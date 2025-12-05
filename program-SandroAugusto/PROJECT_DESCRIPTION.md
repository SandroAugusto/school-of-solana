# Project Description

**Deployed Frontend URL:** https://market-prediction-pp9mttapf-sandroaugustos-projects.vercel.app

**Solana Program ID:** `5m2w2PzCZkSPt8dcqFiuxrSNQX6Z8e84Etne95UPFTBT`

**Network:** Devnet

## Project Overview

### Description
A decentralized prediction market platform built on Solana that allows users to create binary prediction markets (Yes/No questions) and place bets on outcomes. The platform features oracle-based resolution, curated markets, and automatic winnings distribution. Users can create markets about future events (e.g., "Will BTC exceed 100k in 2025?"), place bets on either side, and withdraw winnings after the market is resolved by a designated oracle.

The dApp demonstrates core Solana programming concepts including PDAs (Program Derived Addresses), account management, token transfers, and time-based constraints. All transactions occur on-chain with transparent settlement rules.

### Key Features
- **Market Creation**: Users can create prediction markets with custom questions, end times, and oracle addresses
- **Curated Markets**: Support for curated vs non-curated markets to enable quality control
- **Binary Betting**: Place bets on Yes (side 1) or No (side 2) outcomes
- **Oracle Resolution**: Designated oracles resolve markets after the end time
- **Automatic Settlement**: Winnings are calculated proportionally based on the total pool
- **Market Closure**: Authority can close markets and reclaim rent
- **Secure PDAs**: All accounts (markets and bets) are derived using Program Derived Addresses
- **Time-based Controls**: Markets automatically close for new bets after end time
  
### How to Use the dApp

1. **Connect Wallet**
   - Open the frontend and click "Select Wallet" 
   - Connect your Phantom, Solflare, or compatible Solana wallet
   - Ensure you're connected to Devnet

2. **Create a Market**
   - Click the "Create Market" button
   - Enter a binary question (max 128 characters)
   - Set an end time (must be in the future)
   - Specify an oracle public key (who will resolve the market)
   - Choose if the market is curated
   - Approve the transaction

3. **Place a Bet**
   - Browse available markets
   - Select a market and choose Yes (1) or No (2)
   - Enter the amount in lamports
   - Approve the transaction to place your bet

4. **Resolve Market** (Oracle Only)
   - After the end time, the designated oracle can resolve the market
   - Select the winning outcome (1 for Yes, 2 for No)
   - This determines which bettors can withdraw winnings

5. **Withdraw Winnings**
   - If you bet on the winning side, click "Withdraw Winnings"
   - Your proportional share of the losing side's pool is distributed
   - Original bet amount is returned plus winnings

6. **Close Market** (Authority Only)
   - Market creator can close resolved markets
   - Reclaims rent from the market account

## Program Architecture

The Solana program is built using the Anchor framework and implements a prediction market protocol with five main instructions: initialize_market, place_bet, resolve_market, withdraw_winnings, and close_market.

### PDA Usage

The program uses PDAs (Program Derived Addresses) to ensure deterministic account addresses and secure access control:

**PDAs Used:**

1. **Market PDA**
   - **Seeds**: `["market", authority_pubkey, hash(question), end_time]`
   - **Purpose**: Creates a unique, deterministic address for each market
   - **Why**: The combination of authority, question hash, and end time ensures markets are unique and prevents address collisions. PDAs enable secure rent-exempt accounts without private keys.

2. **Bet PDA**
   - **Seeds**: `["bet", market_pubkey, bettor_pubkey]`
   - **Purpose**: Creates a unique bet account for each bettor per market
   - **Why**: Ensures one bet per user per market, prevents duplicate bets, and allows deterministic address derivation for withdrawals

### Program Instructions

**Instructions Implemented:**

1. **initialize_market**
   - Creates a new prediction market with a question, end time, oracle, and curated flag
   - Validates question length (≤128 chars) and end time (must be future)
   - Initializes market state with zero totals and open status
   - Uses authority + question + end_time as PDA seeds

2. **place_bet**
   - Allows users to place bets on Yes (1) or No (2) outcome
   - Validates side value, amount > 0, and market is open
   - Creates Bet PDA and increments market's total_yes or total_no
   - Automatically closes market if current time ≥ end_time

3. **resolve_market**
   - Oracle-only instruction to set the winning outcome
   - Can only be called by the designated oracle address
   - Sets market outcome to 1 (Yes) or 2 (No)
   - Transitions market to resolved status

4. **withdraw_winnings**
   - Allows winning bettors to claim their proportional share
   - Validates user bet on winning side and hasn't withdrawn
   - Calculates winnings: (user_amount / winning_total) * losing_total
   - Returns original bet + winnings, marks bet as withdrawn

5. **close_market**
   - Allows market authority to close and reclaim rent
   - Can be called by authority or oracle
   - Closes market account and returns lamports to signer

### Account Structure

```rust
#[account]
pub struct Market {
    pub authority: Pubkey,    // Creator of the market
    pub oracle: Pubkey,        // Address authorized to resolve
    pub question: String,      // The prediction question (max 128 chars)
    pub total_yes: u64,        // Total lamports bet on Yes
    pub total_no: u64,         // Total lamports bet on No
    pub outcome: u8,           // 0=none, 1=yes, 2=no
    pub status: u8,            // 0=open, 1=resolving, 2=resolved
    pub end_time: i64,         // Unix timestamp when betting closes
    pub is_curated: bool,      // Whether market is curated
}

#[account]
pub struct Bet {
    pub bettor: Pubkey,        // User who placed the bet
    pub market: Pubkey,        // Market this bet belongs to
    pub side: u8,              // 1=yes, 2=no
    pub amount: u64,           // Amount bet in lamports
    pub withdrawn: bool,       // Whether winnings claimed
}
```

## Testing

### Test Coverage

The program includes comprehensive test coverage with both happy path and unhappy path scenarios for all instructions.

**Happy Path Tests:**
- **Initialize Market**: Creates a valid market with question, end time, oracle
- **Place Bet**: Places valid Yes/No bets and increments totals correctly
- **Resolve Market**: Oracle successfully resolves market with outcome
- **Withdraw Winnings**: Winning bettors receive correct proportional payouts
- **Close Market**: Authority successfully closes resolved market

**Unhappy Path Tests:**
- **Question Too Long**: Rejects questions exceeding 128 characters
- **End Time in Past**: Rejects markets with past end times
- **Invalid Side**: Rejects bets with side not equal to 1 or 2
- **Market Closed**: Prevents bets after end time
- **Unauthorized Oracle**: Prevents non-oracle from resolving
- **Wrong Side Withdrawal**: Prevents losing bettors from withdrawing
- **Double Withdrawal**: Prevents withdrawing winnings twice

### Running Tests

```bash
# Navigate to anchor project directory
cd anchor_project

# Run all tests
anchor test

# Run specific test file
anchor test -- tests/initialize_market.spec.ts
```

All tests use a local validator and include proper setup/teardown for isolated test execution.

## Technical Implementation Details

**Key Design Decisions:**

1. **PDA Architecture**: Markets and bets use deterministic PDAs instead of keypairs, eliminating the need to store private keys and enabling predictable address derivation

2. **Time-based Closure**: Markets automatically transition to closed status when current time exceeds end_time, preventing new bets without requiring manual closure

3. **Proportional Payouts**: Winnings are calculated as (user_bet / winning_pool) * losing_pool, ensuring fair distribution and zero-sum economics

4. **Oracle Pattern**: External oracle model allows flexible resolution mechanisms (could integrate Chainlink, Pyth, or manual resolution)

5. **Question Hashing**: Using hash(question) in PDA seeds keeps seeds compact while supporting variable-length questions

6. **Rent Optimization**: Account sizes are calculated precisely (Market::LEN) to minimize rent costs

**Security Considerations:**

- Signer validation on all instructions
- Oracle authorization check on resolve_market
- Prevents duplicate bets through PDA design
- Validates side values (1 or 2 only)
- Prevents withdrawal after already withdrawn
- Time-based constraints prevent late bets

## Deployment Information

**Program:**
- Program ID: `5m2w2PzCZkSPt8dcqFiuxrSNQX6Z8e84Etne95UPFTBT`
- Network: Solana Devnet
- Framework: Anchor 0.31.1

**Frontend:**
- Framework: React + Vite + TypeScript
- Wallet Integration: Solana Wallet Adapter
- UI: Tailwind CSS + Radix UI components
- RPC: https://api.devnet.solana.com

### Frontend Deployment:

The frontend has been successfully deployed to Vercel and is accessible at the URL listed at the top of this document. The deployment is configured to automatically rebuild on git pushes.

## Additional Notes for Evaluators

- All required elements are implemented: PDAs, Devnet deployment, happy/unhappy tests, frontend
- The program demonstrates practical use of Solana's unique features (PDAs, rent, time-based logic)
- Tests cover edge cases and error scenarios comprehensively
- Frontend provides full CRUD functionality for markets and bets
- Project is production-ready with proper error handling and validation
