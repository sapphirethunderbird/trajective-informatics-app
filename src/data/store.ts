import type { Course } from './types';

const KEY = 'syllabus-dashboard.courses.v2';
const LEGACY_KEY = 'syllabus-dashboard.courses.v1';
const TAGS_KEY = 'syllabus-dashboard.tags.v1';

/** Fields added after v1 — backfilled so older saved courses stay usable. */
function migrate(course: Partial<Course>): Course {
  return {
    ...(course as Course),
    division: course.division ?? '',
    textbooks: course.textbooks ?? [],
    textbookNote: course.textbookNote ?? '',
    referenceNote: course.referenceNote ?? '',
  };
}

function readArray(key: string): unknown[] | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function loadCourses(): Course[] {
  const stored = readArray(KEY) ?? readArray(LEGACY_KEY);
  if (!stored) return [];
  return stored.map((c) => migrate(c as Partial<Course>));
}

export function saveCourses(courses: Course[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(courses));
  } catch {
    // Storage full or unavailable — non-fatal; courses remain in memory.
  }
}

// ---- User tags -----------------------------------------------------------

/** 必修/選択 is not printed in these syllabus PDFs, so students set it themselves. */
export type Requirement = '必修' | '選択' | '自由';

export const REQUIREMENTS: Requirement[] = ['必修', '選択', '自由'];

export type Tags = Record<string, Requirement>;

export function loadTags(): Tags {
  try {
    const raw = localStorage.getItem(TAGS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? (parsed as Tags) : {};
  } catch {
    return {};
  }
}

export function saveTags(tags: Tags): void {
  try {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  } catch {
    // Non-fatal — tags stay in memory for this session.
  }
}
