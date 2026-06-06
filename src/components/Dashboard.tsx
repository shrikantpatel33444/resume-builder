import { useMemo, useState } from 'react';
import { ArrowLeft, FileText, Trash2, Plus, BarChart3, Briefcase } from 'lucide-react';
import type { ResumeData } from '../types';
import { deleteResume, loadResumes, loadScoreHistory, loadApplications, saveApplication, deleteApplication } from '../lib/storage';
import type { JobApplication } from '../lib/storage';
import { extractKeywords } from '../lib/keywords';
import { scoreResume, scoreLevel } from '../lib/atsEngine';
import { cryptoRandomId } from '../lib/aiGenerator';

interface Props {
  onBack: () => void;
  onOpen: (r: ResumeData) => void;
  onNew: () => void;
}

const STATUSES: JobApplication['status'][] = ['wishlist', 'applied', 'interview', 'offer', 'rejected'];
const STATUS_LABELS: Record<JobApplication['status'], string> = {
  wishlist: '⭐ Wishlist',
  applied: '📤 Applied',
  interview: '📞 Interview',
  offer: '🎉 Offer',
  rejected: '❌ Rejected',
};

export default function Dashboard({ onBack, onOpen, onNew }: Props) {
  const [resumes, setResumes] = useState<ResumeData[]>(() => loadResumes());
  const [apps, setApps] = useState<JobApplication[]>(() => loadApplications());
  const [tab, setTab] = useState<'resumes' | 'tracker' | 'analytics'>('resumes');
  const history = useMemo(() => loadScoreHistory(), []);

  // PERF FIX: pre-compute scores once per resume change, not on every render
  const resumeScores = useMemo(() => {
    const map = new Map<string, { percent: number; level: ReturnType<typeof scoreLevel> }>();
    resumes.forEach((r) => {
      const kw = extractKeywords(r.jobDescription);
      const percent = scoreResume(r, kw).percent;
      map.set(r.id, { percent, level: scoreLevel(percent) });
    });
    return map;
  }, [resumes]);

  const avgScore = useMemo(() => {
    if (resumes.length === 0) return 0;
    let sum = 0;
    resumeScores.forEach((s) => { sum += s.percent; });
    return Math.round(sum / resumes.length);
  }, [resumeScores, resumes.length]);

  const remove = (id: string) => { deleteResume(id); setResumes(loadResumes()); };

  const addApp = () => {
    const a: JobApplication = { id: cryptoRandomId(), company: 'New Company', role: 'Role', status: 'wishlist', date: Date.now() };
    saveApplication(a); setApps(loadApplications());
  };
  const updateApp = (a: JobApplication) => { saveApplication(a); setApps(loadApplications()); };
  const removeApp = (id: string) => { deleteApplication(id); setApps(loadApplications()); };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 shrink-0"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="font-bold text-slate-900 text-base sm:text-lg truncate">My Dashboard</h1>
          </div>
          <button onClick={onNew} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-3 sm:px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm shadow flex items-center gap-1 shrink-0">
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">New Resume</span><span className="sm:hidden">New</span>
          </button>
        </div>
        <div className="max-w-7xl mx-auto px-2 sm:px-6 flex gap-1 text-xs font-medium overflow-x-auto">
          {([
            { k: 'resumes', l: 'Resumes', i: <FileText className="w-3.5 h-3.5" /> },
            { k: 'tracker', l: 'Application Tracker', i: <Briefcase className="w-3.5 h-3.5" /> },
            { k: 'analytics', l: 'Analytics', i: <BarChart3 className="w-3.5 h-3.5" /> },
          ] as const).map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)} className={`px-3 py-2 -mb-px border-b-2 flex items-center gap-1.5 whitespace-nowrap ${tab === t.k ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>{t.i}{t.l}</button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {tab === 'resumes' && (
          <div>
            {resumes.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <div className="font-bold text-slate-900 mb-1">No resumes yet</div>
                <p className="text-sm text-slate-500 mb-4">Start by creating your first ATS-optimized resume.</p>
                <button onClick={onNew} className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold">Create Resume</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {resumes.map((r) => {
                  const s = resumeScores.get(r.id) || { percent: 0, level: scoreLevel(0) };
                  const rep = { percent: s.percent };
                  const lvl = s.level;
                  return (
                    <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">{r.title}</div>
                          <div className="text-xs text-slate-500 truncate">{r.targetJobTitle} · {r.country}</div>
                        </div>
                        <span className={`text-xs font-bold ${lvl.color}`}>{rep.percent}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden my-3">
                        <div className={`h-full bg-gradient-to-r ${lvl.bg}`} style={{ width: `${rep.percent}%` }} />
                      </div>
                      <div className="text-xs text-slate-500 mb-3">Updated {new Date(r.updatedAt).toLocaleDateString()}</div>
                      <div className="flex gap-2">
                        <button onClick={() => onOpen(r)} className="flex-1 bg-indigo-600 text-white text-sm font-semibold py-1.5 rounded-lg hover:bg-indigo-700">Open</button>
                        <button onClick={() => remove(r.id)} className="px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'tracker' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-600">Track your applications across the funnel.</p>
              <button onClick={addApp} className="text-sm bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"><Plus className="w-4 h-4" /> Add Application</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {STATUSES.map((s) => (
                <div key={s} className="bg-slate-100 rounded-2xl p-3 min-h-[240px]">
                  <div className="text-xs font-bold text-slate-700 mb-2 flex justify-between"><span>{STATUS_LABELS[s]}</span><span className="text-slate-400">{apps.filter((a) => a.status === s).length}</span></div>
                  <div className="space-y-2">
                    {apps.filter((a) => a.status === s).map((a) => (
                      <div key={a.id} className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm">
                        <input value={a.company} onChange={(e) => updateApp({ ...a, company: e.target.value })} className="font-semibold text-sm w-full focus:outline-none" />
                        <input value={a.role} onChange={(e) => updateApp({ ...a, role: e.target.value })} className="text-xs text-slate-500 w-full focus:outline-none" />
                        <div className="flex items-center justify-between mt-2">
                          <select value={a.status} onChange={(e) => updateApp({ ...a, status: e.target.value as JobApplication['status'] })} className="text-xs bg-slate-50 rounded px-1 py-0.5 border-0 focus:outline-none">
                            {STATUSES.map((st) => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
                          </select>
                          <button onClick={() => removeApp(a.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="space-y-6">
            <div className="grid md:grid-cols-4 gap-3">
              <Stat label="Total Resumes" value={resumes.length} />
              <Stat label="Average ATS Score" value={`${avgScore}%`} />
              <Stat label="Applications" value={apps.length} />
              <Stat label="Interviews" value={apps.filter((a) => a.status === 'interview' || a.status === 'offer').length} />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-6">
              <h3 className="font-bold text-slate-900 mb-3">ATS Score History</h3>
              <ScoreChart points={history.map((h) => h.score)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-3xl font-extrabold text-slate-900 mt-1">{value}</div>
    </div>
  );
}

function ScoreChart({ points }: { points: number[] }) {
  if (points.length === 0) return <div className="text-sm text-slate-500">No history yet — edit a resume to start tracking.</div>;
  const w = 600, h = 160, pad = 20;
  const xs = points.length === 1 ? [pad + (w - 2 * pad) / 2] : points.map((_, i) => pad + (i * (w - 2 * pad)) / (points.length - 1));
  const ys = points.map((p) => h - pad - (p / 100) * (h - 2 * pad));
  const d = xs.map((x, i) => `${i === 0 ? 'M' : 'L'} ${x} ${ys[i]}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      <line x1={pad} y1={h - pad} x2={w - pad} y2={h - pad} stroke="#e2e8f0" />
      <line x1={pad} y1={pad} x2={pad} y2={h - pad} stroke="#e2e8f0" />
      <path d={d} stroke="url(#g)" strokeWidth={2} fill="none" />
      {xs.map((x, i) => <circle key={i} cx={x} cy={ys[i]} r={3} fill="#6366f1" />)}
      <defs>
        <linearGradient id="g" x1="0" x2="1">
          <stop offset="0" stopColor="#6366f1" />
          <stop offset="1" stopColor="#a855f7" />
        </linearGradient>
      </defs>
    </svg>
  );
}
