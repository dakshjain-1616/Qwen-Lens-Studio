import type { StreamHandlers } from './types';

export interface Health {
  status: string;
  model: string;
  mock_mode: boolean;
}

export async function getHealth(): Promise<Health> {
  const r = await fetch('/api/health');
  if (!r.ok) throw new Error(`health ${r.status}`);
  return r.json();
}

/**
 * Stream a multipart POST to an SSE endpoint.
 * Handles two frame shapes produced by the FastAPI backend:
 *   1. Plain deltas:      `data: "chunk"\n\n`
 *   2. Named events:      `event: thinking|answer|done\ndata: "chunk"\n\n`
 */
export async function streamForm(
  url: string,
  formData: FormData,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const dbg = (...a: unknown[]) => {
    if ((window as unknown as { DEBUG?: boolean }).DEBUG) console.debug('[sse]', ...a);
  };
  try {
    const res = await fetch(url, { method: 'POST', body: formData, signal });
    if (!res.ok || !res.body) {
      let body = '';
      try { body = (await res.text()).slice(0, 300); } catch {}
      throw new Error(`HTTP ${res.status} ${res.statusText}${body ? ` — ${body}` : ''}`);
    }
    handlers.onFirstByte?.();
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      dbg('chunk', value?.byteLength);

      let sep: number;
      while ((sep = buf.indexOf('\n\n')) !== -1) {
        const raw = buf.slice(0, sep);
        buf = buf.slice(sep + 2);
        if (!raw.trim()) continue;

        let event = 'message';
        const dataLines: string[] = [];
        for (const line of raw.split('\n')) {
          if (line.startsWith('event:')) event = line.slice(6).trim();
          else if (line.startsWith('data:')) dataLines.push(line.slice(5).trim());
        }
        if (dataLines.length === 0) continue;
        const dataStr = dataLines.join('\n');
        let payload: unknown;
        try {
          payload = JSON.parse(dataStr);
        } catch {
          payload = dataStr;
        }
        const delta = typeof payload === 'string' ? payload : String(payload ?? '');
        dbg('frame', event, delta.length);

        if (event === 'thinking') handlers.onThinking?.(delta);
        else if (event === 'answer') handlers.onAnswer?.(delta);
        else if (event === 'done') handlers.onDone?.();
        else handlers.onAnswer?.(delta);
      }
    }
    handlers.onDone?.();
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
  }
}

/**
 * Downscale + recompress an image file before upload.
 * Phone photos are often 5–10 MB — base64 then adds 33%, and OpenRouter must re-download
 * and re-decode. This keeps quality high for vision while cutting wire size 5–20×.
 */
export async function compressImage(
  file: File,
  maxDim = 1280,
  quality = 0.85
): Promise<File> {
  // Skip small images and non-JPEG/PNG/webp sources
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  if (file.size < 300 * 1024) return file;
  try {
    const src = await readDataUrl(file);
    const img = await decodeImage(src);
    if (img.width <= maxDim && img.height <= maxDim && file.size < 1.5 * 1024 * 1024) {
      return file;
    }
    const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * ratio);
    const h = Math.round(img.height * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((r) =>
      canvas.toBlob(r, 'image/jpeg', quality)
    );
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', {
      type: 'image/jpeg',
    });
  } catch {
    return file;
  }
}

function readDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
}

function decodeImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('image decode'));
    i.src = src;
  });
}

/** Downscale an image file to a ~128px-wide JPEG data URL for history thumbnails. */
export async function makeThumbnail(file: File, maxW = 128): Promise<string> {
  const src = await new Promise<string>((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error('image decode'));
    i.src = src;
  });
  const ratio = Math.min(1, maxW / img.width);
  const w = Math.round(img.width * ratio);
  const h = Math.round(img.height * ratio);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.7);
}
