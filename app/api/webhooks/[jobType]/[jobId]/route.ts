import { NextRequest, NextResponse } from "next/server";
import {
  nftBidsQueue,
  nftPricesQueue,
  tokenBorrowingQueue,
  tokenPricesQueue,
} from "../../../../lib/queues";
import { IndexingJobModel } from "../../../../lib/models/indexingJob"; // Adjust path as needed

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ jobType: string; jobId: string }> }
) {
  // Authenticate the request
  const authHeader = req.headers.get("Authorization");
  const expectedAuthHeader = process.env.WEBHOOK_AUTH_HEADER;

  if (expectedAuthHeader && authHeader !== expectedAuthHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await the params object
  const { jobType, jobId } = await params;
  const jobIdNum = parseInt(jobId);

  // Validate the job exists
  const job = await IndexingJobModel.findById(jobIdNum);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Parse the webhook data
  const data = await req.json();

  try {
    switch (jobType) {
      case "nft_bids":
        await nftBidsQueue.add({ jobId: jobIdNum, data });
        break;
      case "nft_prices":
        await nftPricesQueue.add({ jobId: jobIdNum, data });
        break;
      case "token_borrowing":
        await tokenBorrowingQueue.add({ jobId: jobIdNum, data });
        break;
      case "token_prices":
        await tokenPricesQueue.add({ jobId: jobIdNum, data });
        break;
      default:
        return NextResponse.json(
          { error: "Invalid job type" },
          { status: 400 }
        );
    }
    console.log(`Received webhook for job ${jobId}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error processing webhook for ${jobType}/${jobId}:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
