import type { HistoryEntry, ToolId } from './types';

const KEY = 'qls.history.v1';
const MAX_PER_TOOL = 20;

export function loadHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function save(entries: HistoryEntry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded — drop oldest half and retry once
    const trimmed = entries.slice(0, Math.floor(entries.length / 2));
    try {
      localStorage.setItem(KEY, JSON.stringify(trimmed));
    } catch {
      /* give up */
    }
  }
}

export function addEntry(entry: HistoryEntry): HistoryEntry[] {
  const all = loadHistory();
  const next = [entry, ...all];
  // keep at most MAX_PER_TOOL entries per tool
  const counts: Record<string, number> = {};
  const filtered = next.filter((e) => {
    counts[e.tool] = (counts[e.tool] ?? 0) + 1;
    return counts[e.tool] <= MAX_PER_TOOL;
  });
  save(filtered);
  return filtered;
}

export function removeEntry(id: string): HistoryEntry[] {
  const all = loadHistory().filter((e) => e.id !== id);
  save(all);
  return all;
}

export function clearHistory(tool?: ToolId): HistoryEntry[] {
  const all = tool ? loadHistory().filter((e) => e.tool !== tool) : [];
  save(all);
  return all;
}

export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
