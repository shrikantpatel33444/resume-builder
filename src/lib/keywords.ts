import type { KeywordTier } from '../types';

// Curated list of strong action verbs (200+)
export const STRONG_ACTION_VERBS = new Set([
  'achieved','accelerated','accomplished','administered','advised','analyzed','architected','assembled','authored','automated',
  'boosted','budgeted','built','calculated','captured','centralized','championed','coached','collaborated','collected',
  'commanded','communicated','compiled','completed','composed','conceived','conceptualized','conducted','consolidated','constructed',
  'consulted','coordinated','created','cultivated','customized','cut','debugged','decreased','deciphered','defined',
  'delegated','delivered','demonstrated','deployed','designed','developed','devised','diagnosed','directed','discovered',
  'distributed','documented','drafted','drove','earned','edited','educated','elevated','eliminated','enabled',
  'engineered','enhanced','ensured','established','estimated','evaluated','exceeded','executed','expanded','expedited',
  'experimented','facilitated','finalized','financed','focused','forecasted','formulated','founded','generated','governed',
  'guided','handled','headed','identified','implemented','improved','increased','influenced','initiated','innovated',
  'inspected','installed','instituted','integrated','interpreted','introduced','invented','investigated','launched','led',
  'leveraged','maintained','managed','marketed','maximized','measured','mentored','migrated','minimized','mobilized',
  'modeled','modernized','monitored','motivated','negotiated','operated','optimized','orchestrated','organized','originated',
  'overhauled','oversaw','partnered','performed','pioneered','planned','prepared','presented','presided','prioritized',
  'processed','produced','programmed','promoted','proposed','prototyped','provided','published','purchased','recruited',
  'redesigned','reduced','refactored','reorganized','researched','resolved','restructured','revamped','reviewed','revitalized',
  'saved','scaled','scheduled','secured','selected','shaped','simplified','solved','spearheaded','standardized',
  'steered','strategized','streamlined','strengthened','structured','succeeded','supervised','supported','surpassed','synthesized',
  'targeted','taught','tested','trained','transformed','translated','tripled','troubleshot','unified','updated',
  'upgraded','validated','verified','won','wrote'
]);

export const WEAK_PHRASES = [
  'responsible for','duties included','helped with','worked on','assisted with','tasked with','involved in','in charge of',
  'team player','hard worker','go-getter','think outside the box','synergy'
];

export const ATS_STANDARD_HEADINGS = [
  'Summary','Professional Summary','Experience','Work Experience','Employment History',
  'Education','Skills','Technical Skills','Projects','Certifications','Languages','Awards'
];

// Pool of recognized technical/industry keywords for tier classification
const KNOWN_HARD_SKILLS = new Set([
  'python','javascript','typescript','java','c++','c#','go','golang','rust','ruby','php','swift','kotlin','scala',
  'react','angular','vue','svelte','next.js','nextjs','node.js','nodejs','express','django','flask','fastapi','spring',
  'sql','mysql','postgresql','mongodb','redis','cassandra','dynamodb','elasticsearch','snowflake','bigquery','databricks',
  'aws','azure','gcp','docker','kubernetes','terraform','ansible','jenkins','github actions','gitlab','ci/cd','devops',
  'html','css','tailwind','sass','graphql','rest','grpc','microservices','api','apis','oauth','jwt',
  'machine learning','deep learning','nlp','computer vision','tensorflow','pytorch','scikit-learn','pandas','numpy',
  'tableau','power bi','excel','salesforce','sap','jira','confluence','figma','adobe','photoshop','illustrator',
  'agile','scrum','kanban','waterfall','sdlc','tdd','bdd','oop','solid',
  'seo','sem','google analytics','hubspot','marketo','mailchimp','crm','erp','b2b','b2c','saas','paas','iaas'
]);

const KNOWN_SOFT_SKILLS = new Set([
  'leadership','communication','teamwork','collaboration','problem-solving','problem solving','critical thinking',
  'time management','adaptability','creativity','negotiation','presentation','mentoring','stakeholder management',
  'project management','strategic planning','decision making','conflict resolution','emotional intelligence'
]);

const STOPWORDS = new Set([
  'a','an','the','and','or','but','if','then','else','for','of','to','in','on','at','by','with','as','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','could','should','may','might','must','shall','can','this','that','these','those','i','you','he','she','it','we','they','our','your','their','his','her','its','my','me','us','them','from','up','down','out','about','into','over','after','before','between','through','during','without','within','also','more','most','some','any','all','no','not','only','own','same','than','too','very','just','so','such','here','there','when','where','why','how','what','which','who','whom','one','two','three','years','year','work','job','role','position','candidate','company','team','strong','excellent','good','great','ability','skills','skill','experience','required','preferred','plus','required.','equivalent','etc','etc.','minimum','maximum','include','includes','including','using','use','used','knowledge','familiar','familiarity','understanding','proven','demonstrated','well','able','across','various','among','high','large','small','well-versed'
]);

function normalize(text: string): string {
  return text.toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"');
}

function tokenize(text: string): string[] {
  return normalize(text)
    .replace(/[^a-z0-9+#./\- ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

// Extract n-grams (1 to 3 words) and intersect with known sets / heuristics
export function extractKeywords(jobDescription: string): KeywordTier {
  const text = normalize(jobDescription);
  const tokens = tokenize(text);
  const found = new Set<string>();

  // unigrams, bigrams, trigrams
  for (let n = 1; n <= 3; n++) {
    for (let i = 0; i <= tokens.length - n; i++) {
      const gram = tokens.slice(i, i + n).join(' ');
      if (gram.length < 2) continue;
      if (n === 1 && STOPWORDS.has(gram)) continue;
      if (KNOWN_HARD_SKILLS.has(gram) || KNOWN_SOFT_SKILLS.has(gram)) {
        found.add(gram);
      }
    }
  }

  // Also capture capitalized words / acronyms from original text (likely proper tech names)
  const original = jobDescription;
  const acronyms = original.match(/\b[A-Z]{2,6}(?:\.[A-Z]{2,6})?\b/g) || [];
  acronyms.forEach((a) => {
    const low = a.toLowerCase();
    if (!STOPWORDS.has(low) && low.length >= 2 && low.length <= 8) found.add(low);
  });

  // Frequency analysis for additional important nouns
  const freq = new Map<string, number>();
  tokens.forEach((t) => {
    if (STOPWORDS.has(t) || t.length < 3) return;
    freq.set(t, (freq.get(t) || 0) + 1);
  });
  // Top frequent terms that are not stopwords and appear 2+ times
  const sorted = Array.from(freq.entries())
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 25)
    .map(([w]) => w);
  sorted.forEach((w) => {
    if (w.length >= 4) found.add(w);
  });

  const all = Array.from(found);

  // Tier classification
  const critical: string[] = [];
  const important: string[] = [];
  const niceToHave: string[] = [];

  all.forEach((kw) => {
    const count = (text.match(new RegExp(`\\b${escapeReg(kw)}\\b`, 'g')) || []).length;
    if (KNOWN_HARD_SKILLS.has(kw)) {
      if (count >= 2) critical.push(kw);
      else important.push(kw);
    } else if (KNOWN_SOFT_SKILLS.has(kw)) {
      important.push(kw);
    } else if (count >= 3) {
      critical.push(kw);
    } else if (count >= 2) {
      important.push(kw);
    } else {
      niceToHave.push(kw);
    }
  });

  return {
    critical: dedupe(critical).slice(0, 15),
    important: dedupe(important).slice(0, 15),
    niceToHave: dedupe(niceToHave).slice(0, 10),
  };
}

function dedupe(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    if (!seen.has(a)) {
      seen.add(a);
      out.push(a);
    }
  }
  return out;
}

export function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractJobTitle(jd: string): string {
  // Try common patterns
  const patterns = [
    /(?:job title|position|role)\s*[:\-]\s*([^\n]{3,60})/i,
    /hiring\s+(?:a|an)\s+([A-Z][\w \-/]{3,50})/,
    /^([A-Z][\w \-/]{3,50})\s*\n/m,
  ];
  for (const p of patterns) {
    const m = jd.match(p);
    if (m) return m[1].trim().replace(/[.,;].*$/, '');
  }
  // Fallback: first capitalized phrase
  const first = jd.split('\n').find((l) => l.trim().length > 0 && l.trim().length < 80);
  return first?.trim() || 'Professional';
}
