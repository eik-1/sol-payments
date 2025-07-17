
#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

declare_id!("RMTdcrr5L5M32zBy86nQRghzfcBWVLQZ5AzFwiwsL62");

#[program]
pub mod solana_streaming_payments {
    use super::*;

    pub fn create_stream(
        ctx: Context<CreateStream>,
        amount: u64,
        rate_per_minute: u64,
        duration_minutes: u64,
        fee_percentage: u8,
    ) -> Result<()> {
        // Validate inputs
        require!(amount > 0, ErrorCode::ZeroAmount);
        require!(rate_per_minute > 0, ErrorCode::ZeroRate);
        require!(duration_minutes > 0, ErrorCode::ZeroDuration);
        require!(
            amount >= rate_per_minute * duration_minutes,
            ErrorCode::InsufficientFundsForStream
        );

        // Initialize the stream state account
        let stream = &mut ctx.accounts.stream;
        
        stream.payer = ctx.accounts.payer.key();
        stream.payee = ctx.accounts.payee.key();
        stream.mint = ctx.accounts.mint.key();
        stream.amount = amount;
        stream.rate_per_minute = rate_per_minute;
        stream.start_time = Clock::get()?.unix_timestamp;
        stream.duration_minutes = duration_minutes;
        stream.fee_percentage = fee_percentage;
        stream.redeemed = 0;
        stream.stream_bump = ctx.bumps.stream;
        stream.escrow_bump = ctx.bumps.escrow_token;

        // Transfer funds to escrow
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                token::Transfer {
                    from: ctx.accounts.payer_token.to_account_info(),
                    to: ctx.accounts.escrow_token.to_account_info(),
                    authority: ctx.accounts.payer.to_account_info(),
                },
            ),
            amount,
        )?;
        Ok(())
    }

    pub fn redeem_stream(ctx: Context<RedeemStream>) -> Result<()> {
        // Immutable borrow for calculations
        let stream = &ctx.accounts.stream;
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - stream.start_time) as u64 / 60;
        let streamable_minutes = stream.duration_minutes.min(elapsed_minutes);

        let redeemable_amount = streamable_minutes * stream.rate_per_minute;
        let amount_to_redeem = redeemable_amount.saturating_sub(stream.redeemed).min(stream.amount - stream.redeemed);

        require!(amount_to_redeem > 0, ErrorCode::NoFundsToRedeem);

        let fee = (amount_to_redeem * stream.fee_percentage as u64) / 100;
        let amount_to_payee = amount_to_redeem - fee;

        // Define the PDA seeds for signing
        let payer_key = stream.payer.key();
        let payee_key = stream.payee.key();
        let seeds = &[
            b"escrow",
            payer_key.as_ref(),
            payee_key.as_ref(),
            &[stream.escrow_bump],
        ];
        let signer = &[&seeds[..]];

        // Transfer funds to the payee
        if amount_to_payee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.payee_token.to_account_info(),
                        authority: ctx.accounts.escrow_token.to_account_info(),
                    },
                    signer,
                ),
                amount_to_payee,
            )?;
        }

        // Transfer fees to the fee account
        if fee > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.fee_account.to_account_info(),
                        authority: ctx.accounts.escrow_token.to_account_info(),
                    },
                    signer,
                ),
                fee,
            )?;
        }

        // Update the redeemed amount in the stream state
        let stream_mut = &mut ctx.accounts.stream;
        stream_mut.redeemed += amount_to_redeem;
        Ok(())
    }

    pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
        let stream = &ctx.accounts.stream;

        // First, redeem any outstanding balance to the payee
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - stream.start_time) as u64 / 60;
        let total_streamable_minutes = stream.duration_minutes.min(elapsed_minutes);
        let redeemable_amount = total_streamable_minutes * stream.rate_per_minute;
        let amount_to_payee = redeemable_amount.saturating_sub(stream.redeemed);

        // Define the PDA seeds for signing
        let payer_key = stream.payer.key();
        let payee_key = stream.payee.key();
        let seeds = &[
            b"escrow",
            payer_key.as_ref(),
            payee_key.as_ref(),
            &[stream.escrow_bump],
        ];
        let signer = &[&seeds[..]];

        if amount_to_payee > 0 {
            let fee = (amount_to_payee * stream.fee_percentage as u64) / 100;
            let net_to_payee = amount_to_payee - fee;

            // Pay net amount to payee
            if net_to_payee > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow_token.to_account_info(),
                            to: ctx.accounts.payee_token.to_account_info(),
                            authority: ctx.accounts.escrow_token.to_account_info(),
                        },
                        signer,
                    ),
                    net_to_payee,
                )?;
            }
            // Pay fee to fee_account
            if fee > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.to_account_info(),
                        Transfer {
                            from: ctx.accounts.escrow_token.to_account_info(),
                            to: ctx.accounts.fee_account.to_account_info(),
                            authority: ctx.accounts.escrow_token.to_account_info(),
                        },
                        signer,
                    ),
                    fee,
                )?;
            }
        }


        // Refund the remaining balance to the payer
        let remaining_amount = ctx.accounts.escrow_token.amount - amount_to_payee;
        if remaining_amount > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    ctx.accounts.token_program.to_account_info(),
                    Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.payer_token.to_account_info(),
                        authority: ctx.accounts.escrow_token.to_account_info(),
                    },
                    signer,
                ),
                remaining_amount,
            )?;
        }
        
        // The `close` directive on the stream and escrow accounts will automatically
        // trigger closing them and refunding the rent to the payer.

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, rate_per_minute: u64, duration_minutes: u64, fee_percentage: u8)]
pub struct CreateStream<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + Stream::INIT_SPACE, // Space for Stream account
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: The payee is the recipient of the stream, no checks needed here.
    pub payee: AccountInfo<'info>,

    pub mint: Account<'info, Mint>,
    
    #[account(
        mut,
        token::mint = mint,
        token::authority = payer
    )]
    pub payer_token: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = payer,
        token::mint = mint,
        token::authority = escrow_token,
        seeds = [b"escrow", payer.key().as_ref(), payee.key().as_ref()],
        bump
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RedeemStream<'info> {
    #[account(mut)]
    pub payee: Signer<'info>,

    #[account(
        mut,
        has_one = payee,
        has_one = payer,
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump = stream.stream_bump
    )]
    pub stream: Account<'info, Stream>,
    
    /// CHECK: Payer account from the stream state is used for seed derivation.
    pub payer: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [b"escrow", stream.payer.as_ref(), stream.payee.as_ref()],
        bump = stream.escrow_bump
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = stream.mint
    )]
    pub payee_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        token::mint = stream.mint
    )]
    pub fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: The payee is checked via the has_one constraint on the stream account.
    pub payee: AccountInfo<'info>,
    
    #[account(
        mut,
        has_one = payer,
        has_one = payee,
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump = stream.stream_bump,
        close = payer
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        mut,
        seeds = [b"escrow", stream.payer.as_ref(), stream.payee.as_ref()],
        bump = stream.escrow_bump,
        close = payer
    )]
    pub escrow_token: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint, token::authority = payer)]
    pub payer_token: Account<'info, TokenAccount>,

    #[account(mut, token::mint = stream.mint)]
    pub payee_token: Account<'info, TokenAccount>,

    #[account(
        mut,
        token::mint = stream.mint
    )]
    pub fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct Stream {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub mint: Pubkey,
    pub amount: u64,
    pub rate_per_minute: u64,
    pub start_time: i64,
    pub duration_minutes: u64,
    pub fee_percentage: u8,
    pub redeemed: u64,
    pub stream_bump: u8,
    pub escrow_bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No funds available to redeem.")]
    NoFundsToRedeem,
    #[msg("Amount must be greater than zero.")]
    ZeroAmount,
    #[msg("Rate must be greater than zero.")]
    ZeroRate,
    #[msg("Duration must be greater than zero.")]
    ZeroDuration,
    #[msg("The amount provided is not sufficient to fund the stream for the given duration and rate.")]
    InsufficientFundsForStream,
    #[msg("Stream has not expired yet.")]
    StreamNotExpired,
    #[msg("No funds available to reclaim.")]
    NoFundsToReclaim,
}