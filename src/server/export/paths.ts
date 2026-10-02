import "server-only";
import path from "node:path";
import { mkdir } from "node:fs/promises";

export const projectRoot = process.cwd();
export const dataPulseDirectory = path.join(projectRoot, ".datapulse");
export const assetDirectory = path.join(dataPulseDirectory, "assets");
export const assetCacheDirectory = path.join(assetDirectory, "cache");
export const exportDirectory = path.join(dataPulseDirectory, "exports");
export const jobDirectory = path.join(dataPulseDirectory, "jobs");
export const jobHistoryPath = path.join(dataPulseDirectory, "render-jobs.json");

export async function ensureExportDirectories(): Promise<void> {
  await Promise.all([
    mkdir(assetDirectory, { recursive: true }),
    mkdir(assetCacheDirectory, { recursive: true }),
    mkdir(exportDirectory, { recursive: true }),
    mkdir(jobDirectory, { recursive: true }),
  ]);
}
