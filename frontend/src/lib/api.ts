/**
 * API client for Qwen Lens Studio
 * Handles SSE streaming, image compression, thumbnails, and health checks.
 */

import { getHeaders } from './config';
import type { StreamHandlers } from './types';

export type Health = {
  status: string;
  model: string;
  mock_mode: boolean;
  has_env_key: boolean;
};

export async function getHealth(): Promise<Health> {
  const headers = getHeaders();
  const response = await fetch('/api/health', { headers });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  const data = await response.json();
  return {
    status: data.status ?? 'unknown',
    model: data.model ?? '',
    mock_mode: !!data.mock_mode,
    has_env_key: !!data.has_env_key,
  };
}

// Alias for SettingsModal compatibility
export const checkHealth = getHealth;

export function streamForm(
  url: string,
  formData: FormData,
  handlers: StreamHandlers,
  externalSignal?: AbortSignal
): { cancel: () => void } {
  const controller = new AbortController();
  const signal = controller.signal;

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', () => controller.abort(), { once: true });
    }
  }

  let gotFirstByte = false;

  (async () => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        headers: getHeaders(),
        signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status}: ${text || response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const raw = line.slice(5).trim();
          if (!raw) continue;

          if (!gotFirstByte) {
            gotFirstByte = true;
            handlers.onFirstByte?.();
          }

          if (raw === '[DONE]') {
            handlers.onDone?.();
            return;
          }

          try {
            const chunk = JSON.parse(raw);
            if (chunk.error) {
              handlers.onError?.(new Error(String(chunk.error)));
              continue;
            }
            if (typeof chunk.thinking === 'string' && chunk.thinking) {
              handlers.onThinking?.(chunk.thinking);
            }
            if (typeof chunk.content === 'string' && chunk.content) {
              handlers.onAnswer?.(chunk.content);
            }
            if (chunk.done === true || chunk.is_complete === true) {
              handlers.onDone?.();
              return;
            }
          } catch {
            // ignore malformed SSE line
          }
        }
      }

      handlers.onDone?.();
    } catch (err) {
      if ((err as Error).name === 'AbortError') return;
      handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return {
    cancel: () => controller.abort(),
  };
}

function loadImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve(img);
      // Note: URL revoked after consumer done; but we release here since canvas copies pixels.
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export async function compressImage(
  file: File,
  maxDim: number = 1280,
  quality: number = 0.85
): Promise<File> {
  // Skip compression for small files
  if (file.size < 300 * 1024) {
    return file;
  }

  try {
    const img = await loadImage(file);
    let { width, height } = img;

    if (width <= maxDim && height <= maxDim) {
      return file;
    }

    const ratio = Math.min(maxDim / width, maxDim / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), 'image/jpeg', quality)
    );
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  }
}

export async function makeThumbnail(
  file: File | Blob,
  size: number = 128
): Promise<string> {
  const img = await loadImage(file);
  const ratio = Math.min(size / img.width, size / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.7);
}

// --- Legacy helpers retained for batch/non-stream use cases ---

export interface StreamChunk {
  content: string;
  thinking: string;
  is_thinking?: boolean;
  is_complete?: boolean;
  error: string | null;
}

export async function runToolNonStreaming(
  endpoint: string,
  formData: FormData,
  abortSignal?: AbortSignal
): Promise<{ content: string; thinking: string; error?: string }> {
  const headers = getHeaders();
  let content = '';
  let thinking = '';
  let error: string | undefined;

  try {
    const response = await fetch(endpoint.startsWith('/') ? endpoint : `/api${endpoint}`, {
      method: 'POST',
      body: formData,
      headers,
      signal: abortSignal,
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return { content: '', thinking: '', error: `HTTP ${response.status}: ${text || response.statusText}` };
    }

    const reader = response.body?.getReader();
    if (!reader) return { content: '', thinking: '', error: 'No response body' };

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (!raw) continue;
        if (raw === '[DONE]') return { content, thinking, error };
        try {
          const chunk = JSON.parse(raw);
          if (chunk.error) error = String(chunk.error);
          if (chunk.content) content += chunk.content;
          if (chunk.thinking) thinking += chunk.thinking;
          if (chunk.done === true || chunk.is_complete === true) {
            return { content, thinking, error };
          }
        } catch {
          // ignore
        }
      }
    }

    return { content, thinking, error };
  } catch (err) {
    return {
      content,
      thinking,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
