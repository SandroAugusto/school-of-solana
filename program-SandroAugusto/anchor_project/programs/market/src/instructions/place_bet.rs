use anchor_lang::prelude::*;
use crate::state::{Bet, Market};

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub market: Account<'info, Market>,
    #[account(
        init,
        payer = bettor,
        space = 8 + 32 + 32 + 1 + 8 + 1,
        seeds = [b"bet", market.key().as_ref(), bettor.key().as_ref()],
        bump
    )]
    pub bet: Account<'info, Bet>,
    #[account(mut)]
    pub bettor: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_place_bet(ctx: Context<PlaceBet>, side: u8, amount: u64) -> Result<()> {
    require!(side == 1 || side == 2, PlaceBetError::InvalidSide);
    require!(amount > 0, PlaceBetError::InvalidAmount);
    let market = &mut ctx.accounts.market;
    let now = Clock::get()?.unix_timestamp;
    if now >= market.end_time {
        market.status = 1;
        return err!(PlaceBetError::MarketClosed);
    }
    require!(market.status == 0, PlaceBetError::MarketNotOpen);
    let bet = &mut ctx.accounts.bet;
    bet.bettor = ctx.accounts.bettor.key();
    bet.market = market.key();
    bet.side = side;
    bet.amount = amount;
    bet.withdrawn = false;

    match side {
        1 => market.total_yes += amount,
        2 => market.total_no += amount,
        _ => {}
    }
    Ok(())
}

#[error_code]
pub enum PlaceBetError {
    #[msg("Invalid side")]
    InvalidSide,
    #[msg("Invalid bet amount")]
    InvalidAmount,
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Market is closed for new bets")]
    MarketClosed,
}
