import { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ImageDropzone from '../components/ImageDropzone';
import PageHeader from '../components/PageHeader';
import StreamButton from '../components/StreamButton';
import EmptyState from '../components/EmptyState';
import StageChip from '../components/StageChip';
import JsonTree from '../components/JsonTree';
import ExportMenu from '../components/ExportMenu';
import { useToolRun, compressImage } from '../lib/useToolRun';
import { useAppStore } from '../store/useAppStore';
import { TOOLS, type HistoryEntry } from '../lib/types';
import { makeId } from '../lib/history';

const TOOL = TOOLS.find((t) => t.id === 'document')!;

export default function DocumentPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const { answer, error, loading, stage, begin, run, cancel, restoreOutput } = useToolRun({
    url: '/api/document-iq',
    tool: 'document',
  });
  const consumeRestore = useAppStore((s) => s.consumeRestore);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const entry: HistoryEntry = {
    id: makeId(),
    tool: 'document',
    createdAt: Date.now(),
    title: file?.name || 'Document extract',
    inputs: { thumbs: [] },
    output: { answer },
  };

  useEffect(() => {
    const e = consumeRestore();
    if (e && e.tool === 'document') {
      setPreviewOverride(e.inputs.thumbs[0] ?? null);
      setFile(null);
      restoreOutput(undefined, e.output.answer);
    }
  }, [consumeRestore, restoreOutput]);

  const submit = async () => {
    if (!file) return;
    begin();
    // Documents benefit from higher resolution for OCR accuracy
    const compressed = await compressImage(file, 1600, 0.9);
    const fd = new FormData();
    fd.append('image', compressed);
    setPreviewOverride(null);
    run(fd, [compressed], { thumbs: [], title: file.name || 'Document extract' });
  };

  return (
    <>
      <PageHeader tool={TOOL} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlassCard>
          <ImageDropzone
            label="Drop invoice, receipt, ID…"
            file={file}
            previewOverride={previewOverride}
            onChange={(f) => {
              setFile(f);
              setPreviewOverride(null);
            }}
          />
          <div className="mt-4">
            <StreamButton
              loading={loading}
              disabled={!file}
              onClick={submit}
              onCancel={cancel}
              label="Extract structured data"
            />
          </div>
          <div className="mt-4 text-xs text-slate-500">
            Qwen will return a JSON object with the fields it identifies. You can copy or
            download the result on the right.
          </div>
        </GlassCard>

        <GlassCard padded={false}>
          <div className="p-6">
            <div className="flex items-start justify-between mb-2">
              <StageChip stage={stage} />
              {answer && <ExportMenu entry={entry} elementRef={resultCardRef} />}
            </div>
            {error && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 px-4 py-3 mb-4 text-sm">
                {error}
              </div>
            )}
            {!answer && !error ? (
              <EmptyState
                icon="📄"
                title="JSON appears here"
                hint="Upload a document image. Extracted fields render as a collapsible tree you can copy."
              />
            ) : (
              <div ref={resultCardRef}>
                <JsonTree text={answer} />
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </>
  );
}
