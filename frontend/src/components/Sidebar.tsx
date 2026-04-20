import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TOOLS } from '../lib/types';
import { getHealth, type Health } from '../lib/api';
import { useAppStore } from '../store/useAppStore';

export default function Sidebar() {
  const navigate = useNavigate();
  const toggleHistory = useAppStore((s) => s.toggleHistory);
  const historyCount = useAppStore((s) => s.history.length);
  const [health, setHealth] = useState<Health | null>(null);
  const [healthErr, setHealthErr] = useState(false);

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealthErr(true));
  }, []);

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 py-6 px-4 flex flex-col gap-6 border-r border-white/5 bg-black/20 backdrop-blur-xl">
      <button
        onClick={() => navigate('/')}
        className="group flex items-center gap-3 px-2 text-left"
      >
        <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-xl shadow-lg shadow-purple-500/30">
          ✦
        </div>
        <div>
          <div className="font-bold text-base leading-tight gradient-text">
            Qwen Lens
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-400">
            Studio
          </div>
        </div>
      </button>

      <nav className="flex flex-col gap-1">
        <div className="text-[10px] uppercase tracking-widest text-slate-500 px-3 mb-1">
          Tools
        </div>
        {TOOLS.map((t) => (
          <NavLink
            key={t.id}
            to={t.path}
            className={({ isActive }) =>
              `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-white/10 text-white shadow-inner'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-base bg-gradient-to-br ${t.accent} ${
                    isActive ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
                  }`}
                >
                  {t.icon}
                </span>
                <span>{t.short}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={() => toggleHistory(true)}
          className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
        >
          <span className="flex items-center gap-2">
            <span>🕑</span> History
          </span>
          <span className="text-xs text-slate-400">{historyCount}</span>
        </button>

        <div className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/5">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                healthErr
                  ? 'bg-rose-400'
                  : health
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                  : 'bg-slate-500 animate-pulse'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {healthErr ? 'Offline' : health ? 'Online' : 'Checking…'}
            </span>
            {health?.mock_mode && (
              <span className="chip bg-amber-500/20 text-amber-300 ml-auto">mock</span>
            )}
          </div>
          {health && (
            <div className="text-[10px] text-slate-500 mt-1 truncate" title={health.model}>
              {health.model}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
