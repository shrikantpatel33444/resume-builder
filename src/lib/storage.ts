import type { ResumeData } from '../types';

const KEY = 'smartcv_resumes_v1';
const HISTORY_KEY = 'smartcv_score_history_v1';

export function loadResumes(): ResumeData[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResume(r: ResumeData) {
  const list = loadResumes();
  const idx = list.findIndex((x) => x.id === r.id);
  if (idx >= 0) list[idx] = r;
  else list.unshift(r);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function deleteResume(id: string) {
  const list = loadResumes().filter((r) => r.id !== id);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function getResume(id: string): ResumeData | undefined {
  return loadResumes().find((r) => r.id === id);
}

export interface ScoreHistory { date: number; score: number; resumeId: string; }

export function recordScore(resumeId: string, score: number) {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const list: ScoreHistory[] = raw ? JSON.parse(raw) : [];
    list.push({ date: Date.now(), score, resumeId });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(-50)));
  } catch {
    // noop
  }
}

export function loadScoreHistory(): ScoreHistory[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Application tracker
export interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: 'wishlist' | 'applied' | 'interview' | 'offer' | 'rejected';
  resumeId?: string;
  date: number;
  notes?: string;
}

const APPS_KEY = 'smartcv_applications_v1';

export function loadApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(APPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveApplication(a: JobApplication) {
  const list = loadApplications();
  const idx = list.findIndex((x) => x.id === a.id);
  if (idx >= 0) list[idx] = a;
  else list.unshift(a);
  localStorage.setItem(APPS_KEY, JSON.stringify(list));
}

export function deleteApplication(id: string) {
  const list = loadApplications().filter((x) => x.id !== id);
  localStorage.setItem(APPS_KEY, JSON.stringify(list));
}
