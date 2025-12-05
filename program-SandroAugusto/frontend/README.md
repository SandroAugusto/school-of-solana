# Prediction Market Frontend

A decentralized prediction market interface built with React, Vite, and the Solana Wallet Adapter.

## Features

- **Create Markets**: Create binary prediction markets (Yes/No questions)
- **Place Bets**: Bet on Yes or No outcomes
- **View Markets**: Browse all available prediction markets
- **Resolve Markets**: Oracle can resolve market outcomes
- **Withdraw Winnings**: Winners can claim their proportional rewards
- **Wallet Integration**: Supports Phantom, Solflare, and other Solana wallets

## Tech Stack

- **React 19** with TypeScript
- **Vite** for fast builds and development
- **Anchor 0.31.1** for program interaction
- **Solana Web3.js** for blockchain integration
- **Tailwind CSS** with Radix UI components
- **React Query** for state management

## Setup & Development

### Prerequisites

- Node.js 18+ and npm
- A Solana wallet (Phantom, Solflare, etc.)
- Devnet SOL for testing

### Installation

```bash
cd frontend/market-prediction
npm install
```

### Configuration

The app is configured to connect to Solana Devnet by default. The program ID is set in:
- `src/anchor/program.ts`
- `src/idl/constants.ts`
- `src/idl/prediction_market.json`

**Current Program ID:** `5m2w2PzCZkSPt8dcqFiuxrSNQX6Z8e84Etne95UPFTBT`

### Development Server

```bash
npm run dev
```

Opens at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

Outputs to `dist/` directory.

### Lint & Format

```bash
npm run lint
npm run format
```

## Deployment

### Deploy to Vercel

1. **Install Vercel CLI (if not already installed):**
```bash
npm install -g vercel
```

2. **Login to Vercel:**
```bash
vercel login
```
This will open a browser for authentication.

3. **Deploy:**
```bash
vercel --prod
```

4. **Get Your URL:**
After successful deployment, Vercel will provide a production URL like:
```
https://your-project-name.vercel.app
```

### Alternative: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Set build settings:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Deploy!

## Project Structure

```
src/
├── anchor/          # Anchor program integration
├── components/      # Reusable UI components
├── features/        # Feature-specific modules
│   ├── account/     # Account management
│   ├── cluster/     # Network cluster selection
│   ├── dashboard/   # Main dashboard
│   └── markets/     # Markets functionality
├── idl/            # Program IDL and constants
├── lib/            # Utility libraries
└── utils/          # Helper functions
```

## Usage

1. **Connect Wallet**: Click "Select Wallet" and connect your Solana wallet
2. **Ensure Devnet**: Make sure your wallet is connected to Devnet
3. **Get Devnet SOL**: Use the Solana faucet if needed: https://faucet.solana.com
4. **Create a Market**: Fill in the form with question, end time, oracle address
5. **Place Bets**: Browse markets and place bets on Yes or No
6. **Withdraw**: After market resolution, winners can withdraw earnings

## Network Configuration

The app connects to Solana Devnet:
- RPC URL: `https://api.devnet.solana.com`
- Cluster: `devnet`

To change networks, update the RPC URL in `src/anchor/program.ts`.

## Troubleshooting

### Wallet Not Connecting
- Ensure wallet extension is installed and unlocked
- Check that wallet is set to Devnet
- Refresh the page

### Transactions Failing
- Ensure you have enough SOL for transaction fees
- Check that the market is still open for bets
- Verify you're on the correct network (Devnet)

### Build Errors
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear build cache: `rm -rf dist`
- Ensure Node.js version is 18+

## Contributing

This project was built for the School of Solana course. Feel free to fork and extend!

## License

MIT
