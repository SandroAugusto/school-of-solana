import * as anchor from "@coral-xyz/anchor";
import idl from "../idl/prediction_market.json";

export function getProvider() {
    const connection = new anchor.web3.Connection(anchor.web3.clusterApiUrl("devnet"));
    const wallet = (window as any).solana;
    if (!wallet) throw new Error("Wallet not found");
    const provider = new anchor.AnchorProvider(connection, wallet, {
        preflightCommitment: "processed",
    });
    anchor.setProvider(provider);
    return provider;
}

export function getProgram() {
    const provider = getProvider();
    return new anchor.Program(idl as anchor.Idl, provider);
}
