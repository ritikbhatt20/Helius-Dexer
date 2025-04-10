/* eslint-disable */
import { db } from "../db";

export type JobType =
  | "nft_bids"
  | "nft_prices"
  | "token_borrowing"
  | "token_prices";
export type JobStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "failed";

// Define specific configuration types for each job type
export interface NftBidsConfig {
  marketplace_addresses?: string[];
  collection_addresses?: string[];
}

export interface NftPricesConfig {
  marketplace_addresses?: string[];
  collection_addresses?: string[];
  include_usd_prices?: boolean;
}

export interface TokenBorrowingConfig {
  protocol_addresses?: string[];
  reserve_addresses?: string[];
}

export interface TokenPricesConfig {
  dex_addresses?: string[];
}

export interface IndexingJob {
  id: number;
  user_id: number;
  db_connection_id: number;
  job_type: JobType;
  configuration:
    | NftBidsConfig
    | NftPricesConfig
    | TokenBorrowingConfig
    | TokenPricesConfig;
  target_table: string;
  status: JobStatus;
  webhook_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IndexingJobInput {
  user_id: number;
  db_connection_id: number;
  job_type: JobType;
  configuration:
    | NftBidsConfig
    | NftPricesConfig
    | TokenBorrowingConfig
    | TokenPricesConfig;
  target_table: string;
}

export class IndexingJobModel {
  static async create(data: IndexingJobInput): Promise<IndexingJob> {
    const [job] = await db("indexing_jobs")
      .insert({
        ...data,
        status: "pending",
        configuration: JSON.stringify(data.configuration), // Serialize to JSON
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning("*");

    return {
      ...job,
      configuration: job.configuration || {},
    };
  }

  static async findById(id: number): Promise<IndexingJob | undefined> {
    const job = await db("indexing_jobs").where({ id }).first();
    if (job) {
      return {
        ...job,
        configuration: job.configuration || {},
      };
    }
    return undefined;
  }

  static async findByUserId(userId: number): Promise<IndexingJob[]> {
    const jobs = await db("indexing_jobs").where({ user_id: userId });
    return jobs.map((job) => ({
      ...job,
      configuration: job.configuration || {},
    }));
  }

  static async update(
    id: number,
    data: Partial<Omit<IndexingJob, "configuration">> & {
      configuration?:
        | NftBidsConfig
        | NftPricesConfig
        | TokenBorrowingConfig
        | TokenPricesConfig;
    }
  ): Promise<IndexingJob> {
    const updateData: any = { ...data, updated_at: new Date() };
    if (data.configuration) {
      updateData.configuration = JSON.stringify(data.configuration);
    }
    const [updated] = await db("indexing_jobs")
      .where({ id })
      .update(updateData)
      .returning("*");

    return {
      ...updated,
      configuration: updated.configuration || {},
    };
  }

  static async updateStatus(
    id: number,
    status: JobStatus
  ): Promise<IndexingJob> {
    return this.update(id, { status });
  }

  static async setWebhookId(
    id: number,
    webhookId: string
  ): Promise<IndexingJob> {
    return this.update(id, { webhook_id: webhookId });
  }

  static async delete(id: number): Promise<void> {
    await db("indexing_jobs").where({ id }).delete();
  }

  static async insertIntoTargetTable(
    tableName: string,
    data: any,
    jobType: JobType
  ) {
    const query = this.buildInsertQuery(tableName, data, jobType);
    await db.raw(query.query, query.values);
  }

  private static buildInsertQuery(
    tableName: string,
    data: any,
    jobType: JobType
  ) {
    switch (jobType) {
      case "nft_bids":
        return {
          query: `
            INSERT INTO ${tableName} (marketplace, auction_house, token_address, token_mint, buyer, price, token_size, expiry, bid_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (marketplace, bid_id) DO UPDATE
            SET price = EXCLUDED.price, updated_at = EXCLUDED.updated_at
          `,
          values: [
            data.marketplace,
            data.auction_house,
            data.token_address,
            data.token_mint,
            data.buyer,
            data.price,
            data.token_size,
            data.expiry,
            data.bid_id,
            data.created_at,
            data.updated_at,
          ],
        };
      case "nft_prices":
        return {
          query: `
            INSERT INTO ${tableName} (marketplace, token_address, token_mint, collection_address, price_lamports, price_usd, seller, listing_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (marketplace, listing_id) DO UPDATE
            SET price_lamports = EXCLUDED.price_lamports, price_usd = EXCLUDED.price_usd, updated_at = EXCLUDED.updated_at
          `,
          values: [
            data.marketplace,
            data.token_address,
            data.token_mint,
            data.collection_address,
            data.price_lamports,
            data.price_usd,
            data.seller,
            data.listing_id,
            data.created_at,
            data.updated_at,
          ],
        };
      case "token_borrowing":
        return {
          query: `
            INSERT INTO ${tableName} (protocol, reserve_address, token_mint, token_symbol, available_amount, borrow_apy, ltv_ratio, liquidation_threshold, liquidation_penalty, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (protocol, reserve_address) DO UPDATE
            SET available_amount = EXCLUDED.available_amount, borrow_apy = EXCLUDED.borrow_apy, ltv_ratio = EXCLUDED.ltv_ratio, liquidation_threshold = EXCLUDED.liquidation_threshold, liquidation_penalty = EXCLUDED.liquidation_penalty, updated_at = EXCLUDED.updated_at
          `,
          values: [
            data.protocol,
            data.reserve_address,
            data.token_mint,
            data.token_symbol,
            data.available_amount,
            data.borrow_apy,
            data.ltv_ratio,
            data.liquidation_threshold,
            data.liquidation_penalty,
            data.updated_at,
          ],
        };
      case "token_prices":
        return {
          query: `
            INSERT INTO ${tableName} (token_mint, token_symbol, dex, pool_address, price_usd, volume_24h, liquidity_usd, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (dex, pool_address) DO UPDATE
            SET price_usd = EXCLUDED.price_usd, volume_24h = EXCLUDED.volume_24h, liquidity_usd = EXCLUDED.liquidity_usd, updated_at = EXCLUDED.updated_at
          `,
          values: [
            data.token_mint,
            data.token_symbol,
            data.dex,
            data.pool_address,
            data.price_usd,
            data.volume_24h,
            data.liquidity_usd,
            data.updated_at,
          ],
        };
      default:
        throw new Error(`Unsupported job type: ${jobType}`);
    }
  }
}
