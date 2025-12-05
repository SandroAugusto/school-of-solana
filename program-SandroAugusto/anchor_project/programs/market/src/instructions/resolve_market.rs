use anchor_lang::prelude::*;
use crate::state::Market;

#[derive(Accounts)]
pub struct ResolveMarket<'info> {
    #[account(mut, has_one = oracle)]
    pub market: Account<'info, Market>,
    pub oracle: Signer<'info>,
}

pub fn handle_resolve(ctx: Context<ResolveMarket>, outcome: u8) -> Result<()> {
    require!(outcome == 1 || outcome == 2, ResolveMarketError::InvalidSide);
    let market = &mut ctx.accounts.market;
    require!(market.status == 1, ResolveMarketError::MarketNotResolving);
    let now = Clock::get()?.unix_timestamp;
    require!(now >= market.end_time, ResolveMarketError::MarketStillActive);
    market.outcome = outcome;
    market.status = 2;
    Ok(())
}

#[error_code]
pub enum ResolveMarketError {
    #[msg("Invalid outcome side")]
    InvalidSide,
    #[msg("Market must be in resolving state")]
    MarketNotResolving,
    #[msg("Market is still active")]
    MarketStillActive,
}
