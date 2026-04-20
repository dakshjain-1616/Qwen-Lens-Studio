export default function AuroraBg() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[60rem] h-[60rem] rounded-full bg-fuchsia-600/20 blur-[120px] animate-aurora-1" />
      <div className="absolute top-1/3 -right-40 w-[50rem] h-[50rem] rounded-full bg-cyan-500/20 blur-[120px] animate-aurora-2" />
      <div className="absolute -bottom-40 left-1/4 w-[45rem] h-[45rem] rounded-full bg-indigo-600/20 blur-[120px] animate-aurora-3" />
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
          maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
        }}
      />
    </div>
  );
}
