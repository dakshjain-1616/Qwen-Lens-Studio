export default function EmptyState({
  icon,
  title,
  hint,
}: {
  icon: string;
  title: string;
  hint: string;
}) {
  return (
    <div className="h-full min-h-[320px] flex flex-col items-center justify-center text-center px-8">
      <div className="w-20 h-20 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-4xl mb-4">
        {icon}
      </div>
      <div className="font-semibold text-slate-200 text-lg">{title}</div>
      <div className="text-sm text-slate-500 mt-1 max-w-xs">{hint}</div>
    </div>
  );
}
