import { NextResponse } from "next/server";
import { z } from "zod";
import { exportConfigSchema, parseProjectConfig } from "@/lib/project/schema";
import { createRenderJob, listRenderJobs, publicRenderJob } from "@/server/export/job-store";
import { enqueueRenderJob } from "@/server/export/render-queue";

export const runtime = "nodejs";

const requestSchema = z.object({ project: z.unknown(), config: exportConfigSchema });

export async function GET() {
  const jobs = await listRenderJobs();
  return NextResponse.json({ jobs: jobs.map(publicRenderJob) });
}

export async function POST(request: Request) {
  try {
    const body = requestSchema.parse(await request.json());
    const project = parseProjectConfig(body.project);
    const job = await createRenderJob(project, body.config);
    enqueueRenderJob(job.id);
    return NextResponse.json({ job: publicRenderJob(job) }, { status: 202 });
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.issues.map((issue) => `${issue.path.join(".") || "request"}: ${issue.message}`).join("; ")
      : error instanceof Error ? error.message : "The render job could not be created.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
