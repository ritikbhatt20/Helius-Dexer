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
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
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
      console.error(`Attempt ${attempt} failed for job ${jobId}:`, error);
      if (attempt === maxRetries) {
        await IndexingJobModel.updateStatus(jobId, "failed");
        await JobLogModel.create({
          job_id: jobId,
          log_level: "error",
          message: "Indexing job setup failed",
          details: { error: (error as Error).message },
        });
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }
});

nftBidsQueue.process(async (job) => {
  const { jobId, data } = job.data;
  try {
    const result = await processNftBids(jobId, data);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: "Processed NFT bids",
      details: { count: data.length },
    });
    return result;
  } catch (error) {
    console.error("Error processing NFT bids for job", jobId, ":", error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Failed to process NFT bids",
      details: { error: (error as Error).message },
    });
    throw error;
  }
});

nftPricesQueue.process(async (job) => {
  const { jobId, data } = job.data;
  try {
    const result = await processNftPrices(jobId, data);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: "Processed NFT prices",
      details: { count: data.length },
    });
    return result;
  } catch (error) {
    console.error("Error processing NFT prices for job", jobId, ":", error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Failed to process NFT prices",
      details: { error: (error as Error).message },
    });
    throw error;
  }
});

tokenBorrowingQueue.process(async (job) => {
  const { jobId, data } = job.data;
  try {
    const result = await processTokenBorrowing(jobId, data);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: "Processed token borrowing data",
      details: { count: data.length },
    });
    return result;
  } catch (error) {
    console.error(
      "Error processing token borrowing data for job",
      jobId,
      ":",
      error
    );
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Failed to process token borrowing data",
      details: { error: (error as Error).message },
    });
    throw error;
  }
});

tokenPricesQueue.process(async (job) => {
  const { jobId, data } = job.data;
  try {
    const result = await processTokenPrices(jobId, data);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "info",
      message: "Processed token prices",
      details: { count: data.length },
    });
    return result;
  } catch (error) {
    console.error("Error processing token prices for job", jobId, ":", error);
    await JobLogModel.create({
      job_id: jobId,
      log_level: "error",
      message: "Failed to process token prices",
      details: { error: (error as Error).message },
    });
    throw error;
  }
});

setupJobQueue.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

setupJobQueue.on("failed", (job, error) => {
  console.error(`Job ${job.id} failed with error:`, error);
});

// Add error handling for other queues
[nftBidsQueue, nftPricesQueue, tokenBorrowingQueue, tokenPricesQueue].forEach(
  (queue) => {
    queue.on("failed", async (job, error) => {
      console.error(`Job ${job.id} in ${queue.name} failed:`, error);
    });
  }
);
