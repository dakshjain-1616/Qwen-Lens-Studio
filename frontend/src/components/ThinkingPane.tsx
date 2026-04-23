import { useState } from 'react';

export default function ThinkingPane({
  text,
  streaming,
}: {
  text: string;
  streaming?: boolean;
}) {
  const [open, setOpen] = useState(true);
  if (!text) return null;
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-amber-500/[0.06] transition-colors"
      >
        <span className="flex items-center gap-2 font-semibold text-amber-200/90">
          <span>🧠</span> Thinking
          {streaming && (
            <span className="chip bg-amber-500/20 text-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
              live
            </span>
          )}
        </span>
        <span className="text-amber-300/60 text-sm">{open ? '▾' : '▸'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 pt-1 text-sm text-amber-100/80 font-mono whitespace-pre-wrap leading-relaxed max-h-[480px] overflow-y-auto">
          {text}
        </div>
      )}
    </div>
  );
}
