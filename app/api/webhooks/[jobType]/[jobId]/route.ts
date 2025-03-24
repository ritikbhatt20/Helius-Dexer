import { NextRequest, NextResponse } from "next/server";
import {
  nftBidsQueue,
  nftPricesQueue,
  tokenBorrowingQueue,
  tokenPricesQueue,
} from "../../../../lib/queues";

export async function POST(
  req: NextRequest,
  { params }: { params: { jobType: string; jobId: string } }
) {
  const { jobType, jobId } = params;
  const data = await req.json();

  try {
    switch (jobType) {
      case "nft_bids":
        await nftBidsQueue.add({ jobId: parseInt(jobId), data });
        break;
      case "nft_prices":
        await nftPricesQueue.add({ jobId: parseInt(jobId), data });
        break;
      case "token_borrowing":
        await tokenBorrowingQueue.add({ jobId: parseInt(jobId), data });
        break;
      case "token_prices":
        await tokenPricesQueue.add({ jobId: parseInt(jobId), data });
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
