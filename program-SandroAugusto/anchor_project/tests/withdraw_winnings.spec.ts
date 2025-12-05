import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { SystemProgram } from "@solana/web3.js";
import { program, authority, deriveMarketPda, deriveBetPda, futureTimestamp, waitUntilUnixTime } from "./helpers/setup";

describe("withdraw_winnings", () => {
    const question = "Will SOL outperform BTC this quarter?";
    let marketPda, betPda;
    let endTime: number;

    before(async () => {
        endTime = futureTimestamp(5);
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

        await program.methods
            .placeBet(1, new anchor.BN(500_000))
            .accounts({
                market: marketPda,
                bet: betPda,
                bettor: authority,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        await waitUntilUnixTime(endTime);

        await program.methods
            .closeMarket()
            .accounts({
                market: marketPda,
                signer: authority,
            })
            .rpc();

        await program.methods
            .resolveMarket(1)  // ✅ Remover question, deixar apenas outcome
            .accounts({
                market: marketPda,
                oracle: authority,
            })
            .rpc();
    });

    it("allows single withdrawal", async () => {
        await program.methods
            .withdrawWinnings()
            .accounts({
                market: marketPda,
                bet: betPda,
                bettor: authority,
                systemProgram: SystemProgram.programId,
            })
            .rpc();

        const bet = await program.account.bet.fetch(betPda);
        expect(bet.withdrawn).to.be.true;
    });

    it("prevents double withdrawal", async () => {
        try {
            await program.methods
                .withdrawWinnings()
                .accounts({
                    market: marketPda,
                    bet: betPda,
                    bettor: authority,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();
            expect.fail("Expected AlreadyWithdrawn");
        } catch (err: any) {
            expect(err.toString()).to.include("AlreadyWithdrawn");
        }
    });
});
