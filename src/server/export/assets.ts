import "server-only";
import { createHash } from "node:crypto";
import { lookup } from "node:dns/promises";
import { cp, copyFile, mkdir, mkdtemp, realpath, stat, writeFile } from "node:fs/promises";
import { isIP } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { resolveAssetReference } from "@/lib/assets/asset-reference";
import type { ProjectConfig } from "@/types/project";
import type { RawDataRow } from "@/types/data";
import { assetCacheDirectory, assetDirectory, ensureExportDirectories, projectRoot } from "@/server/export/paths";

const maximumRemoteAssetBytes = 10 * 1024 * 1024;
const allowedImageTypes = new Map([
  ["image/png", ".png"],
  ["image/jpeg", ".jpg"],
  ["image/webp", ".webp"],
  ["image/svg+xml", ".svg"],
]);

export interface ResolvedRenderAssets {
  project: ProjectConfig;
  publicDirectory: string;
  temporaryDirectory: string;
  audioSource: string | null;
  warnings: string[];
}

function isPrivateAddress(address: string): boolean {
  if (address.toLowerCase().startsWith("::ffff:")) return isPrivateAddress(address.slice(7));
  if (isIP(address) === 4) {
    const [a, b] = address.split(".").map(Number);
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168);
  }
  if (isIP(address) === 6) {
    const normalized = address.toLowerCase();
    return normalized === "::1" || normalized === "::" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }
  return true;
}

async function assertPublicHttps(url: URL): Promise<void> {
  if (url.protocol !== "https:") throw new Error("Only HTTPS image URLs are supported.");
  const addresses = await lookup(url.hostname, { all: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new Error("The image URL resolves to a private or unavailable network address.");
  }
}

async function fetchRemoteImage(source: string, redirects = 0): Promise<{ bytes: Uint8Array; extension: string }> {
  if (redirects > 3) throw new Error("The image URL redirected too many times.");
  const url = new URL(source);
  await assertPublicHttps(url);
  const response = await fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15_000) });
  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new Error(`The image server returned redirect ${response.status} without a location.`);
    return fetchRemoteImage(new URL(location, url).toString(), redirects + 1);
  }
  if (!response.ok) throw new Error(`The image server returned HTTP ${response.status}.`);
  const type = response.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  const extension = allowedImageTypes.get(type);
  if (!extension) throw new Error(`Unsupported image type ${type || "unknown"}.`);
  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > maximumRemoteAssetBytes) throw new Error("The image is larger than 10 MB.");
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes.byteLength > maximumRemoteAssetBytes) throw new Error("The image is larger than 10 MB.");
  return { bytes, extension };
}

function decodeEmbeddedImage(source: string): { bytes: Uint8Array; extension: string } {
  const match = /^data:(image\/(?:png|jpeg|webp|svg\+xml));base64,(.+)$/is.exec(source);
  if (!match) throw new Error("Embedded images must be base64 PNG, JPEG, WebP, or SVG data URLs.");
  const extension = allowedImageTypes.get(match[1].toLowerCase());
  if (!extension) throw new Error("The embedded image type is unsupported.");
  const bytes = Buffer.from(match[2], "base64");
  if (bytes.byteLength > maximumRemoteAssetBytes) throw new Error("The embedded image is larger than 10 MB.");
  return { bytes, extension };
}

async function resolveImage(source: string, publicDirectory: string): Promise<string> {
  const reference = resolveAssetReference(source);
  if (!reference) throw new Error("The image reference is not a supported local path, HTTPS URL, or embedded image.");
  if (reference.kind === "local") {
    const relative = reference.source.replace(/^\/+/, "");
    const sourcePath = path.resolve(projectRoot, "public", relative);
    const publicRoot = path.resolve(projectRoot, "public");
    if (!sourcePath.startsWith(`${publicRoot}${path.sep}`)) throw new Error("The local image path leaves the public directory.");
    const [resolvedSourcePath, resolvedPublicRoot] = await Promise.all([realpath(sourcePath), realpath(publicRoot)]);
    if (!resolvedSourcePath.startsWith(`${resolvedPublicRoot}${path.sep}`)) throw new Error("The local image resolves outside the public directory.");
    const metadata = await stat(resolvedSourcePath);
    if (!metadata.isFile()) throw new Error("The local image path is not a file.");
    return `/${relative.split(path.sep).join("/")}`;
  }

  const hash = createHash("sha256").update(reference.source).digest("hex");
  let cachedPath: string | null = null;
  for (const extension of allowedImageTypes.values()) {
    const candidate = path.join(assetCacheDirectory, `${hash}${extension}`);
    try {
      if ((await stat(candidate)).isFile()) { cachedPath = candidate; break; }
    } catch { /* Cache miss. */ }
  }
  if (!cachedPath) {
    const decoded = reference.kind === "embedded" ? decodeEmbeddedImage(reference.source) : await fetchRemoteImage(reference.source);
    cachedPath = path.join(assetCacheDirectory, `${hash}${decoded.extension}`);
    await writeFile(cachedPath, decoded.bytes, { flag: "wx" }).catch(async (error: NodeJS.ErrnoException) => {
      if (error.code !== "EEXIST") throw error;
    });
  }
  const targetName = path.basename(cachedPath);
  await mkdir(path.join(publicDirectory, "resolved-assets"), { recursive: true });
  await copyFile(cachedPath, path.join(publicDirectory, "resolved-assets", targetName));
  return `/resolved-assets/${targetName}`;
}

async function findAudioAsset(assetId: string): Promise<string | null> {
  for (const extension of [".mp3", ".wav"]) {
    const candidate = path.join(assetDirectory, `${assetId}${extension}`);
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch { /* Try the next supported extension. */ }
  }
  return null;
}

export async function resolveRenderAssets(project: ProjectConfig, jobId: string): Promise<ResolvedRenderAssets> {
  await ensureExportDirectories();
  const temporaryDirectory = await mkdtemp(path.join(tmpdir(), `datapulse-${jobId}-`));
  const publicDirectory = path.join(temporaryDirectory, "public");
  await mkdir(publicDirectory, { recursive: true });
  const sourcePublic = path.join(projectRoot, "public");
  try { await cp(sourcePublic, publicDirectory, { recursive: true }); } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  const warnings: string[] = [];
  const imageColumn = project.dataset.mapping.image;
  let rows: RawDataRow[] = project.dataset.rows;
  if (imageColumn) {
    const resolvedSources = new Map<string, string | null>();
    rows = [];
    for (const [index, row] of project.dataset.rows.entries()) {
      const value = row[imageColumn];
      if (typeof value !== "string" || !value.trim()) { rows.push(row); continue; }
      let resolved = resolvedSources.get(value);
      if (resolved === undefined) {
        try { resolved = await resolveImage(value, publicDirectory); }
        catch (error) {
          resolved = null;
          warnings.push(`Image in row ${index + 2} was skipped: ${error instanceof Error ? error.message : "Unknown asset error."}`);
        }
        resolvedSources.set(value, resolved);
      }
      rows.push({ ...row, [imageColumn]: resolved });
    }
  }

  let audioSource: string | null = null;
  if (project.audio.enabled && project.audio.assetId) {
    const source = await findAudioAsset(project.audio.assetId);
    if (!source) throw new Error(`Audio asset ${project.audio.assetId} is missing. Upload it again before exporting.`);
    const targetDirectory = path.join(publicDirectory, "render-assets");
    await mkdir(targetDirectory, { recursive: true });
    const targetName = path.basename(source);
    await copyFile(source, path.join(targetDirectory, targetName));
    audioSource = `render-assets/${targetName}`;
  }

  return {
    project: { ...project, dataset: { ...project.dataset, rows } },
    publicDirectory,
    temporaryDirectory,
    audioSource,
    warnings,
  };
}
