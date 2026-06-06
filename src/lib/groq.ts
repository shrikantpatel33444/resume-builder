const API = '/api/groq';

async function callAPI(action: string, messages: { role: string; content: string }[], parseJson = false): Promise<string> {
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

export async function rewriteBullet(bullet: string, keyword: string | undefined): Promise<string> {
  const prompt = `Rewrite this resume bullet point to be ATS-optimized. Use a strong action verb, include a metric, ${keyword ? `naturally integrate the keyword "${keyword}",` : ''} and keep it concise.

Bullet: "${bullet}"

Return ONLY the rewritten bullet as a plain string, no explanation.`;
  const text = await callAPI('bullet', [{ role: 'user', content: prompt }]);
  return text.replace(/^["']|["']$/g, '').trim() || bullet;
}

export async function rewriteSummary(
  targetJobTitle: string,
  yearsExp: number,
  keywords: string[],
  name: string,
  currentSummary: string
): Promise<string> {
  const kw = keywords.slice(0, 10).join(', ');
  const prompt = `Write a professional ATS-optimized summary for a ${targetJobTitle} with ${yearsExp}+ years of experience.

Keywords to include naturally: ${kw}
Current summary (rewrite this): "${currentSummary}"
Candidate name: ${name}

Return ONLY the summary text (3-4 sentences), no explanation, no JSON.`;
  return await callAPI('summary', [{ role: 'user', content: prompt }]);
}

export async function generateResume(
  jobTitle: string,
  jobDescription: string,
  keywords: string[],
  name: string,
  experience: { title: string; company: string; years: string; bullets: string[] }[]
): Promise<{ summary: string; bullets: string[][]; skills: string[] }> {
  const expText = experience.map((e, i) =>
    `${i + 1}. ${e.title} at ${e.company} (${e.years})\n   Existing bullets: ${e.bullets.filter(Boolean).join(' | ') || 'none'}`
  ).join('\n');

  const prompt = `Generate an ATS-optimized resume for:
Job Title: ${jobTitle}
Job Description: ${jobDescription}
Key Skills: ${keywords.join(', ')}
Candidate: ${name}

Experience:
${expText}

Return JSON ONLY (no markdown, no explanation) with this structure:
{
  "summary": "3-4 sentence professional summary hitting top keywords",
  "experience": [
    {
      "title": "original job title",
      "bullets": ["4-6 rewritten ATS-optimized bullets per role with action verbs and metrics"]
    }
  ],
  "skills": ["technical skills", "in", "priority", "order"]
}`;

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

export async function autoFixResume(
  resumeText: string,
  keywords: string[],
  score: number
): Promise<{ summary: string; experienceBullets: { [key: number]: string[] }; skills: string[] }> {
  const prompt = `I have a resume with ATS score ${score}%. I need to improve it to 95%+.

Resume:
${resumeText}

Target keywords: ${keywords.join(', ')}

Analyze what's missing and return this EXACT JSON structure:
{
  "summary": "rewritten summary with more keywords",
  "experienceBullets": { "0": ["rewritten bullets for role 1"], "1": ["rewritten bullets for role 2"] },
  "skills": ["reordered/expanded skills"]
}

Return ONLY valid JSON, no markdown.`;

  const text = await callAPI('autofix', [{ role: 'user', content: prompt }], true);

  try {
    return JSON.parse(text);
  } catch {
    return { summary: '', experienceBullets: {}, skills: [] };
  }
}

export async function generateCoverLetter(
  name: string,
  jobTitle: string,
  keywords: string[],
  summary: string,
  experienceBullets: string[]
): Promise<string> {
  const bullets = experienceBullets.slice(0, 4).map(b => `- ${b}`).join('\n');
  const prompt = `Write a professional cover letter for:
Name: ${name}
Position: ${jobTitle}
Key Skills: ${keywords.join(', ')}
Summary: ${summary}
Experience highlights:
${bullets}

Return ONLY the cover letter text (3-4 paragraphs), no explanation.`;
  return await callAPI('cover', [{ role: 'user', content: prompt }]);
}
