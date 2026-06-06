import { useMemo, useState } from 'react';
import { ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle2, Bot, FileText } from 'lucide-react';
import { extractKeywords } from '../lib/keywords';
import { scoreResume } from '../lib/atsEngine';
import { emptyResume } from '../lib/sampleData';
import type { ResumeData } from '../types';

interface Props { onBack: () => void }

const MISTAKES = [
  { t: 'Using tables and columns for content', d: 'ATS often reads multi-column resumes top-to-bottom, mangling the order. Use single-column for the ATS version.' },
  { t: 'Fancy headings like "My Journey"', d: 'Stick to standard headings: Experience, Education, Skills, Certifications.' },
  { t: 'Storing critical info in headers/footers', d: 'Many ATS skip headers/footers entirely. Always put email/phone in the body.' },
  { t: 'Graphical skill bars and charts', d: 'ATS ignores images. Use a comma-separated list of exact keyword skills.' },
  { t: 'Unprofessional email like coolboy123@', d: 'Use firstname.lastname@gmail.com format.' },
  { t: 'Missing dates or inconsistent format', d: 'Use one format throughout (e.g. "Jan 2022 – Present" for USA).' },
  { t: 'Bullet points without metrics', d: 'Every bullet should be Action Verb + Task + Quantified Impact.' },
  { t: 'Keyword stuffing the same word 8 times', d: 'Aim for 2–4 natural mentions per critical keyword.' },
  { t: 'Resume too long (3+ pages for 5 years exp)', d: '0-5 years: 1 page. 5-10 years: 1-2 pages. 10+ years: 2 pages max.' },
  { t: 'Saving as image-based PDF', d: 'Always export text-selectable PDFs (or .docx/.txt) for ATS.' },
];

export default function ATSGuide({ onBack }: Props) {
  const [jd, setJd] = useState('');
  const [resumeText, setResumeText] = useState('');

  const result = useMemo(() => {
    if (!jd.trim() || !resumeText.trim()) return null;
    const kw = extractKeywords(jd);
    // Build a quick synthetic resume from the pasted text for scoring
    const r: ResumeData = {
      ...emptyResume(),
      summary: resumeText.slice(0, 600),
      experience: [{ id: 'x', title: 'Role', company: 'Company', location: 'Anywhere', startDate: '2022-01', endDate: 'Present', current: true, bullets: resumeText.split('\n').filter((l) => l.trim()).slice(0, 8) }],
      contact: { fullName: 'Candidate Name', email: 'candidate@example.com', phone: '+1 555 555 5555', linkedin: 'linkedin.com/in/candidate', location: 'City', github: '', portfolio: '' },
      skills: { technical: kw.critical.slice(0, 6), soft: kw.important.filter((k) => k.length < 30).slice(0, 4), tools: [], languages: [] },
      jobDescription: jd,
      targetJobTitle: 'Target Role',
    };
    return { kw, report: scoreResume(r, kw) };
  }, [jd, resumeText]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="font-bold text-slate-900 text-lg">ATS Education Center</h1>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 space-y-12">
        <section>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">What is an ATS — and why it matters</h2>
          <p className="text-slate-600 max-w-3xl">
            An <b>Applicant Tracking System (ATS)</b> is software used by 99% of Fortune 500 companies to filter resumes before any human sees them. If your resume isn't formatted to be machine-readable, or doesn't match the job's keywords, it gets rejected — no matter how qualified you are.
          </p>
          <div className="grid sm:grid-cols-3 gap-4 mt-6">
            {[
              { n: '75%', l: 'of resumes are rejected by ATS before reaching a recruiter' },
              { n: '6 sec', l: 'is the average time recruiters spend on a resume that passes ATS' },
              { n: '90%+', l: 'ATS score is what SmartCV Pro guarantees on every export' },
            ].map((s) => (
              <div key={s.n} className="bg-white border border-slate-200 rounded-2xl p-5 text-center">
                <div className="text-4xl font-extrabold bg-gradient-to-br from-indigo-500 to-violet-600 bg-clip-text text-transparent">{s.n}</div>
                <div className="text-sm text-slate-600 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3"><Bot className="w-5 h-5 text-indigo-600" /> How an ATS reads your resume</h3>
            <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
              <li>Parses the document into raw text (PDFs with images fail here).</li>
              <li>Splits text into sections via headings ("Experience", "Skills", "Education").</li>
              <li>Extracts structured fields: name, email, dates, employers, job titles.</li>
              <li>Matches text against the job description's keywords.</li>
              <li>Scores you and ranks you against other candidates.</li>
            </ol>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="flex items-center gap-2 font-bold text-slate-900 text-lg mb-3"><FileText className="w-5 h-5 text-indigo-600" /> ATS vs Human view</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900 text-slate-100 rounded-lg p-3 font-mono">
                NAME · EMAIL · PHONE<br />
                SUMMARY<br />
                ...<br />
                EXPERIENCE<br />
                ...<br />
                SKILLS<br />
                React, TypeScript, AWS
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg p-3">
                <div className="font-bold text-slate-900">Alex Morgan</div>
                <div className="text-[10px] text-slate-500">SF · alex@…</div>
                <div className="h-1 bg-indigo-200 w-2/3 my-1 rounded" />
                <div className="text-[10px] text-slate-700">Beautiful design for human reviewers</div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-amber-500" /> Top 10 ATS Mistakes to Avoid</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {MISTAKES.map((m, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl p-4">
                <div className="font-semibold text-slate-900 text-sm mb-1">{i + 1}. {m.t}</div>
                <div className="text-xs text-slate-600">{m.d}</div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-2 flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-indigo-600" /> Free ATS Checker</h2>
          <p className="text-slate-600 mb-4">Paste a job description and your resume text below to get an instant ATS score — no sign-up required.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Job Description</label>
              <textarea value={jd} onChange={(e) => setJd(e.target.value)} className="w-full h-56 border border-slate-200 rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Paste job description here…" />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Your Resume (plain text)</label>
              <textarea value={resumeText} onChange={(e) => setResumeText(e.target.value)} className="w-full h-56 border border-slate-200 rounded-xl p-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Paste your resume text here…" />
            </div>
          </div>
          {result && (
            <div className="mt-5 bg-white border border-slate-200 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="font-bold text-slate-900">Your ATS Score</div>
                <div className={`font-bold text-2xl ${result.report.percent >= 90 ? 'text-emerald-600' : result.report.percent >= 70 ? 'text-amber-600' : 'text-red-600'}`}>{result.report.percent}%</div>
              </div>
              <div className="grid sm:grid-cols-2 gap-1.5">
                {result.report.parameters.map((p) => (
                  <div key={p.id} className="flex items-center gap-2 text-xs">
                    {p.score / p.max >= 0.9 ? <CheckCircle2 className="w-3 h-3 text-emerald-500" /> : <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    <span className="text-slate-700 flex-1">{p.name}</span>
                    <span className="text-slate-500 tabular-nums">{p.score}/{p.max}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-500">Missing keywords: {result.report.missingKeywords.slice(0, 12).join(', ') || 'None — great job!'}</div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
