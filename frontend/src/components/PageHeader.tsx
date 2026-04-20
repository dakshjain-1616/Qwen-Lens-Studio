import type { ToolMeta } from '../lib/types';

export default function PageHeader({ tool }: { tool: ToolMeta }) {
  return (
    <div className="mb-6 flex items-start gap-4">
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.accent} flex items-center justify-center text-2xl shadow-lg shadow-black/40`}
      >
        {tool.icon}
      </div>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{tool.label}</h1>
        <p className="text-slate-400 mt-1 text-sm md:text-base">{tool.blurb}</p>
      </div>
    </div>
  );
}
