import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/middleware/auth";
import { DatabaseConnectionModel } from "../../../lib/models/dbConnection";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = parseInt(params.id);
  const connection = await DatabaseConnectionModel.findById(connectionId);

  if (!connection || connection.user_id !== user.id) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  const { password, ...safeConnection } = connection;
  return NextResponse.json(safeConnection);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = parseInt(params.id);
  const body = await req.json();

  const existingConnection =
    await DatabaseConnectionModel.findById(connectionId);
  if (!existingConnection || existingConnection.user_id !== user.id) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  if (
    body.host ||
    body.port ||
    body.username ||
    body.password ||
    body.database_name ||
    body.ssl !== undefined
  ) {
    const testData = {
      host: body.host || existingConnection.host,
      port: body.port || existingConnection.port,
      username: body.username || existingConnection.username,
      password:
        body.password ||
        DatabaseConnectionModel.getDecryptedPassword(existingConnection),
      database_name: body.database_name || existingConnection.database_name,
      ssl: body.ssl !== undefined ? body.ssl : existingConnection.ssl,
      user_id: user.id,
      name: existingConnection.name,
    };

    const isValid = await DatabaseConnectionModel.testConnection(testData);
    if (!isValid) {
      return NextResponse.json(
        { error: "Could not connect to database with provided credentials" },
        { status: 400 }
      );
    }
  }

  const updatedConnection = await DatabaseConnectionModel.update(
    connectionId,
    body
  );
  const { password, ...safeConnection } = updatedConnection;
  return NextResponse.json(safeConnection);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connectionId = parseInt(params.id);
  const existingConnection =
    await DatabaseConnectionModel.findById(connectionId);

  if (!existingConnection || existingConnection.user_id !== user.id) {
    return NextResponse.json(
      { error: "Connection not found" },
      { status: 404 }
    );
  }

  await DatabaseConnectionModel.delete(connectionId);
  return NextResponse.json({ message: "Connection deleted successfully" });
}
