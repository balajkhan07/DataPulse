import { NextResponse } from "next/server";
import { getRenderJob, publicRenderJob } from "@/server/export/job-store";
import { cancelRenderJob } from "@/server/export/render-queue";

export const runtime = "nodejs";

export async function POST(_request: Request, context: RouteContext<"/api/render-jobs/[jobId]/cancel">) {
  const { jobId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({ error: "Invalid render job ID." }, { status: 400 });
  const cancelled = await cancelRenderJob(jobId);
  const job = await getRenderJob(jobId);
  if (!job) return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  if (!cancelled) return NextResponse.json({ error: `A ${job.status} render cannot be cancelled.`, job: publicRenderJob(job) }, { status: 409 });
  return NextResponse.json({ job: publicRenderJob(job) });
}
