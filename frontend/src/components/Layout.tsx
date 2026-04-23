import { Outlet } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Sidebar from './Sidebar';
import AuroraBg from './AuroraBg';
import HistoryPanel from './HistoryPanel';
import SettingsModal from './SettingsModal';
import { useAppStore } from '../store/useAppStore';

export default function Layout() {
  const isSettingsOpen = useAppStore((s) => s.isSettingsOpen);
  const setSettingsOpen = useAppStore((s) => s.setSettingsOpen);

  return (
    <div className="relative min-h-screen flex">
      <AuroraBg />
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-8 max-w-[1400px] mx-auto w-full relative">
        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Settings"
          className="absolute top-6 right-6 z-10 p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
        <Outlet />
      </main>
      <HistoryPanel />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
