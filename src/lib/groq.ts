import {
  MAX_KEYWORDS_FOR_AI,
  COVER_LETTER_BULLETS,
} from './constants';

const API = '/api/groq';

async function callAPI(
  action: string,
  messages: { role: string; content: string }[],
  parseJson = false,
): Promise<string> {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, messages }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `API error (${res.status})`);
  }

  const data = await res.json();
  if (parseJson) return data.content;
  return data.content || '';
}

/** Rewrite a single bullet via AI (used in the AI Tools panel). */
export async function rewriteBulletWithAI(
  bullet: string,
  keyword: string | undefined,
): Promise<string> {
  const prompt = `Rewrite this resume bullet point to be ATS-optimized. Use a strong action verb, include a metric, ${
    keyword ? `naturally integrate the keyword "${keyword}",` : ''
  } and keep it concise.\n\nBullet: "${bullet}"\n\nReturn ONLY the rewritten bullet as a plain string, no explanation.`;
  const text = await callAPI('bullet', [{ role: 'user', content: prompt }]);
  return text.replace(/^["']|["']$/g, '').trim() || bullet;
}

/** Rewrite the professional summary via AI. */
export async function rewriteSummaryWithAI(
  targetJobTitle: string,
  yearsExp: number,
  keywords: string[],
  name: string,
  currentSummary: string,
): Promise<string> {
  const kw = keywords.slice(0, MAX_KEYWORDS_FOR_AI).join(', ');
  const prompt = `Write a professional ATS-optimized summary for a ${targetJobTitle} with ${yearsExp}+ years of experience.\n\nKeywords to include naturally: ${kw}\nCurrent summary (rewrite this): "${currentSummary}"\nCandidate name: ${name}\n\nReturn ONLY the summary text (3-4 sentences), no explanation, no JSON.`;
  return await callAPI('summary', [{ role: 'user', content: prompt }]);
}

/** Generate a complete resume JSON via AI. */
export async function generateResumeWithAI(
  jobTitle: string,
  jobDescription: string,
  keywords: string[],
  name: string,
  experience: { title: string; company: string; years: string; bullets: string[] }[],
): Promise<{ summary: string; bullets: string[][]; skills: string[] }> {
  const expText = experience
    .map(
      (e, i) =>
        `${i + 1}. ${e.title} at ${e.company} (${e.years})\n   Existing bullets: ${
          e.bullets.filter(Boolean).join(' | ') || 'none'
        }`,
    )
    .join('\n');

  const prompt = `Generate an ATS-optimized resume for:\nJob Title: ${jobTitle}\nJob Description: ${jobDescription}\nKey Skills: ${keywords.join(', ')}\nCandidate: ${name}\n\nExperience:\n${expText}\n\nReturn JSON ONLY (no markdown, no explanation) with this structure:\n{\n  "summary": "3-4 sentence professional summary hitting top keywords",\n  "experience": [\n    {\n      "title": "original job title",\n      "bullets": ["4-6 rewritten ATS-optimized bullets per role with action verbs and metrics"]\n    }\n  ],\n  "skills": ["technical skills", "in", "priority", "order"]\n}`;

  const text = await callAPI('generate', [{ role: 'user', content: prompt }], true);

  try {
    const parsed = JSON.parse(text);
    return {
      summary: parsed.summary || '',
      bullets: (parsed.experience || []).map((e: any) => e.bullets || []),
      skills: parsed.skills || keywords.slice(0, 15),
    };
  } catch {
    return { summary: '', bullets: [], skills: keywords.slice(0, 15) };
  }
}

/** Auto-fix the resume to push ATS score ≥ 95% via AI. */
export async function autoFixResumeWithAI(
  resumeText: string,
  keywords: string[],
  score: number,
): Promise<{ summary: string; experienceBullets: { [key: number]: string[] }; skills: string[] }> {
  const prompt = `I have a resume with ATS score ${score}%. I need to improve it to 95%+.\n\nResume:\n${resumeText}\n\nTarget keywords: ${keywords.join(', ')}\n\nAnalyze what's missing and return this EXACT JSON structure:\n{\n  "summary": "rewritten summary with more keywords",\n  "experienceBullets": { "0": ["rewritten bullets for role 1"], "1": ["rewritten bullets for role 2"] },\n  "skills": ["reordered/expanded skills"]\n}\n\nReturn ONLY valid JSON, no markdown.`;

  const text = await callAPI('autofix', [{ role: 'user', content: prompt }], true);

  try {
    return JSON.parse(text);
  } catch {
    return { summary: '', experienceBullets: {}, skills: [] };
  }
}

/** Generate a cover letter via AI. */
export async function generateCoverLetterWithAI(
  name: string,
  jobTitle: string,
  keywords: string[],
  summary: string,
  experienceBullets: string[],
): Promise<string> {
  const bullets = experienceBullets
    .slice(0, COVER_LETTER_BULLETS)
    .map((b) => `- ${b}`)
    .join('\n');
  const prompt = `Write a professional cover letter for:\nName: ${name}\nPosition: ${jobTitle}\nKey Skills: ${keywords.join(', ')}\nSummary: ${summary}\nExperience highlights:\n${bullets}\n\nReturn ONLY the cover letter text (3-4 paragraphs), no explanation.`;
  return await callAPI('cover', [{ role: 'user', content: prompt }]);
}
