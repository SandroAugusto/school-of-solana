import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { program, authority, systemProgram, deriveMarketPda, futureTimestamp } from "./helpers/setup";

describe("initialize_market", () => {
    it("creates a new market successfully", async () => {
        const question = "Will Solana stay above $100?";
        const endTime = futureTimestamp(300);
        const marketPda = deriveMarketPda(question, endTime);

        await program.methods
            .initializeMarket(question, new anchor.BN(endTime), authority, false)
            .accounts({
                market: marketPda,
                authority: authority, // ✅ Removido .publicKey
                systemProgram,
            })
            .rpc();

        const market = await program.account.market.fetch(marketPda);
        expect(market.question).to.eq(question);
    });

    it("throws error on too long question", async () => {
        const longQ = "x".repeat(200);
        const endTime = futureTimestamp(300);
        const marketPda = deriveMarketPda(longQ, endTime);

        try {
            await program.methods
                .initializeMarket(longQ, new anchor.BN(endTime), authority, false)
                .accounts({
                    market: marketPda,
                    authority: authority, // ✅ Removido .publicKey
                    systemProgram,
                })
                .rpc();
            expect.fail("Expected QuestionTooLong");
        } catch (err: any) {
            expect(err.toString()).to.include("QuestionTooLong");
        }
    });
});
