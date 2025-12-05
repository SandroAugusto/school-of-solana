import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, Idl } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import idlRaw from '../idl/prediction_market.json';

export const PROGRAM_ID = new PublicKey('5m2w2PzCZkSPt8dcqFiuxrSNQX6Z8e84Etne95UPFTBT');
export const DEVNET_RPC = 'https://api.devnet.solana.com';

export function getConnection() {
    return new Connection(DEVNET_RPC, 'confirmed');
}

export function getProvider(wallet: anchor.Wallet) {
    const connection = getConnection();
    return new AnchorProvider(connection, wallet, { commitment: 'confirmed' });
}

export function getProgram(wallet: anchor.Wallet) {
    const provider = getProvider(wallet);

    // Deep clone do IDL
    const idl = JSON.parse(JSON.stringify(idlRaw)) as Idl;

    // CRÍTICO: Mapear accounts para types ANTES de criar o Program
    if (idl.accounts && idl.types) {
        idl.accounts = idl.accounts.map((acc: any) => {
            // Se o account não tem type, buscar no array types pelo nome
            if (!acc.type && acc.name) {
                const typeDef = idl.types?.find(t => t.name === acc.name);
                if (typeDef && typeDef.type) {
                    // Retornar account com type completo
                    return {
                        name: acc.name,
                        discriminator: acc.discriminator,
                        type: typeDef.type
                    };
                }
            }
            // Se já tem type, retornar como está
            return acc;
        });
    }

    // Anchor 0.31 expects the Program constructor signature `(idl, provider, coder)`.
    // Passing the program ID as the second argument was valid in older versions,
    // but now it makes Anchor treat the program ID as the provider and the real
    // provider as the coder, which causes `_coder.accounts` to be undefined and
    // ultimately triggers the "Cannot read properties of undefined (reading 'size')" error.
    // Ensure the ID inside the IDL matches PROGRAM_ID and pass the provider in the proper slot.
    idl.address = PROGRAM_ID.toBase58();
    return new Program(idl, provider);
}

export type { BN } from '@coral-xyz/anchor';
