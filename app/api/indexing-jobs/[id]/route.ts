import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../lib/middleware/auth";
import { IndexingJobModel } from "../../../lib/models/indexingJob";
import { heliusService } from "../../../lib/helius";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = parseInt(params.id);
  const job = await IndexingJobModel.findById(jobId);

  if (!job || job.user_id !== user.id) {
    return NextResponse.json(
      { error: "Indexing job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(job);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await authenticate(req);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const jobId = parseInt(params.id);
  const job = await IndexingJobModel.findById(jobId);

  if (!job || job.user_id !== user.id) {
    return NextResponse.json(
      { error: "Indexing job not found" },
      { status: 404 }
    );
  }

  if (job.webhook_id) {
    await heliusService.deleteWebHook(job.webhook_id);
  }

  await IndexingJobModel.delete(jobId);
  return NextResponse.json({ message: "Indexing job deleted successfully" });
}
