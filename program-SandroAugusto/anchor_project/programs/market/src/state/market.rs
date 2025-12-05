use anchor_lang::prelude::*;

#[account]
pub struct Market {
    pub authority: Pubkey,
    pub oracle: Pubkey,
    pub question: String,
    pub total_yes: u64,
    pub total_no: u64,
    pub outcome: u8, // 0 none, 1 yes, 2 no
    pub status: u8,  // 0 open, 1 resolving, 2 resolved
    pub end_time: i64,
    pub is_curated: bool,
}

impl Market {
    pub const LEN: usize = 8  // discriminator
        + 32 // authority
        + 32 // oracle
        + 4 + crate::constants::QUESTION_MAX_LEN // question string prefix + content
        + 8 // total_yes
        + 8 // total_no
        + 1 // outcome
        + 1 // status
        + 8 // end_time
        + 1; // is_curated
}
