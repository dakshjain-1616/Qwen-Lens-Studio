import { useState } from 'react';
import ReadOnlyEditor from './ReadOnlyEditor';

function frameworkToMonacoLang(fw: string): string {
  switch (fw) {
    case 'react':
      return 'javascript';
    case 'vue':
    case 'svelte':
      return 'html';
    case 'html':
      return 'html';
    default:
      return 'plaintext';
  }
}

function extractCode(raw: string): { lang: string; body: string } {
  const fence = raw.match(/```([a-zA-Z0-9+-]*)\n?([\s\S]*?)(?:```|$)/);
  if (fence) return { lang: fence[1] || 'plaintext', body: fence[2] };
  return { lang: 'plaintext', body: raw };
}

function buildPreviewHtml(body: string, framework: string): string {
  const doc = framework === 'html' ? body : `<pre style="white-space:pre-wrap;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.6">${body.replace(/</g, '&lt;')}</pre>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>Qwen Code Preview</title><style>body{font-family:system-ui,-apple-system,sans-serif;margin:0;padding:1.25rem;color:#0f172a;background:#fff}</style></head><body>${doc}</body></html>`;
}

export default function CodePreview({
  text,
  framework,
}: {
  text: string;
  framework: string;
}) {
  const [copied, setCopied] = useState(false);
  const { body, lang } = extractCode(text || '');

  const copy = async () => {
    await navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    const ext = framework === 'react' ? 'jsx' : framework === 'vue' ? 'vue' : framework === 'svelte' ? 'svelte' : 'html';
    const blob = new Blob([body], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qwen-code.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const openPreview = () => {
    const html = buildPreviewHtml(body, framework);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  if (!text) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider font-semibold text-slate-300 bg-white/5 border border-white/10">
            {lang || framework}
          </span>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={openPreview}
            className="relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-fuchsia-500/80 to-indigo-500/80 border border-white/20 hover:brightness-110 transition-all shadow-md shadow-purple-500/30"
            title="Open rendered preview in a new tab"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Open preview
            <span className="text-[10px] opacity-70 ml-1">↗</span>
          </button>
          <button onClick={copy} className="btn-ghost text-xs !py-1 !px-2">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={download} className="btn-ghost text-xs !py-1 !px-2">
            Download
          </button>
        </div>
      </div>

      <ReadOnlyEditor value={body} language={frameworkToMonacoLang(framework)} />
    </div>
  );
}
