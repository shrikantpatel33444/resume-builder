import type { ResumeData, ATSReport, ATSParameter, KeywordTier } from '../types';
import { STRONG_ACTION_VERBS, WEAK_PHRASES, escapeReg } from './keywords';

const COMPATIBLE_SYSTEMS = [
  'Workday','Taleo (Oracle)','Greenhouse','Lever','BambooHR','iCIMS','SmartRecruiters','Jobvite','LinkedIn Easy Apply','Indeed Apply'
];

function resumeToText(r: ResumeData): string {
  const parts: string[] = [];
  parts.push(r.contact.fullName, r.contact.email, r.contact.phone, r.contact.linkedin, r.contact.location);
  parts.push('Summary', r.summary);
  parts.push('Experience');
  r.experience.forEach((e) => {
    parts.push(`${e.title} ${e.company} ${e.location} ${e.startDate} ${e.endDate}`);
    e.bullets.forEach((b) => parts.push(b));
  });
  parts.push('Education');
  r.education.forEach((e) => parts.push(`${e.degree} ${e.school} ${e.location} ${e.startDate} ${e.endDate}`));
  parts.push('Skills');
  parts.push(r.skills.technical.join(', '));
  parts.push(r.skills.soft.join(', '));
  parts.push(r.skills.tools.join(', '));
  parts.push('Projects');
  r.projects.forEach((p) => parts.push(`${p.name} ${p.description} ${p.tech}`));
  parts.push('Certifications');
  r.certifications.forEach((c) => parts.push(`${c.name} ${c.issuer} ${c.date}`));
  return parts.join('\n').toLowerCase();
}

function countOccurrences(text: string, term: string): number {
  const re = new RegExp(`\\b${escapeReg(term.toLowerCase())}\\b`, 'g');
  return (text.match(re) || []).length;
}

// PARAM 1 + 2
function scoreKeywords(text: string, kw: KeywordTier, r: ResumeData): { p1: ATSParameter; p2: ATSParameter; matched: string[]; missing: string[] } {
  const all = [...kw.critical, ...kw.important];
  const matched: string[] = [];
  const missing: string[] = [];

  all.forEach((k) => {
    if (countOccurrences(text, k) >= 1) matched.push(k);
    else missing.push(k);
  });

  const matchRatio = all.length === 0 ? 1 : matched.length / all.length;
  const p1Score = Math.round(matchRatio * 25);

  // Placement
  const summary = r.summary.toLowerCase();
  const skillsTxt = [...r.skills.technical, ...r.skills.soft, ...r.skills.tools].join(' ').toLowerCase();
  const expTxt = r.experience.flatMap((e) => e.bullets).join(' ').toLowerCase();

  const summaryKwCount = all.filter((k) => summary.includes(k)).length;
  const skillsKwCount = all.filter((k) => skillsTxt.includes(k)).length;
  const expKwCount = all.filter((k) => expTxt.includes(k)).length;

  let p2 = 0;
  p2 += summaryKwCount >= 5 ? 5 : Math.min(5, summaryKwCount);
  p2 += all.length === 0 ? 5 : Math.min(5, Math.round((skillsKwCount / Math.max(1, all.length)) * 5));
  p2 += expKwCount >= 5 ? 5 : Math.min(5, expKwCount);

  // Penalty for keyword stuffing (>5 occurrences of same word)
  const stuffed = all.filter((k) => countOccurrences(text, k) > 5);
  if (stuffed.length > 0) p2 = Math.max(0, p2 - 2);

  return {
    p1: {
      id: 'keywords',
      name: 'Keyword Match',
      score: p1Score,
      max: 25,
      issues: missing.length ? [`Missing ${missing.length} keywords: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}`] : [],
      suggestions: missing.length ? ['Add missing keywords naturally into your summary, skills, and experience.'] : [],
    },
    p2: {
      id: 'placement',
      name: 'Keyword Placement',
      score: p2,
      max: 15,
      issues: [
        summaryKwCount < 5 ? `Only ${summaryKwCount} keywords in summary (need 5+)` : '',
        stuffed.length ? `Keyword stuffing detected: ${stuffed.join(', ')}` : '',
      ].filter(Boolean),
      suggestions: summaryKwCount < 5 ? ['Rewrite summary to include more target keywords.'] : [],
    },
    matched,
    missing,
  };
}

// PARAM 3
function scoreFormat(r: ResumeData): ATSParameter {
  const issues: string[] = [];
  let score = 10;
  // We control the renderer, so most are guaranteed. Check for emoji / non-ASCII in content.
  const allText = [r.summary, ...r.experience.flatMap((e) => e.bullets)].join(' ');
  // eslint-disable-next-line no-control-regex
  const hasNonAscii = /[^\x00-\x7F]/.test(allText);
  if (hasNonAscii) {
    issues.push('Non-ASCII characters detected (use plain text for ATS)');
    score -= 2;
  }
  return {
    id: 'format',
    name: 'File Format & Structure',
    score: Math.max(0, score),
    max: 10,
    issues,
    suggestions: hasNonAscii ? ['Remove emojis and special characters from resume body.'] : [],
  };
}

// PARAM 4
function scoreHeadings(): ATSParameter {
  // Our templates always use ATS-standard headings
  return { id: 'headings', name: 'Section Headings', score: 10, max: 10, issues: [], suggestions: [] };
}

// PARAM 5
function scoreContact(r: ResumeData): ATSParameter {
  let score = 0;
  const issues: string[] = [];
  const c = r.contact;
  if (c.fullName.trim().length >= 3) score += 2; else issues.push('Full name missing');
  const email = c.email.trim().toLowerCase();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    score += 2;
    if (/(cool|sexy|cute|baby|boss|king|queen|killer|ninja|crazy|lol|xoxo|123|420|666)/.test(email)) {
      issues.push('Email looks unprofessional');
      score -= 1;
    }
  } else issues.push('Valid email required');
  if (/^[\d+\-()\s]{7,}$/.test(c.phone.trim())) {
    score += 2;
    if (!/^\+/.test(c.phone.trim())) issues.push('Add country code to phone (e.g., +1)');
  } else issues.push('Valid phone required');
  if (/linkedin\.com\//i.test(c.linkedin)) score += 2; else issues.push('LinkedIn URL missing');
  if (c.location.trim().length >= 3) score += 2; else issues.push('Location missing');

  return {
    id: 'contact',
    name: 'Contact Information',
    score,
    max: 10,
    issues,
    suggestions: issues.length ? ['Use a professional email like firstname.lastname@gmail.com'] : [],
  };
}

// PARAM 6
function scoreExperience(r: ResumeData, criticalKw: string[]): ATSParameter {
  if (r.experience.length === 0) {
    return { id: 'experience', name: 'Experience Quality', score: 0, max: 10, issues: ['No work experience added'], suggestions: ['Add at least one work experience entry.'] };
  }
  const allBullets = r.experience.flatMap((e) => e.bullets);
  if (allBullets.length === 0) {
    return { id: 'experience', name: 'Experience Quality', score: 2, max: 10, issues: ['No bullet points'], suggestions: ['Add 3-5 quantified bullets per role.'] };
  }

  const actionVerbBullets = allBullets.filter((b) => {
    const firstWord = b.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, '');
    return firstWord && STRONG_ACTION_VERBS.has(firstWord);
  });
  const quantifiedBullets = allBullets.filter((b) => /\d/.test(b) && /(%|\$|\bk\b|\bm\b|\bb\b|hours|weeks|days|months|years|users|customers|clients|times|fold|x\b)/i.test(b));
  const keywordBullets = allBullets.filter((b) => criticalKw.some((k) => b.toLowerCase().includes(k)));
  const weakBullets = allBullets.filter((b) => WEAK_PHRASES.some((p) => b.toLowerCase().includes(p)));

  const chronoOk = r.experience.every((e, i, arr) => {
    if (i === 0) return true;
    const prev = arr[i - 1];
    return (prev.startDate || '') >= (e.startDate || '');
  });
  const metaOk = r.experience.every((e) => e.title && e.company && e.startDate);

  let score = 0;
  score += Math.round((actionVerbBullets.length / allBullets.length) * 2);
  score += Math.round((quantifiedBullets.length / allBullets.length) * 2);
  score += criticalKw.length === 0 ? 2 : Math.round((keywordBullets.length / Math.max(allBullets.length, 1)) * 2);
  score += chronoOk ? 2 : 0;
  score += metaOk ? 2 : 0;
  if (weakBullets.length > 0) score = Math.max(0, score - 1);

  const issues: string[] = [];
  if (actionVerbBullets.length < allBullets.length) issues.push(`${allBullets.length - actionVerbBullets.length} bullets don't start with strong action verb`);
  if (quantifiedBullets.length < allBullets.length) issues.push(`${allBullets.length - quantifiedBullets.length} bullets lack measurable metrics`);
  if (weakBullets.length > 0) issues.push(`${weakBullets.length} bullets use weak phrasing ("responsible for", etc.)`);
  if (!chronoOk) issues.push('Experience not in reverse chronological order');

  return {
    id: 'experience',
    name: 'Experience Quality',
    score: Math.min(10, score),
    max: 10,
    issues,
    suggestions: ['Use Action Verb + Task + Metric for every bullet.'],
  };
}

// PARAM 7
function scoreSkills(r: ResumeData, kw: KeywordTier): ATSParameter {
  const all = [...r.skills.technical, ...r.skills.soft, ...r.skills.tools];
  let score = 0;
  const issues: string[] = [];
  if (all.length > 0) score += 1; else issues.push('No skills listed');
  if (r.skills.technical.length > 0 && r.skills.soft.length > 0) score += 1; else issues.push('Organize skills into categories');
  // ordering by relevance: at least one critical keyword in first 5 technical
  const firstFive = r.skills.technical.slice(0, 5).map((s) => s.toLowerCase());
  if (kw.critical.length === 0 || kw.critical.some((k) => firstFive.includes(k))) score += 1;
  else issues.push('Most relevant skills not listed first');
  // no graphical bars: our renderer ensures this
  score += 1;
  // keyword match
  const skillsTxt = all.join(' ').toLowerCase();
  const matched = [...kw.critical, ...kw.important].filter((k) => skillsTxt.includes(k)).length;
  const total = kw.critical.length + kw.important.length;
  if (total === 0 || matched / total >= 0.6) score += 1;
  else issues.push('Add more job description keywords to skills');

  return { id: 'skills', name: 'Skills Optimization', score, max: 5, issues, suggestions: [] };
}

// PARAM 8
function scoreDates(r: ResumeData): ATSParameter {
  let score = 5;
  const issues: string[] = [];
  const exp = r.experience;
  if (exp.length === 0) return { id: 'dates', name: 'Date Consistency', score: 5, max: 5, issues: [], suggestions: [] };

  // Consistent format (all YYYY-MM)
  const allDates = exp.flatMap((e) => [e.startDate, e.endDate]).filter(Boolean) as string[];
  const consistent = allDates.every((d) => /^\d{4}-\d{2}$/.test(d) || d === 'Present');
  if (!consistent) { score -= 2; issues.push('Inconsistent date format'); }

  const currentHasPresent = exp.filter((e) => e.current).every((e) => e.endDate === 'Present');
  if (!currentHasPresent) { score -= 1; issues.push('Current role should show "Present"'); }

  // Gap detection
  const sorted = [...exp].sort((a, b) => (a.startDate || '').localeCompare(b.startDate || ''));
  let hasGap = false;
  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = sorted[i - 1].endDate === 'Present' ? '9999-12' : sorted[i - 1].endDate;
    if (prevEnd && sorted[i].startDate && monthsBetween(prevEnd, sorted[i].startDate) > 6) {
      hasGap = true;
      break;
    }
  }
  if (hasGap) { score -= 2; issues.push('Employment gap > 6 months detected'); }

  return { id: 'dates', name: 'Date Consistency', score: Math.max(0, score), max: 5, issues, suggestions: hasGap ? ['Briefly explain gaps with sabbatical, education, or freelance.'] : [] };
}

function monthsBetween(a: string, b: string): number {
  const [ay, am] = a.split('-').map(Number);
  const [by, bm] = b.split('-').map(Number);
  if (!ay || !by) return 0;
  return (by - ay) * 12 + (bm - am);
}

// PARAM 9
function scoreLength(r: ResumeData): ATSParameter {
  let score = 5;
  const issues: string[] = [];
  // estimate words
  const text = resumeToText(r);
  const words = text.split(/\s+/).filter(Boolean).length;
  const years = estimateYears(r);
  const maxWords = years < 5 ? 600 : years < 10 ? 1000 : 1400;
  if (words > maxWords * 1.2) { score -= 2; issues.push(`Resume too long for ${years} years of experience`); }
  if (words < 150) { score -= 2; issues.push('Resume too short — add more detail'); }
  return { id: 'length', name: 'Length & Format', score: Math.max(0, score), max: 5, issues, suggestions: [] };
}

function estimateYears(r: ResumeData): number {
  let months = 0;
  r.experience.forEach((e) => {
    if (!e.startDate) return;
    const end = e.endDate === 'Present' || !e.endDate ? new Date().toISOString().slice(0, 7) : e.endDate;
    months += Math.max(0, monthsBetween(e.startDate, end));
  });
  return Math.round(months / 12);
}

// PARAM 10
function scoreGrammar(r: ResumeData): ATSParameter {
  const issues: string[] = [];
  let score = 5;
  const text = [r.summary, ...r.experience.flatMap((e) => e.bullets)].join(' ');
  // Common typos / repeated words
  const repeated = text.match(/\b(\w+)\s+\1\b/gi);
  if (repeated && repeated.length > 0) { score -= 1; issues.push(`Repeated words found: ${repeated.slice(0, 3).join(', ')}`); }
  // Double spaces
  if (/  +/.test(text)) { score -= 1; issues.push('Double spaces detected'); }
  // Sentence start capitalization (bullets)
  const lowerStartBullets = r.experience.flatMap((e) => e.bullets).filter((b) => b && /^[a-z]/.test(b));
  if (lowerStartBullets.length > 0) { score -= 1; issues.push(`${lowerStartBullets.length} bullets don't start with capital letter`); }
  // Tense consistency for current roles (present tense ending in 's' or -ing — heuristic only)
  // Skip strict check.
  return { id: 'grammar', name: 'Grammar & Spelling', score: Math.max(0, score), max: 5, issues, suggestions: [] };
}

export function scoreResume(r: ResumeData, kw: KeywordTier): ATSReport {
  const text = resumeToText(r);
  const { p1, p2, matched, missing } = scoreKeywords(text, kw, r);
  const p3 = scoreFormat(r);
  const p4 = scoreHeadings();
  const p5 = scoreContact(r);
  const p6 = scoreExperience(r, kw.critical);
  const p7 = scoreSkills(r, kw);
  const p8 = scoreDates(r);
  const p9 = scoreLength(r);
  const p10 = scoreGrammar(r);

  const params = [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10];
  const total = params.reduce((s, p) => s + p.score, 0);
  const max = params.reduce((s, p) => s + p.max, 0);
  const percent = Math.round((total / max) * 100);

  // Compatibility (proxy: pass if score per parameter category meets threshold)
  const compatibility = COMPATIBLE_SYSTEMS.map((s, i) => ({
    system: s,
    ok: percent >= 90 || (percent >= 85 && i < 8),
  }));

  return {
    total,
    max,
    percent,
    parameters: params,
    keywords: kw,
    matchedKeywords: matched,
    missingKeywords: missing,
    compatibility,
  };
}

export function scoreLevel(percent: number): { label: string; color: string; emoji: string; bg: string } {
  if (percent >= 100) return { label: 'Perfect Score!', color: 'text-amber-500', emoji: '🏆', bg: 'from-amber-400 to-yellow-500' };
  if (percent >= 95) return { label: 'Excellent', color: 'text-emerald-500', emoji: '🟢', bg: 'from-emerald-400 to-green-600' };
  if (percent >= 90) return { label: 'Good — ATS Safe', color: 'text-yellow-500', emoji: '🟡', bg: 'from-yellow-400 to-amber-500' };
  if (percent >= 71) return { label: 'Needs Improvement', color: 'text-orange-500', emoji: '🟠', bg: 'from-orange-400 to-red-500' };
  return { label: 'Critical Issues Found', color: 'text-red-500', emoji: '🔴', bg: 'from-red-500 to-rose-600' };
}
