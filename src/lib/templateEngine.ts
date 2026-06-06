/* ============================================================
   SMARTCV PRO — TEMPLATE GENERATION ENGINE (500+ templates)
   ============================================================
   Templates are config-driven (not hand-coded React).
   Each template = unique combination of:
     layout × colorTheme × typography × sectionStyle × headerStyle
   With deterministic naming + computed scoring.
============================================================ */

export type LayoutFlavor =
  | 'single'              // Compact ATS single column
  | 'sidebar-left'
  | 'sidebar-right'
  | 'centered'
  | 'header-card'
  | 'split-header'
  | 'monogram'
  | 'timeline'
  | 'accent-strip-left'
  | 'accent-strip-top'
  | 'magazine'
  | 'card-stack'
  | 'hybrid-header-side'
  | 'compact-ats'
  | 'executive-banner';

export type HeaderStyle =
  | 'classic'   // Name + contact line
  | 'banner'    // Big bold name w/ rule
  | 'gradient'  // Gradient background card
  | 'monogram'  // Initials circle
  | 'split'     // Two-tone half-width header
  | 'minimal'   // Tiny label + huge name
  | 'boxed'     // Bordered card around contact
  | 'mega'      // Editorial XL display name
  | 'tag';      // Tagline below name, no rules

export type SectionStyle =
  | 'underline'
  | 'bar'
  | 'pill'
  | 'plain'
  | 'double'
  | 'boxed'
  | 'numbered'
  | 'left-rule';

export type FontFamily =
  | 'sans-modern'    // Inter / Helvetica
  | 'sans-clean'     // System sans
  | 'serif-executive'// Georgia / Cambria
  | 'serif-editorial'// Source Serif
  | 'mono-accent'    // Sans body + mono headings
  | 'display-bold';  // Heavy display

export type ColorTheme = {
  id: string;
  name: string;
  primary: string;
  secondary?: string;
  textOnPrimary: string; // '#fff' or '#000'
};

export type TemplateCategory =
  | 'ATS Professional'
  | 'Corporate Executive'
  | 'Modern Professional'
  | 'Minimalist'
  | 'Creative Designer'
  | 'Technology & IT'
  | 'Engineering'
  | 'Finance & Banking'
  | 'Healthcare'
  | 'Education'
  | 'Government'
  | 'Logistics & Supply Chain'
  | 'Manufacturing'
  | 'Sales & Marketing'
  | 'Hospitality'
  | 'Construction'
  | 'Research & Academic'
  | 'Student & Graduate'
  | 'Freelancer & Consultant'
  | 'International CV';

export type CountryTag =
  | 'New Zealand' | 'Australia' | 'United States' | 'Canada' | 'United Kingdom'
  | 'Singapore' | 'Malaysia' | 'Japan' | 'Germany' | 'Netherlands' | 'UAE' | 'Global ATS Standard';

export interface TemplateScores {
  ats: number;
  readability: number;
  recruiter: number;
  executive: number;
  modern: number;
}

export interface Template {
  id: string;
  name: string;
  tier: 'free' | 'premium';
  description: string;
  category: TemplateCategory;
  country: CountryTag;
  layout: LayoutFlavor;
  headerStyle: HeaderStyle;
  sectionStyle: SectionStyle;
  font: FontFamily;
  theme: ColorTheme;
  /** Convenience aliases (used by older callers) */
  accent: string;
  accent2?: string;
  scores: TemplateScores;
}

/* ===================== COLOR THEMES ===================== */

export const COLOR_THEMES: ColorTheme[] = [
  { id: 'navy',        name: 'Navy Blue',       primary: '#0f172a',                                 textOnPrimary: '#fff' },
  { id: 'royal',       name: 'Royal Blue',      primary: '#1d4ed8',                                 textOnPrimary: '#fff' },
  { id: 'sapphire',    name: 'Sapphire',        primary: '#1e3a8a', secondary: '#3b82f6',           textOnPrimary: '#fff' },
  { id: 'emerald',     name: 'Emerald',         primary: '#059669',                                 textOnPrimary: '#fff' },
  { id: 'forest',      name: 'Forest Green',    primary: '#14532d',                                 textOnPrimary: '#fff' },
  { id: 'mint',        name: 'Mint',            primary: '#047857', secondary: '#6ee7b7',           textOnPrimary: '#fff' },
  { id: 'teal',        name: 'Teal',            primary: '#0d9488',                                 textOnPrimary: '#fff' },
  { id: 'cyan',        name: 'Cyan',            primary: '#0891b2', secondary: '#67e8f9',           textOnPrimary: '#fff' },
  { id: 'purple',      name: 'Royal Purple',    primary: '#7c3aed',                                 textOnPrimary: '#fff' },
  { id: 'plum',        name: 'Plum',            primary: '#6b21a8', secondary: '#c084fc',           textOnPrimary: '#fff' },
  { id: 'indigo',      name: 'Indigo',          primary: '#4f46e5', secondary: '#a78bfa',           textOnPrimary: '#fff' },
  { id: 'burgundy',    name: 'Burgundy',        primary: '#9f1239',                                 textOnPrimary: '#fff' },
  { id: 'crimson',     name: 'Crimson',         primary: '#b91c1c',                                 textOnPrimary: '#fff' },
  { id: 'rose',        name: 'Rose',            primary: '#be123c', secondary: '#fb7185',           textOnPrimary: '#fff' },
  { id: 'coral',       name: 'Coral',           primary: '#fb7185', secondary: '#fda4af',           textOnPrimary: '#fff' },
  { id: 'sakura',      name: 'Sakura',          primary: '#db2777',                                 textOnPrimary: '#fff' },
  { id: 'charcoal',    name: 'Charcoal',        primary: '#1f2937',                                 textOnPrimary: '#fff' },
  { id: 'slate',       name: 'Slate',           primary: '#334155',                                 textOnPrimary: '#fff' },
  { id: 'graphite',    name: 'Graphite',        primary: '#475569',                                 textOnPrimary: '#fff' },
  { id: 'mono',        name: 'Black & White',   primary: '#000000',                                 textOnPrimary: '#fff' },
  { id: 'gold-exec',   name: 'Gold Executive',  primary: '#0b0f19', secondary: '#d4a017',           textOnPrimary: '#fff' },
  { id: 'platinum',    name: 'Platinum',        primary: '#334155', secondary: '#94a3b8',           textOnPrimary: '#fff' },
  { id: 'bronze',      name: 'Bronze',          primary: '#78350f', secondary: '#c2a060',           textOnPrimary: '#fff' },
  { id: 'amber',       name: 'Amber',           primary: '#b45309', secondary: '#fbbf24',           textOnPrimary: '#fff' },
  { id: 'orange',      name: 'Orange Creative', primary: '#ea580c',                                 textOnPrimary: '#fff' },
  { id: 'sunset',      name: 'Sunset',          primary: '#f97316', secondary: '#fbbf24',           textOnPrimary: '#fff' },
  { id: 'aurora',      name: 'Aurora',          primary: '#4f46e5', secondary: '#ec4899',           textOnPrimary: '#fff' },
  { id: 'midnight',    name: 'Midnight Cyan',   primary: '#0c1226', secondary: '#22d3ee',           textOnPrimary: '#fff' },
  { id: 'ocean',       name: 'Ocean',           primary: '#0369a1', secondary: '#7dd3fc',           textOnPrimary: '#fff' },
  { id: 'wine',        name: 'Wine',            primary: '#581c87',                                 textOnPrimary: '#fff' },
];

/* ===================== STATIC OPTIONS ===================== */

const LAYOUTS: LayoutFlavor[] = [
  'single', 'sidebar-left', 'sidebar-right', 'centered',
  'header-card', 'split-header', 'monogram', 'timeline',
  'accent-strip-left', 'accent-strip-top', 'magazine',
  'card-stack', 'hybrid-header-side', 'compact-ats', 'executive-banner',
];

const HEADER_STYLES: HeaderStyle[] = ['classic','banner','gradient','monogram','split','minimal','boxed','mega','tag'];
const SECTION_STYLES: SectionStyle[] = ['underline','bar','pill','plain','double','boxed','numbered','left-rule'];
const FONTS: FontFamily[] = ['sans-modern','sans-clean','serif-executive','serif-editorial','mono-accent','display-bold'];

const CATEGORIES: TemplateCategory[] = [
  'ATS Professional','Corporate Executive','Modern Professional','Minimalist','Creative Designer',
  'Technology & IT','Engineering','Finance & Banking','Healthcare','Education','Government',
  'Logistics & Supply Chain','Manufacturing','Sales & Marketing','Hospitality','Construction',
  'Research & Academic','Student & Graduate','Freelancer & Consultant','International CV',
];

const COUNTRIES: CountryTag[] = [
  'Global ATS Standard','United States','United Kingdom','Canada','Australia','New Zealand',
  'Singapore','Malaysia','Japan','Germany','Netherlands','UAE',
];

/* ===================== NAME POOLS ===================== */

const CITY_NAMES = [
  'Stockholm','Oslo','Copenhagen','Helsinki','Reykjavik','Amsterdam','Brussels','Zurich','Geneva',
  'Vienna','Prague','Lisbon','Madrid','Barcelona','Rome','Milan','Munich','Berlin','Frankfurt','Hamburg',
  'Paris','London','Edinburgh','Dublin','Athens','Istanbul','Cairo','Casablanca','Tel Aviv','Riyadh',
  'Dubai','Abu Dhabi','Doha','Kuwait','Muscat','Manama','Mumbai','Delhi','Bangalore','Chennai',
  'Hyderabad','Kolkata','Pune','Karachi','Lahore','Dhaka','Colombo','Kathmandu','Bangkok','Manila',
  'Jakarta','Hanoi','Saigon','Singapore','Kuala Lumpur','Penang','Tokyo','Kyoto','Osaka','Seoul',
  'Busan','Beijing','Shanghai','Shenzhen','Hong Kong','Taipei','Sydney','Melbourne','Brisbane','Perth',
  'Auckland','Wellington','Christchurch','Vancouver','Toronto','Montreal','Ottawa','Calgary','Quebec',
  'Boston','Manhattan','Brooklyn','Chicago','Austin','Denver','Seattle','Portland','Miami','Atlanta',
  'Houston','Dallas','Phoenix','Detroit','Philadelphia','Nashville','Charlotte','San Diego','San Jose',
  'Sacramento','Minneapolis','Pittsburgh','Cleveland','Honolulu','Anchorage','Mexico City','Bogota',
  'Lima','Santiago','Quito','Caracas','Sao Paulo','Rio','Brasilia','Buenos Aires','Montevideo',
  'Asuncion','Havana','Panama','San Jose CR','Cape Town','Johannesburg','Pretoria','Nairobi',
  'Addis Ababa','Lagos','Accra','Dakar','Marrakech','Tunis','Algiers','Riga','Vilnius','Tallinn',
  'Warsaw','Krakow','Budapest','Bucharest','Sofia','Belgrade','Zagreb','Sarajevo','Ljubljana',
  'Bratislava','Kyiv','Minsk','Moscow','Saint Petersburg','Tbilisi','Yerevan','Baku','Astana',
  'Tashkent','Almaty','Ulaanbaatar','Lhasa','Macau','Cebu','Davao','Surabaya','Bandung','Yangon',
  'Phnom Penh','Vientiane','Dushanbe','Bishkek',
];

const VARIANT_TAGS = [
  'Pro','Elite','Lux','Bold','Sleek','Vivid','Lite','Compact','Quartz','Pearl','Frost','Marine',
  'Steel','Linen','Velvet','Ember','Onyx','Ivory','Mint','Slate','Plum','Coral','Aurora','Crimson',
  'Indigo','Bronze','Platinum','Gold','Granite','Marble','Eclipse','Horizon','Vertex','Apex','Cobalt',
  'Sterling','Beacon','Summit','Atlas','Nova','Prism','Halo','Vista','Loft','Studio','Atelier',
  'Origin','Forge','Canvas','Edge','Pulse','Drift','Echo','Helix',
];

/* ===================== HELPERS ===================== */

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, Math.round(n)));

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function computeScores(t: Pick<Template, 'layout' | 'font' | 'sectionStyle' | 'headerStyle' | 'theme'>): TemplateScores {
  // ATS — single-column wins; sidebars and magazine penalised but never below 75
  let ats = 96;
  if (t.layout === 'compact-ats') ats = 100;
  else if (['single', 'accent-strip-left', 'accent-strip-top', 'centered', 'executive-banner', 'timeline'].includes(t.layout)) ats = 96;
  else if (['header-card', 'monogram'].includes(t.layout)) ats = 92;
  else if (['split-header', 'sidebar-left', 'sidebar-right', 'hybrid-header-side', 'card-stack'].includes(t.layout)) ats = 86;
  else if (t.layout === 'magazine') ats = 82;
  if (t.font === 'serif-executive' || t.font === 'serif-editorial') ats -= 1;
  if (t.font === 'display-bold') ats -= 3;
  if (t.font === 'mono-accent') ats -= 1;
  if (t.headerStyle === 'mega' || t.headerStyle === 'boxed') ats -= 1;

  // Modern Design
  let modern = 65;
  if (['header-card', 'split-header', 'accent-strip-top', 'magazine', 'card-stack', 'hybrid-header-side', 'monogram'].includes(t.layout)) modern += 15;
  if (t.theme.secondary) modern += 8;
  if (t.font === 'display-bold' || t.font === 'mono-accent') modern += 7;
  if (t.headerStyle === 'gradient' || t.headerStyle === 'mega') modern += 6;
  if (t.sectionStyle === 'pill' || t.sectionStyle === 'boxed' || t.sectionStyle === 'numbered') modern += 4;

  // Executive Presence
  let executive = 60;
  if (t.font === 'serif-executive' || t.font === 'serif-editorial') executive += 15;
  if (['centered', 'executive-banner', 'timeline', 'header-card', 'monogram'].includes(t.layout)) executive += 10;
  if (/0f172a|1f2937|0b0f19|78350f|92400e|0c1226|000000|581c87/i.test(t.theme.primary)) executive += 10;
  if (t.theme.secondary && /d4a017|c2a060|fbbf24|94a3b8/i.test(t.theme.secondary)) executive += 5;

  // Readability
  let readability = 86;
  if (t.sectionStyle === 'underline' || t.sectionStyle === 'bar' || t.sectionStyle === 'left-rule') readability += 5;
  if (t.layout === 'compact-ats' || t.layout === 'single') readability += 4;
  if (t.font === 'sans-clean' || t.font === 'sans-modern') readability += 3;
  if (t.font === 'display-bold') readability -= 3;
  if (t.headerStyle === 'mega') readability -= 2;

  // Recruiter Appeal — weighted avg
  const recruiter = Math.round(ats * 0.35 + readability * 0.3 + modern * 0.2 + executive * 0.15);

  return {
    ats: clamp(ats, 78, 100),
    modern: clamp(modern, 60, 100),
    executive: clamp(executive, 60, 100),
    readability: clamp(readability, 75, 100),
    recruiter: clamp(recruiter, 75, 100),
  };
}

function makeTemplate(input: Omit<Template, 'scores' | 'accent' | 'accent2'>): Template {
  const scores = computeScores(input);
  return {
    ...input,
    accent: input.theme.primary,
    accent2: input.theme.secondary,
    scores,
  };
}

/* ===================== SEED (curated marquee templates) ===================== */

function seed(
  id: string, name: string, layout: LayoutFlavor, themeId: string, category: TemplateCategory,
  opts: Partial<Pick<Template, 'tier' | 'description' | 'country' | 'font' | 'headerStyle' | 'sectionStyle'>> = {}
): Template {
  const theme = COLOR_THEMES.find((t) => t.id === themeId) || COLOR_THEMES[0];
  return makeTemplate({
    id,
    name,
    tier: opts.tier || 'premium',
    description: opts.description || `${name} — ${category}, ${theme.name} accent, ${layout.replace(/-/g, ' ')} layout.`,
    category,
    country: opts.country || 'Global ATS Standard',
    layout,
    headerStyle: opts.headerStyle || 'classic',
    sectionStyle: opts.sectionStyle || 'underline',
    font: opts.font || 'sans-modern',
    theme,
  });
}

const SEED_TEMPLATES: Template[] = [
  // — Free essentials —
  seed('classic-pro', 'Classic Pro', 'single', 'charcoal', 'ATS Professional', { tier: 'free', description: 'Timeless single-column design — recruiter favorite.' }),
  seed('modern-minimal', 'Modern Minimal', 'single', 'ocean', 'Minimalist', { tier: 'free', description: 'Clean, whitespace-focused layout.' }),
  seed('tech-stack', 'Tech Stack', 'accent-strip-left', 'purple', 'Technology & IT', { tier: 'free' }),
  seed('fresh-graduate', 'Fresh Graduate', 'single', 'emerald', 'Student & Graduate', { tier: 'free' }),
  seed('global-standard', 'Global Standard', 'single', 'graphite', 'International CV', { tier: 'free' }),
  seed('stockholm', 'Stockholm', 'sidebar-left', 'teal', 'Modern Professional', { tier: 'free', description: 'Dark teal sidebar — FlowCV-style modern look.' }),
  seed('athens', 'Athens', 'centered', 'slate', 'Minimalist', { tier: 'free' }),
  seed('compact-ats', 'Compact ATS', 'compact-ats', 'mono', 'ATS Professional', { tier: 'free', description: 'Maximum density single-column — 100% ATS guaranteed.' }),
  seed('european-cv', 'European CV', 'single', 'royal', 'International CV', { tier: 'free', country: 'Germany' }),
  seed('canadian-pro', 'Canadian Pro', 'single', 'crimson', 'ATS Professional', { tier: 'free', country: 'Canada' }),

  // — Premium designer flagships —
  seed('onyx', 'Onyx', 'header-card', 'gold-exec', 'Corporate Executive', { headerStyle: 'gradient', sectionStyle: 'bar', description: 'Bold black header card with gold accent — luxe & modern.' }),
  seed('aurora', 'Aurora', 'header-card', 'aurora', 'Creative Designer', { headerStyle: 'gradient', sectionStyle: 'bar' }),
  seed('coral', 'Coral', 'sidebar-left', 'coral', 'Creative Designer', { headerStyle: 'classic' }),
  seed('nordic', 'Nordic', 'single', 'navy', 'Minimalist', { font: 'serif-editorial' }),
  seed('marble', 'Marble', 'timeline', 'bronze', 'Corporate Executive', { font: 'serif-executive', sectionStyle: 'plain' }),
  seed('pulse', 'Pulse', 'accent-strip-left', 'cyan', 'Technology & IT', { font: 'mono-accent', sectionStyle: 'plain' }),
  seed('ivory', 'Ivory', 'centered', 'bronze', 'Corporate Executive', { font: 'serif-editorial', sectionStyle: 'double' }),
  seed('editor', 'Editor', 'magazine', 'purple', 'Creative Designer', { headerStyle: 'mega', sectionStyle: 'plain' }),
  seed('tokyo', 'Tokyo', 'accent-strip-left', 'crimson', 'International CV', { country: 'Japan' }),
  seed('vienna', 'Vienna', 'timeline', 'sapphire', 'Corporate Executive'),
  seed('monogram-pro', 'Monogram Pro', 'monogram', 'amber', 'Corporate Executive', { headerStyle: 'monogram', sectionStyle: 'bar' }),
  seed('cairo', 'Cairo', 'split-header', 'teal', 'International CV', { country: 'UAE', headerStyle: 'split', sectionStyle: 'pill' }),
  seed('lisbon', 'Lisbon', 'accent-strip-top', 'sunset', 'Creative Designer', { headerStyle: 'gradient' }),
  seed('helsinki', 'Helsinki', 'sidebar-left', 'ocean', 'Modern Professional'),
  seed('midnight', 'Midnight', 'header-card', 'midnight', 'Technology & IT', { headerStyle: 'gradient', sectionStyle: 'bar' }),
  seed('sakura', 'Sakura', 'centered', 'sakura', 'Creative Designer', { font: 'serif-editorial' }),
  seed('porto', 'Porto', 'split-header', 'sapphire', 'Modern Professional', { headerStyle: 'split', sectionStyle: 'pill' }),

  // — Industry premium —
  seed('executive-elite', 'Executive Elite', 'centered', 'navy', 'Corporate Executive', { font: 'serif-executive' }),
  seed('creative-canvas', 'Creative Canvas', 'accent-strip-top', 'sakura', 'Creative Designer', { headerStyle: 'gradient' }),
  seed('german-lebenslauf', 'German Lebenslauf', 'single', 'crimson', 'International CV', { country: 'Germany' }),
  seed('british-cv', 'British CV', 'single', 'royal', 'International CV', { country: 'United Kingdom', font: 'serif-executive' }),
  seed('dubai-professional', 'Dubai Professional', 'header-card', 'amber', 'International CV', { country: 'UAE', headerStyle: 'gradient' }),
  seed('silicon-valley', 'Silicon Valley', 'accent-strip-top', 'royal', 'Technology & IT'),
  seed('healthcare-hero', 'Healthcare Hero', 'single', 'teal', 'Healthcare'),
  seed('academic-scholar', 'Academic Scholar', 'single', 'wine', 'Research & Academic', { font: 'serif-executive' }),
  seed('sales-champion', 'Sales Champion', 'accent-strip-top', 'orange', 'Sales & Marketing'),
  seed('two-column-modern', 'Two-Column Modern', 'sidebar-left', 'indigo', 'Modern Professional'),
  seed('kl-modern', 'KL Modern', 'sidebar-left', 'rose', 'International CV', { country: 'Malaysia' }),
  seed('brussels', 'Brussels', 'accent-strip-top', 'royal', 'Modern Professional'),
  seed('amsterdam', 'Amsterdam', 'hybrid-header-side', 'mint', 'Modern Professional', { country: 'Netherlands', headerStyle: 'banner', sectionStyle: 'bar' }),
  seed('singapore-pro', 'Singapore Pro', 'sidebar-right', 'forest', 'International CV', { country: 'Singapore' }),
  seed('auckland', 'Auckland', 'single', 'forest', 'International CV', { country: 'New Zealand' }),
  seed('sydney-edge', 'Sydney Edge', 'card-stack', 'cyan', 'Modern Professional', { country: 'Australia', headerStyle: 'banner' }),
  seed('manhattan-elite', 'Manhattan Elite', 'executive-banner', 'mono', 'Corporate Executive', { headerStyle: 'mega', font: 'serif-executive' }),
  seed('zurich-bank', 'Zurich Bank', 'single', 'navy', 'Finance & Banking', { font: 'serif-executive', sectionStyle: 'left-rule' }),
  seed('houston-energy', 'Houston Energy', 'header-card', 'amber', 'Engineering', { headerStyle: 'banner', sectionStyle: 'bar' }),
  seed('mit-research', 'MIT Research', 'single', 'wine', 'Research & Academic', { font: 'serif-executive', sectionStyle: 'numbered' }),
  seed('oxford-don', 'Oxford Don', 'centered', 'wine', 'Research & Academic', { font: 'serif-editorial', sectionStyle: 'double' }),
  seed('shopify-modern', 'Shopify Modern', 'sidebar-right', 'mint', 'Technology & IT', { headerStyle: 'banner' }),
  seed('aws-cloud', 'AWS Cloud', 'accent-strip-left', 'amber', 'Technology & IT', { font: 'mono-accent' }),
  seed('govlink', 'GovLink', 'single', 'navy', 'Government', { sectionStyle: 'left-rule' }),
  seed('logistics-pro', 'Logistics Pro', 'single', 'graphite', 'Logistics & Supply Chain'),
  seed('factory-floor', 'Factory Floor', 'single', 'graphite', 'Manufacturing', { sectionStyle: 'left-rule' }),
  seed('hotel-concierge', 'Hotel Concierge', 'centered', 'bronze', 'Hospitality', { font: 'serif-editorial' }),
  seed('site-engineer', 'Site Engineer', 'accent-strip-left', 'orange', 'Construction'),
  seed('freelancer-studio', 'Freelancer Studio', 'card-stack', 'plum', 'Freelancer & Consultant', { headerStyle: 'banner', sectionStyle: 'boxed' }),
  seed('consultant-grid', 'Consultant Grid', 'magazine', 'navy', 'Freelancer & Consultant', { font: 'serif-executive' }),
  seed('campus-debut', 'Campus Debut', 'single', 'emerald', 'Student & Graduate', { tier: 'free' }),
  seed('intern-launch', 'Intern Launch', 'sidebar-left', 'cyan', 'Student & Graduate'),
  seed('teacher-classic', 'Teacher Classic', 'single', 'sapphire', 'Education', { font: 'serif-executive' }),
  seed('professor-pillar', 'Professor Pillar', 'timeline', 'wine', 'Education', { font: 'serif-executive', sectionStyle: 'plain' }),
  seed('nurse-care', 'Nurse Care', 'single', 'teal', 'Healthcare', { sectionStyle: 'bar' }),
  seed('surgeon-elite', 'Surgeon Elite', 'centered', 'navy', 'Healthcare', { font: 'serif-executive' }),
  seed('cfo-board', 'CFO Board', 'executive-banner', 'navy', 'Finance & Banking', { headerStyle: 'mega', font: 'serif-executive' }),
  seed('cmo-launch', 'CMO Launch', 'magazine', 'orange', 'Sales & Marketing', { headerStyle: 'mega' }),
  seed('ceo-empire', 'CEO Empire', 'executive-banner', 'gold-exec', 'Corporate Executive', { headerStyle: 'gradient', font: 'serif-executive' }),
  seed('cto-build', 'CTO Build', 'header-card', 'midnight', 'Technology & IT', { headerStyle: 'gradient', sectionStyle: 'bar', font: 'mono-accent' }),
];

/* ===================== PROCEDURAL GENERATOR ===================== */

interface PrimePicker { (i: number, m: number): number; }
const prime: PrimePicker = (i, m) => (i * 2654435761) % m; // Knuth multiplicative hash

function generateProcedural(count: number, startIndex = 0): Template[] {
  const out: Template[] = [];

  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;

    const layout = LAYOUTS[prime(idx + 7, LAYOUTS.length)];
    const theme = COLOR_THEMES[prime(idx + 13, COLOR_THEMES.length)];
    const headerStyle = HEADER_STYLES[prime(idx + 23, HEADER_STYLES.length)];
    const sectionStyle = SECTION_STYLES[prime(idx + 41, SECTION_STYLES.length)];
    const font = FONTS[prime(idx + 59, FONTS.length)];
    const category = CATEGORIES[prime(idx + 71, CATEGORIES.length)];
    const country = COUNTRIES[prime(idx + 89, COUNTRIES.length)];

    const city = CITY_NAMES[prime(idx + 101, CITY_NAMES.length)];
    const variant = VARIANT_TAGS[prime(idx + 127, VARIANT_TAGS.length)];
    const name = `${city} ${variant}`;
    const id = `${slugify(city)}-${slugify(variant)}-${idx}`;

    // Premium gating: rotate by index, leave roughly 25% as free
    const tier: 'free' | 'premium' = idx % 4 === 0 ? 'free' : 'premium';

    out.push(
      makeTemplate({
        id,
        name,
        tier,
        description: `${name} · ${category.toLowerCase()} · ${theme.name.toLowerCase()} accent · ${layout.replace(/-/g, ' ')} layout.`,
        category,
        country,
        layout,
        headerStyle,
        sectionStyle,
        font,
        theme,
      })
    );
  }

  return out;
}

/* ===================== ASSEMBLY ===================== */

function dedupeByIdAndName(list: Template[]): Template[] {
  const seenId = new Set<string>();
  const seenName = new Set<string>();
  const out: Template[] = [];
  for (const t of list) {
    if (seenId.has(t.id) || seenName.has(t.name)) continue;
    seenId.add(t.id);
    seenName.add(t.name);
    out.push(t);
  }
  return out;
}

const _procedural = generateProcedural(540, 0);
export const TEMPLATES: Template[] = dedupeByIdAndName([...SEED_TEMPLATES, ..._procedural]).slice(0, 520);

export function getTemplate(id: string): Template {
  return TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];
}

export const TEMPLATE_CATEGORIES = CATEGORIES;
export const TEMPLATE_COUNTRIES = COUNTRIES;
export const TEMPLATE_LAYOUTS = LAYOUTS;
