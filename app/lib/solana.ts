import {
  Connection,
  Keypair,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import dotenv from "dotenv";

dotenv.config();

export class SolanaService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(
      "https://api.devnet.solana.com",
      "confirmed"
    );
  }

  async signAndSubmitTransaction(): Promise<string> {
    try {
      const payer = Keypair.generate();
      const airdropSignature = await this.connection.requestAirdrop(
        payer.publicKey,
        LAMPORTS_PER_SOL
      );
      await this.connection.confirmTransaction(airdropSignature);

      const recipient = Keypair.generate().publicKey;
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: payer.publicKey,
          toPubkey: recipient,
          lamports: LAMPORTS_PER_SOL / 100,
        })
      );

      const signature = await this.connection.sendTransaction(transaction, [
        payer,
      ]);
      await this.connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error("Error signing and submitting transaction:", error);
      throw new Error("Failed to sign and submit transaction");
    }
  }
}

export const solanaService = new SolanaService();
