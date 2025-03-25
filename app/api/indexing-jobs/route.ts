import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../lib/middleware/auth";
import {
  IndexingJobModel,
  JobType,
  NftBidsConfig,
  NftPricesConfig,
  TokenBorrowingConfig,
  TokenPricesConfig,
} from "../../lib/models/indexingJob";
import { setupJobQueue } from "../../lib/queues";
import { DatabaseConnectionModel } from "../../lib/models/dbConnection";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const jobs = await IndexingJobModel.findByUserId(user.id);
    return NextResponse.json(jobs);
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { db_connection_id, job_type, configuration, target_table } = body;

    // Validate input
    if (!db_connection_id || !Number.isInteger(db_connection_id)) {
      return NextResponse.json(
        { error: "Invalid db_connection_id: must be an integer" },
        { status: 400 }
      );
    }
    if (
      !["nft_bids", "nft_prices", "token_borrowing", "token_prices"].includes(
        job_type
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid job_type: must be one of 'nft_bids', 'nft_prices', 'token_borrowing', 'token_prices'",
        },
        { status: 400 }
      );
    }
    if (!target_table || typeof target_table !== "string") {
      return NextResponse.json(
        { error: "Invalid target_table: must be a non-empty string" },
        { status: 400 }
      );
    }
    if (!configuration || typeof configuration !== "object") {
      return NextResponse.json(
        { error: "Invalid configuration: must be a JSON object" },
        { status: 400 }
      );
    }

    // Validate db_connection_id exists
    const dbConnection =
      await DatabaseConnectionModel.findById(db_connection_id);
    if (!dbConnection) {
      return NextResponse.json(
        { error: "Database connection not found" },
        { status: 404 }
      );
    }

    // Validate configuration based on job_type
    if (job_type === "nft_bids") {
      const config = configuration as NftBidsConfig;
      if (
        config.marketplace_addresses &&
        !Array.isArray(config.marketplace_addresses)
      ) {
        return NextResponse.json(
          { error: "marketplace_addresses must be an array" },
          { status: 400 }
        );
      }
      if (
        config.collection_addresses &&
        !Array.isArray(config.collection_addresses)
      ) {
        return NextResponse.json(
          { error: "collection_addresses must be an array" },
          { status: 400 }
        );
      }
    } else if (job_type === "nft_prices") {
      const config = configuration as NftPricesConfig;
      if (
        config.marketplace_addresses &&
        !Array.isArray(config.marketplace_addresses)
      ) {
        return NextResponse.json(
          { error: "marketplace_addresses must be an array" },
          { status: 400 }
        );
      }
      if (
        config.collection_addresses &&
        !Array.isArray(config.collection_addresses)
      ) {
        return NextResponse.json(
          { error: "collection_addresses must be an array" },
          { status: 400 }
        );
      }
      if (
        config.include_usd_prices !== undefined &&
        typeof config.include_usd_prices !== "boolean"
      ) {
        return NextResponse.json(
          { error: "include_usd_prices must be a boolean" },
          { status: 400 }
        );
      }
    } else if (job_type === "token_borrowing") {
      const config = configuration as TokenBorrowingConfig;
      if (
        config.protocol_addresses &&
        !Array.isArray(config.protocol_addresses)
      ) {
        return NextResponse.json(
          { error: "protocol_addresses must be an array" },
          { status: 400 }
        );
      }
      if (
        config.reserve_addresses &&
        !Array.isArray(config.reserve_addresses)
      ) {
        return NextResponse.json(
          { error: "reserve_addresses must be an array" },
          { status: 400 }
        );
      }
    } else if (job_type === "token_prices") {
      const config = configuration as TokenPricesConfig;
      if (config.dex_addresses && !Array.isArray(config.dex_addresses)) {
        return NextResponse.json(
          { error: "dex_addresses must be an array" },
          { status: 400 }
        );
      }
    }

    const jobData = {
      user_id: user.id,
      db_connection_id,
      job_type: job_type as JobType,
      configuration,
      target_table,
    };

    const job = await IndexingJobModel.create(jobData);
    await setupJobQueue.add({ jobId: job.id });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error("Error creating job:", error);
    return NextResponse.json(
      { error: "Failed to create job: " + error.message },
      { status: 500 }
    );
  }
}
