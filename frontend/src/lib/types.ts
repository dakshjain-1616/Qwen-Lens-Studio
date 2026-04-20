export type ToolId = 'reasoning' | 'multilingual' | 'document' | 'code' | 'dual';

export interface ToolMeta {
  id: ToolId;
  label: string;
  short: string;
  path: string;
  accent: string;
  icon: string;
  blurb: string;
}

export const TOOLS: ToolMeta[] = [
  {
    id: 'reasoning',
    label: 'Visual Reasoning',
    short: 'Reasoning',
    path: '/reasoning',
    accent: 'from-fuchsia-500 to-purple-500',
    icon: '✦',
    blurb: 'Chain-of-thought analysis with a visible thinking pane.',
  },
  {
    id: 'multilingual',
    label: 'Multilingual Describe',
    short: 'Multilingual',
    path: '/multilingual',
    accent: 'from-cyan-400 to-blue-500',
    icon: '🌐',
    blurb: 'Describe any image in 11 languages, streamed live.',
  },
  {
    id: 'document',
    label: 'Document IQ',
    short: 'Document',
    path: '/document',
    accent: 'from-emerald-400 to-teal-500',
    icon: '📄',
    blurb: 'Extract structured JSON from invoices, receipts, IDs.',
  },
  {
    id: 'code',
    label: 'Code Lens',
    short: 'Code',
    path: '/code',
    accent: 'from-amber-400 to-orange-500',
    icon: '⌘',
    blurb: 'Turn a UI screenshot into HTML, React, Vue or Svelte code.',
  },
  {
    id: 'dual',
    label: 'Dual Compare',
    short: 'Compare',
    path: '/dual',
    accent: 'from-rose-400 to-pink-500',
    icon: '⇄',
    blurb: 'Side-by-side reasoning across two images.',
  },
];

export interface HistoryEntry {
  id: string;
  tool: ToolId;
  createdAt: number;
  title: string;
  inputs: {
    question?: string;
    language?: string;
    framework?: string;
    showThinking?: boolean;
    thumbs: string[];
  };
  output: {
    thinking?: string;
    answer: string;
  };
}

export interface StreamHandlers {
  onThinking?: (delta: string) => void;
  onAnswer?: (delta: string) => void;
  onDone?: () => void;
  onError?: (err: Error) => void;
  onFirstByte?: () => void;
}

export type RunStage = 'idle' | 'compressing' | 'uploading' | 'streaming';
