import type { ResumeData, KeywordTier, Experience } from '../types';
import { scoreResume } from './atsEngine';
import { STRONG_ACTION_VERBS, WEAK_PHRASES } from './keywords';
import {
  MAX_SKILLS_TECHNICAL,
  MAX_SKILLS_SOFT,
  MAX_AI_AUTOFIX_ITERS,
  ATS_AUTOFIX_TARGET,
} from './constants';

const ACTION_VERB_LIST = Array.from(STRONG_ACTION_VERBS);

// Pre-compile weak-phrase regexes once at module load (not inside loops)
const WEAK_PHRASE_REGEXES = WEAK_PHRASES.map((p) => new RegExp(p, 'gi'));

function pickVerb(seed: number): string {
  return capitalize(ACTION_VERB_LIST[seed % ACTION_VERB_LIST.length]);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function pickMetric(seed: number): string {
  const metrics = [
    'by 35%', 'by 42%', 'by 28%', 'reducing costs by $50K annually', 'saving 12 hours weekly',
    'serving 10K+ users', 'across 3 teams', 'for 5+ stakeholders', 'improving NPS by 18 points',
    'cutting processing time by 60%', 'generating $250K in new revenue', 'boosting conversion by 22%',
  ];
  return metrics[seed % metrics.length];
}

/**
 * Rewrite a weak bullet into ATS-friendly Action + Task + Metric form.
 * Named distinctly from groq.ts's AI-powered version.
 */
export function rewriteBulletLocally(bullet: string, keyword: string | undefined, seed: number): string {
  let text = bullet.trim();
  if (!text) {
    const v   = pickVerb(seed);
    const kw  = keyword ? ` using ${keyword}` : '';
    return `${v} key initiatives${kw}, ${pickMetric(seed)}.`;
  }
  // Strip weak phrases using pre-compiled regexes
  WEAK_PHRASE_REGEXES.forEach((re) => {
    // Reset lastIndex for global regexes used repeatedly
    re.lastIndex = 0;
    text = text.replace(re, '').trim();
  });
  // Ensure starts with action verb
  const firstWord = text.split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
  if (!firstWord || !STRONG_ACTION_VERBS.has(firstWord)) {
    text = `${pickVerb(seed)} ${text.replace(/^[a-z]/, (c) => c.toLowerCase())}`;
  }
  text = text.charAt(0).toUpperCase() + text.slice(1);
  // Inject keyword if missing
  if (keyword && !text.toLowerCase().includes(keyword.toLowerCase())) {
    text = text.replace(/\.$/, '') + ` leveraging ${keyword}`;
  }
  // Add metric if none present
  if (!/\d/.test(text)) {
    text = text.replace(/\.$/, '') + `, ${pickMetric(seed)}`;
  }
  if (!/[.!?]$/.test(text)) text += '.';
  text = text.replace(/\s+/g, ' ').replace(/ ,/g, ',');
  return text;
}

/** Generate or rewrite the professional summary (local, no AI). */
export function rewriteSummaryLocally(r: ResumeData, kw: KeywordTier): string {
  const jobTitle    = r.targetJobTitle || 'Professional';
  const topKeywords = [...kw.critical, ...kw.important].slice(0, 8);
  const years       = estimateYears(r);
  const yrsText     = years > 0 ? `${years}+ years of experience` : 'a strong track record';
  const skills1     = topKeywords.slice(0, 4).join(', ');
  const skills2     = topKeywords.slice(4, 8).join(', ');
  const name        = r.contact.fullName.split(' ')[0] || 'A';

  return (
    `Results-driven ${jobTitle} with ${yrsText} delivering measurable impact through ${skills1}. ` +
    `Proven expertise in ${skills2 || 'cross-functional collaboration'}, with a track record of improving performance, reducing costs, and shipping high-quality solutions on time. ` +
    `${capitalize(name === 'A' ? 'Adept' : name + ' is adept')} at translating business requirements into scalable outcomes, mentoring peers, and driving continuous improvement across ${jobTitle.toLowerCase()} initiatives.`
  );
}

function estimateYears(r: ResumeData): number {
  let months = 0;
  r.experience.forEach((e) => {
    if (!e.startDate) return;
    const end = e.endDate === 'Present' || !e.endDate ? new Date().toISOString().slice(0, 7) : e.endDate;
    const [ay, am] = e.startDate.split('-').map(Number);
    const [by, bm] = end.split('-').map(Number);
    if (ay && by) months += Math.max(0, (by - ay) * 12 + (bm - am));
  });
  return Math.round(months / 12);
}

/** Add missing keywords to skills, organize, and dedupe. */
export function optimizeSkills(r: ResumeData, kw: KeywordTier): ResumeData['skills'] {
  const allKw   = [...kw.critical, ...kw.important];
  const existing = new Set(
    [...r.skills.technical, ...r.skills.soft, ...r.skills.tools].map((s) => s.toLowerCase()),
  );
  const techAdd: string[] = [];
  const softAdd: string[] = [];
  const SOFT = new Set([
    'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving', 'problem solving',
    'critical thinking', 'time management', 'adaptability', 'creativity', 'negotiation', 'presentation',
    'mentoring', 'stakeholder management', 'project management', 'strategic planning',
  ]);

  allKw.forEach((k) => {
    if (existing.has(k.toLowerCase())) return;
    if (SOFT.has(k)) softAdd.push(capitalize(k));
    else techAdd.push(formatSkill(k));
  });

  const technical = uniqCaseInsensitive([
    ...kw.critical.filter((k) => !SOFT.has(k)).map(formatSkill),
    ...r.skills.technical,
    ...techAdd,
  ]);
  const soft  = uniqCaseInsensitive([...r.skills.soft, ...softAdd]);
  const tools = uniqCaseInsensitive(r.skills.tools);
  const languages = r.skills.languages || [];

  return {
    technical: technical.slice(0, MAX_SKILLS_TECHNICAL),
    soft:      soft.slice(0, MAX_SKILLS_SOFT),
    tools,
    languages,
  };
}

function formatSkill(k: string): string {
  const exact: Record<string, string> = {
    javascript: 'JavaScript', typescript: 'TypeScript', nodejs: 'Node.js', 'node.js': 'Node.js',
    nextjs: 'Next.js', 'next.js': 'Next.js', aws: 'AWS', gcp: 'GCP', sql: 'SQL', html: 'HTML', css: 'CSS',
    'ci/cd': 'CI/CD', rest: 'REST', api: 'API', apis: 'APIs', oop: 'OOP', tdd: 'TDD', bdd: 'BDD',
    'machine learning': 'Machine Learning', 'deep learning': 'Deep Learning', nlp: 'NLP',
  };
  return exact[k.toLowerCase()] || capitalize(k);
}

function uniqCaseInsensitive(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const k = a.toLowerCase();
    if (!seen.has(k) && a.trim()) {
      seen.add(k);
      out.push(a);
    }
  }
  return out;
}

/**
 * Auto-fix the entire resume locally to push ATS score ≥ target%.
 * Named distinctly from groq.ts's AI-powered version.
 */
export function autoFixResumeLocally(
  input: ResumeData,
  kw: KeywordTier,
  target = ATS_AUTOFIX_TARGET,
): { resume: ResumeData; iterations: number; logs: string[] } {
  let resume: ResumeData = JSON.parse(JSON.stringify(input));
  const logs: string[]   = [];
  let iter = 0;

  while (iter < MAX_AI_AUTOFIX_ITERS) {
    const report = scoreResume(resume, kw);
    if (report.percent >= target) break;

    const deficits = report.parameters
      .map((p) => ({ p, deficit: p.max - p.score }))
      .sort((a, b) => b.deficit - a.deficit);

    for (const { p } of deficits) {
      if (p.score >= p.max) continue;
      switch (p.id) {
        case 'keywords':
        case 'placement': {
          resume.summary = rewriteSummaryLocally(resume, kw);
          logs.push('Rewrote summary with target keywords.');
          const missing = report.missingKeywords.slice();
          resume.experience = resume.experience.map((exp, ei) => {
            const newBullets = exp.bullets.map((b, bi) => {
              const k = missing.shift();
              return rewriteBulletLocally(b, k, ei * 10 + bi);
            });
            while (newBullets.length < 3) {
              const k = missing.shift();
              newBullets.push(rewriteBulletLocally('', k, ei * 10 + newBullets.length));
            }
            return { ...exp, bullets: newBullets };
          });
          if (missing.length > 0 && resume.experience[0]) {
            const exp = resume.experience[0];
            missing.slice(0, 4).forEach((k, i) =>
              exp.bullets.push(rewriteBulletLocally('', k, 100 + i)),
            );
          }
          resume.skills = optimizeSkills(resume, kw);
          break;
        }
        case 'experience': {
          resume.experience = resume.experience.map((exp, ei) => ({
            ...exp,
            bullets: exp.bullets.map((b, bi) =>
              rewriteBulletLocally(
                b,
                kw.critical[bi % Math.max(1, kw.critical.length)] || kw.important[0],
                ei * 7 + bi,
              ),
            ),
          }));
          logs.push('Rewrote weak bullets with action verbs and metrics.');
          break;
        }
        case 'skills': {
          resume.skills = optimizeSkills(resume, kw);
          logs.push('Reorganized skills section by relevance.');
          break;
        }
        case 'contact': {
          if (resume.contact.phone && !resume.contact.phone.startsWith('+')) {
            resume.contact.phone = '+1 ' + resume.contact.phone.replace(/^\+?\d*\s*/, '');
            logs.push('Added country code to phone.');
          }
          if (!resume.contact.linkedin) {
            const handle = resume.contact.fullName.toLowerCase().replace(/\s+/g, '-');
            resume.contact.linkedin = `linkedin.com/in/${handle}`;
            logs.push('Generated LinkedIn URL placeholder.');
          }
          if (/(cool|sexy|cute|baby|boss|king|queen|killer|ninja|crazy|lol|xoxo|123|420|666)/.test(resume.contact.email)) {
            const handle = resume.contact.fullName.toLowerCase().replace(/\s+/g, '.');
            resume.contact.email = `${handle}@gmail.com`;
            logs.push('Replaced unprofessional email.');
          }
          break;
        }
        case 'dates': {
          resume.experience = ensureChronoAndPresent(resume.experience);
          logs.push('Standardized dates and ordering.');
          break;
        }
        case 'format': {
          resume.summary = stripEmoji(resume.summary);
          resume.experience = resume.experience.map((e) => ({
            ...e,
            bullets: e.bullets.map(stripEmoji),
          }));
          logs.push('Removed non-ASCII characters.');
          break;
        }
        case 'grammar': {
          resume.summary = cleanGrammar(resume.summary);
          resume.experience = resume.experience.map((e) => ({
            ...e,
            bullets: e.bullets.map(cleanGrammar),
          }));
          logs.push('Fixed grammar and spacing.');
          break;
        }
        case 'length': {
          if (resume.experience.length > 3) {
            resume.experience = resume.experience.map((e, i) =>
              i >= 3 ? { ...e, bullets: e.bullets.slice(0, 2) } : e,
            );
            logs.push('Trimmed older experience for length.');
          }
          break;
        }
      }
    }
    iter++;
  }
  return { resume, iterations: iter, logs };
}

function ensureChronoAndPresent(exp: Experience[]): Experience[] {
  const sorted = [...exp].sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''));
  return sorted.map((e) => ({
    ...e,
    endDate: e.current ? 'Present' : e.endDate,
  }));
}

function stripEmoji(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/[^\x00-\x7F]/g, '');
}

function cleanGrammar(s: string): string {
  let out = s.replace(/\s+/g, ' ').trim();
  out = out.replace(/\b(\w+)\s+\1\b/gi, '$1');
  if (out && /^[a-z]/.test(out)) out = out.charAt(0).toUpperCase() + out.slice(1);
  return out;
}

/** Generate a fresh resume from job description + minimal candidate data (local). */
export function generateResumeLocally(seed: ResumeData, kw: KeywordTier): ResumeData {
  const resume: ResumeData = JSON.parse(JSON.stringify(seed));
  resume.summary = rewriteSummaryLocally(resume, kw);
  resume.skills  = optimizeSkills(resume, kw);

  if (resume.experience.length === 0) {
    resume.experience = [
      {
        id: cryptoRandomId(),
        title: resume.targetJobTitle || 'Professional',
        company: 'Company Name',
        location: resume.contact.location || 'City, Country',
        startDate: '2022-01',
        endDate: 'Present',
        current: true,
        bullets: [],
      },
    ];
  }

  const allKw = [...kw.critical, ...kw.important];
  resume.experience = resume.experience.map((exp, ei) => {
    const bullets: string[] = [];
    const existing = exp.bullets.filter((b) => b.trim().length > 0);
    existing.forEach((b, bi) =>
      bullets.push(rewriteBulletLocally(b, allKw[(ei + bi) % Math.max(1, allKw.length)], ei * 13 + bi)),
    );
    while (bullets.length < 4) {
      const k = allKw[(ei + bullets.length) % Math.max(1, allKw.length)];
      bullets.push(rewriteBulletLocally('', k, ei * 13 + bullets.length + 50));
    }
    return { ...exp, bullets, endDate: exp.current ? 'Present' : exp.endDate };
  });

  resume.experience = ensureChronoAndPresent(resume.experience);
  const { resume: fixed } = autoFixResumeLocally(resume, kw, ATS_AUTOFIX_TARGET);
  return fixed;
}

export function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2, 10);
}

/** Generate a cover letter locally (no AI). */
export function generateCoverLetterLocally(r: ResumeData, kw: KeywordTier): string {
  const kws   = [...kw.critical, ...kw.important].slice(0, 6).join(', ');
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return `${r.contact.fullName}
${r.contact.email} | ${r.contact.phone} | ${r.contact.linkedin}

${today}

Dear Hiring Manager,

I am writing to express my strong interest in the ${r.targetJobTitle} position. With proven expertise in ${kws}, I am confident in my ability to deliver immediate value to your team.

In my previous roles, I ${r.experience[0]?.bullets[0]?.replace(/\.$/, '').toLowerCase() || 'led key initiatives that improved performance and reduced costs'}. I also ${r.experience[0]?.bullets[1]?.replace(/\.$/, '').toLowerCase() || 'partnered with cross-functional stakeholders to ship high-impact solutions'}. These experiences align directly with the responsibilities outlined in your job description.

What excites me most about this opportunity is the chance to apply my background in ${kw.critical.slice(0, 3).join(', ') || 'this domain'} to drive measurable outcomes for your organization. I bring a results-oriented mindset, strong communication skills, and a track record of mentoring teams toward shared goals.

I would welcome the opportunity to discuss how my background and skills align with your needs. Thank you for considering my application — I look forward to hearing from you.

Sincerely,
${r.contact.fullName}`;
}
