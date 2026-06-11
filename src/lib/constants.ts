// ============================================================
// App-wide named constants — replaces all magic numbers
// ============================================================

// Storage limits
export const MAX_HISTORY_ENTRIES = 30;
export const MAX_SCORE_HISTORY   = 50;
export const MAX_SKILLS_TECHNICAL = 20;
export const MAX_SKILLS_SOFT      = 10;
export const MAX_SKILLS_TOOLS     = 25;
export const MAX_SKILLS_LANGUAGES = 12;

// ATS scoring thresholds
export const MIN_KEYWORD_MATCH_RATIO = 0.6;
export const ATS_DOWNLOAD_THRESHOLD  = 90;
export const ATS_AUTOFIX_TARGET      = 95;
export const MAX_KEYWORD_STUFFING    = 5;
export const MIN_KEYWORDS_IN_SUMMARY = 5;
export const MIN_BULLET_POINTS       = 3;
export const MAX_BULLET_POINTS       = 6;
export const MAX_EXPERIENCE_ENTRIES_FOR_TRIM = 3;
export const EMPLOYMENT_GAP_MONTHS   = 6;

// AI / API limits
export const GROQ_MAX_TOKENS      = 4096;
export const COVER_LETTER_BULLETS = 4;
export const MAX_KEYWORDS_FOR_AI  = 10;
export const MAX_AI_AUTOFIX_ITERS = 6;

// UI limits
export const RESUME_TITLE_MAX_LENGTH = 100;
export const MAX_FEATURED_TEMPLATES  = 9;
