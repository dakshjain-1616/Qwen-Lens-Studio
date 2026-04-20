import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import AuroraBg from './AuroraBg';
import HistoryPanel from './HistoryPanel';

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen flex">
      <AuroraBg />
      <Sidebar />
      <main className="flex-1 min-w-0 px-8 py-8 max-w-[1400px] mx-auto w-full">
        {children}
      </main>
      <HistoryPanel />
    </div>
  );
}
