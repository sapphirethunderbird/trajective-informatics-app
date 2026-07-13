import type { Course } from './types';

const KEY = 'syllabus-dashboard.courses.v1';

export function loadCourses(): Course[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Course[]) : [];
  } catch {
    return [];
  }
}

export function saveCourses(courses: Course[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(courses));
  } catch {
    // Storage full or unavailable — non-fatal; courses remain in memory.
  }
}
