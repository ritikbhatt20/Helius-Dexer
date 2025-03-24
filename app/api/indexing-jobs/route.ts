import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../lib/middleware/auth";
import { IndexingJobModel } from "../../lib/models/indexingJob";
import { setupJobQueue } from "../../lib/queues";

export async function GET(req: NextRequest) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobs = await IndexingJobModel.findByUserId(user.id);
  return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const jobData = { ...body, user_id: user.id };

  const job = await IndexingJobModel.create(jobData);
  await setupJobQueue.add({ jobId: job.id });

  return NextResponse.json(job, { status: 201 });
}
