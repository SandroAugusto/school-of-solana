use anchor_lang::prelude::*;
use crate::{constants::QUESTION_MAX_LEN, state::Market};

#[derive(Accounts)]
#[instruction(question: String, end_time: i64, _oracle: Pubkey, _is_curated: bool)]
pub struct InitializeMarket<'info> {
    #[account(
        init,
        payer = authority,
        space = Market::LEN,
        seeds = [
            b"market",
            authority.key().as_ref(),
            &anchor_lang::solana_program::hash::hash(question.as_bytes()).to_bytes()[..32],
            &end_time.to_le_bytes()
        ],
        bump
    )]
    pub market: Account<'info, Market>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

pub fn handle_initialize(
    ctx: Context<InitializeMarket>,
    question: String,
    end_time: i64,
    oracle: Pubkey,
    is_curated: bool,
) -> Result<()> {
    require!(question.len() <= QUESTION_MAX_LEN, InitializeMarketError::QuestionTooLong);
    let now = Clock::get()?.unix_timestamp;
    require!(end_time > now, InitializeMarketError::EndTimeInPast);
    let market = &mut ctx.accounts.market;
    market.authority = ctx.accounts.authority.key();
    market.oracle = oracle;
    market.question = question;
    market.total_yes = 0;
    market.total_no = 0;
    market.status = 0;
    market.outcome = 0;
    market.end_time = end_time;
    market.is_curated = is_curated;
    Ok(())
}

#[error_code]
pub enum InitializeMarketError {
    #[msg("Question too long")]
    QuestionTooLong,
    #[msg("End time must be in the future")]
    EndTimeInPast,
}
