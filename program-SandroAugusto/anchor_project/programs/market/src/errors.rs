use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("Question too long")]
    QuestionTooLong,
    #[msg("Invalid bet amount")]
    InvalidAmount,
    #[msg("Invalid side")]
    InvalidSide,
    #[msg("Market is not open")]
    MarketNotOpen,
    #[msg("Market already resolved")]
    AlreadyResolved,
    #[msg("Unauthorized")]
    Unauthorized,
    #[msg("Market not resolved")]
    MarketNotResolved,
    #[msg("User already withdrew")]
    AlreadyWithdrawn,
    #[msg("Overflow")]
    Overflow,
    #[msg("Division by zero")]
    DivisionByZero,
}
