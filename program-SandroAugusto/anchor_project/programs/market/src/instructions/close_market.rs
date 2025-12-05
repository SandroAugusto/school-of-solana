use anchor_lang::prelude::*;
use crate::state::Market;

#[derive(Accounts)]
pub struct CloseMarket<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    pub signer: Signer<'info>,
}

pub fn handle_close_market(ctx: Context<CloseMarket>) -> Result<()> {
    let market = &mut ctx.accounts.market;
    let now = Clock::get()?.unix_timestamp;
    require!(market.status == 0, CloseMarketError::MarketNotOpen);
    require!(now >= market.end_time, CloseMarketError::MarketStillActive);
    let signer_key = ctx.accounts.signer.key();
    require!(
        signer_key == market.authority || signer_key == market.oracle,
        CloseMarketError::Unauthorized
    );
    market.status = 1;
    Ok(())
}

#[error_code]
pub enum CloseMarketError {
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Market is still active")]
    MarketStillActive,
    #[msg("Unauthorized to close market")]
    Unauthorized,
}
