import { IndexingJobModel } from "./models/indexingJob";
import { DatabaseConnectionModel } from "./models/dbConnection";
import { JobLogModel } from "./models/jobLog";
import { heliusService } from "./helius";
import knex from "knex";
import clientSchemas from "./utils/clientSchema";
import {
  extractPoolDataFromTransactions,
  extractReserveDataFromTransactions,
} from "./utils/helpers";

async function getClientDbConnection(jobId: number) {
  const job = await IndexingJobModel.findById(jobId);
  if (!job) {
    throw new Error(`Job with ID ${jobId} not found`);
  }

  const dbConn = await DatabaseConnectionModel.findById(job.db_connection_id);
  if (!dbConn) {
    throw new Error(
      `Database connection with ID ${job.db_connection_id} not found`
    );
  }

  const password = DatabaseConnectionModel.getDecryptedPassword(dbConn);

  const clientDb = knex({
    client: "pg",
    connection: {
      host: dbConn.host,
      port: dbConn.port,
      user: dbConn.username,
      password,
      database: dbConn.database_name,
      ssl: dbConn.ssl ? { rejectUnauthorized: false } : undefined,
    },
    pool: { min: 0, max: 5 },
  });

  return { clientDb, job };
}

async function ensureTableExists(
  db: knex.Knex,
  jobType: keyof typeof clientSchemas,
  tableName: string
) {
  const schemaTemplate = clientSchemas[jobType];
  if (!schemaTemplate) {
    throw new Error(`No schema template found for job type: ${jobType}`);
  }

  const schemaSql = schemaTemplate.replace(/\${tableName}/g, tableName);
  await db.raw(schemaSql);
}

export async function processNftBids(jobId: number, data: any): Promise<any> {
  try {
    const { clientDb, job } = await getClientDbConnection(jobId);
    await ensureTableExists(clientDb, job.job_type, job.target_table);

    for (const transaction of data.transactions) {
      if (transaction.type !== "NFT_BID") continue;

      const { nft, marketplace, buyer, amount, bidId, expiry } =
        transaction.events.nft?.bid || {};

      if (!nft || !marketplace || !buyer || !amount) continue;

      await clientDb(job.target_table)
        .insert({
          marketplace: marketplace.name || "unknown",
          auction_house: marketplace.programId || null,
          token_address: nft.address,
          token_mint: nft.mint,
          buyer: buyer,
          price: amount,
          token_size: nft.tokenStandard === "NonFungible" ? 1 : null,
          expiry: expiry ? new Date(expiry) : null,
          bid_id: bidId || null,
          created_at: new Date(),
          updated_at: new Date(),
        })
        .onConflict(["marketplace", "bid_id"])
        .merge(["price", "updated_at"])
        .returning("*");
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${data.transactions.length} transactions`,
      details: { count: data.transactions.length },
    });

    await clientDb.destroy();
    return { success: true, processedCount: data.transactions.length };
  } catch (error) {
    console.error(`Error processing NFT bids for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing NFT bids",
      details: { error: (error as Error).message },
    });
    throw error;
  }
}

export async function processNftPrices(jobId: number, data: any): Promise<any> {
  try {
    const { clientDb, job } = await getClientDbConnection(jobId);
    await ensureTableExists(clientDb, job.job_type, job.target_table);

    for (const transaction of data.transactions) {
      if (!["NFT_LISTING", "NFT_SALE"].includes(transaction.type)) continue;

      const nftEvent = transaction.events.nft;
      if (!nftEvent) continue;

      if (transaction.type === "NFT_LISTING" && nftEvent.listing) {
        const { nft, marketplace, seller, amount, listingId } =
          nftEvent.listing;

        if (!nft || !marketplace || !seller || !amount) continue;

        let priceUsd = null;
        if (job.configuration.include_usd_prices) {
          try {
            const priceData = await heliusService.getTokenPrice(
              marketplace.paymentMint
            );
            if (priceData && priceData.price) {
              priceUsd = (amount / 10 ** 9) * priceData.price;
            }
          } catch (err) {
            console.warn("Failed to get USD price:", err);
          }
        }

        await clientDb(job.target_table)
          .insert({
            marketplace: marketplace.name || "unknown",
            token_address: nft.address,
            token_mint: nft.mint,
            collection_address: nft.collection?.address || null,
            price_lamports: amount,
            price_usd: priceUsd,
            seller: seller,
            listing_id: listingId || `${nft.mint}-${seller}-${amount}`,
            created_at: new Date(),
            updated_at: new Date(),
          })
          .onConflict(["marketplace", "listing_id"])
          .merge(["price_lamports", "price_usd", "updated_at"])
          .returning("*");
      }

      if (transaction.type === "NFT_SALE" && nftEvent.sale) {
        const { nft, marketplace } = nftEvent.sale;

        if (!nft || !marketplace) continue;

        await clientDb(job.target_table)
          .where({ token_mint: nft.mint })
          .delete();
      }
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${data.transactions.length} transactions`,
      details: { count: data.transactions.length },
    });

    await clientDb.destroy();
    return { success: true, processedCount: data.transactions.length };
  } catch (error) {
    console.error(`Error processing NFT prices for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing NFT prices",
      details: { error: (error as Error).message },
    });
    throw error;
  }
}

export async function processTokenBorrowing(
  jobId: number,
  data: any
): Promise<any> {
  try {
    const { clientDb, job } = await getClientDbConnection(jobId);
    await ensureTableExists(clientDb, job.job_type, job.target_table);

    const { protocols = [], reserve_addresses = [] } = job.configuration;
    const extractedReserveData = extractReserveDataFromTransactions(
      data.transactions,
      protocols,
      reserve_addresses
    );

    for (const reserve of extractedReserveData) {
      await clientDb(job.target_table)
        .insert({
          protocol: reserve.protocol,
          reserve_address: reserve.address,
          token_mint: reserve.tokenMint,
          token_symbol: reserve.tokenSymbol,
          available_amount: reserve.availableAmount,
          borrow_apy: reserve.borrowApy,
          ltv_ratio: reserve.ltvRatio,
          liquidation_threshold: reserve.liquidationThreshold,
          liquidation_penalty: reserve.liquidationPenalty,
          updated_at: new Date(),
        })
        .onConflict(["protocol", "reserve_address"])
        .merge([
          "available_amount",
          "borrow_apy",
          "ltv_ratio",
          "liquidation_threshold",
          "liquidation_penalty",
          "updated_at",
        ])
        .returning("*");
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${extractedReserveData.length} reserve updates`,
      details: { count: extractedReserveData.length },
    });

    await clientDb.destroy();
    return { success: true, processedCount: extractedReserveData.length };
  } catch (error) {
    console.error(`Error processing token borrowing for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing token borrowing",
      details: { error: (error as Error).message },
    });
    throw error;
  }
}

export async function processTokenPrices(
  jobId: number,
  data: any
): Promise<any> {
  try {
    const { clientDb, job } = await getClientDbConnection(jobId);
    await ensureTableExists(clientDb, job.job_type, job.target_table);

    const extractedPoolData = extractPoolDataFromTransactions(
      data.transactions
    );

    for (const pool of extractedPoolData) {
      await clientDb(job.target_table)
        .insert({
          token_mint: pool.tokenMint,
          token_symbol: pool.tokenSymbol,
          dex: pool.dex,
          pool_address: pool.poolAddress,
          price_usd: pool.priceUsd,
          volume_24h: pool.volume24h,
          liquidity_usd: pool.liquidityUsd,
          updated_at: new Date(),
        })
        .onConflict(["dex", "pool_address"])
        .merge(["price_usd", "volume_24h", "liquidity_usd", "updated_at"])
        .returning("*");
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${extractedPoolData.length} token price updates`,
      details: { count: extractedPoolData.length },
    });

    await clientDb.destroy();
    return { success: true, processedCount: extractedPoolData.length };
  } catch (error) {
    console.error(`Error processing token prices for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing token prices",
      details: { error: (error as Error).message },
    });
    throw error;
  }
}
