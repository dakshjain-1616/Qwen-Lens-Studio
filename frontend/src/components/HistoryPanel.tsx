import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { TOOLS } from '../lib/types';
import type { HistoryEntry } from '../lib/types';

function relTime(ts: number) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HistoryPanel() {
  const open = useAppStore((s) => s.historyOpen);
  const toggle = useAppStore((s) => s.toggleHistory);
  const history = useAppStore((s) => s.history);
  const deleteEntry = useAppStore((s) => s.deleteEntry);
  const wipe = useAppStore((s) => s.wipe);
  const queueRestore = useAppStore((s) => s.queueRestore);
  const navigate = useNavigate();

  const restore = (e: HistoryEntry) => {
    queueRestore(e);
    const path = TOOLS.find((t) => t.id === e.tool)?.path ?? '/';
    navigate(path);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => toggle(false)}
          />
          <motion.aside
            className="fixed right-0 top-0 h-screen w-full max-w-md z-50 bg-ink-900/95 backdrop-blur-xl border-l border-white/10 flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 280, damping: 30 }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="font-semibold text-lg">History</div>
                <div className="text-xs text-slate-500">
                  {history.length} {history.length === 1 ? 'entry' : 'entries'} · stored locally
                </div>
              </div>
              <div className="flex items-center gap-2">
                {history.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Clear all history?')) wipe();
                    }}
                    className="btn-ghost text-xs"
                  >
                    Clear all
                  </button>
                )}
                <button
                  onClick={() => toggle(false)}
                  className="w-9 h-9 rounded-lg hover:bg-white/10 flex items-center justify-center"
                  aria-label="close"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {history.length === 0 && (
                <div className="text-center text-slate-500 py-20">
                  <div className="text-5xl mb-3">🕑</div>
                  <div className="font-medium text-slate-300">No runs yet</div>
                  <div className="text-sm mt-1">Your recent analyses will show here.</div>
                </div>
              )}
              {history.map((e) => {
                const tool = TOOLS.find((t) => t.id === e.tool);
                return (
                  <button
                    key={e.id}
                    onClick={() => restore(e)}
                    className="group glass glass-hover p-3 text-left flex gap-3 items-center"
                  >
                    <div className="flex -space-x-2 shrink-0">
                      {e.inputs.thumbs.slice(0, 2).map((t, i) => (
                        <img
                          key={i}
                          src={t}
                          className="w-12 h-12 rounded-lg object-cover border-2 border-ink-900"
                        />
                      ))}
                      {e.inputs.thumbs.length === 0 && (
                        <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center text-lg">
                          {tool?.icon ?? '✦'}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`chip bg-gradient-to-r ${tool?.accent} text-white`}
                        >
                          {tool?.short}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {relTime(e.createdAt)}
                        </span>
                      </div>
                      <div className="text-sm text-slate-200 truncate">{e.title}</div>
                    </div>
                    <button
                      onClick={(ev) => {
                        ev.stopPropagation();
                        deleteEntry(e.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-8 h-8 rounded-lg hover:bg-rose-500/20 text-slate-500 hover:text-rose-300 flex items-center justify-center"
                      aria-label="delete"
                    >
                      ✕
                    </button>
                  </button>
                );
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
