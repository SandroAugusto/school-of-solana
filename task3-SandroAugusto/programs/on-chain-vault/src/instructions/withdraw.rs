//-------------------------------------------------------------------------------
///
/// TASK: Implement the withdraw functionality for the on-chain vault
/// 
/// Requirements:
/// - Verify that the vault is not locked
/// - Verify that the vault has enough balance to withdraw
/// - Transfer lamports from vault to vault authority
/// - Emit a withdraw event after successful transfer
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use crate::state::Vault;
use crate::errors::VaultError;
use crate::events::WithdrawEvent;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub vault_authority: Signer<'info>,
    #[account(
        mut,
        seeds = [b"vault", vault_authority.key().as_ref()],
        bump
    )]
    pub vault: Account<'info, Vault>,
    pub system_program: Program<'info, System>,
}

pub fn _withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    let vault = &ctx.accounts.vault;
    
    // Check that the vault is not locked
    require!(!vault.locked, VaultError::VaultLocked);
    
    // Check that the vault has enough balance
    let vault_balance = ctx.accounts.vault.to_account_info().lamports();
    let min_rent = Rent::get()?.minimum_balance(std::mem::size_of::<Vault>());
    let available_balance = vault_balance.checked_sub(min_rent).ok_or(VaultError::InsufficientBalance)?;
    
    require!(available_balance >= amount, VaultError::InsufficientBalance);
    
    // Transfer lamports from vault to vault_authority manually
    **ctx.accounts.vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **ctx.accounts.vault_authority.to_account_info().try_borrow_mut_lamports()? += amount;
    
    // Emit a withdraw event
    emit!(WithdrawEvent {
        amount,
        vault_authority: ctx.accounts.vault_authority.key(),
        vault: ctx.accounts.vault.key(),
    });
    
    Ok(())
}