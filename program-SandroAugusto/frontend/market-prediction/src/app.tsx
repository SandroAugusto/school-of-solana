import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { MarketsView } from './features/markets/MarketsView';

export default function App() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[#0a0a0a]/95 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">P</span>
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">Predict</h1>
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <MarketsView />
      </main>
    </div>
  );
}