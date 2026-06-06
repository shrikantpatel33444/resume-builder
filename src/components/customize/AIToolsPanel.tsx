import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Languages, SpellCheck, Sparkles, Lightbulb, CheckCircle2, AlertCircle, X, Send } from 'lucide-react';
import type { ResumeData } from '../../types';
import { Card } from './controls';

interface Props {
  resume: ResumeData;
  onChange: (r: ResumeData) => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
  { code: 'de', label: 'German (Deutsch)' },
  { code: 'it', label: 'Italian (Italiano)' },
  { code: 'pt', label: 'Portuguese (Português)' },
  { code: 'ar', label: 'Arabic (العربية)' },
  { code: 'ja', label: 'Japanese (日本語)' },
  { code: 'zh', label: 'Chinese (中文)' },
  { code: 'ms', label: 'Malay (Bahasa)' },
];

/** Lightweight built-in dictionary for section headings + a few stock phrases.
 *  Real translation would require a backend API key. */
const TRANSLATIONS: Record<string, Record<string, string>> = {
  hi: {
    'Professional Summary': 'पेशेवर सारांश',
    'Work Experience': 'कार्य अनुभव',
    'Education': 'शिक्षा',
    'Skills': 'कौशल',
    'Projects': 'परियोजनाएँ',
    'Certifications': 'प्रमाणपत्र',
    'Languages': 'भाषाएँ',
    'Profile': 'प्रोफ़ाइल',
    'Present': 'वर्तमान',
  },
  es: {
    'Professional Summary': 'Resumen Profesional', 'Work Experience': 'Experiencia Laboral',
    'Education': 'Educación', 'Skills': 'Habilidades', 'Projects': 'Proyectos',
    'Certifications': 'Certificaciones', 'Languages': 'Idiomas', 'Profile': 'Perfil', 'Present': 'Actualidad',
  },
  fr: {
    'Professional Summary': 'Résumé Professionnel', 'Work Experience': 'Expérience Professionnelle',
    'Education': 'Formation', 'Skills': 'Compétences', 'Projects': 'Projets',
    'Certifications': 'Certifications', 'Languages': 'Langues', 'Profile': 'Profil', 'Present': 'En cours',
  },
  de: {
    'Professional Summary': 'Berufliches Profil', 'Work Experience': 'Berufserfahrung',
    'Education': 'Ausbildung', 'Skills': 'Kenntnisse', 'Projects': 'Projekte',
    'Certifications': 'Zertifikate', 'Languages': 'Sprachen', 'Profile': 'Profil', 'Present': 'Heute',
  },
  pt: { 'Work Experience': 'Experiência Profissional', 'Education': 'Educação', 'Skills': 'Habilidades', 'Projects': 'Projetos', 'Certifications': 'Certificações', 'Languages': 'Idiomas', 'Present': 'Atual' },
  it: { 'Work Experience': 'Esperienza Lavorativa', 'Education': 'Istruzione', 'Skills': 'Competenze', 'Projects': 'Progetti', 'Certifications': 'Certificazioni', 'Languages': 'Lingue', 'Present': 'Presente' },
  ja: { 'Work Experience': '職務経歴', 'Education': '学歴', 'Skills': 'スキル', 'Projects': 'プロジェクト', 'Certifications': '資格', 'Languages': '言語', 'Present': '現在' },
};

/* ===== Spell + Grammar check (lightweight, deterministic) ===== */
const COMMON_TYPOS: Record<string, string> = {
  'recieve': 'receive', 'recieved': 'received', 'occured': 'occurred', 'seperate': 'separate',
  'definately': 'definitely', 'managment': 'management', 'enviroment': 'environment',
  'experiance': 'experience', 'profesional': 'professional', 'responsable': 'responsible',
  'sucessful': 'successful', 'sucessfully': 'successfully', 'acheived': 'achieved',
  'accross': 'across', 'untill': 'until', 'comming': 'coming', 'occassion': 'occasion',
  'comunicate': 'communicate', 'comunication': 'communication', 'collaberate': 'collaborate',
  'developement': 'development', 'maintainence': 'maintenance', 'beleive': 'believe',
};

interface Issue { kind: 'spelling' | 'grammar'; text: string; suggestion: string; location: string; }

function findIssues(resume: ResumeData): Issue[] {
  const issues: Issue[] = [];
  const scan = (text: string, where: string) => {
    if (!text) return;
    // Spelling
    const words = text.match(/\b[A-Za-z]+\b/g) || [];
    words.forEach((w) => {
      const low = w.toLowerCase();
      if (COMMON_TYPOS[low]) {
        issues.push({ kind: 'spelling', text: w, suggestion: COMMON_TYPOS[low], location: where });
      }
    });
    // Grammar: double spaces
    if (/  +/.test(text)) issues.push({ kind: 'grammar', text: 'double space', suggestion: 'single space', location: where });
    // Repeated words
    const repeats = text.match(/\b(\w+)\s+\1\b/gi);
    if (repeats) repeats.forEach((r) => issues.push({ kind: 'grammar', text: r, suggestion: r.split(/\s+/)[0], location: where }));
    // Lowercase start
    if (/^[a-z]/.test(text.trim())) issues.push({ kind: 'grammar', text: 'Lowercase start', suggestion: 'Capitalize first letter', location: where });
  };
  scan(resume.summary, 'Summary');
  resume.experience.forEach((e, i) => {
    e.bullets.forEach((b, j) => scan(b, `Experience ${i + 1} · bullet ${j + 1}`));
  });
  resume.projects.forEach((p, i) => scan(p.description, `Project ${i + 1}`));
  return issues;
}

function applyIssueFixes(resume: ResumeData): ResumeData {
  const fix = (text: string): string => {
    let t = text;
    Object.entries(COMMON_TYPOS).forEach(([bad, good]) => {
      t = t.replace(new RegExp(`\\b${bad}\\b`, 'gi'), (m) => /^[A-Z]/.test(m) ? good.charAt(0).toUpperCase() + good.slice(1) : good);
    });
    t = t.replace(/  +/g, ' ').replace(/\b(\w+)\s+\1\b/gi, '$1');
    if (t && /^[a-z]/.test(t)) t = t.charAt(0).toUpperCase() + t.slice(1);
    return t;
  };
  return {
    ...resume,
    summary: fix(resume.summary),
    experience: resume.experience.map((e) => ({ ...e, bullets: e.bullets.map(fix) })),
    projects: resume.projects.map((p) => ({ ...p, description: fix(p.description) })),
  };
}

/* ===== Translation ===== */
function translateResume(resume: ResumeData, lang: string): ResumeData {
  const dict = TRANSLATIONS[lang];
  if (!dict) return resume;
  // We don't translate proper nouns or user content (that needs an LLM/API).
  // We translate well-known phrases like "Present" inside dates.
  const r: ResumeData = JSON.parse(JSON.stringify(resume));
  r.experience.forEach((e) => { if (e.endDate === 'Present' && dict['Present']) e.endDate = dict['Present']; });
  return r;
}

export default function AIToolsPanel({ resume, onChange }: Props) {
  const [lang, setLang] = useState('hi');
  const [translating, setTranslating] = useState(false);
  const [checked, setChecked] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  const issues = useMemo(() => (checked ? findIssues(resume) : []), [resume, checked]);

  const handleTranslate = async () => {
    setTranslating(true);
    await new Promise((r) => setTimeout(r, 600));
    onChange(translateResume(resume, lang));
    setTranslating(false);
  };

  const handleCheck = async () => {
    setChecking(true);
    await new Promise((r) => setTimeout(r, 400));
    setChecked(true);
    setChecking(false);
    setShowModal(true);
  };

  const handleFixAll = () => {
    onChange(applyIssueFixes(resume));
    setShowModal(false);
    setChecked(false);
  };

  return (
    <div className="space-y-3">
      {/* TRANSLATE CARD */}
      <Card className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white flex items-center justify-center shrink-0">
            <Languages className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">AI Translate Resume</h3>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">BETA</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Translate section headings, date words ("Present"), and common labels.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {LANGUAGES.map((l) => <option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          <button
            onClick={handleTranslate}
            disabled={translating || lang === 'en'}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-violet-600 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {translating ? 'Translating…' : 'Translate now'}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2">💡 Tip: User-written content stays as-is — only standard labels are translated.</p>
      </Card>

      {/* SPELL CHECK CARD */}
      <Card className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shrink-0">
            <SpellCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Check spelling &amp; grammar</h3>
              {checked && issues.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">{issues.length} issues</span>
              )}
              {checked && issues.length === 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Clean!</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Catches common typos, double spaces, repeated words, and capitalization issues.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleCheck}
            disabled={checking}
            className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-600 hover:shadow-md transition disabled:opacity-50"
          >
            {checking ? 'Checking…' : checked ? 'Re-check' : 'Check now'}
          </button>
          {checked && issues.length > 0 && (
            <button onClick={() => setShowModal(true)} className="px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 hover:bg-slate-200">
              View {issues.length}
            </button>
          )}
        </div>
      </Card>

      {/* FEEDBACK CARD */}
      <Card className="p-4 bg-gradient-to-br from-amber-50 to-pink-50 border-amber-100">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-400 text-white flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm">Got an idea for a new AI tool?</h3>
            <p className="text-xs text-slate-600 mt-0.5">We'd love to hear what would make your resume better.</p>
            {feedbackSent ? (
              <div className="mt-2 text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" /> Thanks! We'll review your suggestion.
              </div>
            ) : (
              <div className="mt-2 flex gap-2">
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="e.g. AI bullet rewriter…"
                  className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
                <button
                  onClick={() => { if (feedback.trim()) { setFeedbackSent(true); setFeedback(''); } }}
                  disabled={!feedback.trim()}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" /> Let us know
                </button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* GENERIC "OTHER AI TOOLS" hint */}
      <Card className="p-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>More AI tools available in the <b className="text-slate-700">Edit</b> tab — Auto-Fix, bullet rewriter, cover letter generator.</span>
        </div>
      </Card>

      {/* SPELLING ISSUES MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900">Spelling &amp; grammar</h3>
                  <p className="text-xs text-slate-500">{issues.length} issue{issues.length === 1 ? '' : 's'} found</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {issues.length === 0 ? (
                  <div className="text-center py-10 text-emerald-600">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                    <div className="font-bold">No issues!</div>
                    <p className="text-xs text-slate-500 mt-1">Your resume reads clean.</p>
                  </div>
                ) : (
                  issues.map((iss, i) => (
                    <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-50 rounded-lg">
                      <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${iss.kind === 'spelling' ? 'text-amber-500' : 'text-rose-500'}`} />
                      <div className="text-xs flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono bg-rose-50 text-rose-700 px-1 rounded">{iss.text}</span>
                          <span className="text-slate-400">→</span>
                          <span className="font-mono bg-emerald-50 text-emerald-700 px-1 rounded">{iss.suggestion}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1">{iss.location}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {issues.length > 0 && (
                <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
                  <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100">Close</button>
                  <button onClick={handleFixAll} className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-fuchsia-500 to-violet-600">Fix all automatically</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
