import * as anchor from "@coral-xyz/anchor";
import { SystemProgram, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { PredictionMarket } from "../../target/types/prediction_market";

// Usar .env() para ler do Anchor.toml - o anchor test inicia o validator automaticamente
const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);

export const program = anchor.workspace.PredictionMarket as anchor.Program<PredictionMarket>;
export const authority = provider.wallet.publicKey;
export const systemProgram = SystemProgram.programId;
export const connection = provider.connection;

export function deriveMarketPda(question: string, endTime: number): PublicKey {
    const hash = createHash("sha256").update(question).digest().slice(0, 32);
    const endTimeBytes = Buffer.alloc(8);
    endTimeBytes.writeBigInt64LE(BigInt(endTime));
    const [marketPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("market"), authority.toBuffer(), hash, endTimeBytes],
        program.programId
    );
    return marketPda;
}

export function deriveBetPda(market: PublicKey, bettor: PublicKey): PublicKey {
    const [betPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("bet"), market.toBuffer(), bettor.toBuffer()],
        program.programId
    );
    return betPda;
}

export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function futureTimestamp(secondsAhead = 60): number {
    return Math.floor(Date.now() / 1000) + secondsAhead;
}

export async function getClusterTime(): Promise<number> {
    const slot = await connection.getSlot();
    const blockTime = await connection.getBlockTime(slot);
    return blockTime ?? Math.floor(Date.now() / 1000);
}

export async function waitUntilUnixTime(target: number): Promise<void> {
    while (true) {
        const current = await getClusterTime();
        if (current >= target) {
            return;
        }
        await sleep(Math.min((target - current) * 1000, 1000));
    }
}
