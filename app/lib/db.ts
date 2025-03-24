import knex from "knex";
import dotenv from "dotenv";

dotenv.config();

export const db = knex({
  client: "pg",
  connection: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "helius_user",
    password: process.env.DB_PASSWORD || "helius",
    database: process.env.DB_NAME || "helius_indexer",
  },
  pool: { min: 0, max: 10 },
});
