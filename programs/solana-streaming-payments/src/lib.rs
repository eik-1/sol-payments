
#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("294BsSNNf6Nt5T7xQZWSSQ5nAcPhcmkdtgkuUj2woCox");

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
        let stream = &mut ctx.accounts.stream;
        let bump = ctx.bumps.stream;
        
        stream.payer = ctx.accounts.payer.key();
        stream.payee = ctx.accounts.payee.key();
        stream.amount = amount;
        stream.rate_per_minute = rate_per_minute;
        stream.start_time = Clock::get()?.unix_timestamp;
        stream.duration_minutes = duration_minutes;
        stream.fee_percentage = fee_percentage;
        stream.redeemed = 0;
        stream.bump = bump;

        // Transfer funds to escrow
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.payer_token.to_account_info(),
            to: ctx.accounts.escrow_token.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        token::transfer(CpiContext::new(cpi_program, cpi_accounts), amount)?;
        Ok(())
    }

    pub fn redeem_stream(ctx: Context<RedeemStream>, _seed: u64) -> Result<()> {
        // Immutable borrow for calculations
        let stream = &ctx.accounts.stream;
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - stream.start_time) as u64 / 60;

        let redeemable_amount = elapsed_minutes * stream.rate_per_minute;
        let amount_to_redeem = redeemable_amount.min(stream.amount - stream.redeemed);

        if amount_to_redeem == 0 {
            return Err(ErrorCode::NoFundsToRedeem.into());
        }

        let fee = (amount_to_redeem * stream.fee_percentage as u64) / 100;
        let amount_to_payee = amount_to_redeem - fee;

        // Transfer to payee
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.escrow_token.to_account_info(),
            to: ctx.accounts.payee_token.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(cpi_program.clone(), cpi_accounts), 
            amount_to_payee
        )?;

        // Transfer fee (if any)
        if fee > 0 {
            let cpi_accounts = token::Transfer {
                from: ctx.accounts.escrow_token.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            };
            token::transfer(
                CpiContext::new(cpi_program, cpi_accounts), 
                fee
            )?;
        }

        // Mutable borrow only for updating the account
        let stream = &mut ctx.accounts.stream;
        stream.redeemed += amount_to_redeem;
        Ok(())
    }

    pub fn reclaim_stream(ctx: Context<ReclaimStream>, _seed: u64) -> Result<()> {
        let stream = &ctx.accounts.stream;
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - stream.start_time) as u64 / 60;

        if elapsed_minutes < stream.duration_minutes {
            return Err(ErrorCode::StreamNotExpired.into());
        }

        let remaining_amount = stream.amount - stream.redeemed;

        if remaining_amount == 0 {
            return Err(ErrorCode::NoFundsToReclaim.into());
        }

        // No need to transfer - the payer already owns the escrow account
        // Just update the stream account to mark it as fully redeemed
        let stream = &mut ctx.accounts.stream;
        stream.redeemed = stream.amount;
        
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(amount: u64, rate_per_minute: u64, duration_minutes: u64, fee_percentage: u8)]
pub struct CreateStream<'info> {
    #[account(
        init,
        payer = payer,
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 8 + 1, // Space for Stream account
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This is just a public key for the payee
    pub payee: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = payer_token.owner == payer.key()
    )]
    pub payer_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = escrow_token.owner == payer.key()
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct RedeemStream<'info> {
    #[account(
        mut,
        has_one = payee,
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump = stream.bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    #[account(mut)]
    pub payee: Signer<'info>,
    
    #[account(
        mut,
        constraint = payee_token.owner == payee.key()
    )]
    pub payee_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = escrow_token.owner == payer.key()
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(seed: u64)]
pub struct ReclaimStream<'info> {
    #[account(
        mut,
        has_one = payer,
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump = stream.bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This is just a public key for the payee
    pub payee: AccountInfo<'info>,
    
    #[account(
        mut,
        constraint = escrow_token.owner == payer.key()
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Stream {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub amount: u64,
    pub rate_per_minute: u64,
    pub start_time: i64,
    pub duration_minutes: u64,
    pub fee_percentage: u8,
    pub redeemed: u64,
    pub bump: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No funds available to redeem.")]
    NoFundsToRedeem,
    #[msg("Stream has not expired yet.")]
    StreamNotExpired,
    #[msg("No funds available to reclaim.")]
    NoFundsToReclaim,
}