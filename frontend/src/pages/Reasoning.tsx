import { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ImageDropzone from '../components/ImageDropzone';
import PageHeader from '../components/PageHeader';
import StreamButton from '../components/StreamButton';
import ThinkingPane from '../components/ThinkingPane';
import EmptyState from '../components/EmptyState';
import StageChip from '../components/StageChip';
import ExportMenu from '../components/ExportMenu';
import Markdown from '../components/Markdown';
import { useToolRun, compressImage } from '../lib/useToolRun';
import { useAppStore } from '../store/useAppStore';
import { TOOLS, type HistoryEntry } from '../lib/types';
import { makeId } from '../lib/history';

const TOOL = TOOLS.find((t) => t.id === 'reasoning')!;

export default function Reasoning() {
  const [file, setFile] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [showThinking, setShowThinking] = useState(true);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const { thinking, answer, error, loading, stage, begin, run, cancel, restoreOutput } = useToolRun({
    url: '/api/reasoning',
    tool: 'reasoning',
    supportsThinking: true,
  });
  const consumeRestore = useAppStore((s) => s.consumeRestore);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const entry: HistoryEntry = {
    id: makeId(),
    tool: 'reasoning',
    createdAt: Date.now(),
    title: question.slice(0, 80) || 'Visual reasoning',
    inputs: { question, showThinking, thumbs: [] },
    output: { thinking, answer },
  };

  useEffect(() => {
    const entry = consumeRestore();
    if (entry && entry.tool === 'reasoning') {
      setQuestion(entry.inputs.question ?? '');
      setShowThinking(!!entry.inputs.showThinking);
      setPreviewOverride(entry.inputs.thumbs[0] ?? null);
      setFile(null);
      restoreOutput(entry.output.thinking, entry.output.answer);
    }
  }, [consumeRestore, restoreOutput]);

  const submit = async () => {
    if (!file || !question.trim()) return;
    begin();
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append('image', compressed);
    fd.append('question', question);
    fd.append('show_thinking', String(showThinking));
    setPreviewOverride(null);
    run(fd, [compressed], {
      question,
      showThinking,
      thumbs: [],
      title: question.slice(0, 80),
    });
  };

  return (
    <>
      <PageHeader tool={TOOL} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <ImageDropzone
            file={file}
            previewOverride={previewOverride}
            onChange={(f) => {
              setFile(f);
              setPreviewOverride(null);
            }}
          />
          <div className="mt-4 space-y-3">
            <textarea
              className="input-field resize-y min-h-[140px]"
              rows={6}
              placeholder="Ask a complex question about the image…"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <label className="flex items-center gap-3 text-sm text-slate-300 select-none cursor-pointer">
              <span
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  showThinking ? 'bg-fuchsia-500' : 'bg-white/10'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    showThinking ? 'translate-x-4' : ''
                  }`}
                />
              </span>
              <input
                type="checkbox"
                className="hidden"
                checked={showThinking}
                onChange={(e) => setShowThinking(e.target.checked)}
              />
              <span>
                Show thinking <span className="text-slate-500">· stream Qwen's reasoning</span>
              </span>
            </label>
            <StreamButton
              loading={loading}
              disabled={!file || !question.trim()}
              onClick={submit}
              onCancel={cancel}
              label="Analyze with Qwen"
            />
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-start justify-between mb-2">
            <StageChip stage={stage} />
          </div>
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 px-4 py-3 mb-4 text-sm">
              {error}
            </div>
          )}
          {!thinking && !error ? (
            <EmptyState
              icon="✦"
              title="Thinking appears here"
              hint="Upload an image and ask a question. Qwen's reasoning will stream into this pane while the full answer renders below."
            />
          ) : (
            thinking && <ThinkingPane text={thinking} streaming={loading && !answer} />
          )}
        </GlassCard>
      </div>

      {(answer || (loading && !thinking)) && (
        <div className="mt-6">
          <GlassCard>
            <div className="flex items-start justify-between mb-3 pb-3 border-b border-white/5">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-fuchsia-300/80 font-semibold mb-0.5">Answer</div>
                <div className="text-sm text-slate-400">{question || 'Visual reasoning'}</div>
              </div>
              {answer && <ExportMenu entry={entry} elementRef={resultCardRef} />}
            </div>
            <div ref={resultCardRef}>
              {answer ? (
                <Markdown text={answer} />
              ) : (
                <div className="text-slate-500 italic text-sm">streaming…</div>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </>
  );
}
