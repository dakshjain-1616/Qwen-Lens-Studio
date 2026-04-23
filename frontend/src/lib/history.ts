/**
 * History persistence for Qwen Lens Studio.
 * Flat array of HistoryEntry, capped per-tool at MAX_PER_TOOL.
 */

import type { HistoryEntry, ToolId } from './types';

export type { HistoryEntry, ToolId } from './types';

const HISTORY_KEY = 'qls.history.v1';
export const MAX_PER_TOOL = 100;

export function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // newest first
    return parsed
      .filter((e) => e && typeof e.id === 'string' && typeof e.tool === 'string')
      .sort((a: HistoryEntry, b: HistoryEntry) => b.createdAt - a.createdAt);
  } catch (e) {
    console.error('Failed to load history:', e);
    return [];
  }
}

function capPerTool(entries: HistoryEntry[]): HistoryEntry[] {
  const counts: Record<string, number> = {};
  const out: HistoryEntry[] = [];
  for (const entry of entries) {
    const c = counts[entry.tool] ?? 0;
    if (c < MAX_PER_TOOL) {
      out.push(entry);
      counts[entry.tool] = c + 1;
    }
  }
  return out;
}

function writeWithQuotaFallback(entries: HistoryEntry[]): HistoryEntry[] {
  let current = entries;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(current));
      return current;
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        // drop oldest half and retry
        const keep = Math.max(1, Math.floor(current.length / 2));
        current = current.slice(0, keep);
        continue;
      }
      console.error('Failed to save history:', e);
      return current;
    }
  }
  return current;
}

export function addEntry(entry: HistoryEntry): HistoryEntry[] {
  const current = loadHistory();
  const next = capPerTool([entry, ...current]);
  return writeWithQuotaFallback(next);
}

export function removeEntry(id: string): HistoryEntry[] {
  const current = loadHistory().filter((e) => e.id !== id);
  return writeWithQuotaFallback(current);
}

export function clearHistory(tool?: ToolId): HistoryEntry[] {
  if (!tool) {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch (e) {
      console.error('Failed to clear history:', e);
    }
    return [];
  }
  const current = loadHistory().filter((e) => e.tool !== tool);
  return writeWithQuotaFallback(current);
}

export function searchHistory(tool: ToolId | null, q: string): HistoryEntry[] {
  const ql = q.trim().toLowerCase();
  const all = loadHistory();
  return all.filter((entry) => {
    if (tool && entry.tool !== tool) return false;
    if (!ql) return true;
    const hay = `${entry.title ?? ''}\n${entry.output?.answer ?? ''}`.toLowerCase();
    return hay.includes(ql);
  });
}

export function exportHistoryJson(tool?: ToolId): string {
  const entries = tool ? loadHistory().filter((e) => e.tool === tool) : loadHistory();
  return JSON.stringify({ exportedAt: Date.now(), tool: tool ?? null, entries }, null, 2);
}
