// src/lib/meCache.ts

export type MeResponse = {
  name: string | null;
  ico: string | null;
  phone: string | null;
  address: string | null;
  websiteUrl: string | null;
};

let cached: { value: MeResponse; ts: number } | null = null;

export function getMeCache(maxAgeMs = 60_000): MeResponse | null {
  if (!cached) return null;
  if (Date.now() - cached.ts > maxAgeMs) return null;
  return cached.value;
}

export function setMeCache(value: MeResponse) {
  cached = { value, ts: Date.now() };
}

export function clearMeCache() {
  cached = null;
}
