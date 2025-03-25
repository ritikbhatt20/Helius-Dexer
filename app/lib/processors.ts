import {
  IndexingJobModel,
  TokenBorrowingConfig,
  NftPricesConfig,
} from "./models/indexingJob";
import { DatabaseConnectionModel } from "./models/dbConnection";
import { JobLogModel } from "./models/jobLog";
import { heliusService } from "./helius";
import knex from "knex";
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

export async function processNftBids(jobId: number, data: any): Promise<any> {
  let clientDb: knex.Knex | undefined;
  try {
    const { clientDb: db, job } = await getClientDbConnection(jobId);
    clientDb = db;

    let processedCount = 0;
    for (const transaction of data.transactions || []) {
      if (transaction.type !== "NFT_BID") continue;

      const { nft, marketplace, buyer, amount, bidId, expiry } =
        transaction.events?.nft?.bid || {};

      if (!nft || !marketplace || !buyer || !amount) continue;

      const bidData = {
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
      };

      await IndexingJobModel.insertIntoTargetTable(
        job.target_table,
        bidData,
        "nft_bids"
      );
      processedCount++;
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${processedCount} NFT bid transactions`,
      details: {
        processedCount,
        totalTransactions: data.transactions?.length || 0,
      },
    });

    return { success: true, processedCount };
  } catch (error) {
    console.error(`Error processing NFT bids for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing NFT bids",
      details: { error: (error as Error).message },
    });
    throw error;
  } finally {
    if (clientDb) {
      await clientDb.destroy();
    }
  }
}

export async function processNftPrices(jobId: number, data: any): Promise<any> {
  let clientDb: knex.Knex | undefined;
  try {
    const { clientDb: db, job } = await getClientDbConnection(jobId);
    clientDb = db;

    // Type guard to ensure job.configuration is NftPricesConfig
    const config = job.configuration as NftPricesConfig;

    let processedCount = 0;
    for (const transaction of data.transactions || []) {
      if (!["NFT_LISTING", "NFT_SALE"].includes(transaction.type)) continue;

      const nftEvent = transaction.events?.nft;
      if (!nftEvent) continue;

      if (transaction.type === "NFT_LISTING" && nftEvent.listing) {
        const { nft, marketplace, seller, amount, listingId } =
          nftEvent.listing;

        if (!nft || !marketplace || !seller || !amount) continue;

        let priceUsd: number | null = null;
        if (config.include_usd_prices) {
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

        const listingData = {
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
        };

        await IndexingJobModel.insertIntoTargetTable(
          job.target_table,
          listingData,
          "nft_prices"
        );
        processedCount++;
      }

      if (transaction.type === "NFT_SALE" && nftEvent.sale) {
        const { nft, marketplace } = nftEvent.sale;

        if (!nft || !marketplace) continue;

        await clientDb(job.target_table)
          .where({ token_mint: nft.mint })
          .delete();
        processedCount++;
      }
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${processedCount} NFT price transactions`,
      details: {
        processedCount,
        totalTransactions: data.transactions?.length || 0,
      },
    });

    return { success: true, processedCount };
  } catch (error) {
    console.error(`Error processing NFT prices for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing NFT prices",
      details: { error: (error as Error).message },
    });
    throw error;
  } finally {
    if (clientDb) {
      await clientDb.destroy();
    }
  }
}

export async function processTokenBorrowing(
  jobId: number,
  data: any
): Promise<any> {
  let clientDb: knex.Knex | undefined;
  try {
    const { clientDb: db, job } = await getClientDbConnection(jobId);
    clientDb = db;

    // Type guard to ensure job.configuration is TokenBorrowingConfig
    const config = job.configuration as TokenBorrowingConfig;
    const protocols = config.protocol_addresses || [];
    const reserve_addresses = config.reserve_addresses || [];

    const extractedReserveData = extractReserveDataFromTransactions(
      data.transactions || [],
      protocols,
      reserve_addresses
    );

    let processedCount = 0;
    for (const reserve of extractedReserveData) {
      const reserveData = {
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
      };

      await IndexingJobModel.insertIntoTargetTable(
        job.target_table,
        reserveData,
        "token_borrowing"
      );
      processedCount++;
    }

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${processedCount} token borrowing reserve updates`,
      details: {
        processedCount,
        totalTransactions: data.transactions?.length || 0,
      },
    });

    return { success: true, processedCount };
  } catch (error) {
    console.error(`Error processing token borrowing for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing token borrowing",
      details: { error: (error as Error).message },
    });
    throw error;
  } finally {
    if (clientDb) {
      await clientDb.destroy();
    }
  }
}

export async function processTokenPrices(
  jobId: number,
  data: any
): Promise<any> {
  let clientDb: knex.Knex | undefined;
  try {
    const { clientDb: db, job } = await getClientDbConnection(jobId);
    clientDb = db;

    const extractedPoolData = extractPoolDataFromTransactions(
      data.transactions || []
    );

    let processedCount = 0;
    for (const pool of extractedPoolData) {
      const poolData = {
        token_mint: pool.tokenMint,
        token_symbol: pool.tokenSymbol,
        dex: pool.dex,
        pool_address: pool.poolAddress,
        price_usd: pool.priceUsd,
        volume_24h: pool.volume24h,
        liquidity_usd: pool.liquidityUsd,
        updated_at: new Date(),
      };

      await IndexingJobModel.insertIntoTargetTable(
        job.target_table,
        poolData,
        "token_prices"
      );
      processedCount++;
    }
    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: `Processed ${processedCount} token price updates`,
      details: {
        processedCount,
        totalTransactions: data.transactions?.length || 0,
      },
    });

    return { success: true, processedCount };
  } catch (error) {
    console.error(`Error processing token prices for job ${jobId}:`, error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Error processing token prices",
      details: { error: (error as Error).message },
    });
    throw error;
  } finally {
    if (clientDb) {
      await clientDb.destroy();
    }
  }
}
