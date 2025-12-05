#![allow(deprecated)]

use anchor_lang::prelude::*;

pub mod constants;
pub mod instructions;
pub mod state;

pub use instructions::{
    close_market, initialize_market, place_bet, resolve_market, withdraw_winnings,
};

use instructions::*;

declare_id!("HQsBocFCGFxBK6rtHtWWpoooPGLugNUPtCps4aSwLrqt");

#[program]
pub mod prediction_market {
    use super::*;

    pub fn initialize_market(
        ctx: Context<InitializeMarket>,
        question: String,
        end_time: i64,
        oracle: Pubkey,
        is_curated: bool,
    ) -> Result<()> {
        initialize_market::handle_initialize(ctx, question, end_time, oracle, is_curated)
    }

    pub fn place_bet(ctx: Context<PlaceBet>, side: u8, amount: u64) -> Result<()> {
        place_bet::handle_place_bet(ctx, side, amount)
    }

    pub fn close_market(ctx: Context<CloseMarket>) -> Result<()> {
        close_market::handle_close_market(ctx)
    }

    pub fn resolve_market(ctx: Context<ResolveMarket>, outcome: u8) -> Result<()> {
        resolve_market::handle_resolve(ctx, outcome)
    }

    pub fn withdraw_winnings(ctx: Context<WithdrawWinnings>) -> Result<()> {
        withdraw_winnings::handle_withdraw(ctx)
    }
}
