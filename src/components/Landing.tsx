import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, FileCheck2, Bot, Globe2, BarChart3, ArrowRight, CheckCircle2, Star, Layers, Briefcase, GraduationCap } from 'lucide-react';

interface Props {
  onStart: () => void;
  onOpenGuide: () => void;
  onOpenDashboard: () => void;
  onOpenTemplates: () => void;
}

export default function Landing({ onStart, onOpenGuide, onOpenDashboard, onOpenTemplates }: Props) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-200/40 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 bg-white/70 backdrop-blur border border-slate-200 rounded-full px-4 py-1.5 text-xs font-semibold text-indigo-700 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" /> AI Resume Builder · Guaranteed 90–100% ATS Score
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }} className="text-5xl sm:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight">
            The Resume That <br />
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Beats Every ATS.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }} className="mt-6 max-w-2xl mx-auto text-lg text-slate-600">
            SmartCV Pro auto-generates and auto-fixes your resume until it scores <b className="text-emerald-600">90–100% on every major ATS</b> — Workday, Greenhouse, Lever, Taleo, and more. Download is disabled until you pass.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.3 } }} className="mt-8 flex flex-wrap justify-center gap-3">
            <button onClick={onStart} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:scale-[1.02] transition flex items-center gap-2">
              Build My Resume <ArrowRight className="w-5 h-5" />
            </button>
            <button onClick={onOpenGuide} className="bg-white border border-slate-200 text-slate-800 px-8 py-3.5 rounded-2xl font-bold hover:border-slate-300 transition flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" /> Free ATS Checker
            </button>
          </motion.div>
          <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-slate-500">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> No sign-up required</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 500+ ATS-safe templates</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 12 country formats</span>
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AI cover letter</span>
          </div>

          {/* Score mockup */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.4 } }} className="mt-14 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur rounded-3xl border border-slate-200 shadow-2xl shadow-indigo-500/10 p-6 text-left">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-900"><ShieldCheck className="w-4 h-4 text-indigo-600" /> Live ATS Score</div>
                <span className="text-xs font-semibold text-emerald-600">🟢 Excellent</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-6xl font-extrabold bg-gradient-to-br from-emerald-400 to-green-600 bg-clip-text text-transparent">96%</div>
                <div className="flex-1 space-y-1.5">
                  {[
                    { l: 'Keyword Match', p: 100 },
                    { l: 'Experience Quality', p: 90 },
                    { l: 'Format & Structure', p: 100 },
                    { l: 'Grammar & Tone', p: 95 },
                  ].map((x, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 w-32">{x.l}</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${x.p}%` }} transition={{ delay: 0.7 + i * 0.1 }} className="h-full bg-gradient-to-r from-emerald-400 to-green-600" />
                      </div>
                      <span className="text-slate-500 tabular-nums">{x.p}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <h2 className="text-4xl font-bold text-center text-slate-900 mb-2">Why SmartCV Pro Beats the Rest</h2>
        <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">A custom 10-parameter ATS engine, real-time auto-fix loops, and AI-rewritten bullets — all engineered to clear the screening gate every time.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { i: <ShieldCheck className="w-6 h-6" />, t: '10-Parameter ATS Engine', d: 'Custom built scoring across keywords, format, headings, contact info, experience quality, dates, length, and grammar.' },
            { i: <Zap className="w-6 h-6" />, t: 'Auto-Fix Until 90%+', d: 'If your score is below 90%, the engine rewrites until it passes. Download is gated for your protection.' },
            { i: <Bot className="w-6 h-6" />, t: 'ATS Bot View', d: 'See exactly how an ATS reads your resume — text-only, single column, machine-readable.' },
            { i: <Globe2 className="w-6 h-6" />, t: '12 Country Formats', d: 'USA, UK, Germany, France, Australia, India, UAE, Singapore, Malaysia, Japan, Canada and International.' },
            { i: <Layers className="w-6 h-6" />, t: '500+ Designer Templates', d: 'Massive library across 20 industries × 12 countries × 15 layouts × 30 colors — every template ATS-scored. Filter, preview, apply instantly.' },
            { i: <FileCheck2 className="w-6 h-6" />, t: 'Smart CV Upload', d: 'Drop a PDF or DOCX — we fully scrape name, contact, experience, education, skills, projects and certs into the editor.' },
          ].map((f, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-lg hover:-translate-y-0.5 transition">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white flex items-center justify-center mb-3">{f.i}</div>
              <h3 className="font-bold text-slate-900 mb-1">{f.t}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{f.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: 1, t: 'Paste Job Description', d: 'We extract every critical keyword you must include.', i: <Briefcase /> },
              { n: 2, t: 'Add Your Details', d: 'Upload your CV, paste a LinkedIn URL, or fill a quick form.', i: <GraduationCap /> },
              { n: 3, t: 'AI Generates + Auto-Fixes', d: 'Resume is built, scored, and auto-fixed until it hits 90–100%.', i: <Sparkles /> },
            ].map((s) => (
              <div key={s.n} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-bold">{s.n}</span>
                  <span className="opacity-70">{s.i}</span>
                </div>
                <h3 className="font-bold text-xl mb-1">{s.t}</h3>
                <p className="text-sm text-white/70">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick links */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-4">
          <QuickCard icon={<Layers />} title="Browse Templates" desc="15+ ATS-safe designs for every industry & country." onClick={onOpenTemplates} />
          <QuickCard icon={<BarChart3 />} title="My Dashboard" desc="Track resumes, ATS scores, and job applications." onClick={onOpenDashboard} />
          <QuickCard icon={<ShieldCheck />} title="ATS Guide" desc="Learn how ATS works and avoid the top 10 mistakes." onClick={onOpenGuide} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { n: 'Priya S.', r: 'Software Engineer · India', q: 'Went from 64% to 98% ATS in one click. Got 3 interviews in a week.' },
            { n: 'Markus K.', r: 'Product Manager · Germany', q: 'The German Lebenslauf template + auto-fix is a game changer.' },
            { n: 'Sara H.', r: 'Marketing Lead · UAE', q: 'Finally a tool that proves my resume passes ATS before I apply.' },
          ].map((t) => (
            <div key={t.n} className="bg-white rounded-2xl border border-slate-200 p-6">
              <div className="flex text-amber-400 mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}</div>
              <p className="text-slate-700 italic">“{t.q}”</p>
              <div className="mt-3 text-xs"><b className="text-slate-900">{t.n}</b> <span className="text-slate-500">— {t.r}</span></div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white"><Sparkles className="w-4 h-4" /></div>
            <span className="font-bold text-slate-900">SmartCV Pro</span>
            <span>· AI Resume Builder with Guaranteed ATS Score</span>
          </div>
          <div>© {new Date().getFullYear()} SmartCV Pro · Built for job seekers worldwide</div>
        </div>
      </footer>
    </div>
  );
}

function QuickCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition">
      <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center mb-3">{icon}</div>
      <h3 className="font-bold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-600">{desc}</p>
      <div className="mt-3 text-xs font-semibold text-indigo-700 flex items-center gap-1">Open <ArrowRight className="w-3 h-3" /></div>
    </button>
  );
}
