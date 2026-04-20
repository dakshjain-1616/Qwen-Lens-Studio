import { useEffect, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ImageDropzone from '../components/ImageDropzone';
import PageHeader from '../components/PageHeader';
import StreamButton from '../components/StreamButton';
import EmptyState from '../components/EmptyState';
import StageChip from '../components/StageChip';
import DiffCompare from '../components/DiffCompare';
import { useToolRun, compressImage } from '../lib/useToolRun';
import { useAppStore } from '../store/useAppStore';
import { TOOLS } from '../lib/types';

const TOOL = TOOLS.find((t) => t.id === 'dual')!;

export default function Dual() {
  const [img1, setImg1] = useState<File | null>(null);
  const [img2, setImg2] = useState<File | null>(null);
  const [question, setQuestion] = useState('');
  const [override1, setOverride1] = useState<string | null>(null);
  const [override2, setOverride2] = useState<string | null>(null);
  const { answer, error, loading, stage, begin, run, cancel, restoreOutput } = useToolRun({
    url: '/api/dual-compare',
    tool: 'dual',
  });
  const consumeRestore = useAppStore((s) => s.consumeRestore);

  useEffect(() => {
    const e = consumeRestore();
    if (e && e.tool === 'dual') {
      setQuestion(e.inputs.question ?? '');
      setOverride1(e.inputs.thumbs[0] ?? null);
      setOverride2(e.inputs.thumbs[1] ?? null);
      setImg1(null);
      setImg2(null);
      restoreOutput(undefined, e.output.answer);
    }
  }, [consumeRestore, restoreOutput]);

  const submit = async () => {
    if (!img1 || !img2 || !question.trim()) return;
    begin();
    const [c1, c2] = await Promise.all([compressImage(img1), compressImage(img2)]);
    const fd = new FormData();
    fd.append('image1', c1);
    fd.append('image2', c2);
    fd.append('question', question);
    setOverride1(null);
    setOverride2(null);
    run(fd, [c1, c2], {
      question,
      thumbs: [],
      title: question.slice(0, 80),
    });
  };

  return (
    <>
      <PageHeader tool={TOOL} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <div className="grid grid-cols-2 gap-3">
            <ImageDropzone
              compact
              label="Image 1"
              file={img1}
              previewOverride={override1}
              onChange={(f) => {
                setImg1(f);
                setOverride1(null);
              }}
            />
            <ImageDropzone
              compact
              label="Image 2"
              file={img2}
              previewOverride={override2}
              onChange={(f) => {
                setImg2(f);
                setOverride2(null);
              }}
            />
          </div>
          <div className="mt-4 space-y-3">
            <textarea
              className="input-field resize-none"
              rows={3}
              placeholder="What should Qwen compare about these images?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
            />
            <StreamButton
              loading={loading}
              disabled={!img1 || !img2 || !question.trim()}
              onClick={submit}
              onCancel={cancel}
              label="Compare images"
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
                icon="⇄"
                title="Comparison appears here"
                hint="Qwen returns Similarities, Differences, and a Verdict — each in its own card."
              />
            ) : (
              <DiffCompare text={answer} />
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
