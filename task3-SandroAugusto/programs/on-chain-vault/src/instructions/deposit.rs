//-------------------------------------------------------------------------------
///
/// TASK: Implement the deposit functionality for the on-chain vault
/// 
/// Requirements:
/// - Verify that the user has enough balance to deposit
/// - Verify that the vault is not locked
/// - Transfer lamports from user to vault using CPI (Cross-Program Invocation)
/// - Emit a deposit event after successful transfer
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::transfer;
use crate::state::Vault;
use crate::errors::VaultError;
use crate::events::DepositEvent;

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut)]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

pub fn _deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;
    
    // Check that the vault is not locked
    require!(!vault.locked, VaultError::VaultLocked);
    
    // Check that the user has enough balance
    let user_balance = ctx.accounts.user.to_account_info().lamports();
    let min_rent = Rent::get()?.minimum_balance(0);
    let available_balance = user_balance.checked_sub(min_rent).ok_or(VaultError::InsufficientBalance)?;
    require!(available_balance >= amount, VaultError::InsufficientBalance);
    
    // Transfer lamports from user to vault using CPI
    let cpi_accounts = transfer(
        &ctx.accounts.user.key,
        &ctx.accounts.vault.key(),
        amount,
    );
    
    invoke(
        &cpi_accounts,
        &[
            ctx.accounts.user.to_account_info(),
            ctx.accounts.vault.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    ).map_err(|_| VaultError::InsufficientBalance)?;
    
    // Emit a deposit event
    emit!(DepositEvent {
        amount,
        user: ctx.accounts.user.key(),
        vault: ctx.accounts.vault.key(),
    });
    
    Ok(())
}