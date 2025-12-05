import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { listMarkets, createMarket, placeBet, resolveMarket, withdrawWinnings, closeMarket } from './api';
import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, RefreshCw } from 'lucide-react';

type MarketItem = {
    pubkey: PublicKey;
    authority: PublicKey;
    oracle: PublicKey;
    question: string;
    totalYes: anchor.BN;
    totalNo: anchor.BN;
    outcome: number;
    status: number;
    endTime: number;
    isCurated: boolean;
};

export function MarketsView() {
    const { publicKey, wallet } = useWallet();
    const anchorWallet = wallet?.adapter as unknown as anchor.Wallet | undefined;

    const [markets, setMarkets] = useState<MarketItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [showCreate, setShowCreate] = useState(false);
    const [qInput, setQInput] = useState('');
    const [endInput, setEndInput] = useState('');
    const [oracleInput, setOracleInput] = useState('');
    const [isCurated, setIsCurated] = useState(false);
    const [betModal, setBetModal] = useState<{ market?: MarketItem; side?: 1 | 2 } | null>(null);
    const [betAmount, setBetAmount] = useState('1000000');

    const reload = useCallback(async () => {
        if (!anchorWallet) return;
        setLoading(true);
        try {
            const data = await listMarkets(anchorWallet);
            setMarkets(data as MarketItem[]);
        } finally {
            setLoading(false);
        }
    }, [anchorWallet]);

    useEffect(() => {
        reload();
    }, [reload]);

    useEffect(() => {
        if (publicKey && !oracleInput) {
            setOracleInput(publicKey.toBase58());
        }
    }, [publicKey, oracleInput]);

    const canWrite = !!publicKey;

    const onCreate = async () => {
        if (!anchorWallet || !qInput.trim() || !endInput) return;
        const endTimestamp = Math.floor(new Date(endInput).getTime() / 1000);
        const nowSeconds = Math.floor(Date.now() / 1000);
        if (!Number.isFinite(endTimestamp) || endTimestamp <= nowSeconds) return;
        const oracleAddress = oracleInput || publicKey?.toBase58();
        if (!oracleAddress) return;
        let oracleKey: PublicKey;
        try {
            oracleKey = new PublicKey(oracleAddress);
        } catch {
            return;
        }
        await createMarket(anchorWallet, qInput.trim(), endTimestamp, oracleKey, isCurated);
        setQInput('');
        setEndInput('');
        setIsCurated(false);
        setShowCreate(false);
        if (publicKey) {
            setOracleInput(publicKey.toBase58());
        }
        await reload();
    };

    const onBet = async () => {
        if (!anchorWallet || !betModal?.market || !betModal.side) return;
        await placeBet(anchorWallet, betModal.market.pubkey, betModal.side, Number(betAmount));
        setBetModal(null);
        await reload();
    };

    const onResolve = async (m: MarketItem, outcome: 1 | 2) => {
        if (!anchorWallet) return;
        await resolveMarket(anchorWallet, m.pubkey, outcome);
        await reload();
    };

    const onWithdraw = async (m: MarketItem) => {
        if (!anchorWallet) return;
        await withdrawWinnings(anchorWallet, m.pubkey);
        await reload();
    };

    const onCloseMarket = async (m: MarketItem) => {
        if (!anchorWallet) return;
        await closeMarket(anchorWallet, m.pubkey);
        await reload();
    };

    const formatLamports = (lamports: anchor.BN | number) => {
        const numeric = typeof lamports === 'number' ? lamports : Number(lamports?.toString() ?? 0);
        return (numeric / 1_000_000).toFixed(2);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Markets</h1>
                    <p className="text-sm text-white/50">Place your predictions</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={reload}
                        disabled={loading}
                        size="sm"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white/70 hover:bg-[#252525] hover:text-white hover:border-[#3a3a3a]"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                        disabled={!canWrite}
                        onClick={() => setShowCreate(true)}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-0 font-medium"
                    >
                        <Plus className="h-4 w-4 mr-1.5" />
                        Create
                    </Button>
                </div>
            </div>

            {/* Markets */}
            {loading ? (
                <div className="flex items-center justify-center py-24">
                    <RefreshCw className="h-8 w-8 animate-spin text-white/30" />
                </div>
            ) : markets.length === 0 ? (
                <div className="text-center py-24">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1a1a1a] mb-4">
                        <Plus className="h-8 w-8 text-white/30" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No markets yet</h3>
                    <p className="text-sm text-white/50 mb-6">Create your first prediction market</p>
                    <Button
                        disabled={!canWrite}
                        onClick={() => setShowCreate(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Market
                    </Button>
                </div>
            ) : (
                <div className="space-y-3">
                    {markets.map((m) => {
                        const yes = Number(m.totalYes?.toString() ?? 0);
                        const no = Number(m.totalNo?.toString() ?? 0);
                        const liq = yes + no;
                        const yesPct = liq ? Math.round((yes * 100) / liq) : 50;
                        const noPct = 100 - yesPct;
                        const nowSeconds = Math.floor(Date.now() / 1000);
                        const resolved = m.status === 2;
                        const resolving = m.status === 1;
                        const statusLabel = resolved ? 'Resolved' : resolving ? 'Resolving' : 'Open';
                        const statusStyles = resolved
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : resolving
                                ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
                        const isOracle = publicKey ? publicKey.equals(m.oracle) : false;
                        const isAuthority = publicKey ? publicKey.equals(m.authority) : false;
                        const isPastEnd = nowSeconds >= m.endTime;
                        const canResolve = !!anchorWallet && isOracle && resolving;
                        const canClose = !!anchorWallet && (isOracle || isAuthority) && m.status === 0 && isPastEnd;
                        const canBetOnMarket = !!anchorWallet && !resolved && !isPastEnd && m.status === 0;
                        const yesPrice = (yesPct / 100).toFixed(2);
                        const noPrice = (noPct / 100).toFixed(2);
                        const oracleLabel = m.oracle.toBase58();
                        const oracleShort = `${oracleLabel.slice(0, 4)}...${oracleLabel.slice(-4)}`;
                        const endDate = new Date(m.endTime * 1000);
                        const outcomeLabel = m.outcome === 1 ? 'YES' : 'NO';

                        return (
                            <div
                                key={m.pubkey.toBase58()}
                                className="bg-[#111111] border border-[#1f1f1f] rounded-xl p-5 hover:border-[#2a2a2a] transition-all"
                            >
                                {/* Question & metadata */}
                                <div className="mb-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="space-y-2">
                                            <h3 className="text-base font-semibold text-white leading-snug">
                                                {m.question}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-white/50">
                                                <span>
                                                    Liquidity:{' '}
                                                    <span className="text-white/70 font-medium">
                                                        {formatLamports(liq)} SOL
                                                    </span>
                                                </span>
                                                <span>
                                                    Ends:{' '}
                                                    <span className="text-white/70 font-medium">
                                                        {endDate.toLocaleString()}
                                                    </span>
                                                </span>
                                                <span>
                                                    Oracle:{' '}
                                                    <span className="text-white/70 font-medium">{oracleShort}</span>
                                                </span>
                                                <span>
                                                    Type:{' '}
                                                    <span className="text-white/70 font-medium">
                                                        {m.isCurated ? 'Curated' : 'Community'}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span
                                                className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyles}`}
                                            >
                                                {statusLabel}
                                            </span>
                                            {resolved && (
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${m.outcome === 1
                                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        }`}
                                                >
                                                    {outcomeLabel}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Probability Bars */}
                                <div className="space-y-3 mb-5">
                                    {/* YES */}
                                    <div
                                        className={`relative ${canBetOnMarket ? 'cursor-pointer' : 'opacity-60'}`}
                                        onClick={() => canBetOnMarket && setBetModal({ market: m, side: 1 })}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">YES</span>
                                                <span className="text-sm font-bold text-green-400">{yesPct}%</span>
                                            </div>
                                            <span className="text-sm font-mono text-white/50">${yesPrice}</span>
                                        </div>
                                        <div className="h-9 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                                            <div
                                                className="h-full bg-green-500 transition-all duration-500 flex items-center"
                                                style={{ width: `${yesPct}%` }}
                                            >
                                                {yesPct > 20 && (
                                                    <span className="text-xs font-bold text-white ml-3 drop-shadow">
                                                        {yesPct}%
                                                    </span>
                                                )}
                                            </div>
                                            {yesPct <= 20 && (
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="text-xs font-semibold text-white/60 ml-3">
                                                        {yesPct}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* NO */}
                                    <div
                                        className={`relative ${canBetOnMarket ? 'cursor-pointer' : 'opacity-60'}`}
                                        onClick={() => canBetOnMarket && setBetModal({ market: m, side: 2 })}
                                    >
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-white">NO</span>
                                                <span className="text-sm font-bold text-red-400">{noPct}%</span>
                                            </div>
                                            <span className="text-sm font-mono text-white/50">${noPrice}</span>
                                        </div>
                                        <div className="h-9 bg-[#1a1a1a] rounded-lg overflow-hidden relative">
                                            <div
                                                className="h-full bg-red-500 transition-all duration-500 flex items-center"
                                                style={{ width: `${noPct}%` }}
                                            >
                                                {noPct > 20 && (
                                                    <span className="text-xs font-bold text-white ml-3 drop-shadow">
                                                        {noPct}%
                                                    </span>
                                                )}
                                            </div>
                                            {noPct <= 20 && (
                                                <div className="absolute inset-0 flex items-center">
                                                    <span className="text-xs font-semibold text-white/60 ml-3">
                                                        {noPct}%
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2">
                                    {resolved ? (
                                        <Button
                                            disabled={!canWrite}
                                            onClick={() => onWithdraw(m)}
                                            className="flex-1 bg-[#1a1a1a] hover:bg-[#252525] text-white border border-[#2a2a2a]"
                                        >
                                            Withdraw
                                        </Button>
                                    ) : (
                                        <>
                                            <Button
                                                disabled={!canBetOnMarket}
                                                onClick={() => setBetModal({ market: m, side: 1 })}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white border-0 font-medium disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                Buy YES
                                            </Button>
                                            <Button
                                                disabled={!canBetOnMarket}
                                                onClick={() => setBetModal({ market: m, side: 2 })}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white border-0 font-medium disabled:opacity-50 disabled:pointer-events-none"
                                            >
                                                Buy NO
                                            </Button>
                                        </>
                                    )}
                                </div>

                                {(canClose || canResolve) && (
                                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-[#1f1f1f]">
                                        {canClose && (
                                            <Button
                                                onClick={() => onCloseMarket(m)}
                                                variant="outline"
                                                size="sm"
                                                className="flex-1 bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]"
                                            >
                                                Close betting
                                            </Button>
                                        )}
                                        {canResolve && (
                                            <>
                                                <Button
                                                    onClick={() => onResolve(m, 1)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20"
                                                >
                                                    Resolve YES
                                                </Button>
                                                <Button
                                                    onClick={() => onResolve(m, 2)}
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                                                >
                                                    Resolve NO
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">Create Market</DialogTitle>
                        <DialogDescription className="text-white/50">
                            Enter your prediction question
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="question" className="text-white/90">Question</Label>
                            <Input
                                id="question"
                                value={qInput}
                                onChange={(e) => setQInput(e.target.value)}
                                placeholder="e.g., Will Bitcoin reach $100k by 2025?"
                                maxLength={100}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/30"
                            />
                            <p className="text-xs text-white/40">{qInput.length}/100</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime" className="text-white/90">End time (UTC)</Label>
                            <Input
                                id="endTime"
                                type="datetime-local"
                                value={endInput}
                                onChange={(e) => setEndInput(e.target.value)}
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/30"
                            />
                            <p className="text-xs text-white/40">After this time the market moves to resolving.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="oracleAddress" className="text-white/90">Oracle address</Label>
                            <Input
                                id="oracleAddress"
                                value={oracleInput}
                                onChange={(e) => setOracleInput(e.target.value)}
                                placeholder="Default: current wallet"
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-white/30 font-mono text-xs"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                            <input
                                id="curated"
                                type="checkbox"
                                checked={isCurated}
                                onChange={(e) => setIsCurated(e.target.checked)}
                                className="h-4 w-4 rounded border border-white/40 bg-transparent"
                            />
                            <Label htmlFor="curated" className="text-white/80 text-sm">
                                Official / curated oracle
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowCreate(false)}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onCreate}
                            disabled={!qInput.trim() || !endInput}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Bet Dialog */}
            <Dialog open={!!betModal} onOpenChange={() => setBetModal(null)}>
                <DialogContent className="bg-[#111111] border-[#1f1f1f] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            Buy {betModal?.side === 1 ? 'YES' : 'NO'}
                        </DialogTitle>
                        <DialogDescription className="text-white/50">
                            {betModal?.market?.question}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-white/90">Amount (lamports)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={betAmount}
                                onChange={(e) => setBetAmount(e.target.value)}
                                placeholder="1000000"
                                className="bg-[#1a1a1a] border-[#2a2a2a] text-white font-mono"
                            />
                            <p className="text-xs text-white/40">
                                ≈ {formatLamports(Number(betAmount) || 0)} SOL
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBetModal(null)}
                            className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#252525]"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onBet}
                            className={`${betModal?.side === 1
                                    ? 'bg-green-600 hover:bg-green-700'
                                    : 'bg-red-600 hover:bg-red-700'
                                } text-white`}
                        >
                            Confirm
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
