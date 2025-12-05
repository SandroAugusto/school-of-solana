//-------------------------------------------------------------------------------
///
/// TASK: Implement the remove reaction functionality for the Twitter program
/// 
/// Requirements:
/// - Verify that the tweet reaction exists and belongs to the reaction author
/// - Decrement the appropriate counter (likes or dislikes) on the tweet
/// - Close the tweet reaction account and return rent to reaction author
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::states::*;

pub fn remove_reaction(ctx: Context<RemoveReactionContext>) -> Result<()> {
    require!(
        ctx.accounts.tweet_reaction.reaction_author == ctx.accounts.reaction_author.key(),
        anchor_lang::error::ErrorCode::ConstraintOwner
    );
    
    let reaction_type = ctx.accounts.tweet_reaction.reaction.clone();
    
    let tweet = &mut ctx.accounts.tweet;
    match reaction_type {
        ReactionType::Like => {
            require!(tweet.likes > 0, TwitterError::MinLikesReached);
            tweet.likes = tweet.likes.checked_sub(1).ok_or(TwitterError::MinLikesReached)?;
        }
        ReactionType::Dislike => {
            require!(tweet.dislikes > 0, TwitterError::MinDislikesReached);
            tweet.dislikes = tweet.dislikes.checked_sub(1).ok_or(TwitterError::MinDislikesReached)?;
        }
    }
    
    Ok(())
}

#[derive(Accounts)]
pub struct RemoveReactionContext<'info> {
    #[account(
        mut,
        close = reaction_author,
        seeds = [TWEET_REACTION_SEED.as_bytes(), reaction_author.key().as_ref(), tweet.key().as_ref()],
        bump = tweet_reaction.bump
    )]
    pub tweet_reaction: Account<'info, Reaction>,
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
    #[account(mut)]
    pub reaction_author: Signer<'info>,
}
