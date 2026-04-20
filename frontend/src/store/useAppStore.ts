import { create } from 'zustand';
import { addEntry, loadHistory, removeEntry, clearHistory } from '../lib/history';
import type { HistoryEntry, ToolId } from '../lib/types';

interface AppState {
  history: HistoryEntry[];
  historyOpen: boolean;
  restoreTarget: HistoryEntry | null;
  toggleHistory: (open?: boolean) => void;
  pushHistory: (entry: HistoryEntry) => void;
  deleteEntry: (id: string) => void;
  wipe: (tool?: ToolId) => void;
  queueRestore: (entry: HistoryEntry) => void;
  consumeRestore: () => HistoryEntry | null;
}

export const useAppStore = create<AppState>((set, get) => ({
  history: loadHistory(),
  historyOpen: false,
  restoreTarget: null,
  toggleHistory: (open) =>
    set((s) => ({ historyOpen: open === undefined ? !s.historyOpen : open })),
  pushHistory: (entry) => set({ history: addEntry(entry) }),
  deleteEntry: (id) => set({ history: removeEntry(id) }),
  wipe: (tool) => set({ history: clearHistory(tool) }),
  queueRestore: (entry) => set({ restoreTarget: entry, historyOpen: false }),
  consumeRestore: () => {
    const t = get().restoreTarget;
    if (t) set({ restoreTarget: null });
    return t;
  },
}));
