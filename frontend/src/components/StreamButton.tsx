interface Props {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  onCancel?: () => void;
  label: string;
  loadingLabel?: string;
}

export default function StreamButton({
  loading,
  disabled,
  onClick,
  onCancel,
  label,
  loadingLabel = 'Streaming…',
}: Props) {
  if (loading) {
    return (
      <button
        onClick={onCancel}
        className="w-full relative overflow-hidden rounded-xl px-5 py-3 font-semibold text-white border border-white/15 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-3"
      >
        <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <span>{loadingLabel}</span>
        <span className="ml-2 text-xs text-slate-400">click to cancel</span>
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="btn-primary w-full text-base"
    >
      {label}
    </button>
  );
}
