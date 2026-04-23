import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Trash2, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { TOOLS, type HistoryEntry, type ToolId } from '../lib/types';
import { exportHistoryJson, searchHistory } from '../lib/history';
import { downloadBlob } from '../lib/export';

export default function HistoryPanel() {
  const isOpen = useAppStore((s) => s.isHistoryOpen);
  const toggleHistory = useAppStore((s) => s.toggleHistory);
  const history = useAppStore((s) => s.history);
  const deleteEntry = useAppStore((s) => s.deleteEntry);
  const wipe = useAppStore((s) => s.wipe);
  const queueRestore = useAppStore((s) => s.queueRestore);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [toolFilter, setToolFilter] = useState<ToolId | 'all'>('all');

  const filtered = useMemo(() => {
    const tool = toolFilter === 'all' ? null : toolFilter;
    if (query.trim() || tool) {
      return searchHistory(tool, query);
    }
    return history;
  }, [history, query, toolFilter]);

  const handleExportAll = () => {
    const data = exportHistoryJson();
    downloadBlob(data, `qwen-history-${Date.now()}.json`, 'application/json');
  };

  const handleExportTool = () => {
    if (toolFilter === 'all') {
      handleExportAll();
      return;
    }
    const data = exportHistoryJson(toolFilter);
    downloadBlob(data, `qwen-history-${toolFilter}-${Date.now()}.json`, 'application/json');
  };

  const handleRestore = (entry: HistoryEntry) => {
    queueRestore(entry);
    const meta = TOOLS.find((t) => t.id === entry.tool);
    toggleHistory(false);
    if (meta) navigate(meta.path);
  };

  const handleClear = () => {
    if (toolFilter === 'all') {
      if (confirm('Clear ALL history?')) wipe();
    } else {
      if (confirm(`Clear history for ${toolFilter}?`)) wipe(toolFilter);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={() => toggleHistory(false)}
        />
      )}
      <aside
        className={`fixed top-0 right-0 h-screen w-[420px] max-w-[90vw] z-50 bg-black/80 backdrop-blur-xl border-l border-white/10 transition-transform duration-300 flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <div className="font-semibold">History</div>
            <div className="text-xs text-slate-500">{filtered.length} entries</div>
          </div>
          <button
            onClick={() => toggleHistory(false)}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-white/5 space-y-2">
          <input
            type="text"
            placeholder="Search title or answer…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/50"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={toolFilter}
              onChange={(e) => setToolFilter(e.target.value as ToolId | 'all')}
              className="px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200"
            >
              <option value="all">All tools</option>
              {TOOLS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.short}
                </option>
              ))}
            </select>
            <button
              onClick={handleExportTool}
              className="ml-auto px-2.5 py-1.5 rounded-lg text-xs bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 inline-flex items-center gap-1"
            >
              <Download className="w-3 h-3" /> Export
            </button>
            <button
              onClick={handleClear}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-200 inline-flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" /> Clear
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5">
          {filtered.length === 0 ? (
            <div className="text-center text-slate-500 text-sm mt-8">No entries</div>
          ) : (
            filtered.map((entry) => {
              const meta = TOOLS.find((t) => t.id === entry.tool);
              return (
                <div
                  key={entry.id}
                  className="group relative rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] p-3 cursor-pointer transition-colors"
                  onClick={() => handleRestore(entry)}
                >
                  <div className="flex items-start gap-3">
                    {entry.inputs?.thumbs?.[0] ? (
                      <img
                        src={entry.inputs.thumbs[0]}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover bg-black/40 shrink-0"
                      />
                    ) : (
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${meta?.accent ?? 'from-slate-600 to-slate-700'} flex items-center justify-center text-sm shrink-0`}
                      >
                        {meta?.icon ?? '•'}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase tracking-widest text-slate-500">
                          {meta?.short ?? entry.tool}
                        </span>
                        <span className="text-[10px] text-slate-600">
                          {new Date(entry.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-slate-100 truncate mt-0.5">
                        {entry.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {entry.output?.answer?.slice(0, 120) ?? ''}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteEntry(entry.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-rose-400 transition"
                      aria-label="Delete"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </>
  );
}
