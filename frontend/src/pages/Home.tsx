import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TOOLS } from '../lib/types';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center pt-8 pb-12"
      >
        <div className="inline-flex items-center gap-2 chip bg-white/5 border border-white/10 text-slate-300 mb-5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
          Powered by Qwen3.6-35B-A3B · 73.4% SWE-Bench
        </div>
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-tight">
          <span className="gradient-text">Qwen Lens Studio</span>
        </h1>
        <p className="text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
          Five multimodal AI tools in one beautiful canvas. Upload an image, watch Qwen
          reason, describe, extract, code, and compare — all streamed live.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((t, i) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i + 0.1, duration: 0.35 }}
          >
            <Link
              to={t.path}
              className="glass glass-hover p-6 block group relative overflow-hidden"
            >
              <div
                className={`absolute -right-12 -top-12 w-40 h-40 rounded-full bg-gradient-to-br ${t.accent} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`}
              />
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.accent} flex items-center justify-center text-xl mb-4 shadow-lg shadow-black/30`}
                >
                  {t.icon}
                </div>
                <div className="font-semibold text-lg">{t.label}</div>
                <div className="text-sm text-slate-400 mt-1">{t.blurb}</div>
                <div className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-300 group-hover:text-white transition-colors">
                  Open <span className="transition-transform group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="text-center text-xs text-slate-500 mt-12">
        All uploads are streamed in memory — nothing is stored on disk.
      </div>
    </div>
  );
}
