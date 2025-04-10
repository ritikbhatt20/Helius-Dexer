/* eslint-disable */
import { db } from "../db";

export type LogLevel = "info" | "warning" | "error";

export interface JobLog {
  id: number;
  job_id: number;
  log_level: LogLevel;
  message: string;
  details?: Record<string, any>;
  created_at: Date;
}

export interface JobLogInput {
  job_id: number;
  log_level: LogLevel;
  message: string;
  details?: Record<string, any>;
}

export class JobLogModel {
  static async create(data: JobLogInput): Promise<JobLog> {
    const [log] = await db("job_logs").insert(data).returning("*");
    return log;
  }

  static async findByJobId(jobId: number, limit = 100): Promise<JobLog[]> {
    return db("job_logs")
      .where({ job_id: jobId })
      .orderBy("created_at", "desc")
      .limit(limit);
  }
}
