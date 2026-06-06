export type Country =
  | 'USA'
  | 'UK'
  | 'Germany'
  | 'France'
  | 'Australia'
  | 'Canada'
  | 'India'
  | 'UAE'
  | 'Singapore'
  | 'Japan'
  | 'Malaysia'
  | 'International';

export interface ContactInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedin: string;
  location: string;
  github?: string;
  portfolio?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  bullets: string[];
}

export interface Education {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  tech: string;
  link?: string;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  date: string;
}

export type IconShape = 'link' | 'square' | 'rounded' | 'circle' | 'diamond' | 'rectangle';
export type HeadingStyleId =
  | 'underline'
  | 'bar'
  | 'pill'
  | 'plain'
  | 'double'
  | 'boxed'
  | 'numbered'
  | 'left-rule'
  | 'background';

export interface CustomizationConfig {
  // Basics
  pageFormat: 'A4' | 'Letter';
  dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'Month YYYY' | 'MMM YYYY';
  uiLanguage: string;
  // Layout
  layoutMode: 'one' | 'two' | 'mix';
  fontSize: number;            // 8 – 16 pt
  lineHeight: number;          // 1.0 – 2.0
  marginLeftRight: number;     // 0 – 40 mm
  marginTopBottom: number;     // 0 – 30 mm
  spaceBetweenEntries: number; // -10 .. +20 pt
  entryLayout: 'standard' | 'compact' | 'split' | 'icon';
  columnWidth: 'auto' | 'manual';
  titleSize: number;           // 16 – 48 pt (name)
  subtitleSize: number;        // 10 – 20 pt (section title)
  // Design
  fontFamily: string;
  fontCategory: 'serif' | 'sans' | 'mono';
  primaryColor: string;
  accentColor: string;
  accentTargets: {
    name: boolean;
    jobTitle: boolean;
    headings: boolean;
    headingLine: boolean;
    headerIcons: boolean;
    dotsBars: boolean;
    dates: boolean;
    subtitle: boolean;
    linkIcons: boolean;
  };
  headingStyle: HeadingStyleId;
  headingCapitalization: 'capitalize' | 'uppercase' | 'normal';
  // Personal details
  headerAlignment: 'left' | 'center' | 'right';
  detailsArrangement: 'lines' | 'dotted' | 'icon' | 'bullet' | 'bar';
  iconStyle: IconShape;
  nameSize: 'XS' | 'S' | 'M' | 'L' | 'XL';
  nameBold: boolean;
  nameFont: 'body' | 'creative';
  profilePhoto: string | null; // data URL
  profilePhotoShape: 'circle' | 'square' | 'rounded';
}

export interface ResumeData {
  id: string;
  title: string;
  contact: ContactInfo;
  summary: string;
  experience: Experience[];
  education: Education[];
  skills: {
    technical: string[];
    soft: string[];
    tools: string[];
    languages: string[];
  };
  projects: Project[];
  certifications: Certification[];
  jobDescription: string;
  targetJobTitle: string;
  country: Country;
  templateId: string;
  customization?: CustomizationConfig;
  /** Order of sections in the preview, used by the Sections accordion */
  sectionOrder?: string[];
  /** Sections hidden from the preview */
  hiddenSections?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface KeywordTier {
  critical: string[];
  important: string[];
  niceToHave: string[];
}

export interface ATSParameter {
  id: string;
  name: string;
  score: number;
  max: number;
  issues: string[];
  suggestions: string[];
}

export interface ATSReport {
  total: number;
  max: number;
  percent: number;
  parameters: ATSParameter[];
  keywords: KeywordTier;
  matchedKeywords: string[];
  missingKeywords: string[];
  compatibility: { system: string; ok: boolean }[];
}
