const GROQ_BASE = 'https://api.groq.com/openai/v1';

function getKey(): string | null {
  try {
    return localStorage.getItem('groq_api_key');
  } catch { return null; }
}

function systemPrompt(role: string): string {
  return `You are an expert ATS resume writer. You specialize in writing resumes that score 95%+ on Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo, iCIMS, etc.).

Rules:
- Use strong action verbs (led, built, optimized, designed, implemented, etc.)
- Include quantifiable metrics (percentages, dollar amounts, time saved, etc.)
- Integrate job-specific keywords naturally
- Keep each bullet to 1-2 lines
- Use proper capitalization and punctuation
- Never use emoji or special characters
- Return ONLY valid JSON, no markdown, no explanation

Your task: ${role}`;
}

async function groqChat(messages: { role: string; content: string }[]): Promise<string> {
  const key = getKey();
  if (!key) throw new Error('Groq API key not set');

  const res = await fetch(`${GROQ_BASE}/chat/completions`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: messages[0]?.role === 'system' ? messages[0].content : '' },
        ...messages.filter(m => m.role !== 'system')
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq API error (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || '';
}

export async function rewriteBullet(bullet: string, keyword: string | undefined): Promise<string> {
  const prompt = `Rewrite this resume bullet point to be ATS-optimized. Use a strong action verb, include a metric, ${keyword ? `naturally integrate the keyword "${keyword}",` : ''} and keep it concise.

Bullet: "${bullet}"

Return ONLY the rewritten bullet as a plain string, no explanation.`;
  const text = await groqChat([
    { role: 'system', content: systemPrompt('Rewrite resume bullet points to be ATS-optimized with action verbs and metrics.') },
    { role: 'user', content: prompt },
  ]);
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
  const text = await groqChat([
    { role: 'system', content: systemPrompt('Write ATS-optimized professional summaries.') },
    { role: 'user', content: prompt },
  ]);
  return text.replace(/^["']|["']$/g, '').trim() || currentSummary;
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

  const text = await groqChat([
    { role: 'system', content: systemPrompt('Generate complete ATS-optimized resumes from job descriptions.') },
    { role: 'user', content: prompt },
  ]);

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
  const text = await groqChat([
    { role: 'system', content: systemPrompt('Analyze and fix ATS resume issues to score 95%+.') },
    { role: 'user', content: prompt },
  ]);

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
  return await groqChat([
    { role: 'system', content: systemPrompt('Write professional cover letters.') },
    { role: 'user', content: prompt },
  ]);
}
