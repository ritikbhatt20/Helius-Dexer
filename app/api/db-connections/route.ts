/* eslint-disable */
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../lib/middleware/auth";
import { DatabaseConnectionModel } from "../../lib/models/dbConnection";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connections = await DatabaseConnectionModel.findByUserId(user.id);
  const safeConnections = connections.map(({ password, ...rest }) => rest);
  return NextResponse.json(safeConnections);
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const connectionData = { ...body, user_id: user.id };

  const isValid = await DatabaseConnectionModel.testConnection(connectionData);
  if (!isValid) {
    console.error("Connection test failed for:", {
      host: connectionData.host,
      port: connectionData.port,
      database_name: connectionData.database_name,
      ssl: connectionData.ssl,
    });
    return NextResponse.json(
      { error: "Could not connect to database with provided credentials" },
      { status: 400 }
    );
  }

  const connection = await DatabaseConnectionModel.create(connectionData);
  const { password, ...safeConnection } = connection;
  return NextResponse.json(safeConnection, { status: 201 });
}
