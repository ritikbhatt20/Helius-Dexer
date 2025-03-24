import knex from "knex";
import { db } from "../db";
import crypto from "crypto";

const ENCRYPTION_KEY_RAW =
  process.env.ENCRYPTION_KEY || "32-char-long-key-here-1234567890";
const ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW, "utf8").slice(0, 32);
if (ENCRYPTION_KEY.length !== 32) {
  throw new Error("ENCRYPTION_KEY must be exactly 32 bytes for AES-256-CBC");
}
const IV_LENGTH = 16;

export interface DatabaseConnection {
  id: number;
  user_id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
  ssl: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DatabaseConnectionInput {
  user_id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  database_name: string;
  ssl?: boolean;
}

export class DatabaseConnectionModel {
  static async create(
    data: DatabaseConnectionInput
  ): Promise<DatabaseConnection> {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let encryptedPassword = cipher.update(data.password, "utf8", "hex");
    encryptedPassword += cipher.final("hex");
    const encryptedWithIv = iv.toString("hex") + ":" + encryptedPassword;

    const [connection] = await db("database_connections")
      .insert({
        ...data,
        password: encryptedWithIv,
        ssl: data.ssl || false,
      })
      .returning("*");

    return connection;
  }

  static async findById(id: number): Promise<DatabaseConnection | undefined> {
    return db("database_connections").where({ id }).first();
  }

  static async findByUserId(userId: number): Promise<DatabaseConnection[]> {
    return db("database_connections").where({ user_id: userId });
  }

  static async update(
    id: number,
    data: Partial<DatabaseConnectionInput>
  ): Promise<DatabaseConnection> {
    if (data.password) {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
      let encryptedPassword = cipher.update(data.password, "utf8", "hex");
      encryptedPassword += cipher.final("hex");
      data.password = iv.toString("hex") + ":" + encryptedPassword;
    }

    const [updated] = await db("database_connections")
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning("*");

    return updated;
  }

  static async delete(id: number): Promise<void> {
    await db("database_connections").where({ id }).delete();
  }

  static getDecryptedPassword(connection: DatabaseConnection): string {
    const [ivHex, encrypted] = connection.password.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  static async testConnection(
    connectionData: DatabaseConnectionInput
  ): Promise<boolean> {
    try {
      const testDb = knex({
        client: "pg",
        connection: {
          host: connectionData.host,
          port: connectionData.port,
          user: connectionData.username,
          password: connectionData.password,
          database: connectionData.database_name,
          ssl: connectionData.ssl ? { rejectUnauthorized: false } : undefined,
        },
        pool: { min: 0, max: 1 },
      });

      await testDb.raw("SELECT 1");
      await testDb.destroy();
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }
}
