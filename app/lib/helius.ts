import axios from "axios";
import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import { JobType } from "./models/indexingJob";

dotenv.config();

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_API_URL = "https://api.helius.xyz/v0";
const RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

export interface HeliusWebHookConfig {
  webHookURL: string;
  transactionTypes: string[];
  accountAddresses?: string[];
  accountAddressOwners?: string[];
  webHookType: "enhanced" | "raw";
  authHeader?: string;
  txnStatus?: "confirmed" | "finalized";
}

export class HeliusService {
  private connection: Connection;

  constructor() {
    this.connection = new Connection(RPC_URL, "confirmed");
  }

  async createWebHook(config: HeliusWebHookConfig): Promise<string> {
    try {
      const url = `${HELIUS_API_URL}/webhooks?api-key=${HELIUS_API_KEY}`;
      const response = await axios.post(url, config, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Webhook created:", response.data);
      return response.data.webhookID;
    } catch (error) {
      console.error("Error creating Helius webHook:", error);
      throw new Error("Failed to create Helius webHook");
    }
  }

  async deleteWebHook(webHookId: string): Promise<void> {
    try {
      const url = `${HELIUS_API_URL}/webhooks?api-key=${HELIUS_API_KEY}`;
      await axios.delete(url, {
        data: { webHookID: webHookId },
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error deleting Helius webHook:", error);
      throw new Error("Failed to delete Helius webHook");
    }
  }

  async getNFTMetadata(mintAddress: string): Promise<any> {
    try {
      const response = await axios.get(
        `${HELIUS_API_URL}/nfts?api-key=${HELIUS_API_KEY}&addresses=[${mintAddress}]`
      );
      return response.data[0];
    } catch (error) {
      console.error("Error fetching NFT metadata:", error);
      throw new Error("Failed to fetch NFT metadata");
    }
  }

  async getTokenMetadata(mintAddress: string): Promise<any> {
    try {
      const response = await axios.get(
        `${HELIUS_API_URL}/token-metadata?api-key=${HELIUS_API_KEY}&mintAccounts=[${mintAddress}]`
      );
      return response.data[0];
    } catch (error) {
      console.error("Error fetching token metadata:", error);
      throw new Error("Failed to fetch token metadata");
    }
  }

  async getTokenPrice(mintAddress: string): Promise<any> {
    try {
      const response = await axios.get(
        `${HELIUS_API_URL}/token-price?api-key=${HELIUS_API_KEY}&address=${mintAddress}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching token price:", error);
      throw new Error("Failed to fetch token price");
    }
  }

  getConnection(): Connection {
    return this.connection;
  }

  static getWebHookConfigForJobType(
    jobType: JobType,
    jobId: number,
    config: Record<string, any>
  ): HeliusWebHookConfig {
    const baseConfig = {
      webHookURL: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/${jobType}/${jobId}`,
      webHookType: "enhanced" as const,
      txnStatus: "confirmed" as const,
      authHeader: process.env.WEBHOOK_AUTH_HEADER,
    };

    switch (jobType) {
      case "nft_bids":
        return {
          ...baseConfig,
          transactionTypes: ["NFT_BID"],
          accountAddresses: config.collection_addresses || [],
          accountAddressOwners: config.marketplace_addresses || [],
        };
      case "nft_prices":
        return {
          ...baseConfig,
          transactionTypes: ["NFT_LISTING", "NFT_SALE"],
          accountAddresses: config.collection_addresses || [],
          accountAddressOwners: config.marketplace_addresses || [],
        };
      case "token_borrowing":
        return {
          ...baseConfig,
          transactionTypes: ["SWAP", "UNKNOWN"],
          accountAddressOwners: config.protocol_addresses || [],
        };
      case "token_prices":
        return {
          ...baseConfig,
          transactionTypes: ["SWAP"],
          accountAddressOwners: config.dex_addresses || [],
        };
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }
}

export const heliusService = new HeliusService();
