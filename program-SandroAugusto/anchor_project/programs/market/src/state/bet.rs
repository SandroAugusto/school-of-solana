use anchor_lang::prelude::*;

#[account]
pub struct Bet {
    pub bettor: Pubkey,
    pub market: Pubkey,
    pub side: u8,      // 1 yes, 2 no
    pub amount: u64,
    pub withdrawn: bool,
}
