import * as anchor from "@coral-xyz/anchor";
import { expect } from "chai";
import { program, authority, deriveMarketPda, futureTimestamp, waitUntilUnixTime } from "./helpers/setup";

describe("resolve_market", () => {
    const question = "Will ETH reach 4k this year?";

    async function setupResolvableMarket(suffix: string) {
        const q = `${question} ${suffix}`;
        const endTime = futureTimestamp(3);
        const marketPda = deriveMarketPda(q, endTime);
        await program.methods
            .initializeMarket(q, new anchor.BN(endTime), authority, false)
            .accounts({
                market: marketPda,
                authority: authority,
                systemProgram: anchor.web3.SystemProgram.programId,
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

        return marketPda;
    }

    it("resolves successfully", async () => {
        const marketPda = await setupResolvableMarket("success");

        await program.methods
            .resolveMarket(1)
            .accounts({
                market: marketPda,
                oracle: authority,
            })
            .rpc();

        const market = await program.account.market.fetch(marketPda);
        expect(market.status).to.eq(2);
        expect(market.outcome).to.eq(1);
    });

    it("rejects invalid outcome", async () => {
        const marketPda = await setupResolvableMarket("invalid");

        try {
            await program.methods
                .resolveMarket(3)
                .accounts({
                    market: marketPda,
                    oracle: authority,
                })
                .rpc();
            expect.fail("Expected invalid side error");
        } catch (err: any) {
            expect(err.toString()).to.include("InvalidSide");
        }
    });
});
