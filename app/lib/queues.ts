import Queue from "bull";
import { HeliusService, heliusService } from "./helius";
import { IndexingJobModel } from "./models/indexingJob";
import { JobLogModel } from "./models/jobLog";
import {
  processNftBids,
  processNftPrices,
  processTokenBorrowing,
  processTokenPrices,
} from "./processors";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export const setupJobQueue = new Queue("setup-indexing-jobs", REDIS_URL);
export const nftBidsQueue = new Queue("nft-bids-processing", REDIS_URL);
export const nftPricesQueue = new Queue("nft-prices-processing", REDIS_URL);
export const tokenBorrowingQueue = new Queue(
  "token-borrowing-processing",
  REDIS_URL
);
export const tokenPricesQueue = new Queue("token-prices-processing", REDIS_URL);

setupJobQueue.process(async (job) => {
  const { jobId } = job.data;

  try {
    const indexingJob = await IndexingJobModel.findById(jobId);
    if (!indexingJob) {
      throw new Error(`Indexing job ${jobId} not found`);
    }

    const webhookConfig = HeliusService.getWebHookConfigForJobType(
      indexingJob.job_type,
      indexingJob.id,
      indexingJob.configuration
    );

    const webhookId = await heliusService.createWebHook(webhookConfig);

    await IndexingJobModel.update(jobId, {
      webhook_id: webhookId,
      status: "active",
    });

    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: "Indexing job setup successful",
      details: { webhook_id: webhookId },
    });

    return { success: true, webhook_id: webhookId };
  } catch (error) {
    console.error(`Error setting up indexing job ${jobId}:`, error);
    await IndexingJobModel.updateStatus(jobId, "failed");
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Indexing job setup failed",
      details: { error: (error as Error).message },
    });
    throw error;
  }
});

nftBidsQueue.process(async (job) => {
  try {
    const { jobId, data } = job.data;
    const result = await processNftBids(jobId, data);
    return result;
  } catch (error) {
    console.error("Error processing NFT bids:", error);
    throw error;
  }
});

nftPricesQueue.process(async (job) => {
  try {
    const { jobId, data } = job.data;
    const result = await processNftPrices(jobId, data);
    return result;
  } catch (error) {
    console.error("Error processing NFT prices:", error);
    throw error;
  }
});

tokenBorrowingQueue.process(async (job) => {
  try {
    const { jobId, data } = job.data;
    const result = await processTokenBorrowing(jobId, data);
    return result;
  } catch (error) {
    console.error("Error processing token borrowing data:", error);
    throw error;
  }
});

tokenPricesQueue.process(async (job) => {
  try {
    const { jobId, data } = job.data;
    const result = await processTokenPrices(jobId, data);
    return result;
  } catch (error) {
    console.error("Error processing token prices:", error);
    throw error;
  }
});

setupJobQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

setupJobQueue.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});
