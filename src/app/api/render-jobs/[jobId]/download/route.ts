import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getRenderJob } from "@/server/export/job-store";
import { exportDirectory } from "@/server/export/paths";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/render-jobs/[jobId]/download">) {
  const { jobId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(jobId)) return NextResponse.json({ error: "Invalid render job ID." }, { status: 400 });
  const job = await getRenderJob(jobId);
  if (!job || job.status !== "completed" || !job.outputPath) return NextResponse.json({ error: "The rendered file is not available." }, { status: 404 });
  const resolved = path.resolve(job.outputPath);
  const root = path.resolve(exportDirectory);
  if (!resolved.startsWith(`${root}${path.sep}`)) return NextResponse.json({ error: "The rendered file path is invalid." }, { status: 400 });
  try {
    const metadata = await stat(resolved);
    const stream = Readable.toWeb(createReadStream(resolved)) as ReadableStream;
    return new Response(stream, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(metadata.size),
        "Content-Disposition": `attachment; filename="${path.basename(resolved).replaceAll('"', "")}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "The rendered file has been moved or removed." }, { status: 404 });
  }
}
