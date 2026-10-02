export type AssetKind = "local" | "remote" | "embedded";

export interface AssetReference {
  kind: AssetKind;
  source: string;
  cacheKey: string;
}

function hashSource(source: string): string {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

export function resolveAssetReference(source?: string): AssetReference | null {
  const value = source?.trim();
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return { kind: "local", source: value, cacheKey: `local-${hashSource(value)}` };
  if (/^https:\/\//i.test(value)) return { kind: "remote", source: value, cacheKey: `remote-${hashSource(value)}` };
  if (/^data:image\/(png|jpeg|webp|svg\+xml);/i.test(value)) return { kind: "embedded", source: value, cacheKey: `embedded-${hashSource(value)}` };
  return null;
}
