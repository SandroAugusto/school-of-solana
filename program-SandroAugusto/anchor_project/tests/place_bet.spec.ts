import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram } from "@solana/web3.js";
import { program, authority, deriveMarketPda, deriveBetPda, futureTimestamp, connection } from "./helpers/setup";

describe("place_bet", () => {
    const question = "Will BTC stay above $60k?";
    let marketPda;
    let betPda;
    let endTime: number;

    before(async () => {
        endTime = futureTimestamp(600);
        marketPda = deriveMarketPda(question, endTime);
        betPda = deriveBetPda(marketPda, authority);
        await program.methods
            .initializeMarket(question, new anchor.BN(endTime), authority, false)
            .accounts({
                market: marketPda,
                authority: authority,
                systemProgram: SystemProgram.programId,
            })
            .rpc();
    });

    it("places a valid YES bet", async () => {
        await program.methods
            .placeBet(1, new anchor.BN(1_000_000))
            .accounts({
                market: marketPda,
                bet: betPda,
                bettor: authority,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const market = await program.account.market.fetch(marketPda);
        expect(market.totalYes.toNumber()).to.equal(1_000_000);
    });

    it("rejects invalid side", async () => {
        const newBettor = anchor.web3.Keypair.generate();
        const newBetPda = deriveBetPda(marketPda, newBettor.publicKey);
        await connection.confirmTransaction(
            await connection.requestAirdrop(newBettor.publicKey, 2 * anchor.web3.LAMPORTS_PER_SOL)
        );

        try {
            await program.methods
                .placeBet(9, new anchor.BN(1_000_000))
                .accounts({
                    market: marketPda,
                    bet: newBetPda,
                    bettor: newBettor.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .signers([newBettor])
                .rpc();
            expect.fail("Expected invalid side error");
        } catch (err: any) {
            const errorStr = err.toString();
            expect(errorStr).to.satisfy((msg: string) =>
                msg.includes("InvalidSide") ||
                msg.includes("Simulation failed") ||
                msg.includes("0x1")
            );
        }
    });
});
