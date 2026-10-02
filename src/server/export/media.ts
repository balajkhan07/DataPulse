import "server-only";
import { spawn } from "node:child_process";
import { rm } from "node:fs/promises";

export async function removeInvalidAudio(filePath: string): Promise<void> {
  await rm(filePath, { force: true });
}

const maximumAudioBytes = 100 * 1024 * 1024;

export interface ValidatedAudioFile {
  extension: ".mp3" | ".wav";
  mimeType: "audio/mpeg" | "audio/wav";
  bytes: Uint8Array;
}

export function validateAudioUpload(file: File, bytes: Uint8Array): ValidatedAudioFile {
  if (bytes.byteLength === 0) throw new Error("The selected audio file is empty.");
  if (bytes.byteLength > maximumAudioBytes) throw new Error("Audio files must be 100 MB or smaller.");
  const isWave = bytes.byteLength >= 12
    && new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF"
    && new TextDecoder().decode(bytes.slice(8, 12)) === "WAVE";
  const isMp3 = bytes.byteLength >= 3 && (
    new TextDecoder().decode(bytes.slice(0, 3)) === "ID3"
    || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
  );
  const lowerName = file.name.toLowerCase();
  if (isWave && lowerName.endsWith(".wav")) return { extension: ".wav", mimeType: "audio/wav", bytes };
  if (isMp3 && lowerName.endsWith(".mp3")) return { extension: ".mp3", mimeType: "audio/mpeg", bytes };
  throw new Error("Use an MP3 or WAV file whose contents match its file extension.");
}

export async function probeDuration(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ], { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });
    child.on("error", (error) => reject(new Error(`FFprobe could not inspect the audio file: ${error.message}`)));
    child.on("close", (code) => {
      const duration = Number(stdout.trim());
      if (code !== 0 || !Number.isFinite(duration) || duration <= 0) {
        reject(new Error(`The audio duration could not be read.${stderr.trim() ? ` ${stderr.trim()}` : ""}`));
        return;
      }
      resolve(duration);
    });
  });
}
