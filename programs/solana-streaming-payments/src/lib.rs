<<<<<<< HEAD

#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

declare_id!("294BsSNNf6Nt5T7xQZWSSQ5nAcPhcmkdtgkuUj2woCox");
=======
#![allow(unexpected_cfgs)]
#![allow(deprecated)]
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Mint};
use anchor_spl::associated_token::AssociatedToken;

declare_id!("ByWArGP9u92e3g7gdh9heufdnQ8CH6CREFCaLwA8n4TK");
>>>>>>> main

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
<<<<<<< HEAD
        let bump = ctx.bumps.stream;
        
        stream.payer = ctx.accounts.payer.key();
        stream.payee = ctx.accounts.payee.key();
=======
        let stream_bump = ctx.bumps.stream;
        let escrow_bump = ctx.bumps.escrow_token;
        
        stream.payer = ctx.accounts.payer.key();
        stream.payee = ctx.accounts.payee.key();
        stream.token_mint = ctx.accounts.token_mint.key();
>>>>>>> main
        stream.amount = amount;
        stream.rate_per_minute = rate_per_minute;
        stream.start_time = Clock::get()?.unix_timestamp;
        stream.duration_minutes = duration_minutes;
        stream.fee_percentage = fee_percentage;
        stream.redeemed = 0;
<<<<<<< HEAD
        stream.bump = bump;
=======
        stream.stream_bump = stream_bump;
        stream.escrow_bump = escrow_bump;
>>>>>>> main

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

    pub fn redeem_stream(ctx: Context<RedeemStream>, amount_to_redeem: u64) -> Result<()> {
        // Immutable borrow for calculations
        let stream = &ctx.accounts.stream;
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - stream.start_time) as u64 / 60;

        let redeemable_amount = elapsed_minutes * stream.rate_per_minute;
        let max_redeemable = redeemable_amount.min(stream.amount - stream.redeemed);

        // If amount_to_redeem is 0, redeem the maximum available
        let amount_to_redeem = if amount_to_redeem == 0 {
            max_redeemable
        } else {
            amount_to_redeem.min(max_redeemable)
        };

        if amount_to_redeem == 0 {
            return Err(ErrorCode::NoFundsToRedeem.into());
        }

        let fee = (amount_to_redeem * stream.fee_percentage as u64) / 100;
        let amount_to_payee = amount_to_redeem - fee;

        // Transfer to payee using program as signer
        let escrow_seeds = &[
            b"escrow",
            stream.payer.as_ref(),
            stream.payee.as_ref(),
            stream.token_mint.as_ref(),
            &[stream.escrow_bump],
        ];

        // Transfer to payee
        let cpi_program = ctx.accounts.token_program.to_account_info();
<<<<<<< HEAD
        let cpi_accounts = token::Transfer {
            from: ctx.accounts.escrow_token.to_account_info(),
            to: ctx.accounts.payee_token.to_account_info(),
            authority: ctx.accounts.payer.to_account_info(),
        };
        token::transfer(
            CpiContext::new(cpi_program.clone(), cpi_accounts), 
=======
        
        // Transfer to payee
        token::transfer(
            CpiContext::new_with_signer(
                cpi_program.clone(), 
                token::Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.payee_token.to_account_info(),
                    authority: ctx.accounts.escrow_token.to_account_info(),
                },
                &[escrow_seeds]
            ), 
>>>>>>> main
            amount_to_payee
        )?;

        // Transfer fee (if any)
        if fee > 0 {
<<<<<<< HEAD
            let cpi_accounts = token::Transfer {
                from: ctx.accounts.escrow_token.to_account_info(),
                to: ctx.accounts.fee_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            };
            token::transfer(
                CpiContext::new(cpi_program, cpi_accounts), 
=======
            token::transfer(
                CpiContext::new_with_signer(
                    cpi_program, 
                    token::Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.fee_account.to_account_info(),
                        authority: ctx.accounts.escrow_token.to_account_info(),
                    },
                    &[escrow_seeds]
                ), 
>>>>>>> main
                fee
            )?;
        }

        // Mutable borrow only for updating the account
        let stream = &mut ctx.accounts.stream;
        stream.redeemed += amount_to_redeem;
        Ok(())
    }

<<<<<<< HEAD
    pub fn reclaim_stream(ctx: Context<ReclaimStream>, _seed: u64) -> Result<()> {
=======
    pub fn reclaim_stream(ctx: Context<ReclaimStream>) -> Result<()> {
>>>>>>> main
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

<<<<<<< HEAD
        // No need to transfer - the payer already owns the escrow account
        // Just update the stream account to mark it as fully redeemed
=======
        // Transfer remaining funds back to payer
        let escrow_seeds = &[
            b"escrow",
            stream.payer.as_ref(),
            stream.payee.as_ref(),
            stream.token_mint.as_ref(),
            &[stream.escrow_bump],
        ];

        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(), 
                token::Transfer {
                    from: ctx.accounts.escrow_token.to_account_info(),
                    to: ctx.accounts.payer_token.to_account_info(),
                    authority: ctx.accounts.escrow_token.to_account_info(),
                },
                &[escrow_seeds]
            ), 
            remaining_amount
        )?;
        
        // Update the stream account to mark it as fully redeemed
        let stream = &mut ctx.accounts.stream;
        stream.redeemed = stream.amount;
        
        Ok(())
    }

    pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
        let stream = &ctx.accounts.stream;
        
        // Calculate how much the payee has earned so far
        let current_time = Clock::get()?.unix_timestamp;
        let elapsed_minutes = (current_time - stream.start_time) as u64 / 60;
        let earned_amount = (elapsed_minutes * stream.rate_per_minute).min(stream.amount);
        let already_redeemed = stream.redeemed;
        
        // Calculate how much to send to payee and how much to return to payer
        let amount_to_payee = earned_amount.saturating_sub(already_redeemed);
        let amount_to_payer = stream.amount.saturating_sub(earned_amount);
        
        let escrow_seeds = &[
            b"escrow",
            stream.payer.as_ref(),
            stream.payee.as_ref(),
            stream.token_mint.as_ref(),
            &[stream.escrow_bump],
        ];
        
        let cpi_program = ctx.accounts.token_program.to_account_info();
        
        // Transfer earned but unredeemed funds to payee
        if amount_to_payee > 0 {
            let fee = (amount_to_payee * stream.fee_percentage as u64) / 100;
            let net_to_payee = amount_to_payee - fee;
            
            // Transfer to payee
            if net_to_payee > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        cpi_program.clone(), 
                        token::Transfer {
                            from: ctx.accounts.escrow_token.to_account_info(),
                            to: ctx.accounts.payee_token.to_account_info(),
                            authority: ctx.accounts.escrow_token.to_account_info(),
                        },
                        &[escrow_seeds]
                    ), 
                    net_to_payee
                )?;
            }
            
            // Transfer fee if any
            if fee > 0 {
                token::transfer(
                    CpiContext::new_with_signer(
                        cpi_program.clone(), 
                        token::Transfer {
                            from: ctx.accounts.escrow_token.to_account_info(),
                            to: ctx.accounts.fee_account.to_account_info(),
                            authority: ctx.accounts.escrow_token.to_account_info(),
                        },
                        &[escrow_seeds]
                    ), 
                    fee
                )?;
            }
        }
        
        // Return remaining funds to payer
        if amount_to_payer > 0 {
            token::transfer(
                CpiContext::new_with_signer(
                    cpi_program, 
                    token::Transfer {
                        from: ctx.accounts.escrow_token.to_account_info(),
                        to: ctx.accounts.payer_token.to_account_info(),
                        authority: ctx.accounts.escrow_token.to_account_info(),
                    },
                    &[escrow_seeds]
                ), 
                amount_to_payer
            )?;
        }
        
        // Mark stream as fully redeemed
>>>>>>> main
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
<<<<<<< HEAD
        space = 8 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 8 + 1, // Space for Stream account
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
=======
        space = 8 + 32 + 32 + 32 + 8 + 8 + 8 + 8 + 1 + 8 + 1 + 1, // Space for Stream account
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref(), token_mint.key().as_ref()],
>>>>>>> main
        bump
    )]
    pub stream: Account<'info, Stream>,
    
<<<<<<< HEAD
=======
    #[account(
        init,
        payer = payer,
        seeds = [b"escrow", payer.key().as_ref(), payee.key().as_ref(), token_mint.key().as_ref()],
        bump,
        token::mint = token_mint,
        token::authority = escrow_token,
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
>>>>>>> main
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This is just a public key for the payee
    pub payee: AccountInfo<'info>,
    
<<<<<<< HEAD
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
    
=======
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = payer_token.owner == payer.key(),
        constraint = payer_token.mint == token_mint.key()
    )]
    pub payer_token: Account<'info, TokenAccount>,
    
>>>>>>> main
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct RedeemStream<'info> {
    #[account(
        mut,
        has_one = payee,
<<<<<<< HEAD
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump = stream.bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
=======
        has_one = token_mint,
        seeds = [b"stream", stream.payer.as_ref(), payee.key().as_ref(), token_mint.key().as_ref()],
        bump = stream.stream_bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(
        mut,
        seeds = [b"escrow", stream.payer.as_ref(), payee.key().as_ref(), token_mint.key().as_ref()],
        bump = stream.escrow_bump,
        token::mint = token_mint,
        token::authority = escrow_token,
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    /// CHECK: This is the payer's public key
    pub payer: AccountInfo<'info>,
>>>>>>> main
    
    #[account(mut)]
    pub payee: Signer<'info>,
    
<<<<<<< HEAD
    #[account(
        mut,
        constraint = payee_token.owner == payee.key()
=======
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = payee_token.owner == payee.key(),
        constraint = payee_token.mint == token_mint.key()
>>>>>>> main
    )]
    pub payee_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
<<<<<<< HEAD
        constraint = escrow_token.owner == payer.key()
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
=======
        constraint = fee_account.mint == token_mint.key()
    )]
>>>>>>> main
    pub fee_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReclaimStream<'info> {
    #[account(
        mut,
        has_one = payer,
<<<<<<< HEAD
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref()],
        bump = stream.bump
    )]
    pub stream: Account<'info, Stream>,
    
=======
        has_one = token_mint,
        seeds = [b"stream", payer.key().as_ref(), stream.payee.as_ref(), token_mint.key().as_ref()],
        bump = stream.stream_bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(
        mut,
        seeds = [b"escrow", payer.key().as_ref(), stream.payee.as_ref(), token_mint.key().as_ref()],
        bump = stream.escrow_bump,
        token::mint = token_mint,
        token::authority = escrow_token,
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
>>>>>>> main
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This is just a public key for the payee
    pub payee: AccountInfo<'info>,
    
<<<<<<< HEAD
    #[account(
        mut,
        constraint = escrow_token.owner == payer.key()
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
=======
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = payer_token.owner == payer.key(),
        constraint = payer_token.mint == token_mint.key()
    )]
    pub payer_token: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(
        mut,
        has_one = payer,
        has_one = payee,
        has_one = token_mint,
        seeds = [b"stream", payer.key().as_ref(), payee.key().as_ref(), token_mint.key().as_ref()],
        bump = stream.stream_bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(
        mut,
        seeds = [b"escrow", payer.key().as_ref(), payee.key().as_ref(), token_mint.key().as_ref()],
        bump = stream.escrow_bump,
        token::mint = token_mint,
        token::authority = escrow_token,
    )]
    pub escrow_token: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub payer: Signer<'info>,
    
    /// CHECK: This is the payee's public key
    pub payee: AccountInfo<'info>,
    
    pub token_mint: Account<'info, Mint>,
    
    #[account(
        mut,
        constraint = payer_token.owner == payer.key(),
        constraint = payer_token.mint == token_mint.key()
    )]
    pub payer_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = payee_token.owner == payee.key(),
        constraint = payee_token.mint == token_mint.key()
    )]
    pub payee_token: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = fee_account.mint == token_mint.key()
    )]
    pub fee_account: Account<'info, TokenAccount>,
    
>>>>>>> main
    pub token_program: Program<'info, Token>,
}

#[account]
pub struct Stream {
    pub payer: Pubkey,
    pub payee: Pubkey,
    pub token_mint: Pubkey,
    pub amount: u64,
    pub rate_per_minute: u64,
    pub start_time: i64,
    pub duration_minutes: u64,
    pub fee_percentage: u8,
    pub redeemed: u64,
<<<<<<< HEAD
    pub bump: u8,
=======
    pub stream_bump: u8,
    pub escrow_bump: u8,
>>>>>>> main
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