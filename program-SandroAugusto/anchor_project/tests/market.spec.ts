import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PredictionMarket } from "../target/types/prediction_market";
import { expect } from "chai";
import { deriveMarketPda, futureTimestamp } from "./helpers/setup";

describe("prediction_market", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.PredictionMarket as Program<PredictionMarket>;
  const authority = provider.wallet;
  const question = "Will BTC exceed 100k in 2025?";
  let marketPda: anchor.web3.PublicKey;
  let endTime: number;

  it("initializes market", async () => {
    endTime = futureTimestamp(600);
    marketPda = deriveMarketPda(question, endTime);
    await program.methods
      .initializeMarket(question, new anchor.BN(endTime), authority.publicKey, false)
      .accounts({
        market: marketPda,
        authority: authority.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const marketAccount = await program.account.market.fetch(marketPda);
    expect(marketAccount.authority.toBase58()).to.eq(authority.publicKey.toBase58());
    expect(marketAccount.question).to.eq(question);
  });

  it("fails with too long question", async () => {
    const badQuestion = "x".repeat(200);
    const badEnd = futureTimestamp(650);
    const badPda = deriveMarketPda(badQuestion, badEnd);

    try {
      await program.methods
        .initializeMarket(badQuestion, new anchor.BN(badEnd), authority.publicKey, false)
        .accounts({
          market: badPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      throw new Error("Should have failed");
    } catch (err: any) {
      expect(err).to.be.instanceOf(Error);
      expect(err.message).to.include("QuestionTooLong"); // ✅ Mudado de "Simulation failed" para "QuestionTooLong"
    }

  });
});
