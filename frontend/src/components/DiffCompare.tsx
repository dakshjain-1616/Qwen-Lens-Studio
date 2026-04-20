function extractSection(text: string, head: string, next: string[]): string {
  const nextPattern = next.length ? `(?=##\\s+(?:${next.join('|')})|$)` : '$';
  const re = new RegExp(`##\\s+${head}\\s*\\n([\\s\\S]*?)${nextPattern}`, 'i');
  const m = text.match(re);
  return m ? m[1].trim() : '';
}

export default function DiffCompare({ text }: { text: string }) {
  if (!text) return null;
  const sims = extractSection(text, 'Similarities', ['Differences', 'Verdict']);
  const diffs = extractSection(text, 'Differences', ['Verdict']);
  const verdict = extractSection(text, 'Verdict', []);

  // If no markers, fall back to a single answer block
  if (!sims && !diffs && !verdict) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 whitespace-pre-wrap text-slate-200 leading-relaxed">
        {text}
      </div>
    );
  }

  const items = [
    { label: 'Similarities', body: sims, color: 'from-blue-500 to-cyan-400', icon: '≈' },
    { label: 'Differences', body: diffs, color: 'from-orange-500 to-rose-500', icon: '⇄' },
    { label: 'Verdict', body: verdict, color: 'from-emerald-400 to-teal-500', icon: '✓' },
  ];

  return (
    <div className="grid grid-cols-1 gap-4">
      {items.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden"
        >
          <div
            className={`px-4 py-2.5 bg-gradient-to-r ${s.color} text-white font-semibold flex items-center gap-2`}
          >
            <span>{s.icon}</span> {s.label}
          </div>
          <div className="p-4 text-slate-200 whitespace-pre-wrap leading-relaxed">
            {s.body || <span className="text-slate-500 italic">streaming…</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
