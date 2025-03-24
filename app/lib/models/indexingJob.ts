import { db } from "../db";

export type JobType =
  | "nft_bids"
  | "nft_prices"
  | "token_borrowing"
  | "token_prices";
export type JobStatus =
  | "pending"
  | "active"
  | "paused"
  | "completed"
  | "failed";

export interface IndexingJob {
  id: number;
  user_id: number;
  db_connection_id: number;
  job_type: JobType;
  configuration: Record<string, any>;
  target_table: string;
  status: JobStatus;
  webhook_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IndexingJobInput {
  user_id: number;
  db_connection_id: number;
  job_type: JobType;
  configuration: Record<string, any>;
  target_table: string;
}

export class IndexingJobModel {
  static async create(data: IndexingJobInput): Promise<IndexingJob> {
    const [job] = await db("indexing_jobs")
      .insert({
        ...data,
        status: "pending",
      })
      .returning("*");

    return job;
  }

  static async findById(id: number): Promise<IndexingJob | undefined> {
    return db("indexing_jobs").where({ id }).first();
  }

  static async findByUserId(userId: number): Promise<IndexingJob[]> {
    return db("indexing_jobs").where({ user_id: userId });
  }

  static async update(
    id: number,
    data: Partial<IndexingJob>
  ): Promise<IndexingJob> {
    const [updated] = await db("indexing_jobs")
      .where({ id })
      .update({
        ...data,
        updated_at: new Date(),
      })
      .returning("*");

    return updated;
  }

  static async updateStatus(
    id: number,
    status: JobStatus
  ): Promise<IndexingJob> {
    return this.update(id, { status });
  }

  static async setWebhookId(
    id: number,
    webhookId: string
  ): Promise<IndexingJob> {
    return this.update(id, { webhook_id: webhookId });
  }

  static async delete(id: number): Promise<void> {
    await db("indexing_jobs").where({ id }).delete();
  }
}
