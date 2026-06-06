import type { CustomizationConfig } from '../types';
import { getTemplate } from './templateEngine';

export const DEFAULT_CUSTOMIZATION: CustomizationConfig = {
  pageFormat: 'Letter',
  dateFormat: 'MMM YYYY',
  uiLanguage: 'en',
  layoutMode: 'one',
  fontSize: 10.5,
  lineHeight: 1.4,
  marginLeftRight: 22,
  marginTopBottom: 14,
  spaceBetweenEntries: 0,
  entryLayout: 'standard',
  columnWidth: 'auto',
  titleSize: 24,
  subtitleSize: 12,
  fontFamily: 'Inter',
  fontCategory: 'sans',
  primaryColor: '#0f172a',
  accentColor: '#6366f1',
  accentTargets: {
    name: true,
    jobTitle: true,
    headings: true,
    headingLine: true,
    headerIcons: false,
    dotsBars: false,
    dates: false,
    subtitle: false,
    linkIcons: false,
  },
  headingStyle: 'underline',
  headingCapitalization: 'uppercase',
  headerAlignment: 'left',
  detailsArrangement: 'icon',
  iconStyle: 'circle',
  nameSize: 'M',
  nameBold: true,
  nameFont: 'body',
  profilePhoto: null,
  profilePhotoShape: 'circle',
};

/**
 * Derive a CustomizationConfig from a template's design so existing templates
 * still drive defaults — user can then override anything.
 */
export function customizationFromTemplate(templateId: string, overrides?: Partial<CustomizationConfig>): CustomizationConfig {
  const t = getTemplate(templateId);
  const base: CustomizationConfig = {
    ...DEFAULT_CUSTOMIZATION,
    primaryColor: t.theme.primary,
    accentColor: t.theme.primary,
    fontFamily: fontForTemplateFont(t.font),
    fontCategory: t.font?.startsWith('serif') ? 'serif' : t.font === 'mono-accent' ? 'mono' : 'sans',
    headingStyle: t.sectionStyle as CustomizationConfig['headingStyle'],
  };
  return { ...base, ...overrides };
}

function fontForTemplateFont(f?: string): string {
  switch (f) {
    case 'serif-executive': return 'Source Serif Pro';
    case 'serif-editorial': return 'EB Garamond';
    case 'mono-accent':     return 'JetBrains Mono';
    case 'display-bold':    return 'Inter';
    case 'sans-clean':      return 'Roboto';
    case 'sans-modern':
    default:                return 'Inter';
  }
}

/** Resolve a config for a resume, falling back to template-based defaults. */
export function getCustomization(resume: { templateId: string; customization?: CustomizationConfig }): CustomizationConfig {
  if (resume.customization) return resume.customization;
  return customizationFromTemplate(resume.templateId);
}

/* =========================
   FONT LIBRARY
========================= */

export interface FontMeta { name: string; stack: string; }

export const FONT_LIBRARY: Record<'serif' | 'sans' | 'mono', FontMeta[]> = {
  serif: [
    { name: 'Lora',                stack: '"Lora", Georgia, serif' },
    { name: 'Source Serif Pro',    stack: '"Source Serif Pro", Cambria, serif' },
    { name: 'Zilla Slab',          stack: '"Zilla Slab", Georgia, serif' },
    { name: 'PT Serif',            stack: '"PT Serif", Georgia, serif' },
    { name: 'Literata',            stack: '"Literata", Georgia, serif' },
    { name: 'EB Garamond',         stack: '"EB Garamond", Garamond, serif' },
    { name: 'Aleo',                stack: '"Aleo", Georgia, serif' },
    { name: 'Crimson Pro',         stack: '"Crimson Pro", Georgia, serif' },
    { name: 'Cormorant Garamond',  stack: '"Cormorant Garamond", Garamond, serif' },
    { name: 'Volkhov',             stack: '"Volkhov", Georgia, serif' },
    { name: 'Amiri',               stack: '"Amiri", Georgia, serif' },
    { name: 'Crimson Text',        stack: '"Crimson Text", Georgia, serif' },
    { name: 'Alegreya',            stack: '"Alegreya", Georgia, serif' },
    { name: 'Merriweather',        stack: '"Merriweather", Georgia, serif' },
  ],
  sans: [
    { name: 'Inter',               stack: '"Inter", "Helvetica Neue", Arial, sans-serif' },
    { name: 'Roboto',              stack: '"Roboto", Arial, sans-serif' },
    { name: 'Open Sans',           stack: '"Open Sans", Arial, sans-serif' },
    { name: 'Lato',                stack: '"Lato", Arial, sans-serif' },
    { name: 'Montserrat',          stack: '"Montserrat", Arial, sans-serif' },
    { name: 'Nunito',              stack: '"Nunito", Arial, sans-serif' },
    { name: 'Poppins',             stack: '"Poppins", Arial, sans-serif' },
    { name: 'Work Sans',           stack: '"Work Sans", Arial, sans-serif' },
    { name: 'Rubik',               stack: '"Rubik", Arial, sans-serif' },
    { name: 'IBM Plex Sans',       stack: '"IBM Plex Sans", Arial, sans-serif' },
    { name: 'DM Sans',             stack: '"DM Sans", Arial, sans-serif' },
    { name: 'Manrope',             stack: '"Manrope", Arial, sans-serif' },
  ],
  mono: [
    { name: 'JetBrains Mono',      stack: '"JetBrains Mono", Menlo, monospace' },
    { name: 'Fira Code',           stack: '"Fira Code", Menlo, monospace' },
    { name: 'IBM Plex Mono',       stack: '"IBM Plex Mono", Menlo, monospace' },
    { name: 'Source Code Pro',     stack: '"Source Code Pro", Menlo, monospace' },
    { name: 'Roboto Mono',         stack: '"Roboto Mono", Menlo, monospace' },
    { name: 'Inconsolata',         stack: '"Inconsolata", Menlo, monospace' },
  ],
};

export function resolveFontStack(family: string, category: 'serif' | 'sans' | 'mono'): string {
  const found = FONT_LIBRARY[category].find((f) => f.name === family);
  return found?.stack || FONT_LIBRARY[category][0].stack;
}

/* =========================
   COLOR PALETTE
========================= */

export const COLOR_PALETTE = [
  '#0f172a', '#1e293b', '#1e3a8a', '#1d4ed8', '#2563eb', '#0891b2',
  '#0d9488', '#059669', '#16a34a', '#a16207', '#b45309', '#dc2626',
  '#be123c', '#db2777', '#9333ea', '#7c3aed', '#6366f1', '#ea580c',
  '#475569', '#334155', '#000000', '#6b7280', '#0c1226', '#581c87',
];

export const NAME_SIZE_PT: Record<CustomizationConfig['nameSize'], number> = {
  XS: 18, S: 22, M: 26, L: 32, XL: 40,
};

/* =========================
   DATE FORMATTING (override)
========================= */

export function formatCustomDate(dateIso: string, format: CustomizationConfig['dateFormat']): string {
  if (!dateIso) return '';
  if (dateIso === 'Present') return 'Present';
  const m = dateIso.match(/^(\d{4})-(\d{1,2})(?:-(\d{1,2}))?$/);
  if (!m) return dateIso;
  const y = m[1];
  const mo = String(parseInt(m[2], 10)).padStart(2, '0');
  const d = m[3] ? String(parseInt(m[3], 10)).padStart(2, '0') : '01';
  const monthNamesLong = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const monthNamesShort = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  switch (format) {
    case 'DD/MM/YYYY':  return `${d}/${mo}/${y}`;
    case 'MM/DD/YYYY':  return `${mo}/${d}/${y}`;
    case 'YYYY-MM-DD':  return `${y}-${mo}-${d}`;
    case 'Month YYYY':  return `${monthNamesLong[parseInt(mo, 10) - 1]} ${y}`;
    case 'MMM YYYY':
    default:            return `${monthNamesShort[parseInt(mo, 10) - 1]} ${y}`;
  }
}

export function formatCustomRange(start: string, end: string, format: CustomizationConfig['dateFormat']): string {
  const s = formatCustomDate(start, format);
  const e = end === 'Present' ? 'Present' : formatCustomDate(end, format);
  if (!s && !e) return '';
  return `${s} – ${e}`;
}

/* =========================
   PAGE GEOMETRY
========================= */

export function pageWidthIn(format: 'A4' | 'Letter'): number {
  return format === 'A4' ? 8.27 : 8.5;
}
export function pageHeightIn(format: 'A4' | 'Letter'): number {
  return format === 'A4' ? 11.69 : 11;
}

/* Map nameSize letter → pt */
export function nameSizePt(c: CustomizationConfig): number {
  return c.titleSize || NAME_SIZE_PT[c.nameSize];
}
