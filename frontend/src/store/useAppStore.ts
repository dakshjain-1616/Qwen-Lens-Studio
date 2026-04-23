import { create } from 'zustand';
import type { HistoryEntry, ToolId } from '../lib/types';
import { addEntry, clearHistory, loadHistory, removeEntry } from '../lib/history';

interface AppState {
  history: HistoryEntry[];
  isHistoryOpen: boolean;
  pendingRestore: HistoryEntry | null;
  isSettingsOpen: boolean;

  toggleHistory: (open?: boolean) => void;
  pushHistory: (entry: HistoryEntry) => void;
  deleteEntry: (id: string) => void;
  wipe: (tool?: ToolId) => void;
  queueRestore: (entry: HistoryEntry) => void;
  consumeRestore: () => HistoryEntry | null;
  setSettingsOpen: (open: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  history: loadHistory(),
  isHistoryOpen: false,
  pendingRestore: null,
  isSettingsOpen: false,

  toggleHistory: (open?: boolean) =>
    set((state) => ({
      isHistoryOpen: typeof open === 'boolean' ? open : !state.isHistoryOpen,
    })),

  pushHistory: (entry) => {
    const next = addEntry(entry);
    set({ history: next });
  },

  deleteEntry: (id) => {
    const next = removeEntry(id);
    set({ history: next });
  },

  wipe: (tool) => {
    const next = clearHistory(tool);
    set({ history: next });
  },

  queueRestore: (entry) => set({ pendingRestore: entry }),

  consumeRestore: () => {
    const current = get().pendingRestore;
    if (current) set({ pendingRestore: null });
    return current;
  },

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
