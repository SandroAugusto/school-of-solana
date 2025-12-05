use anchor_lang::prelude::*;
use crate::state::{Market, Bet};

#[derive(Accounts)]
pub struct WithdrawWinnings<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        mut,
        has_one = bettor,
        has_one = market,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_withdraw(ctx: Context<WithdrawWinnings>) -> Result<()> {
    let bet = &mut ctx.accounts.bet;
    let market = &ctx.accounts.market;

    require!(market.status == 2, WithdrawError::MarketNotResolved);
    require!(!bet.withdrawn, WithdrawError::AlreadyWithdrawn);
    require!(market.outcome == bet.side, WithdrawError::NotAWinner);

    bet.withdrawn = true;
    Ok(())
}

#[error_code]
pub enum WithdrawError {
    #[msg("Market not resolved yet")]
    MarketNotResolved,
    #[msg("Already withdrawn")]
    AlreadyWithdrawn,
    #[msg("You did not win this market")]
    NotAWinner,
}
