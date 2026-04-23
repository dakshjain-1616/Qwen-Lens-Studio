import { useEffect, useRef, useState } from 'react';
import GlassCard from '../components/GlassCard';
import PageHeader from '../components/PageHeader';
import MultiImageDropzone from '../components/MultiImageDropzone';
import { TOOLS, type ToolId } from '../lib/types';
import { compressImage, makeThumbnail, runToolNonStreaming } from '../lib/api';
import { downloadCsv, downloadJson } from '../lib/export';

type BatchToolId = Exclude<ToolId, 'dual'>;

type Status = 'queued' | 'running' | 'done' | 'error';

interface Job {
  id: string;
  file: File;
  thumb?: string;
  status: Status;
  latencyMs?: number;
  output?: string;
  error?: string;
  controller?: AbortController;
}

const ENDPOINTS: Record<BatchToolId, string> = {
  reasoning: '/api/reasoning',
  multilingual: '/api/multilingual',
  document: '/api/document-iq',
  code: '/api/code-lens',
};

const BATCH_TOOL_OPTIONS: { id: BatchToolId; label: string }[] = [
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'multilingual', label: 'Multilingual' },
  { id: 'document', label: 'Document IQ' },
  { id: 'code', label: 'Code Lens' },
];

const CONCURRENCY = 3;

export default function Batch() {
  const [tool, setTool] = useState<BatchToolId>('reasoning');
  const [question, setQuestion] = useState('Describe this image.');
  const [language, setLanguage] = useState('en');
  const [framework, setFramework] = useState('html');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [running, setRunning] = useState(false);
  const abortAllRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    jobs.forEach((job) => {
      if (!job.thumb && job.status === 'queued') {
        makeThumbnail(job.file, 128)
          .then((thumb) => {
            if (!cancelled) {
              setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, thumb } : j)));
            }
          })
          .catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobs.length]);

  const handleFiles = (files: File[]) => {
    const next: Job[] = files.map((f, i) => ({
      id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 7)}`,
      file: f,
      status: 'queued',
    }));
    setJobs((prev) => [...prev, ...next]);
  };

  const resetQueue = () => {
    if (running) return;
    setJobs([]);
  };

  const buildFormData = async (file: File): Promise<FormData> => {
    const compressed = await compressImage(file, tool === 'document' || tool === 'code' ? 1600 : 1280, 0.9);
    const fd = new FormData();
    fd.append('image', compressed);
    if (tool === 'reasoning') {
      fd.append('question', question);
      fd.append('show_thinking', 'false');
    } else if (tool === 'multilingual') {
      fd.append('language', language);
    } else if (tool === 'code') {
      fd.append('framework', framework);
    }
    return fd;
  };

  const runOne = async (jobId: string, globalSignal: AbortSignal) => {
    const start = Date.now();
    const controller = new AbortController();
    const onAbort = () => controller.abort();
    globalSignal.addEventListener('abort', onAbort);

    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: 'running', controller } : j))
    );

    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    try {
      const fd = await buildFormData(job.file);
      const result = await runToolNonStreaming(ENDPOINTS[tool], fd, controller.signal);
      const latencyMs = Date.now() - start;
      if (result.error) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, status: 'error', latencyMs, error: result.error, controller: undefined }
              : j
          )
        );
      } else {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId
              ? { ...j, status: 'done', latencyMs, output: result.content, controller: undefined }
              : j
          )
        );
      }
    } catch (err) {
      const latencyMs = Date.now() - start;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === jobId
            ? {
                ...j,
                status: 'error',
                latencyMs,
                error: err instanceof Error ? err.message : String(err),
                controller: undefined,
              }
            : j
        )
      );
    } finally {
      globalSignal.removeEventListener('abort', onAbort);
    }
  };

  const startAll = async () => {
    if (running) return;
    const queue = jobs.filter((j) => j.status === 'queued').map((j) => j.id);
    if (queue.length === 0) return;
    setRunning(true);
    const global = new AbortController();
    abortAllRef.current = global;

    let i = 0;
    const worker = async () => {
      while (i < queue.length && !global.signal.aborted) {
        const idx = i++;
        await runOne(queue[idx], global.signal);
      }
    };
    const workers: Promise<void>[] = [];
    for (let k = 0; k < Math.min(CONCURRENCY, queue.length); k++) {
      workers.push(worker());
    }
    await Promise.all(workers);
    setRunning(false);
    abortAllRef.current = null;
  };

  const cancelAll = () => {
    abortAllRef.current?.abort();
    setRunning(false);
  };

  const exportJson = () => {
    const payload = {
      tool,
      params:
        tool === 'reasoning'
          ? { question }
          : tool === 'multilingual'
          ? { language }
          : tool === 'code'
          ? { framework }
          : {},
      runAt: Date.now(),
      results: jobs.map((j) => ({
        filename: j.file.name,
        status: j.status,
        latencyMs: j.latencyMs ?? 0,
        output: j.output ?? '',
        error: j.error,
      })),
    };
    downloadJson(payload, `qwen-batch-${tool}-${Date.now()}.json`);
  };

  const exportCsv = () => {
    const baseCols = ['filename', 'status', 'latency_ms', 'output'];
    let extraKeys: string[] = [];
    if (tool === 'document') {
      const keySet = new Set<string>();
      for (const j of jobs) {
        if (!j.output) continue;
        try {
          const parsed = JSON.parse(j.output);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            for (const k of Object.keys(parsed)) keySet.add(k);
          }
        } catch {
          // ignore
        }
      }
      extraKeys = Array.from(keySet);
    }
    const header = [...baseCols, ...extraKeys];
    const rows: string[][] = [header];
    for (const j of jobs) {
      const base = [j.file.name, j.status, String(j.latencyMs ?? ''), j.output ?? ''];
      const extras: string[] = extraKeys.map(() => '');
      if (tool === 'document' && j.output) {
        try {
          const parsed = JSON.parse(j.output);
          if (parsed && typeof parsed === 'object') {
            extraKeys.forEach((k, idx) => {
              const v = (parsed as Record<string, unknown>)[k];
              extras[idx] = v === undefined || v === null ? '' : typeof v === 'string' ? v : JSON.stringify(v);
            });
          }
        } catch {
          // ignore
        }
      }
      rows.push([...base, ...extras]);
    }
    downloadCsv(rows, `qwen-batch-${tool}-${Date.now()}.csv`);
  };

  const removeJob = (id: string) => {
    if (running) return;
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const pageTool = TOOLS.find((t) => t.id === 'reasoning')!;

  return (
    <>
      <PageHeader
        tool={{
          ...pageTool,
          id: 'reasoning',
          label: 'Batch Processing',
          short: 'Batch',
          icon: '▦',
          blurb: 'Run a tool across many images. Concurrency 3. Export JSON/CSV.',
          accent: 'from-sky-500 to-indigo-500',
        }}
      />

      <GlassCard>
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Tool</div>
              <select
                value={tool}
                onChange={(e) => setTool(e.target.value as BatchToolId)}
                disabled={running}
                className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100"
              >
                {BATCH_TOOL_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            {tool === 'reasoning' && (
              <div className="flex-1 min-w-[240px]">
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Question</div>
                <input
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  disabled={running}
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100"
                />
              </div>
            )}
            {tool === 'multilingual' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Language</div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={running}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100"
                >
                  {['en', 'zh', 'ja', 'es', 'fr', 'de', 'ar', 'hi', 'ko', 'pt', 'ru'].map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {tool === 'code' && (
              <div>
                <div className="text-xs uppercase tracking-widest text-slate-500 mb-1">Framework</div>
                <select
                  value={framework}
                  onChange={(e) => setFramework(e.target.value)}
                  disabled={running}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-slate-100"
                >
                  <option value="html">HTML</option>
                  <option value="react">React</option>
                  <option value="vue">Vue</option>
                  <option value="svelte">Svelte</option>
                </select>
              </div>
            )}
          </div>

          <MultiImageDropzone onFilesSelected={handleFiles} disabled={running} />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={startAll}
              disabled={running || jobs.filter((j) => j.status === 'queued').length === 0}
              className="px-4 py-2 rounded-lg bg-indigo-500 hover:bg-indigo-400 text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Start ({jobs.filter((j) => j.status === 'queued').length})
            </button>
            <button
              onClick={cancelAll}
              disabled={!running}
              className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 disabled:opacity-40"
            >
              Cancel all
            </button>
            <button
              onClick={resetQueue}
              disabled={running || jobs.length === 0}
              className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 disabled:opacity-40"
            >
              Clear queue
            </button>
            <div className="ml-auto flex gap-2">
              <button
                onClick={exportJson}
                disabled={jobs.length === 0}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 disabled:opacity-40"
              >
                Export JSON
              </button>
              <button
                onClick={exportCsv}
                disabled={jobs.length === 0}
                className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 disabled:opacity-40"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </GlassCard>

      <div className="mt-6">
        <GlassCard padded={false}>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-widest text-slate-500 border-b border-white/5">
                <tr>
                  <th className="px-4 py-3">Thumb</th>
                  <th className="px-4 py-3">File</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Latency</th>
                  <th className="px-4 py-3">Output</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {jobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-500 py-8">
                      Drop images above to populate the queue.
                    </td>
                  </tr>
                ) : (
                  jobs.map((j) => (
                    <tr key={j.id} className="border-b border-white/5 align-top">
                      <td className="px-4 py-3">
                        {j.thumb ? (
                          <img
                            src={j.thumb}
                            alt=""
                            className="w-16 h-16 rounded-lg object-cover bg-black/40"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-lg bg-white/5 border border-white/10" />
                        )}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-slate-200">
                        {j.file.name}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-400">
                        {j.latencyMs ? `${j.latencyMs} ms` : '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-300 max-w-[360px]">
                        <div className="line-clamp-3 text-xs">
                          {j.error ? (
                            <span className="text-rose-300">{j.error}</span>
                          ) : (
                            (j.output ?? '').slice(0, 200)
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => removeJob(j.id)}
                          disabled={running}
                          className="text-slate-400 hover:text-rose-400 disabled:opacity-30 text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, string> = {
    queued: 'bg-slate-500/20 text-slate-300',
    running: 'bg-sky-500/20 text-sky-200 animate-pulse',
    done: 'bg-emerald-500/20 text-emerald-200',
    error: 'bg-rose-500/20 text-rose-200',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-widest ${map[status]}`}>
      {status}
    </span>
  );
}
