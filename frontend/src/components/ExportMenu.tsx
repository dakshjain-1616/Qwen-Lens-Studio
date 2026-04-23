import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { HistoryEntry } from '../lib/types';
import { copyToClipboard, downloadBlob, downloadJson, toMarkdown, toPdf } from '../lib/export';

interface Props {
  entry: HistoryEntry;
  elementRef?: React.RefObject<HTMLElement>;
}

export default function ExportMenu({ entry, elementRef }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const base = `qwen-${entry.tool}-${entry.id}`;

  const handleMarkdown = () => {
    downloadBlob(toMarkdown(entry), `${base}.md`, 'text/markdown');
    setOpen(false);
  };
  const handleJson = () => {
    downloadJson(entry, `${base}.json`);
    setOpen(false);
  };
  const handlePdf = async () => {
    setOpen(false);
    const el = elementRef?.current ?? document.body;
    await toPdf(el as HTMLElement, `${base}.pdf`);
  };
  const handleCopy = async () => {
    await copyToClipboard(toMarkdown(entry));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 inline-flex items-center gap-1"
      >
        Export <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 rounded-xl border border-white/10 bg-black/90 backdrop-blur-xl shadow-xl z-50 overflow-hidden">
          <MenuItem label="Markdown" onClick={handleMarkdown} />
          <MenuItem label="JSON" onClick={handleJson} />
          <MenuItem label="PDF" onClick={handlePdf} />
          <MenuItem label="Copy as Markdown" onClick={handleCopy} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-white/10 transition"
    >
      {label}
    </button>
  );
}
