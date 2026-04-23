/**
 * Response cache keyed by a SHA-256 hash of the request body (multipart form
 * fields + image bytes + tool id + custom system prompt). On cache hit we
 * replay the stored thinking + answer instantly without a network call.
 *
 * Stored in localStorage under `qls.cache.v1`. Capped at MAX_ENTRIES; LRU
 * eviction (drop oldest by createdAt). On QuotaExceededError we halve.
 */

const CACHE_KEY = 'qls.cache.v1';
const MAX_ENTRIES = 50;

export interface CacheEntry {
  tool: string;
  thinking?: string;
  answer: string;
  createdAt: number;
}

async function hashRequest(fd: FormData, extra: string): Promise<string> {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [encoder.encode(`${extra}\n`)];
  const entries = Array.from(fd.entries()).sort(([a], [b]) => a.localeCompare(b));
  for (const [key, value] of entries) {
    parts.push(encoder.encode(`${key}=`));
    if (typeof value !== 'string') {
      // File / Blob
      parts.push(new Uint8Array(await (value as Blob).arrayBuffer()));
    } else {
      parts.push(encoder.encode(value));
    }
    parts.push(encoder.encode('\n'));
  }
  const totalLen = parts.reduce((n, p) => n + p.length, 0);
  const concat = new Uint8Array(totalLen);
  let offset = 0;
  for (const p of parts) {
    concat.set(p, offset);
    offset += p.length;
  }
  const digest = await crypto.subtle.digest('SHA-256', concat);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function loadCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveCache(cache: Record<string, CacheEntry>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      const entries = Object.entries(cache).sort((a, b) => a[1].createdAt - b[1].createdAt);
      const keep = entries.slice(Math.floor(entries.length / 2));
      const trimmed: Record<string, CacheEntry> = {};
      keep.forEach(([k, v]) => (trimmed[k] = v));
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(trimmed));
      } catch {
        /* give up */
      }
    }
  }
}

export async function getCached(fd: FormData, extra: string): Promise<CacheEntry | null> {
  try {
    const hash = await hashRequest(fd, extra);
    const cache = loadCache();
    return cache[hash] ?? null;
  } catch {
    return null;
  }
}

export async function setCached(
  fd: FormData,
  extra: string,
  entry: Omit<CacheEntry, 'createdAt'>
): Promise<void> {
  try {
    const hash = await hashRequest(fd, extra);
    const cache = loadCache();
    cache[hash] = { ...entry, createdAt: Date.now() };
    const keys = Object.keys(cache);
    if (keys.length > MAX_ENTRIES) {
      const sorted = keys.sort((a, b) => cache[a].createdAt - cache[b].createdAt);
      const drop = sorted.slice(0, keys.length - MAX_ENTRIES);
      drop.forEach((k) => delete cache[k]);
    }
    saveCache(cache);
  } catch {
    /* cache is best-effort */
  }
}

export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
}

export function getCacheStats(): { count: number; bytes: number } {
  const cache = loadCache();
  const count = Object.keys(cache).length;
  let bytes = 0;
  try {
    bytes = new Blob([JSON.stringify(cache)]).size;
  } catch {
    bytes = 0;
  }
  return { count, bytes };
}
