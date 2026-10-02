import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ensureExportDirectories, assetDirectory } from "@/server/export/paths";
import { probeDuration, removeInvalidAudio, validateAudioUpload } from "@/server/export/media";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an MP3 or WAV file." }, { status: 400 });
    const validated = validateAudioUpload(file, new Uint8Array(await file.arrayBuffer()));
    await ensureExportDirectories();
    const assetId = randomUUID();
    const filePath = path.join(assetDirectory, `${assetId}${validated.extension}`);
    await writeFile(filePath, validated.bytes, { flag: "wx" });
    let durationSeconds: number;
    try {
      durationSeconds = await probeDuration(filePath);
    } catch (error) {
      await removeInvalidAudio(filePath);
      throw error;
    }
    return NextResponse.json({
      asset: { assetId, fileName: path.basename(file.name), mimeType: validated.mimeType, durationSeconds },
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The audio file could not be uploaded." }, { status: 400 });
  }
}
