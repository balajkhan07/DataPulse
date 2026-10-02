import { NextResponse } from "next/server";
import { getRenderJob, publicRenderJob } from "@/server/export/job-store";

export const runtime = "nodejs";

function validJobId(value: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(value);
}

export async function GET(_request: Request, context: RouteContext<"/api/render-jobs/[jobId]">) {
  const { jobId } = await context.params;
  if (!validJobId(jobId)) return NextResponse.json({ error: "Invalid render job ID." }, { status: 400 });
  const job = await getRenderJob(jobId);
  if (!job) return NextResponse.json({ error: "Render job not found." }, { status: 404 });
  return NextResponse.json({ job: publicRenderJob(job) });
}
