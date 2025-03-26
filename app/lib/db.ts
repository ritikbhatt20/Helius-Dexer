import knex from "knex";
import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

export const db = knex({
  client: "pg",
  connection: {
    host: "db.ezbxmazmjylxmnprohlx.supabase.co",
    port: 5432,
    user: "postgres",
    password: "helius_indexer",
    database: "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  },
  pool: {
    min: 0,
    max: 10,
    acquireTimeoutMillis: 10000,
    createTimeoutMillis: 10000,
  },
  debug: true,
});

export async function validateDatabaseConnection() {
  const client = new Client({
    host: "db.ezbxmazmjylxmnprohlx.supabase.co",
    port: 5432,
    user: "postgres",
    password: "helius_indexer",
    database: "postgres",
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Attempt direct connection
    await client.connect();

    // Run a simple query
    const result = await client.query("SELECT 1");

    console.log("Database connection successful", result.rows);

    // Close the connection
    await client.end();

    return true;
  } catch (error: any) {
    console.error("Comprehensive connection error:", {
      errorName: error.name,
      errorMessage: error.message,
      errorCode: error.code,
      errorStack: error.stack,
    });

    // Ensure connection is closed even on error
    try {
      await client.end();
    } catch {}

    return false;
  }
}

// Network diagnostics function
export function getNetworkDiagnostics() {
  const os = require("os");
  const networkInterfaces = os.networkInterfaces();

  console.log("Network Interfaces:");
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    const interfaces = networkInterfaces[interfaceName];
    interfaces.forEach((iface: any) => {
      console.log(`- ${interfaceName}: ${iface.address} (${iface.family})`);
    });
  });
}
