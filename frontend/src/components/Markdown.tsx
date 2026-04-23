import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

function normalize(raw: string): string {
  // Model output sometimes merges a newline+number (e.g., "foo.2. bar") or
  // collides sub-bullets into prose. Add gentle spacing before ordered-list
  // items and bullet markers when the model forgot the preceding newline.
  let t = raw;
  // "text.2. " or "text 2. " at sentence boundaries → newline before the number
  t = t.replace(/([a-zA-Z0-9"'\.\)])\s*(?=\b\d+\.\s+[A-Z])/g, '$1\n\n');
  // Inline "* " bullets that immediately follow text → push to new line
  t = t.replace(/([^\s])\s+(?=\*\s+[A-Z])/g, '$1\n');
  // Collapse 3+ newlines to 2
  t = t.replace(/\n{3,}/g, '\n\n');
  return t;
}

export default function Markdown({ text }: { text: string }) {
  return (
    <div className="markdown-body text-slate-100 leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => <h1 className="text-xl font-bold text-white mt-6 mb-3 first:mt-0">{children}</h1>,
          h2: ({ children }) => <h2 className="text-lg font-semibold text-white mt-5 mb-2 first:mt-0">{children}</h2>,
          h3: ({ children }) => <h3 className="text-base font-semibold text-slate-100 mt-4 mb-2 first:mt-0">{children}</h3>,
          p: ({ children }) => <p className="text-slate-200 mb-3 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-outside pl-5 mb-3 space-y-1.5 marker:text-fuchsia-400">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-outside pl-5 mb-3 space-y-1.5 marker:text-fuchsia-400">{children}</ol>,
          li: ({ children }) => <li className="text-slate-200">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-100">{children}</em>,
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-fuchsia-300 hover:text-fuchsia-200 underline decoration-fuchsia-500/40 underline-offset-2">
              {children}
            </a>
          ),
          code: ({ className, children }) => {
            const isBlock = className?.startsWith('language-');
            if (isBlock) {
              return (
                <pre className="my-3 p-3 rounded-lg bg-black/40 border border-white/10 overflow-auto">
                  <code className="text-xs font-mono text-slate-100">{children}</code>
                </pre>
              );
            }
            return <code className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[0.9em] font-mono text-fuchsia-200">{children}</code>;
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-fuchsia-500/50 pl-3 my-3 text-slate-300 italic">{children}</blockquote>
          ),
          hr: () => <hr className="my-5 border-white/10" />,
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border border-white/10 px-3 py-2 text-left font-semibold bg-white/5">{children}</th>,
          td: ({ children }) => <td className="border border-white/10 px-3 py-2">{children}</td>,
        }}
      >
        {normalize(text)}
      </ReactMarkdown>
    </div>
  );
}
