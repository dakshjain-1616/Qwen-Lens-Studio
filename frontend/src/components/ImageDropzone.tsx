import { useCallback, useEffect, useRef, useState } from 'react';
import { makeThumbnail } from '../lib/api';

interface Props {
  label?: string;
  file: File | null;
  previewOverride?: string | null;
  onChange: (file: File | null) => void;
  compact?: boolean;
}

export default function ImageDropzone({
  label = 'Drop image, click, or paste',
  file,
  previewOverride,
  onChange,
  compact,
}: Props) {
  const [preview, setPreview] = useState<string | null>(previewOverride ?? null);
  const [dragging, setDragging] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (previewOverride !== undefined) setPreview(previewOverride);
  }, [previewOverride]);

  useEffect(() => {
    if (!file) {
      if (!previewOverride) setPreview(null);
      return;
    }
    let cancelled = false;
    // Immediate blob URL so something paints without waiting for decode
    const instant = URL.createObjectURL(file);
    setPreview(instant);
    // Then replace with a small downscaled data URL so the big blob can be freed
    makeThumbnail(file, 640)
      .then((thumb) => {
        if (!cancelled) {
          setPreview(thumb);
          URL.revokeObjectURL(instant);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      URL.revokeObjectURL(instant);
    };
  }, [file, previewOverride]);

  const accept = useCallback(
    (f: File | undefined | null) => {
      if (!f) return;
      if (!f.type.startsWith('image/')) return;
      onChange(f);
    },
    [onChange]
  );

  useEffect(() => {
    if (!focused) return;
    const handler = (e: ClipboardEvent) => {
      const item = [...(e.clipboardData?.items ?? [])].find((i) =>
        i.type.startsWith('image/')
      );
      if (item) {
        const f = item.getAsFile();
        if (f) accept(f);
      }
    };
    window.addEventListener('paste', handler);
    return () => window.removeEventListener('paste', handler);
  }, [focused, accept]);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    accept(e.dataTransfer.files?.[0]);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      ref={boxRef}
      tabIndex={0}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={`group relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden
        ${compact ? 'min-h-[160px]' : 'min-h-[240px]'}
        ${
          dragging
            ? 'border-fuchsia-400 bg-fuchsia-400/10'
            : preview
            ? 'border-white/15 bg-white/[0.03]'
            : 'border-white/15 bg-white/[0.02] hover:border-cyan-400/50 hover:bg-white/[0.04]'
        }
        ${focused ? 'ring-2 ring-fuchsia-400/40' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => accept(e.target.files?.[0])}
      />
      {preview ? (
        <>
          <img
            src={preview}
            className="absolute inset-0 w-full h-full object-contain bg-black/40"
            alt="preview"
          />
          <button
            type="button"
            onClick={clear}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-rose-500 text-white flex items-center justify-center text-sm backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="remove image"
          >
            ✕
          </button>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl mb-3 group-hover:scale-110 transition-transform">
            🖼️
          </div>
          <div className="font-medium text-slate-200">{label}</div>
          <div className="text-xs text-slate-500 mt-1">
            PNG, JPG, WebP · max 10MB
          </div>
          <div className="text-[10px] uppercase tracking-widest text-slate-600 mt-3">
            Click · Drop · Paste (⌘V)
          </div>
        </div>
      )}
    </div>
  );
}
