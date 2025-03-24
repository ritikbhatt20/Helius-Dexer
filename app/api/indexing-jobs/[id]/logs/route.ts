import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "../../../../lib/middleware/auth";
import { IndexingJobModel } from "../../../../lib/models/indexingJob";
import { JobLogModel } from "../../../../lib/models/jobLog";

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

  const logs = await JobLogModel.findByJobId(jobId);
  return NextResponse.json(logs);
}
