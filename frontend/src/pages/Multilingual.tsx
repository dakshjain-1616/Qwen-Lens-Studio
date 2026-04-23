import { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import ImageDropzone from '../components/ImageDropzone';
import PageHeader from '../components/PageHeader';
import StreamButton from '../components/StreamButton';
import EmptyState from '../components/EmptyState';
import StageChip from '../components/StageChip';
import ExportMenu from '../components/ExportMenu';
import Markdown from '../components/Markdown';
import { useToolRun, compressImage } from '../lib/useToolRun';
import { useAppStore } from '../store/useAppStore';
import { TOOLS, type HistoryEntry } from '../lib/types';
import { makeId } from '../lib/history';

const TOOL = TOOLS.find((t) => t.id === 'multilingual')!;

const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function Multilingual() {
  const [file, setFile] = useState<File | null>(null);
  const [lang, setLang] = useState('en');
  const [previewOverride, setPreviewOverride] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { answer, error, loading, stage, begin, run, cancel, restoreOutput } = useToolRun({
    url: '/api/multilingual',
    tool: 'multilingual',
  });
  const consumeRestore = useAppStore((s) => s.consumeRestore);
  const resultCardRef = useRef<HTMLDivElement>(null);

  const langMeta = LANGUAGES.find((l) => l.code === lang);
  const entry: HistoryEntry = {
    id: makeId(),
    tool: 'multilingual',
    createdAt: Date.now(),
    title: `Multilingual ${langMeta?.label ?? lang}`,
    inputs: { language: lang, thumbs: [] },
    output: { answer },
  };

  useEffect(() => {
    const e = consumeRestore();
    if (e && e.tool === 'multilingual') {
      setLang(e.inputs.language ?? 'en');
      setPreviewOverride(e.inputs.thumbs[0] ?? null);
      setFile(null);
      restoreOutput(undefined, e.output.answer);
    }
  }, [consumeRestore, restoreOutput]);

  const submit = async () => {
    if (!file) return;
    begin();
    const compressed = await compressImage(file);
    const fd = new FormData();
    fd.append('image', compressed);
    fd.append('language', lang);
    setPreviewOverride(null);
    run(fd, [compressed], {
      language: lang,
      thumbs: [],
      title: `Describe in ${langMeta?.label ?? lang}`,
    });
  };

  const copy = async () => {
    await navigator.clipboard.writeText(answer);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
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
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-2">
                Output language
              </div>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                      lang === l.code
                        ? 'border-cyan-400/60 bg-cyan-400/10 text-white'
                        : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200 hover:border-white/20'
                    }`}
                  >
                    <span className="mr-1">{l.flag}</span>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <StreamButton
              loading={loading}
              disabled={!file}
              onClick={submit}
              onCancel={cancel}
              label="Describe image"
            />
          </div>
        </GlassCard>

        <GlassCard>
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
              icon="🌐"
              title="Description appears here"
              hint="Pick a language and upload an image to get a detailed multilingual description."
            />
          ) : (
            <div ref={resultCardRef}>
              <div className="flex items-center justify-between mb-3">
                <span className="chip bg-cyan-500/20 text-cyan-200">
                  {LANGUAGES.find((l) => l.code === lang)?.flag}{' '}
                  {LANGUAGES.find((l) => l.code === lang)?.label}
                </span>
                <button onClick={copy} className="btn-ghost text-xs !py-1 !px-2">
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
              <Markdown text={answer} />
            </div>
          )}
        </GlassCard>
      </div>
    </>
  );
}
