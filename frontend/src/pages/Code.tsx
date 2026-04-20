import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ImageDropzone from '../components/ImageDropzone';
import PageHeader from '../components/PageHeader';
import StreamButton from '../components/StreamButton';
import EmptyState from '../components/EmptyState';
import StageChip from '../components/StageChip';
import CodePreview from '../components/CodePreview';
import { useToolRun, compressImage } from '../lib/useToolRun';
import { useAppStore } from '../store/useAppStore';
import { TOOLS } from '../lib/types';

const TOOL = TOOLS.find((t) => t.id === 'code')!;

const FRAMEWORKS = [
  { id: 'html', label: 'HTML + CSS' },
  { id: 'react', label: 'React + Tailwind' },
  { id: 'vue', label: 'Vue 3' },
  { id: 'svelte', label: 'Svelte' },
];

export default function Code() {
  const [file, setFile] = useState<File | null>(null);
  const [framework, setFramework] = useState('html');
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const { answer, error, loading, stage, begin, run, cancel, restoreOutput } = useToolRun({
    url: '/api/code-lens',
    tool: 'code',
  });
  const consumeRestore = useAppStore((s) => s.consumeRestore);

  useEffect(() => {
    const e = consumeRestore();
    if (e && e.tool === 'code') {
      setFramework(e.inputs.framework ?? 'html');
      setPreviewOverride(e.inputs.thumbs[0] ?? null);
      setFile(null);
      restoreOutput(undefined, e.output.answer);
    }
  }, [consumeRestore, restoreOutput]);

  const submit = async () => {
    if (!file) return;
    begin();
    const compressed = await compressImage(file, 1600, 0.9);
    const fd = new FormData();
    fd.append('image', compressed);
    fd.append('framework', framework);
    setPreviewOverride(null);
    run(fd, [compressed], {
      framework,
      thumbs: [],
      title: `UI → ${FRAMEWORKS.find((f) => f.id === framework)?.label}`,
    });
  };

  return (
    <>
      <PageHeader tool={TOOL} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <ImageDropzone
            label="Drop a UI screenshot"
            file={file}
            previewOverride={previewOverride}
            onChange={(f) => {
              setFile(f);
              setPreviewOverride(null);
            }}
          />
          <div className="mt-4 space-y-3">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                Target framework
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FRAMEWORKS.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFramework(f.id)}
                    className={`px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      framework === f.id
                        ? 'border-amber-400/60 bg-amber-400/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <StreamButton
              loading={loading}
              disabled={!file}
              onClick={submit}
              onCancel={cancel}
              label="Generate code"
            />
          </div>
        </GlassCard>

        <GlassCard padded={false}>
          <div className="p-6">
            <StageChip stage={stage} />
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}
            {!answer && !error ? (
              <EmptyState
                icon="⌘"
                title="Code appears here"
                hint="HTML output gets a live sandboxed preview. Other frameworks show the syntax-highlighted source."
              />
            ) : (
              <CodePreview text={answer} framework={framework} />
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
