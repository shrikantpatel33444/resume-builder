import type { ResumeData, Experience, Education } from '../types';
import { emptyResume } from './sampleData';
import { cryptoRandomId } from './aiGenerator';

/* ============================================================
   FILE EXTRACTION
============================================================ */

interface RawTextItem {
  text: string;
  x: number;
  y: number;
  fontSize: number;
  bold: boolean;
}

interface ExtractResult {
  text: string;
  items: RawTextItem[]; // optional rich items (only PDFs)
}

async function extractPdf(file: File): Promise<ExtractResult> {
  const pdfjs: any = await import('pdfjs-dist/build/pdf.mjs');
  // Use the locally bundled worker first; fall back to CDN if not available.
  // This prevents parse failures when CDN is down or on slow connections.
  const localWorker = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url,
  ).toString();
  pdfjs.GlobalWorkerOptions.workerSrc = localWorker || `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;

  const allItems: RawTextItem[] = [];
  const allPages: string[] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const items = (content.items as any[])
      .filter((it) => it.str)
      .map((it) => {
        const tr = it.transform as number[];
        return {
          text: it.str as string,
          x: tr[4] as number,
          y: tr[5] as number,
          fontSize: Math.abs(tr[0] as number) || (it.height || 11),
          bold: /bold/i.test(it.fontName || ''),
          width: it.width || 0,
        };
      });

    // Bucket items into lines using Y tolerance ~ 40% of font size
    type Line = { y: number; items: typeof items };
    const lines: Line[] = [];
    items.forEach((it) => {
      const tol = Math.max(2.5, it.fontSize * 0.4);
      let line = lines.find((l) => Math.abs(l.y - it.y) <= tol);
      if (!line) {
        line = { y: it.y, items: [] };
        lines.push(line);
      }
      line.items.push(it);
    });

    // Sort lines top-to-bottom (higher y is up in PDF coords)
    lines.sort((a, b) => b.y - a.y);
    // Within each line, sort left-to-right; join with adaptive space
    const pageLines: string[] = lines.map((l) => {
      const sorted = l.items.sort((a, b) => a.x - b.x);
      let line = '';
      let prevEnd = -Infinity;
      sorted.forEach((it) => {
        const gap = it.x - prevEnd;
        if (line === '') line = it.text;
        else if (gap > it.fontSize * 0.45) line += '  ' + it.text;
        else if (gap > 0.5) line += ' ' + it.text;
        else line += it.text;
        prevEnd = it.x + (it as any).width;
      });
      return line.replace(/\s+/g, ' ').trim();
    });

    allPages.push(pageLines.filter(Boolean).join('\n'));

    // Capture rich items (used for name detection via font-size heuristic)
    lines.forEach((l) => {
      l.items.forEach((it) => {
        allItems.push({
          text: it.text,
          x: it.x,
          y: it.y - 10000 * (p - 1), // offset per page so global sort works
          fontSize: it.fontSize,
          bold: it.bold,
        });
      });
    });
  }

  return { text: allPages.join('\n\n'), items: allItems };
}

async function extractDocx(file: File): Promise<ExtractResult> {
  const mammoth: any = await import('mammoth/mammoth.browser');
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return { text: (result.value || '').replace(/\r/g, ''), items: [] };
}

export async function extractTextFromFile(file: File): Promise<ExtractResult> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return extractPdf(file);
  if (name.endsWith('.docx') || file.type.includes('officedocument.wordprocessingml')) return extractDocx(file);
  const text = await file.text();
  return { text, items: [] };
}

/* ============================================================
   REGEXES & CONSTANTS
============================================================ */

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/i;
const PHONE_RE = /(\+?\d[\d\s().\-]{7,}\d)/;
const LINKEDIN_RE = /(?:https?:\/\/)?(?:[\w.]+\.)?linkedin\.com\/(?:in|pub)\/[\w%\-_.]+\/?/i;
const GITHUB_RE = /(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+\/?/i;
const URL_RE = /(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?/gi;

const MONTH_NAMES = '(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t)?(?:ember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)';
const DATE_TOKEN = `(?:${MONTH_NAMES}\\.?\\s*\\d{4}|${MONTH_NAMES}\\.?\\s*['"]?\\d{2}|\\d{1,2}[\\/\\.]\\d{4}|\\d{1,2}[\\/\\.]\\d{1,2}[\\/\\.]\\d{2,4}|\\d{4}-\\d{2}|\\d{4})`;
const PRESENT = '(?:Present|present|Current|current|Now|now|Till\\s*date|To\\s*date|Ongoing|ongoing)';
const SEP = '(?:\\s*[\\-–—~›→]+\\s*|\\s+to\\s+|\\s+until\\s+)';
const DATE_RANGE_RE = new RegExp(`(${DATE_TOKEN})${SEP}(${DATE_TOKEN}|${PRESENT})`, 'i');
const DATE_SINGLE_RE = new RegExp(`(${DATE_TOKEN}|${PRESENT})`, 'i');

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

const SECTION_KEYS = {
  summary: [
    'summary', 'professional summary', 'profile', 'professional profile', 'career profile',
    'objective', 'career objective', 'about', 'about me', 'overview', 'personal statement',
    'executive summary', 'introduction',
  ],
  experience: [
    'experience', 'work experience', 'professional experience', 'employment', 'employment history',
    'career history', 'work history', 'professional background', 'relevant experience', 'industry experience',
    'work', 'career', 'positions held', 'professional career',
  ],
  education: [
    'education', 'academic background', 'academic qualifications', 'qualifications',
    'academics', 'educational background', 'academic history', 'educational qualifications',
    'training', 'academic credentials',
  ],
  skills: [
    'skills', 'technical skills', 'core skills', 'key skills', 'competencies', 'core competencies',
    'expertise', 'technologies', 'technical expertise', 'professional skills', 'areas of expertise',
    'specialties', 'specializations', 'tools', 'tools & technologies', 'technical proficiencies',
    'capabilities', 'skill set', 'skill highlights',
  ],
  projects: [
    'projects', 'personal projects', 'selected projects', 'key projects', 'side projects',
    'notable projects', 'project experience', 'academic projects', 'major projects', 'portfolio',
  ],
  certifications: [
    'certifications', 'certificates', 'licenses', 'licences', 'licenses & certifications',
    'licences & certifications', 'professional certifications', 'awards & certifications',
    'training & certifications', 'credentials', 'professional development',
  ],
  languages: ['languages', 'language proficiency', 'spoken languages', 'language skills'],
  awards: ['awards', 'achievements', 'honors', 'honours', 'recognition', 'accomplishments', 'awards & honors'],
  interests: ['interests', 'hobbies', 'interests & hobbies', 'personal interests'],
  publications: ['publications', 'research', 'papers', 'publications & research'],
  volunteer: ['volunteer', 'volunteering', 'volunteer experience', 'community involvement', 'community service'],
  references: ['references', 'referees'],
} as const;
type SectionKey = keyof typeof SECTION_KEYS;

/* ============================================================
   HELPERS
============================================================ */

function normalizeDate(token: string): string {
  if (!token) return '';
  const t = token.trim();
  if (/^(present|current|now|till\s*date|to\s*date|ongoing)$/i.test(t)) return 'Present';
  // YYYY-MM
  const ym = t.match(/^(\d{4})-(\d{1,2})$/);
  if (ym) return `${ym[1]}-${ym[2].padStart(2, '0')}`;
  // MM/YYYY or MM.YYYY
  const my = t.match(/^(\d{1,2})[\/\.](\d{4})$/);
  if (my) return `${my[2]}-${my[1].padStart(2, '0')}`;
  // DD/MM/YYYY or MM/DD/YYYY (ignore day)
  const dmy = t.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{2,4})$/);
  if (dmy) {
    const year = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    const month = parseInt(dmy[2], 10) > 12 ? dmy[1] : dmy[2];
    return `${year}-${month.padStart(2, '0')}`;
  }
  // Month YYYY or Month 'YY
  const mm = t.match(/^([A-Za-z]+)\.?\s*['"]?(\d{2,4})$/);
  if (mm) {
    const month = MONTHS[mm[1].toLowerCase()] || 1;
    let year = mm[2];
    if (year.length === 2) year = parseInt(year, 10) > 30 ? `19${year}` : `20${year}`;
    return `${year}-${String(month).padStart(2, '0')}`;
  }
  // Just YYYY
  const y = t.match(/^(\d{4})$/);
  if (y) return `${y[1]}-01`;
  return t;
}

function detectSectionKey(line: string): SectionKey | null {
  let norm = line.toLowerCase().replace(/[^a-z& ]/g, '').replace(/\s+/g, ' ').trim();
  if (!norm || norm.length > 45) return null;
  norm = norm.replace(/&/g, 'and');
  for (const [key, names] of Object.entries(SECTION_KEYS)) {
    if (names.some((n) => norm === n || norm === n.replace(/&/g, 'and'))) return key as SectionKey;
  }
  return null;
}

function looksLikeName(line: string): boolean {
  if (!line) return false;
  if (EMAIL_RE.test(line) || PHONE_RE.test(line) || /https?:\/\//i.test(line)) return false;
  if (/\d/.test(line)) return false;
  const words = line.split(/\s+/).filter(Boolean);
  if (words.length < 1 || words.length > 6) return false;
  if (line.length > 50 || line.length < 3) return false;
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ.,\-' ]+$/.test(line)) return false;
  // Skip section headings & common labels
  if (detectSectionKey(line)) return false;
  if (/^(curriculum vitae|resume|cv|profile)$/i.test(line.trim())) return false;
  // Mostly capitalized words OR ALL CAPS
  const isAllCaps = line === line.toUpperCase() && /[A-Z]/.test(line);
  if (isAllCaps && words.length >= 2 && words.length <= 5) return true;
  const capitalized = words.filter((w) => /^[A-ZÀ-Ö]/.test(w)).length;
  return capitalized >= Math.max(2, Math.floor(words.length * 0.6));
}

function cleanLine(s: string): string {
  return s.replace(/[\t\u00a0]+/g, ' ').replace(/\s{2,}/g, '  ').trim();
}

/* ============================================================
   SECTION SPLITTING
============================================================ */

interface Section {
  key: SectionKey | 'header' | 'other';
  title: string;
  lines: string[];
}

function splitIntoSections(text: string): Section[] {
  const lines = text.split(/\r?\n/).map(cleanLine);
  const sections: Section[] = [{ key: 'header', title: 'Header', lines: [] }];

  let i = 0;
  while (i < lines.length) {
    const raw = lines[i];
    if (!raw) {
      sections[sections.length - 1].lines.push('');
      i++;
      continue;
    }
    // Try direct match
    let key = detectSectionKey(raw);
    // Try with surrounding decoration removed
    if (!key) {
      const stripped = raw.replace(/[:|\-=_•●▪▶►\s]+$/g, '').replace(/^[:|\-=_•●▪▶►\s]+/g, '');
      key = detectSectionKey(stripped);
    }
    // Try first segment if line contains "EXPERIENCE   Software Engineer" style
    if (!key) {
      const firstSeg = raw.split(/\s{2,}|\t/)[0];
      if (firstSeg && firstSeg !== raw) key = detectSectionKey(firstSeg);
    }
    if (key) {
      sections.push({ key, title: raw, lines: [] });
    } else {
      sections[sections.length - 1].lines.push(raw);
    }
    i++;
  }
  return sections;
}

/* ============================================================
   HEADER (name + contact)
============================================================ */

function parseHeader(lines: string[], items?: RawTextItem[]) {
  const text = lines.join('\n');
  const email = text.match(EMAIL_RE)?.[0] || '';
  const phoneRaw = text.match(PHONE_RE)?.[0] || '';
  const phone = phoneRaw.replace(/\s{2,}/g, ' ').replace(/^\(\s*/, '(').trim();
  const linkedin = text.match(LINKEDIN_RE)?.[0]?.replace(/^https?:\/\/(?:www\.)?/, '') || '';
  const github = text.match(GITHUB_RE)?.[0]?.replace(/^https?:\/\/(?:www\.)?/, '') || '';

  // Portfolio: another URL that isn't email/linkedin/github
  let portfolio = '';
  const allUrls = text.match(URL_RE) || [];
  for (const u of allUrls) {
    const low = u.toLowerCase();
    if (low.includes('linkedin') || low.includes('github')) continue;
    if (low.includes('@')) continue;
    if (low.length < 5) continue;
    portfolio = u.replace(/^https?:\/\/(?:www\.)?/, '');
    break;
  }

  // Name detection strategies (in order)
  let fullName = '';

  // Strategy 1: Use the largest-font line near the top of the PDF
  if (items && items.length > 0) {
    const topItems = [...items].sort((a, b) => b.y - a.y).slice(0, 25);
    // Group same-line items by y
    const grouped = new Map<number, RawTextItem[]>();
    topItems.forEach((it) => {
      const key = Math.round(it.y / 2) * 2;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(it);
    });
    const candidates = Array.from(grouped.values()).map((g) => {
      const merged = g.sort((a, b) => a.x - b.x).map((x) => x.text).join(' ').replace(/\s+/g, ' ').trim();
      const avgFont = g.reduce((s, x) => s + x.fontSize, 0) / g.length;
      return { text: merged, font: avgFont };
    });
    candidates.sort((a, b) => b.font - a.font);
    for (const c of candidates) {
      if (looksLikeName(c.text)) { fullName = c.text; break; }
    }
  }

  // Strategy 2: First line that looks like a person's name
  if (!fullName) {
    for (const l of lines.slice(0, 12)) {
      if (looksLikeName(l)) { fullName = l; break; }
    }
  }
  // Strategy 3: First non-empty line stripped
  if (!fullName) {
    for (const l of lines.slice(0, 5)) {
      const stripped = l.replace(/^(name|full name)\s*[:\-]\s*/i, '').trim();
      if (stripped && stripped.length < 50 && !EMAIL_RE.test(stripped) && !PHONE_RE.test(stripped)) {
        fullName = stripped;
        break;
      }
    }
  }
  // Strategy 4: Header line has everything smushed together — take the text BEFORE the first email/phone/url
  if (!fullName) {
    for (const l of lines.slice(0, 5)) {
      if (!l) continue;
      const cutters = [l.search(EMAIL_RE), l.search(PHONE_RE), l.search(/https?:\/\//i)].filter((n) => n > 0);
      if (cutters.length > 0) {
        const cut = Math.min(...cutters);
        const candidate = l.slice(0, cut).replace(/[|·•,;\s]+$/g, '').trim();
        if (candidate && candidate.length >= 3 && candidate.length < 50 && looksLikeName(candidate)) {
          fullName = candidate;
          break;
        }
      }
    }
  }

  // Title-case ALL CAPS names
  if (fullName && fullName === fullName.toUpperCase()) {
    fullName = fullName.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Location detection
  let location = '';
  const KNOWN_COUNTRIES = ['USA','United States','UK','United Kingdom','India','Canada','Australia','Germany','France','Singapore','Malaysia','UAE','Dubai','Japan','Pakistan','Bangladesh','Sri Lanka','Nepal','Indonesia','Philippines','Vietnam','Thailand','China','South Africa','Nigeria','Kenya','Egypt','Saudi Arabia','Qatar','Spain','Italy','Netherlands','Belgium','Switzerland','Sweden','Norway','Denmark','Finland','Poland','Brazil','Mexico','Argentina','Ireland','New Zealand','Turkey'];
  for (const l of lines) {
    if (!l || l === fullName) continue;
    if (EMAIL_RE.test(l) || PHONE_RE.test(l) || /https?:\/\//i.test(l)) continue;
    if (l.length > 80) continue;
    if (/^(address|location)\s*[:\-]/i.test(l)) {
      location = l.replace(/^(address|location)\s*[:\-]\s*/i, '').trim();
      break;
    }
    if (KNOWN_COUNTRIES.some((c) => new RegExp(`\\b${c}\\b`, 'i').test(l))) { location = l; break; }
    if (/^[A-Z][A-Za-z .'-]+,\s*[A-Z][A-Za-z .'-]+(?:,\s*[A-Z][A-Za-z .'-]+)?$/.test(l)) { location = l; break; }
  }

  return { fullName, email, phone, linkedin, github, portfolio, location };
}

/* ============================================================
   EXPERIENCE PARSER
============================================================ */

function isBulletLike(line: string): boolean {
  return /^[•●▪■◆▶►·\-*–—◦›»]+\s+/.test(line) || /^\s*[-*]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^[•●▪■◆▶►·\-*–—◦›»]+\s*/, '').replace(/^\s*[-*]\s+/, '').trim();
}

function parseExperience(lines: string[]): Experience[] {
  const out: Experience[] = [];
  // Pass 1: identify "anchor lines" containing a date range. Each anchor starts a new entry.
  const anchors: { idx: number; start: string; end: string; current: boolean }[] = [];
  lines.forEach((l, i) => {
    const m = l.match(DATE_RANGE_RE);
    if (m) {
      const end = normalizeDate(m[2]);
      anchors.push({ idx: i, start: normalizeDate(m[1]), end, current: end === 'Present' });
    }
  });

  if (anchors.length === 0) {
    // Fallback: group by blank lines into entries
    const entries: string[][] = [];
    let cur: string[] = [];
    lines.forEach((l) => {
      if (!l) { if (cur.length) { entries.push(cur); cur = []; } }
      else cur.push(l);
    });
    if (cur.length) entries.push(cur);
    entries.forEach((entry) => {
      if (entry.length < 1) return;
      out.push({
        id: cryptoRandomId(),
        title: entry[0] || 'Role',
        company: entry[1] || '',
        location: '',
        startDate: '',
        endDate: '',
        current: false,
        bullets: entry.slice(2).map((b) => stripBullet(b)).filter(Boolean),
      });
    });
    return out;
  }

  // Build entries between anchors
  for (let a = 0; a < anchors.length; a++) {
    const anchor = anchors[a];
    const blockStart = a === 0 ? 0 : anchors[a - 1].idx + 1;
    const blockEnd = a + 1 < anchors.length ? anchors[a + 1].idx : lines.length;

    // Lines in this entry block: from previous anchor end (or section start) up to next anchor start
    const block = lines.slice(blockStart, blockEnd);
    const anchorLocalIdx = anchor.idx - blockStart;
    const anchorLine = lines[anchor.idx];

    // Title/company detection — look in a window around the anchor
    const ctx: string[] = [];
    for (let i = Math.max(0, anchorLocalIdx - 2); i <= Math.min(block.length - 1, anchorLocalIdx + 2); i++) {
      const v = block[i];
      if (v && !ctx.includes(v)) ctx.push(v);
    }
    const anchorWithoutDate = anchorLine.replace(DATE_RANGE_RE, '').replace(/[|·•,;]+\s*$/, '').trim();
    const nonBulletCtx = ctx.filter((l) => !isBulletLike(l) && !DATE_RANGE_RE.test(l));
    if (anchorWithoutDate) nonBulletCtx.unshift(anchorWithoutDate);

    let title = '';
    let company = '';
    let location = '';

    // Look for a candidate with separator "title — company" or "title at company"
    for (const c of nonBulletCtx) {
      const split = c.split(/\s+[\-–—|@,]\s+|\s+at\s+/i);
      if (split.length >= 2 && split[0].length < 60 && split[1].length < 60) {
        title = split[0].trim();
        company = split[1].trim();
        if (split[2] && split[2].length < 60) location = split[2].trim();
        break;
      }
    }
    // Otherwise use first two non-bullet lines (title then company)
    if (!title && nonBulletCtx.length > 0) title = nonBulletCtx[0].replace(/[|·•]+/g, '').trim();
    if (!company && nonBulletCtx.length > 1) company = nonBulletCtx[1].replace(/[|·•]+/g, '').trim();

    // If "company" looks more like a location (contains comma + caps short), swap
    if (company && !location && /^[A-Z][A-Za-z .'-]+,\s*[A-Z][A-Za-z .'-]+/.test(company) && company.length < 50) {
      location = company;
      company = nonBulletCtx[2] ? nonBulletCtx[2].trim() : '';
    }

    // Bullets: lines after the anchor up to blockEnd that are bullet-like, or simple statements
    const bulletLines: string[] = [];
    for (let i = anchor.idx + 1; i < blockEnd; i++) {
      const l = lines[i];
      if (!l) continue;
      if (DATE_RANGE_RE.test(l)) break;
      if (detectSectionKey(l)) break;
      // Skip if it looks like the title/company of next role with no date yet
      bulletLines.push(stripBullet(l));
    }

    // Merge wrapped bullets — if a line doesn't start with bullet AND prev was bullet, append
    const merged: string[] = [];
    let prevWasBullet = false;
    for (let i = anchor.idx + 1; i < blockEnd; i++) {
      const raw = lines[i];
      if (!raw) { prevWasBullet = false; continue; }
      if (DATE_RANGE_RE.test(raw) || detectSectionKey(raw)) break;
      if (isBulletLike(raw)) {
        merged.push(stripBullet(raw));
        prevWasBullet = true;
      } else if (prevWasBullet && merged.length > 0) {
        merged[merged.length - 1] += ' ' + raw;
      } else {
        // Treat standalone non-bullet sentence as bullet too
        if (raw.length > 10) merged.push(raw);
      }
    }

    out.push({
      id: cryptoRandomId(),
      title: (title || 'Role').replace(/\s+/g, ' ').slice(0, 100),
      company: (company || '').replace(/\s+/g, ' ').slice(0, 100),
      location: location.slice(0, 80),
      startDate: anchor.start,
      endDate: anchor.end,
      current: anchor.current,
      bullets: (merged.length ? merged : bulletLines).map((b) => b.trim()).filter((b) => b.length > 3),
    });
  }

  return out;
}

/* ============================================================
   EDUCATION PARSER
============================================================ */

const DEGREE_RE = /(bachelor|master|m\.?\s?sc|b\.?\s?sc|b\.?\s?a|m\.?\s?a|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\b|m\.?\s?e\b|ph\.?\s?d|phd|mba|bba|llb|llm|md|diploma|certificate|associate|hsc|ssc|high school|secondary)/i;
const SCHOOL_RE = /(university|institute|college|school|academy|polytechnic|college of)/i;

function parseEducation(lines: string[]): Education[] {
  const out: Education[] = [];
  // Strategy: scan and group by detecting either a degree word or a date range
  const anchors: number[] = [];
  lines.forEach((l, i) => {
    if (DEGREE_RE.test(l) || (DATE_RANGE_RE.test(l) && SCHOOL_RE.test([lines[i - 1], lines[i], lines[i + 1]].filter(Boolean).join(' ')))) {
      anchors.push(i);
    }
  });

  // Also single-date (graduation year) anchors when context has degree
  if (anchors.length === 0) {
    lines.forEach((l, i) => {
      if (DATE_SINGLE_RE.test(l) && (DEGREE_RE.test(l) || SCHOOL_RE.test(l))) anchors.push(i);
    });
  }

  if (anchors.length === 0) return out;

  for (let a = 0; a < anchors.length; a++) {
    const start = a === 0 ? 0 : anchors[a - 1] + 1;
    const end = a + 1 < anchors.length ? anchors[a + 1] : lines.length;
    const block = lines.slice(start, end).filter(Boolean);

    const blockText = block.join(' ');
    const rangeMatch = blockText.match(DATE_RANGE_RE);
    const singleMatch = !rangeMatch ? blockText.match(DATE_SINGLE_RE) : null;
    const startDate = rangeMatch ? normalizeDate(rangeMatch[1]) : '';
    const endDate = rangeMatch ? normalizeDate(rangeMatch[2]) : (singleMatch ? normalizeDate(singleMatch[0]) : '');

    let degree = '';
    let school = '';
    let location = '';
    for (const l of block) {
      if (!degree && DEGREE_RE.test(l)) degree = l.replace(DATE_RANGE_RE, '').replace(DATE_SINGLE_RE, '').replace(/[|,;]\s*$/, '').trim();
      else if (!school && SCHOOL_RE.test(l)) school = l.replace(DATE_RANGE_RE, '').replace(DATE_SINGLE_RE, '').replace(/[|,;]\s*$/, '').trim();
    }
    if (!degree) degree = block[0] || 'Degree';
    if (!school) school = block[1] || '';

    // Try to split "school, location"
    if (school && !location) {
      const parts = school.split(/,\s*/);
      if (parts.length >= 2 && parts[parts.length - 1].length < 40) {
        location = parts.pop()!.trim();
        school = parts.join(', ').trim();
      }
    }

    const gpaMatch = blockText.match(/(?:gpa|cgpa|grade)[:\s]*([0-9.]+(?:\s*\/\s*[0-9.]+)?)/i);
    out.push({
      id: cryptoRandomId(),
      degree: degree.slice(0, 120),
      school: school.slice(0, 120),
      location: location.slice(0, 80),
      startDate,
      endDate: endDate || startDate,
      gpa: gpaMatch?.[1],
    });
  }
  return out;
}

/* ============================================================
   SKILLS PARSER
============================================================ */

function parseSkills(lines: string[]) {
  const technical: string[] = [];
  const soft: string[] = [];
  const tools: string[] = [];
  const languages: string[] = [];

  const SOFT_HINTS = ['leadership','communication','teamwork','collaboration','problem-solving','problem solving','critical thinking','time management','adaptability','creativity','mentoring','presentation','organisation','organization','interpersonal','public speaking','negotiation','emotional intelligence'];
  const LANGUAGE_HINTS = ['english','spanish','french','german','mandarin','chinese','japanese','korean','arabic','hindi','urdu','bengali','tamil','telugu','marathi','gujarati','punjabi','malay','tagalog','vietnamese','thai','italian','portuguese','russian','dutch','turkish','swahili','native','fluent','conversational','proficient','intermediate','basic','beginner','advanced'];

  const fullText = lines.filter(Boolean).join('\n');
  // Detect explicit category groupings
  const matches = [...fullText.matchAll(/(^|\n)([A-Z][A-Za-z &\/]{1,30}):\s*([\s\S]*?)(?=(?:\n[A-Z][A-Za-z &\/]{1,30}:)|\n\n|$)/g)];
  if (matches.length >= 2) {
    matches.forEach((m) => {
      const label = m[2].toLowerCase();
      const content = m[3];
      const items = splitSkillItems(content);
      if (/(soft|interpersonal|people)/.test(label)) soft.push(...items);
      else if (/(tool|software|platform|environment|ide)/.test(label)) tools.push(...items);
      else if (/(language)/.test(label) && !/programming|technical/.test(label)) languages.push(...items);
      else technical.push(...items);
    });
  } else {
    // Flat list — split each line and classify per-item
    for (const raw of lines) {
      if (!raw) continue;
      let line = raw;
      const colonIdx = line.indexOf(':');
      let forcedBucket: 'tech' | 'soft' | 'tool' | 'lang' | null = null;
      if (colonIdx > 0 && colonIdx < 40) {
        const label = line.slice(0, colonIdx).toLowerCase();
        if (/(soft|interpersonal|people)/.test(label)) forcedBucket = 'soft';
        else if (/(tool|software|platform|environment|ide)/.test(label)) forcedBucket = 'tool';
        else if (/(language)/.test(label) && !/programming|technical/.test(label)) forcedBucket = 'lang';
        line = line.slice(colonIdx + 1);
      }
      const items = splitSkillItems(line);
      items.forEach((s) => {
        const low = s.toLowerCase();
        let bucket: 'tech' | 'soft' | 'tool' | 'lang' = forcedBucket || 'tech';
        if (!forcedBucket) {
          if (SOFT_HINTS.some((h) => low.includes(h))) bucket = 'soft';
          else if (LANGUAGE_HINTS.some((h) => low.includes(h)) && low.length < 30) bucket = 'lang';
        }
        if (bucket === 'soft') soft.push(s);
        else if (bucket === 'tool') tools.push(s);
        else if (bucket === 'lang') languages.push(s);
        else technical.push(s);
      });
    }
  }

  const dedupe = (arr: string[]) => {
    const seen = new Set<string>();
    const out: string[] = [];
    arr.forEach((a) => { const k = a.toLowerCase(); if (!seen.has(k) && a.trim()) { seen.add(k); out.push(a.trim()); } });
    return out;
  };
  return {
    technical: dedupe(technical).slice(0, 40),
    soft: dedupe(soft).slice(0, 15),
    tools: dedupe(tools).slice(0, 25),
    languages: dedupe(languages).slice(0, 12),
  };
}

function splitSkillItems(text: string): string[] {
  return text
    .split(/[,•·|;\n]| - |\s{3,}/)
    .map((s) => s.replace(/^[●▪■◆▶►\-*]+/g, '').replace(/\([^)]*\)/g, '').trim())
    .filter((s) => s.length >= 2 && s.length <= 50)
    .filter((s) => !/^(and|or|the|with|using)$/i.test(s));
}

/* ============================================================
   PROJECTS, CERTIFICATIONS
============================================================ */

function parseProjects(lines: string[]) {
  const out: { id: string; name: string; description: string; tech: string; link?: string }[] = [];
  let current: { id: string; name: string; description: string; tech: string; link?: string } | null = null;
  for (const line of lines) {
    if (!line) { continue; }
    const linkMatch = line.match(/(?:https?:\/\/)?[\w-]+\.[\w.\-/]+/);
    const looksLikeTitle = !isBulletLike(line) && line.length < 90 && !line.endsWith('.') && !/^(developed|built|created|designed|implemented)/i.test(line);
    if (looksLikeTitle && (!current || current.description.length > 20)) {
      if (current) out.push(current);
      current = { id: cryptoRandomId(), name: line.replace(/[|·•]+/g, '').trim(), description: '', tech: '', link: linkMatch?.[0] };
    } else if (current) {
      const cleaned = stripBullet(line);
      if (/^(tech|stack|tools|technologies)\s*[:\-]/i.test(cleaned)) {
        current.tech = cleaned.split(/[:\-]/).slice(1).join(':').trim();
      } else {
        current.description = (current.description ? current.description + ' ' : '') + cleaned;
      }
    }
  }
  if (current) out.push(current);
  return out.filter((p) => p.name && p.name.length > 1);
}

function parseCertifications(lines: string[]) {
  const out: { id: string; name: string; issuer: string; date: string }[] = [];
  for (const raw of lines) {
    if (!raw) continue;
    const dateMatch = raw.match(new RegExp(DATE_TOKEN, 'i'));
    const cleaned = stripBullet(raw);
    const withoutDate = cleaned.replace(new RegExp(DATE_TOKEN, 'gi'), '').replace(/[(),]/g, '').trim();
    const parts = withoutDate.split(/\s+[\-–—|]\s+|,\s+(?=[A-Z])/);
    if (!parts[0]) continue;
    out.push({
      id: cryptoRandomId(),
      name: parts[0].trim().slice(0, 120),
      issuer: (parts[1] || '').trim().slice(0, 80),
      date: dateMatch ? normalizeDate(dateMatch[0]) : '',
    });
  }
  return out;
}

/* ============================================================
   TOP-LEVEL
============================================================ */

export async function parseCv(file: File): Promise<{ resume: ResumeData; rawText: string }> {
  const { text, items } = await extractTextFromFile(file);
  const resume = parseResumeText(text, items);
  return { resume, rawText: text };
}

export function parseResumeText(text: string, items?: RawTextItem[]): ResumeData {
  const base = emptyResume();

  // Normalize text: collapse soft hyphens, etc.
  const normalized = text
    .replace(/\u00ad/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  const sections = splitIntoSections(normalized);

  const header = sections.find((s) => s.key === 'header');
  if (header) {
    const h = parseHeader(header.lines, items);
    base.contact = {
      fullName: h.fullName || base.contact.fullName,
      email: h.email,
      phone: h.phone,
      linkedin: h.linkedin,
      location: h.location,
      github: h.github,
      portfolio: h.portfolio,
    };
    // If summary section was missing, see if the header includes a paragraph after contact
    const paragraph = header.lines.filter((l) => l.length > 80).join(' ').trim();
    if (paragraph) base.summary = paragraph;
  }

  const summarySec = sections.find((s) => s.key === 'summary');
  if (summarySec) {
    base.summary = summarySec.lines.filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  // Merge all experience-related sections
  const expSecs = sections.filter((s) => s.key === 'experience');
  if (expSecs.length > 0) {
    base.experience = expSecs.flatMap((s) => parseExperience(s.lines));
  }

  const eduSec = sections.find((s) => s.key === 'education');
  if (eduSec) base.education = parseEducation(eduSec.lines);

  const skillSec = sections.find((s) => s.key === 'skills');
  if (skillSec) base.skills = parseSkills(skillSec.lines);

  const langSec = sections.find((s) => s.key === 'languages');
  if (langSec) {
    const parsed = parseSkills(langSec.lines);
    if (parsed.languages.length > 0) base.skills.languages = parsed.languages;
    else {
      base.skills.languages = langSec.lines
        .flatMap((l) => l.split(/[,•·|;]/))
        .map((s) => s.trim())
        .filter((s) => s.length > 1 && s.length < 40);
    }
  }

  const projSec = sections.find((s) => s.key === 'projects');
  if (projSec) base.projects = parseProjects(projSec.lines);

  const certSec = sections.find((s) => s.key === 'certifications');
  if (certSec) base.certifications = parseCertifications(certSec.lines);

  // Title
  base.title = base.contact.fullName ? `${base.contact.fullName} — Imported CV` : 'Imported CV';

  // Reasonable target job title from latest experience
  if (!base.targetJobTitle && base.experience.length > 0) {
    base.targetJobTitle = base.experience[0].title;
  }

  return base;
}
