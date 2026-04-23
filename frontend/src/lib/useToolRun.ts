import { useCallback, useRef, useState } from 'react';
import { compressImage, makeThumbnail, streamForm } from './api';
export { compressImage };
import { makeId } from './history';
import { useAppStore } from '../store/useAppStore';
import type { HistoryEntry, RunStage, ToolId } from './types';
import { getCached, setCached } from './cache';
import { getConfig } from './config';

interface Options {
  url: string;
  tool: ToolId;
  supportsThinking?: boolean;
}

type RunMeta = {
  question?: string;
  language?: string;
  framework?: string;
  showThinking?: boolean;
  thumbs?: string[];
  title: string;
};

export function useToolRun({ url, tool, supportsThinking }: Options) {
  const [thinking, setThinking] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<RunStage>('idle');
  const cancelRef = useRef<(() => void) | null>(null);
  const push = useAppStore((s) => s.pushHistory);

  const reset = useCallback(() => {
    setThinking('');
    setAnswer('');
    setError(null);
  }, []);

  const begin = useCallback(() => {
    reset();
    setLoading(true);
    setStage('compressing');
  }, [reset]);

  const run = useCallback(
    async (formData: FormData, files: File[], meta: RunMeta) => {
      setLoading(true);
      setStage('uploading');

      const cacheEnabled = getConfig().cacheEnabled !== false; // default on
      const cacheExtra = `tool=${tool}`;

      let thinkingAcc = '';
      let answerAcc = '';
      let servedFromCache = false;

      if (cacheEnabled) {
        const hit = await getCached(formData, cacheExtra);
        if (hit) {
          servedFromCache = true;
          thinkingAcc = hit.thinking ?? '';
          answerAcc = hit.answer;
          setThinking(thinkingAcc);
          setAnswer(answerAcc);
          setStage('idle');
          setLoading(false);
        }
      }

      if (!servedFromCache) {
        let finished = false;
        await new Promise<void>((resolve) => {
          const handle = streamForm(url, formData, {
            onFirstByte: () => setStage('streaming'),
            onThinking: (d) => {
              thinkingAcc += d;
              setThinking(thinkingAcc);
            },
            onAnswer: (d) => {
              answerAcc += d;
              setAnswer(answerAcc);
            },
            onError: (e) => {
              setError(`${e.name}: ${e.message}`);
              if (!finished) {
                finished = true;
                resolve();
              }
            },
            onDone: () => {
              if (!finished) {
                finished = true;
                resolve();
              }
            },
          });
          cancelRef.current = handle.cancel;
        });

        cancelRef.current = null;
        setLoading(false);
        setStage('idle');

        if (cacheEnabled && answerAcc && !error) {
          // Fire-and-forget cache write
          void setCached(formData, cacheExtra, {
            tool,
            thinking: thinkingAcc || undefined,
            answer: answerAcc,
          });
        }
      }

      if (answerAcc || thinkingAcc) {
        const thumbs = await Promise.all(
          files.map((f) => makeThumbnail(f).catch(() => ''))
        );
        const entry: HistoryEntry = {
          id: makeId(),
          tool,
          createdAt: Date.now(),
          title: meta.title,
          inputs: {
            question: meta.question,
            language: meta.language,
            framework: meta.framework,
            showThinking: supportsThinking ? meta.showThinking : undefined,
            thumbs: thumbs.filter(Boolean),
          },
          output: {
            thinking: thinkingAcc || undefined,
            answer: answerAcc,
          },
        };
        push(entry);
      }
    },
    [url, tool, push, supportsThinking, error]
  );

  const cancel = useCallback(() => {
    cancelRef.current?.();
    cancelRef.current = null;
    setLoading(false);
    setStage('idle');
  }, []);

  const restoreOutput = useCallback((t: string | undefined, a: string) => {
    setThinking(t ?? '');
    setAnswer(a);
    setError(null);
  }, []);

  return { thinking, answer, error, loading, stage, begin, run, cancel, reset, restoreOutput };
}
