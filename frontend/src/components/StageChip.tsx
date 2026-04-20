import type { RunStage } from '../lib/types';

const LABELS: Record<Exclude<RunStage, 'idle'>, string> = {
  compressing: 'Compressing image…',
  uploading: 'Uploading · waiting for model…',
  streaming: 'Streaming response…',
};

export default function StageChip({ stage }: { stage: RunStage }) {
  if (stage === 'idle') return null;
  return (
    <div className="mb-3 inline-flex items-center gap-2 text-xs text-slate-300 bg-white/[0.04] border border-white/10 rounded-full px-3 py-1.5">
      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
      {LABELS[stage]}
    </div>
  );
}
