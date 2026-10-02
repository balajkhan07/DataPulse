import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { assetDirectory } from "@/server/export/paths";

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext<"/api/audio-assets/[assetId]">) {
  const { assetId } = await context.params;
  if (!/^[0-9a-f-]{36}$/i.test(assetId)) return NextResponse.json({ error: "Invalid audio asset ID." }, { status: 400 });
  for (const [extension, contentType] of [[".mp3", "audio/mpeg"], [".wav", "audio/wav"]] as const) {
    const filePath = path.join(assetDirectory, `${assetId}${extension}`);
    try {
      const metadata = await stat(filePath);
      const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
      return new Response(stream, {
        headers: { "Content-Type": contentType, "Content-Length": String(metadata.size), "Cache-Control": "private, max-age=3600" },
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  return NextResponse.json({ error: "Audio asset not found." }, { status: 404 });
}
