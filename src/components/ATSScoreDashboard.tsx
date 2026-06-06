import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ATSReport } from '../types';
import { scoreLevel } from '../lib/atsEngine';
import { CheckCircle2, AlertTriangle, ChevronDown, Sparkles, Zap, ShieldCheck, XCircle } from 'lucide-react';

interface Props {
  report: ATSReport;
  onAutoFix: () => void;
  fixing?: boolean;
}

export default function ATSScoreDashboard({ report, onAutoFix, fixing }: Props) {
  const level = scoreLevel(report.percent);
  const [expanded, setExpanded] = useState<string | null>(null);
  const issueCount = report.parameters.reduce((c, p) => c + p.issues.length, 0);
  const [confetti, setConfetti] = useState(false);
  const [displayPercent, setDisplayPercent] = useState(report.percent);
  const prevPercentRef = useRef(report.percent);

  useEffect(() => {
    // Animate counter using a ref-tracked start value (avoids stale closure issues)
    const start = displayPercent;
    const end = report.percent;
    if (start === end) return;
    const dur = 600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      setDisplayPercent(Math.round(start + (end - start) * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.percent]);

  useEffect(() => {
    // BUG FIX: Confetti previously fired on every render while score ≥ 95.
    // Now only fires when CROSSING the 95% threshold (not while staying above).
    if (report.percent >= 95 && prevPercentRef.current < 95) {
      setConfetti(true);
      const t = setTimeout(() => setConfetti(false), 2500);
      prevPercentRef.current = report.percent;
      return () => clearTimeout(t);
    }
    prevPercentRef.current = report.percent;
  }, [report.percent]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 relative overflow-hidden">
      {confetti && <Confetti />}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600" />
          ATS Score Meter
        </h3>
        <span className={`text-xs font-semibold ${level.color}`}>{level.emoji} {level.label}</span>
      </div>

      {/* Big score */}
      <div className="text-center mb-4">
        <motion.div
          key={Math.floor(report.percent / 5)}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className={`text-5xl font-extrabold bg-gradient-to-br ${level.bg} bg-clip-text text-transparent`}
        >
          {displayPercent}%
        </motion.div>
        <div className="text-xs text-slate-500 mt-1">{report.total}/{report.max} points</div>
        <div className="mt-2 h-3 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${level.bg}`}
            initial={{ width: 0 }}
            animate={{ width: `${report.percent}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Parameters */}
      <div className="space-y-1.5 mb-4">
        {report.parameters.map((p) => {
          const pct = Math.round((p.score / p.max) * 100);
          const ok = pct >= 90;
          const isOpen = expanded === p.id;
          return (
            <div key={p.id} className="rounded-lg border border-slate-100 overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : p.id)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-50 text-left"
              >
                {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> : <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />}
                <span className="text-xs font-medium text-slate-700 flex-1 truncate">{p.name}</span>
                <span className="text-xs text-slate-500 tabular-nums">{p.score}/{p.max}</span>
                <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className={`h-full ${ok ? 'bg-emerald-500' : pct >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-slate-50 px-3 py-2 text-xs text-slate-600 space-y-1"
                  >
                    {p.issues.length === 0 && p.suggestions.length === 0 && (
                      <div className="flex gap-1.5 items-center text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Perfect on this parameter.</div>
                    )}
                    {p.issues.map((i, k) => (
                      <div key={k} className="flex gap-1.5"><XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" /><span>{i}</span></div>
                    ))}
                    {p.suggestions.map((s, k) => (
                      <div key={k} className="flex gap-1.5"><Sparkles className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" /><span>{s}</span></div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Action */}
      <div className="mb-3">
        {issueCount > 0 ? (
          <button
            onClick={onAutoFix}
            disabled={fixing}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold py-2.5 rounded-xl shadow hover:shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Zap className={`w-4 h-4 ${fixing ? 'animate-pulse' : ''}`} />
            {fixing ? 'Auto-Fixing…' : `Auto-Fix All Issues (${issueCount})`}
          </button>
        ) : (
          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold py-2.5 rounded-xl text-center text-sm">
            🎯 All ATS criteria met!
          </div>
        )}
      </div>

      {/* Gate status */}
      <div className={`rounded-lg px-3 py-2 text-xs font-medium ${report.percent >= 95 ? 'bg-emerald-50 text-emerald-700' : report.percent >= 90 ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-700'}`}>
        {report.percent >= 95
          ? '🏆 Excellent — All download formats unlocked'
          : report.percent >= 90
            ? '✅ ATS Safe — Download enabled'
            : '⚠️ Score below 90% — Download disabled. Click Auto-Fix.'}
      </div>

      {/* Compatibility */}
      <details className="mt-3">
        <summary className="text-xs font-semibold text-slate-700 cursor-pointer">
          ATS Compatibility: {report.compatibility.filter((c) => c.ok).length}/10 systems
        </summary>
        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
          {report.compatibility.map((c) => (
            <div key={c.system} className="flex items-center gap-1">
              {c.ok ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-red-400" />}
              <span className={c.ok ? 'text-slate-700' : 'text-slate-400'}>{c.system}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

function Confetti() {
  const pieces = Array.from({ length: 30 });
  const colors = ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-sm"
          style={{ background: colors[i % colors.length], left: `${(i * 7) % 100}%`, top: '-10px' }}
          initial={{ y: -20, opacity: 0, rotate: 0 }}
          animate={{ y: 400, opacity: [0, 1, 1, 0], rotate: 360 }}
          transition={{ duration: 2.2, delay: (i % 10) * 0.05, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}
