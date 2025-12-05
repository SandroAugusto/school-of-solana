import { PublicKey } from '@solana/web3.js';
import { sha256 } from '@noble/hashes/sha256';

export function hashQuestion32(question: string): Uint8Array {
  const h = sha256(new TextEncoder().encode(question));
  return h.slice(0, 32);
}

export function deriveMarketPda(
  authority: PublicKey,
  question: string,
  endTime: number,
  programId: PublicKey
): PublicKey {
  const seedHash = hashQuestion32(question);
  const endTimeBuf = Buffer.alloc(8);
  endTimeBuf.writeBigInt64LE(BigInt(endTime));
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('market'), authority.toBuffer(), Buffer.from(seedHash), endTimeBuf],
    programId
  );
  return pda;
}

export function deriveBetPda(
  market: PublicKey,
  bettor: PublicKey,
  programId: PublicKey
): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from('bet'), market.toBuffer(), bettor.toBuffer()],
    programId
  );
  return pda;
}
