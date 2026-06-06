import type { VercelRequest, VercelResponse } from '@vercel/node';

const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPTS: Record<string, string> = {
  bullet: `You are an expert ATS resume writer. Rewrite resume bullet points to be ATS-optimized with strong action verbs, quantifiable metrics, and natural keyword integration. Return ONLY the rewritten bullet text, no explanation.`,
  summary: `You are an expert ATS resume writer. Write professional ATS-optimized summaries (3-4 sentences) that include target keywords naturally. Return ONLY the summary text, no explanation.`,
  generate: `You are an expert ATS resume writer. Generate complete ATS-optimized resumes from job descriptions. Return ONLY valid JSON, no markdown, no explanation.`,
  autofix: `You are an expert ATS resume analyst. Analyze resumes and fix ATS issues to score 95%+. Return ONLY valid JSON, no markdown, no explanation.`,
  cover: `You are an expert professional writer. Write ATS-optimized cover letters (3-4 paragraphs). Return ONLY the letter text, no explanation.`,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY not configured on server' });
  }

  const { action, messages, model = 'llama-3.3-70b-versatile', temperature = 0.7, max_tokens = 4096 } = req.body;

  if (!action || !messages) {
    return res.status(400).json({ error: 'Missing required fields: action, messages' });
  }

  const systemContent = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.generate;

  try {
    const groqRes = await fetch(GROQ_BASE, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemContent },
          ...messages,
        ],
        temperature,
        max_tokens,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return res.status(groqRes.status).json({ error: `Groq API error: ${err}` });
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    return res.status(200).json({ content });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
