import { useCallback, useRef, useState } from 'react';
import { compressImage, makeThumbnail, streamForm } from './api';
export { compressImage };
import { makeId } from './history';
import { useAppStore } from '../store/useAppStore';
import type { HistoryEntry, RunStage, ToolId } from './types';

interface Options {
  url: string;
  tool: ToolId;
  supportsThinking?: boolean;
}

export function useToolRun({ url, tool, supportsThinking }: Options) {
  const [thinking, setThinking] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<RunStage>('idle');
  const controllerRef = useRef<AbortController | null>(null);
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
    async (formData: FormData, files: File[], meta: HistoryEntry['inputs'] & { title: string }) => {
      setLoading(true);
      setStage('uploading');
      const controller = new AbortController();
      controllerRef.current = controller;

      let thinkingAcc = '';
      let answerAcc = '';

      await streamForm(
        url,
        formData,
        {
          onFirstByte: () => setStage('streaming'),
          onThinking: (d) => {
            thinkingAcc += d;
            setThinking(thinkingAcc);
          },
          onAnswer: (d) => {
            answerAcc += d;
            setAnswer(answerAcc);
          },
          onError: (e) => setError(`${e.name}: ${e.message}`),
          onDone: () => {},
        },
        controller.signal
      );

      setLoading(false);
      setStage('idle');

      if (answerAcc || thinkingAcc) {
        const thumbs = await Promise.all(files.map((f) => makeThumbnail(f).catch(() => '')));
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
    [url, tool, push, reset, supportsThinking]
  );

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
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
