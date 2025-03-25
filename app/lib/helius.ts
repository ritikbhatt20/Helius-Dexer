import axios from "axios";
import { Connection } from "@solana/web3.js";
import dotenv from "dotenv";
import {
  JobType,
  NftBidsConfig,
  NftPricesConfig,
  TokenBorrowingConfig,
  TokenPricesConfig,
} from "./models/indexingJob";

dotenv.config();

const HELIUS_API_KEY = process.env.HELIUS_API_KEY || "";
const HELIUS_API_URL = "https://api.helius.xyz/v0";
const RPC_URL = `https://rpc.helius.xyz/?api-key=${HELIUS_API_KEY}`;

export interface HeliusWebHookConfig {
  webhookURL: string; // Updated to match Helius API field name
  transactionTypes: string[];
  accountAddresses: string[];
  webhookType: "enhanced" | "raw"; // Updated to match Helius API field name
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
      console.log("Creating webhook with config:", config);
      const response = await axios.post(url, config, {
        headers: { "Content-Type": "application/json" },
      });
      console.log("Webhook created:", response.data);
      return response.data.webhookID;
    } catch (error) {
      console.error("Error creating Helius webHook:", error);
      if (axios.isAxiosError(error) && error.response) {
        console.error("Helius API response:", error.response.data);
      }
      throw new Error("Failed to create Helius webHook");
    }
  }

  async deleteWebHook(webHookId: string): Promise<void> {
    try {
      const url = `${HELIUS_API_URL}/webhooks/${webHookId}?api-key=${HELIUS_API_KEY}`; // Fixed URL
      await axios.delete(url, {
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
    config:
      | NftBidsConfig
      | NftPricesConfig
      | TokenBorrowingConfig
      | TokenPricesConfig
  ): HeliusWebHookConfig {
    const baseConfig = {
      webhookURL: `${process.env.WEBHOOK_BASE_URL}/api/webhooks/${jobType}/${jobId}`, // Updated field name
      webhookType: "enhanced" as const, // Updated field name
      txnStatus: "confirmed" as const,
      authHeader: process.env.WEBHOOK_AUTH_HEADER,
    };

    switch (jobType) {
      case "nft_bids":
        return {
          ...baseConfig,
          transactionTypes: ["NFT_BID"],
          accountAddresses: [
            ...((config as NftBidsConfig).collection_addresses || []),
            ...((config as NftBidsConfig).marketplace_addresses || []),
          ],
        };
      case "nft_prices":
        return {
          ...baseConfig,
          transactionTypes: ["NFT_LISTING", "NFT_SALE"],
          accountAddresses: [
            ...((config as NftPricesConfig).collection_addresses || []),
            ...((config as NftPricesConfig).marketplace_addresses || []),
          ],
        };
      case "token_borrowing":
        return {
          ...baseConfig,
          transactionTypes: ["SWAP", "UNKNOWN"],
          accountAddresses:
            (config as TokenBorrowingConfig).protocol_addresses || [],
        };
      case "token_prices":
        return {
          ...baseConfig,
          transactionTypes: ["SWAP"],
          accountAddresses: (config as TokenPricesConfig).dex_addresses || [],
        };
      default:
        throw new Error(`Unknown job type: ${jobType}`);
    }
  }
}

export const heliusService = new HeliusService();
