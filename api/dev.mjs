import { createServer } from 'http';

const PORT = 3001;
const GROQ_BASE = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPTS = {
  bullet: 'You are an expert ATS resume writer. Rewrite resume bullet points to be ATS-optimized with strong action verbs, quantifiable metrics, and natural keyword integration. Return ONLY the rewritten bullet text, no explanation.',
  summary: 'You are an expert ATS resume writer. Write professional ATS-optimized summaries (3-4 sentences) that include target keywords naturally. Return ONLY the summary text, no explanation.',
  generate: 'You are an expert ATS resume writer. Generate complete ATS-optimized resumes from job descriptions. Return ONLY valid JSON, no markdown, no explanation.',
  autofix: 'You are an expert ATS resume analyst. Analyze resumes and fix ATS issues to score 95%+. Return ONLY valid JSON, no markdown, no explanation.',
  cover: 'You are an expert professional writer. Write ATS-optimized cover letters (3-4 paragraphs). Return ONLY the letter text, no explanation.',
};

const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) {
  console.error('ERROR: GROQ_API_KEY environment variable is not set.');
  console.error('Create a .env file in the project root with: GROQ_API_KEY=gsk_...');
  process.exit(1);
}

const server = createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  for await (const chunk of req) body += chunk;

  try {
    const { action, messages, model = 'llama-3.3-70b-versatile', temperature = 0.7, max_tokens = 4096 } = JSON.parse(body);

    if (!action || !messages) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing required fields: action, messages' }));
      return;
    }

    const systemContent = SYSTEM_PROMPTS[action] || SYSTEM_PROMPTS.generate;

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
      res.writeHead(groqRes.status, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Groq API error: ${err}` }));
      return;
    }

    const data = await groqRes.json();
    const content = data.choices?.[0]?.message?.content || '';

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ content }));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal server error' }));
  }
});

server.listen(PORT, () => {
  console.log(`Groq API dev server running at http://localhost:${PORT}`);
  console.log('Make sure GROQ_API_KEY is set in .env file');
});
