import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/middleware/auth";
import { solanaService } from "../../../lib/solana";

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const signature = await solanaService.signAndSubmitTransaction();
    return NextResponse.json({
      signature,
      message: "Transaction submitted to Solana devnet",
    });
  } catch (error) {
    console.error("Error in test transaction:", error);
    return NextResponse.json(
      { error: "Failed to submit transaction" },
      { status: 500 }
    );
  }
}
