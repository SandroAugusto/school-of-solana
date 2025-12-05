import { getProgram } from '../../anchor/program';
import { PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import { deriveMarketPda, deriveBetPda } from '../../lib/pdas';

const toNumber = (value: anchor.BN | number | undefined) => {
    if (!value) return 0;
    return typeof value === 'number' ? value : value.toNumber();
};

export async function listMarkets(wallet: anchor.Wallet) {
    const program = getProgram(wallet);
    // GPA por discriminador do tipo Market (Anchor faz isso com .all())
    const accounts = await (program.account as any).market.all();
    // Ordena por recente (opcional)
    accounts.sort((a: any, b: any) => b.publicKey.toBase58().localeCompare(a.publicKey.toBase58()));
    return accounts.map(({ publicKey, account }: any) => ({
        pubkey: publicKey as PublicKey,
        authority: account.authority,
        oracle: account.oracle,
        question: account.question,
        totalYes: account.totalYes,
        totalNo: account.totalNo,
        outcome: account.outcome,
        status: account.status,
        endTime: toNumber(account.endTime),
        isCurated: account.isCurated,
    }));
}

export async function createMarket(
    wallet: anchor.Wallet,
    question: string,
    endTime: number,
    oracle: PublicKey,
    isCurated: boolean
) {
    const program = getProgram(wallet);
    const authority = program.provider.publicKey!;
    const marketPda = deriveMarketPda(authority, question, endTime, program.programId);

    await program.methods
        .initializeMarket(question, new anchor.BN(endTime), oracle, isCurated)
        .accounts({
            market: marketPda,
            authority,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

    return marketPda;
}

export async function placeBet(
    wallet: anchor.Wallet,
    market: PublicKey,
    side: 1 | 2,
    amountLamports: number | anchor.BN
) {
    const program = getProgram(wallet);
    const bettor = program.provider.publicKey!;
    const betPda = deriveBetPda(market, bettor, program.programId);

    await program.methods
        .placeBet(side, new anchor.BN(amountLamports))
        .accounts({
            market,
            bet: betPda,
            bettor,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

    return betPda;
}

export async function resolveMarket(
    wallet: anchor.Wallet,
    market: PublicKey,
    outcome: 1 | 2
) {
    const program = getProgram(wallet);
    const oracle = program.provider.publicKey!;
    await program.methods
        .resolveMarket(outcome)
        .accounts({
            market,
            oracle,
        })
        .rpc();
}

export async function closeMarket(wallet: anchor.Wallet, market: PublicKey) {
    const program = getProgram(wallet);
    const signer = program.provider.publicKey!;
    await program.methods
        .closeMarket()
        .accounts({
            market,
            signer,
        })
        .rpc();
}

export async function withdrawWinnings(wallet: anchor.Wallet, market: PublicKey) {
    const program = getProgram(wallet);
    const bettor = program.provider.publicKey!;
    const betPda = deriveBetPda(market, bettor, program.programId);

    await program.methods
        .withdrawWinnings()
        .accounts({
            market,
            bet: betPda,
            bettor,
            systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
}
