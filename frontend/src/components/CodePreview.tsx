import { useEffect, useRef, useState } from 'react';

function extractCode(raw: string): { lang: string; body: string } {
  const fence = raw.match(/```([a-zA-Z0-9+-]*)\n?([\s\S]*?)(?:```|$)/);
  if (fence) return { lang: fence[1] || 'plaintext', body: fence[2] };
  return { lang: 'plaintext', body: raw };
}

export default function CodePreview({
  text,
  framework,
}: {
  text: string;
  framework: string;
}) {
  const [tab, setTab] = useState<'code' | 'preview'>(framework === 'html' ? 'preview' : 'code');
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { body, lang } = extractCode(text || '');

  useEffect(() => {
    if (tab !== 'preview') return;
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = framework === 'html' ? body : `<pre>${body.replace(/</g, '&lt;')}</pre>`;
    iframe.srcdoc = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui;margin:0;padding:1rem;color:#0f172a;background:#fff}</style></head><body>${doc}</body></html>`;
  }, [tab, body, framework]);

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

  if (!text) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-1">
          {framework === 'html' && (
            <button
              onClick={() => setTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                tab === 'preview' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Preview
            </button>
          )}
          <button
            onClick={() => setTab('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === 'code' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Code
            <span className="ml-2 text-[10px] text-slate-500">{lang}</span>
          </button>
        </div>
        <div className="flex gap-1">
          <button onClick={copy} className="btn-ghost text-xs !py-1 !px-2">
            {copied ? '✓ Copied' : 'Copy'}
          </button>
          <button onClick={download} className="btn-ghost text-xs !py-1 !px-2">
            Download
          </button>
        </div>
      </div>

      {tab === 'preview' ? (
        <iframe
          ref={iframeRef}
          title="preview"
          sandbox="allow-scripts"
          className="w-full h-[480px] bg-white"
        />
      ) : (
        <pre className="m-0 p-4 text-sm font-mono text-slate-200 overflow-auto max-h-[480px] leading-relaxed">
          <code>{body}</code>
        </pre>
      )}
    </div>
  );
}
