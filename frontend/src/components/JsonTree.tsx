import { useMemo, useState } from 'react';

function tryParse(raw: string): unknown {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  // strip ```json fences if present
  const fence = trimmed.match(/```(?:json)?\n?([\s\S]*?)(?:```|$)/);
  const body = fence ? fence[1] : trimmed;
  try {
    return JSON.parse(body);
  } catch {
    // try to close unterminated strings/brackets minimally
    for (let i = body.length; i > 0; i--) {
      try {
        return JSON.parse(body.slice(0, i));
      } catch {
        /* keep shrinking */
      }
    }
    return null;
  }
}

function Node({ name, value, depth }: { name?: string; value: unknown; depth: number }) {
  const [open, setOpen] = useState(depth < 2);
  if (value === null) return <Leaf name={name} raw="null" cls="text-slate-500" />;
  if (typeof value === 'string') return <Leaf name={name} raw={`"${value}"`} cls="text-emerald-300" />;
  if (typeof value === 'number') return <Leaf name={name} raw={String(value)} cls="text-amber-300" />;
  if (typeof value === 'boolean') return <Leaf name={name} raw={String(value)} cls="text-purple-300" />;
  if (Array.isArray(value)) {
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-left hover:text-white text-slate-300"
        >
          {name !== undefined && <span className="text-cyan-300">{name}: </span>}
          <span className="text-slate-500">[{value.length}]</span> {open ? '▾' : '▸'}
        </button>
        {open && (
          <div className="pl-4 border-l border-white/5 ml-2 mt-1">
            {value.map((v, i) => (
              <Node key={i} name={String(i)} value={v} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="text-left hover:text-white text-slate-300"
        >
          {name !== undefined && <span className="text-cyan-300">{name}: </span>}
          <span className="text-slate-500">{`{${entries.length}}`}</span> {open ? '▾' : '▸'}
        </button>
        {open && (
          <div className="pl-4 border-l border-white/5 ml-2 mt-1">
            {entries.map(([k, v]) => (
              <Node key={k} name={k} value={v} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  return null;
}

function Leaf({ name, raw, cls }: { name?: string; raw: string; cls: string }) {
  return (
    <div>
      {name !== undefined && <span className="text-cyan-300">{name}: </span>}
      <span className={cls}>{raw}</span>
    </div>
  );
}

export default function JsonTree({ text }: { text: string }) {
  const [view, setView] = useState<'tree' | 'raw'>('tree');
  const [copied, setCopied] = useState(false);
  const parsed = useMemo(() => tryParse(text), [text]);
  if (!text) return null;
  const pretty = parsed ? JSON.stringify(parsed, null, 2) : text;

  const copy = async () => {
    await navigator.clipboard.writeText(pretty);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const download = () => {
    const blob = new Blob([pretty], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qwen-extract.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1">
          <button
            onClick={() => setView('tree')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              view === 'tree' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tree
          </button>
          <button
            onClick={() => setView('raw')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
              view === 'raw' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Raw
          </button>
          {!parsed && (
            <span className="chip bg-rose-500/20 text-rose-300 ml-2">invalid JSON</span>
          )}
        </div>
        <div className="flex gap-1">
          <button onClick={copy} className="btn-ghost text-xs !py-1 !px-2">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={download} className="btn-ghost text-xs !py-1 !px-2">
            Download
          </button>
        </div>
      </div>
      {view === 'tree' && parsed ? (
        <div className="p-4 font-mono text-sm max-h-[480px] overflow-auto leading-relaxed">
          <Node value={parsed} depth={0} />
        </div>
      ) : (
        <pre className="m-0 p-4 text-sm font-mono text-slate-200 overflow-auto max-h-[480px] whitespace-pre-wrap">
          {pretty}
        </pre>
      )}
    </div>
  );
}
