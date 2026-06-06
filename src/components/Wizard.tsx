import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, FileUp, Pencil, Link2, Sparkles, X, Globe2 } from 'lucide-react';
import type { Country, ResumeData } from '../types';
import { extractKeywords, extractJobTitle } from '../lib/keywords';
import { scoreResume } from '../lib/atsEngine';
import { generateResume as generateRuleBased } from '../lib/aiGenerator';
import * as groq from '../lib/groq';
import { emptyResume, SAMPLE_JOB_DESCRIPTION } from '../lib/sampleData';
import { COUNTRY_FLAGS } from '../lib/format';
import { parseCv } from '../lib/cvParser';

interface Props {
  onComplete: (r: ResumeData) => void;
  onCancel: () => void;
}

const COUNTRIES: Country[] = ['USA','UK','Germany','France','Australia','Canada','India','UAE','Singapore','Malaysia','Japan','International'];

export default function Wizard({ onComplete, onCancel }: Props) {
  const [step, setStep] = useState(0);
  const [jd, setJd] = useState('');
  const [method, setMethod] = useState<'upload' | 'manual' | 'linkedin'>('manual');
  const [parsedResume, setParsedResume] = useState<ResumeData | null>(null);
  const [oldScore, setOldScore] = useState<number | null>(null);
  const [country, setCountry] = useState<Country>('USA');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [yearsExp, setYearsExp] = useState('3');

  const keywords = useMemo(() => (jd.trim() ? extractKeywords(jd) : null), [jd]);
  const jobTitle = useMemo(() => (jd.trim() ? extractJobTitle(jd) : ''), [jd]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    setUploadedFileName(file.name);
    try {
      const { resume } = await parseCv(file);
      // Carry over manual fields if filled
      if (name) resume.contact.fullName = name;
      if (email) resume.contact.email = email;
      if (phone) resume.contact.phone = phone;
      if (location) resume.contact.location = location;
      if (linkedin) resume.contact.linkedin = linkedin;
      resume.country = country;
      resume.jobDescription = jd;
      resume.targetJobTitle = jobTitle || resume.targetJobTitle || 'Professional';
      setParsedResume(resume);
      // Score the parsed (pre-optimization) resume
      if (keywords && (resume.contact.fullName || resume.experience.length > 0)) {
        const r = scoreResume(resume, keywords);
        setOldScore(r.percent);
      }
    } catch (err) {
      console.error(err);
      setUploadError('Could not parse this file. Try a different PDF/DOCX or paste your details manually.');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    await new Promise((res) => setTimeout(res, 400));
    let base: ResumeData;
    let useGroq = false;
    (() => { try { useGroq = !!localStorage.getItem('groq_api_key'); } catch {} })();

    if (parsedResume && method === 'upload') {
      base = JSON.parse(JSON.stringify(parsedResume));
      base.country = country;
      base.jobDescription = jd;
      base.targetJobTitle = jobTitle || base.targetJobTitle || 'Professional';
      base.title = `${base.contact.fullName || 'Candidate'} — ${jobTitle || 'Resume'}`;
    } else {
      base = emptyResume();
      base.contact.fullName = name || 'Your Name';
      base.contact.email = email || 'your.name@gmail.com';
      base.contact.phone = phone || '+1 555 555 5555';
      base.contact.location = location || 'City, Country';
      base.contact.linkedin = linkedin || `linkedin.com/in/${(name || 'your-name').toLowerCase().replace(/\s+/g, '-')}`;
      base.country = country;
      base.targetJobTitle = jobTitle || 'Professional';
      base.jobDescription = jd;
      base.title = `${jobTitle || 'Resume'} — ${country}`;

      const years = parseInt(yearsExp, 10) || 3;
      const now = new Date();
      const startRecent = `${now.getFullYear() - Math.max(1, Math.floor(years / 2))}-01`;
      const endPrev = `${now.getFullYear() - Math.max(1, Math.floor(years / 2))}-01`;
      const startPrev = `${now.getFullYear() - years}-06`;
      base.experience = [
        { id: 'e1', title: jobTitle || 'Professional', company: 'Recent Company', location: base.contact.location, startDate: startRecent, endDate: 'Present', current: true, bullets: [] },
        ...(years > 2 ? [{ id: 'e2', title: jobTitle || 'Professional', company: 'Previous Company', location: base.contact.location, startDate: startPrev, endDate: endPrev, current: false, bullets: [] }] : []),
      ];
      base.education = [{ id: 'ed1', degree: "Bachelor's Degree", school: 'University', location: base.contact.location, startDate: `${now.getFullYear() - years - 4}-09`, endDate: `${now.getFullYear() - years}-05` }];
    }

    try {
      if (useGroq && keywords) {
        const allKw = [...keywords.critical, ...keywords.important];
        const expInput = base.experience.map(e => ({
          title: e.title, company: e.company, years: e.startDate || '', bullets: e.bullets,
        }));
        const result = await groq.generateResume(
          base.targetJobTitle || 'Professional',
          base.jobDescription || '',
          allKw,
          base.contact.fullName,
          expInput,
        );
        if (result.summary) base.summary = result.summary;
        if (result.skills.length) {
          base.skills = {
            technical: result.skills.filter(s => !['leadership','communication','teamwork','problem-solving','adaptability','creativity'].includes(s.toLowerCase())).slice(0, 15),
            soft: result.skills.filter(s => ['leadership','communication','teamwork','problem-solving','adaptability','creativity'].includes(s.toLowerCase())).slice(0, 8),
            tools: base.skills.tools, languages: base.skills.languages,
          };
        }
        result.bullets.forEach((bullets, i) => {
          if (bullets?.length && base.experience[i]) base.experience[i].bullets = bullets.slice(0, 6);
        });
      } else {
        const generated = generateRuleBased(base, keywords!);
        base = generated;
      }
    } catch {
      const generated = generateRuleBased(base, keywords!);
      base = generated;
    }

    setGenerating(false);
    onComplete(base);
  };

  const useSampleJD = () => setJd(SAMPLE_JOB_DESCRIPTION);

  const canNext = step === 0 ? jd.trim().length > 30 : true;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-start sm:items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl my-4 sm:my-8 overflow-hidden"
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shrink-0"><Sparkles className="w-5 h-5" /></div>
            <div className="min-w-0">
              <div className="font-bold text-slate-900 text-sm sm:text-base truncate">Build Your ATS-Optimized Resume</div>
              <div className="text-xs text-slate-500">Step {step + 1} of 3</div>
            </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-100 shrink-0" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        {/* Progress */}
        <div className="px-6 pt-4">
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600" animate={{ width: `${((step + 1) / 3) * 100}%` }} />
          </div>
        </div>

        <div className="p-4 sm:p-6 min-h-[380px] sm:min-h-[420px]">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Paste the Job Description</h2>
                <p className="text-sm text-slate-500 mb-3">We'll extract critical keywords your resume MUST contain to score 90%+ on ATS.</p>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={useSampleJD} className="text-xs px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100">Use sample</button>
                </div>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here…"
                  className="w-full h-56 border border-slate-200 rounded-xl p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                {keywords && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <KwGroup title="🔴 Critical Keywords" tone="red" items={keywords.critical} />
                    <KwGroup title="🟠 Important Keywords" tone="orange" items={keywords.important} />
                    <KwGroup title="🟡 Good to Have" tone="yellow" items={keywords.niceToHave} />
                  </div>
                )}
                {jobTitle && <div className="mt-3 text-xs text-slate-600">Detected job title: <span className="font-semibold">{jobTitle}</span></div>}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Your Details</h2>
                <p className="text-sm text-slate-500 mb-4">Choose how you'd like to provide your information.</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                  <MethodCard active={method === 'manual'} onClick={() => { setMethod('manual'); setUploadError(null); }} icon={<Pencil className="w-5 h-5" />} title="Manual Entry" desc="Fill a quick form" />
                  <MethodCard active={method === 'upload'} onClick={() => { setMethod('upload'); setUploadError(null); }} icon={<FileUp className="w-5 h-5" />} title="Upload Old CV" desc="PDF/DOCX/TXT" />
                  <MethodCard active={method === 'linkedin'} onClick={() => { setMethod('linkedin'); setUploadError(null); }} icon={<Link2 className="w-5 h-5" />} title="LinkedIn URL" desc="Auto-import" />
                </div>
                {method === 'manual' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input label="Full Name *" value={name} onChange={setName} placeholder="Alex Morgan" />
                    <Input label="Email *" value={email} onChange={setEmail} placeholder="alex.morgan@gmail.com" />
                    <Input label="Phone (with country code)" value={phone} onChange={setPhone} placeholder="+1 415 555 0142" />
                    <Input label="Location" value={location} onChange={setLocation} placeholder="San Francisco, CA, USA" />
                    <Input label="LinkedIn URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/alexmorgan" />
                    <Input label="Years of Experience" value={yearsExp} onChange={setYearsExp} type="number" />
                  </div>
                )}
                {method === 'upload' && (
                  <div>
                    <label className={`block border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${uploading ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}>
                      <FileUp className={`w-10 h-10 mx-auto mb-2 ${uploading ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
                      <div className="font-semibold text-slate-700">
                        {uploading ? 'Parsing your CV…' : 'Drop your CV or click to upload'}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">PDF, DOCX, TXT — fully scraped & auto-filled</div>
                      <input type="file" accept=".pdf,.docx,.txt" className="hidden" disabled={uploading} onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
                    </label>

                    {uploadError && (
                      <div className="mt-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{uploadError}</div>
                    )}

                    {parsedResume && !uploading && (
                      <div className="mt-4 bg-gradient-to-br from-emerald-50 to-indigo-50 border border-emerald-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-bold text-emerald-800 flex items-center gap-1.5">✅ CV Parsed Successfully</div>
                          {uploadedFileName && <span className="text-xs text-slate-500 truncate ml-2">{uploadedFileName}</span>}
                        </div>

                        {/* Contact */}
                        <div className="bg-white/70 rounded-lg p-2.5 mb-2">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Contact</div>
                          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-slate-700">
                            <div><b>Name:</b> {parsedResume.contact.fullName || <span className="text-red-500">not detected</span>}</div>
                            <div><b>Email:</b> {parsedResume.contact.email || <span className="text-red-500">not detected</span>}</div>
                            <div><b>Phone:</b> {parsedResume.contact.phone || <span className="text-red-500">not detected</span>}</div>
                            <div><b>Location:</b> {parsedResume.contact.location || <span className="text-red-500">not detected</span>}</div>
                            <div className="truncate"><b>LinkedIn:</b> {parsedResume.contact.linkedin || '—'}</div>
                            <div className="truncate"><b>GitHub:</b> {parsedResume.contact.github || '—'}</div>
                          </div>
                        </div>

                        {/* Experience preview */}
                        {parsedResume.experience.length > 0 && (
                          <div className="bg-white/70 rounded-lg p-2.5 mb-2">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Experience — {parsedResume.experience.length} role{parsedResume.experience.length === 1 ? '' : 's'}</div>
                            <div className="space-y-1.5 text-xs">
                              {parsedResume.experience.slice(0, 3).map((e) => (
                                <div key={e.id}>
                                  <div className="font-semibold text-slate-800">{e.title} <span className="font-normal text-slate-500">— {e.company || '(no company)'}</span></div>
                                  <div className="text-[10px] text-slate-500">{e.startDate} → {e.endDate} · {e.bullets.length} bullet{e.bullets.length === 1 ? '' : 's'}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Education + Skills row */}
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          {parsedResume.education.length > 0 && (
                            <div className="bg-white/70 rounded-lg p-2.5">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Education — {parsedResume.education.length}</div>
                              <div className="text-xs space-y-1">
                                {parsedResume.education.slice(0, 2).map((e) => (
                                  <div key={e.id} className="truncate"><b className="font-semibold">{e.degree}</b> <span className="text-slate-500">— {e.school}</span></div>
                                ))}
                              </div>
                            </div>
                          )}
                          <div className="bg-white/70 rounded-lg p-2.5">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                              Skills — {parsedResume.skills.technical.length + parsedResume.skills.soft.length + parsedResume.skills.tools.length}
                            </div>
                            <div className="text-[11px] text-slate-700 line-clamp-2">
                              {[...parsedResume.skills.technical, ...parsedResume.skills.tools, ...parsedResume.skills.soft].slice(0, 12).join(' · ') || <span className="text-slate-400">none found</span>}
                            </div>
                          </div>
                        </div>

                        {(parsedResume.projects.length > 0 || parsedResume.certifications.length > 0) && (
                          <div className="text-xs text-slate-600 mb-2">
                            <b>{parsedResume.projects.length}</b> projects · <b>{parsedResume.certifications.length}</b> certifications detected
                          </div>
                        )}

                        {oldScore !== null && (
                          <div className="mt-2 pt-2 border-t border-emerald-200 text-sm flex items-center justify-between">
                            <div>Current ATS: <span className="font-bold text-red-600">{oldScore}%</span></div>
                            <div className="text-emerald-700 font-semibold">→ After AI: 95%+ guaranteed</div>
                          </div>
                        )}
                        <div className="mt-2 text-[11px] text-slate-500">💡 All this data will pre-fill the editor. If something looks off, you can fix it manually after generation.</div>
                      </div>
                    )}
                  </div>
                )}
                {method === 'linkedin' && (
                  <div>
                    <Input label="LinkedIn Profile URL" value={linkedin} onChange={setLinkedin} placeholder="linkedin.com/in/your-handle" />
                    <p className="text-xs text-slate-500 mt-2">📌 Demo mode: We'll seed a structure from your URL. Edit details after generation.</p>
                  </div>
                )}
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <h2 className="text-xl font-bold text-slate-900 mb-1">Choose Country Format</h2>
                <p className="text-sm text-slate-500 mb-4">Dates, sections, and tone will be adapted for your target market.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                  {COUNTRIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCountry(c)}
                      className={`border rounded-xl p-3 text-center transition ${country === c ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <div className="text-2xl mb-1">{COUNTRY_FLAGS[c]}</div>
                      <div className="text-xs font-semibold">{c}</div>
                    </button>
                  ))}
                </div>
                <div className="mt-6 bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-900 flex items-start gap-2">
                  <Globe2 className="w-4 h-4 mt-0.5" />
                  <div>
                    Your resume will use <b>{country}</b> date and naming conventions. We auto-fix until ATS ≥ 95% — guaranteed.
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="text-slate-600 font-medium px-4 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-40 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          {step < 2 ? (
            <button
              onClick={() => canNext && setStep((s) => s + 1)}
              disabled={!canNext}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:shadow-lg flex items-center gap-1 disabled:opacity-50"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold px-5 py-2.5 rounded-xl shadow hover:shadow-lg flex items-center gap-1 disabled:opacity-60"
            >
              <Sparkles className="w-4 h-4" /> {generating ? 'Generating ATS-Optimized Resume…' : 'Generate Resume'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function KwGroup({ title, items, tone }: { title: string; items: string[]; tone: 'red' | 'orange' | 'yellow' }) {
  const map = {
    red: 'bg-red-50 border-red-200 text-red-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  } as const;
  return (
    <div className={`rounded-xl p-3 border ${map[tone]}`}>
      <div className="text-xs font-bold mb-2">{title}</div>
      <div className="flex flex-wrap gap-1">
        {items.length === 0 && <span className="text-xs italic opacity-60">None detected</span>}
        {items.map((k) => (
          <span key={k} className="bg-white/70 backdrop-blur px-2 py-0.5 rounded-md text-xs font-medium">{k}</span>
        ))}
      </div>
    </div>
  );
}

function MethodCard({ active, onClick, icon, title, desc }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <button
      onClick={onClick}
      className={`text-left border rounded-2xl p-4 transition ${active ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-slate-300'}`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${active ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>{icon}</div>
      <div className="font-semibold text-slate-900 text-sm">{title}</div>
      <div className="text-xs text-slate-500">{desc}</div>
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-slate-700 block mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </label>
  );
}
