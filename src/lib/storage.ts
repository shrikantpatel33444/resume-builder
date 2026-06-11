import type { ResumeData } from '../types';
import { MAX_SCORE_HISTORY } from './constants';

const KEY         = 'smartcv_resumes_v1';
const HISTORY_KEY = 'smartcv_score_history_v1';
const APPS_KEY    = 'smartcv_applications_v1';

// ---- Safe localStorage helpers ----

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(key, value);
    return { ok: true };
  } catch (e: any) {
    // QuotaExceededError
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      return { ok: false, error: 'Storage full. Please delete old resumes to free space.' };
    }
    return { ok: false, error: e?.message || 'Storage error' };
  }
}

// ---- Resume CRUD ----

export function loadResumes(): ResumeData[] {
  try {
    const raw = safeGet(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResume(r: ResumeData): { ok: boolean; error?: string } {
  const list = loadResumes();
  const idx  = list.findIndex((x) => x.id === r.id);
  if (idx >= 0) list[idx] = r;
  else list.unshift(r);
  return safeSet(KEY, JSON.stringify(list));
}

export function deleteResume(id: string): void {
  const list = loadResumes().filter((r) => r.id !== id);
  safeSet(KEY, JSON.stringify(list));
}

export function getResume(id: string): ResumeData | undefined {
  return loadResumes().find((r) => r.id === id);
}

// ---- Score history ----

export interface ScoreHistory { date: number; score: number; resumeId: string; }

export function recordScore(resumeId: string, score: number): void {
  try {
    const raw  = safeGet(HISTORY_KEY);
    const list: ScoreHistory[] = raw ? JSON.parse(raw) : [];
    list.push({ date: Date.now(), score, resumeId });
    // Keep only the latest MAX_SCORE_HISTORY entries; trim silently
    const trimmed = list.slice(-MAX_SCORE_HISTORY);
    safeSet(HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // noop — history is non-critical
  }
}

export function loadScoreHistory(): ScoreHistory[] {
  try {
    const raw = safeGet(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ---- Application tracker ----

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';
  resumeId?: string;
  date: number;
  notes?: string;
}

export function loadApplications(): JobApplication[] {
  try {
    const raw = safeGet(APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApplication(a: JobApplication): { ok: boolean; error?: string } {
  const list = loadApplications();
  const idx  = list.findIndex((x) => x.id === a.id);
  if (idx >= 0) list[idx] = a;
  else list.unshift(a);
  return safeSet(APPS_KEY, JSON.stringify(list));
}

export function deleteApplication(id: string): void {
  const list = loadApplications().filter((x) => x.id !== id);
  safeSet(APPS_KEY, JSON.stringify(list));
}
