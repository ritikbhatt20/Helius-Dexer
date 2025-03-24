import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/middleware/auth";
import { DatabaseConnectionModel } from "../../../lib/models/dbConnection";

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const connectionData = { ...body, user_id: user.id, name: "test-connection" };

  const isValid = await DatabaseConnectionModel.testConnection(connectionData);
  return NextResponse.json({ success: isValid });
}
