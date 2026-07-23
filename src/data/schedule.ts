import type { Course } from './types';

/** Weekday columns of the timetable grid, in 曜日時限 order. */
export const DAYS = ['月', '火', '水', '木', '金'] as const;
export const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const;

/** The university timetable runs 1〜8 (four 90-minute blocks of two periods). */
export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export interface Slot {
  day: number; // index into DAYS
  periods: number[]; // 1-based, ascending
}

/** One 曜日時限 entry: a weekday followed by a period or a period range. */
const SLOT_RE = /([月火水木金土日])\s*(\d+)(?:\s*[~〜～\-−–]\s*(\d+))?/g;

/**
 * Parse a 曜日時限 string such as `火1〜2`, `月3〜4`, or `月1,水3〜4` into grid
 * slots. Values with no weekday/period (集中, 応談, empty) yield no slots, and
 * 土/日 are dropped — the grid only shows the weekday columns.
 */
export function parseSchedule(raw: string): Slot[] {
  if (!raw) return [];
  // Full-width digits and the wave dash both appear across template versions.
  const text = raw.normalize('NFKC');
  const slots: Slot[] = [];
  for (const m of text.matchAll(SLOT_RE)) {
    const day = DAYS.indexOf(m[1] as (typeof DAYS)[number]);
    if (day === -1) continue; // 土/日 — outside the grid
    const from = Number(m[2]);
    const to = m[3] ? Number(m[3]) : from;
    if (!from || from > to) continue;
    const periods: number[] = [];
    for (let p = from; p <= to; p++) if (PERIODS.includes(p as (typeof PERIODS)[number])) periods.push(p);
    if (periods.length) slots.push({ day, periods });
  }
  return slots;
}

/** True when the course has no place on the weekday grid (集中講義 etc.). */
export function isUnscheduled(course: Course): boolean {
  return parseSchedule(course.schedule).length === 0;
}

/** True when two courses occupy the same weekday and period. */
export function conflicts(a: Course, b: Course): boolean {
  const bs = parseSchedule(b.schedule);
  if (!bs.length) return false;
  return parseSchedule(a.schedule).some((sa) =>
    bs.some((sb) => sa.day === sb.day && sa.periods.some((p) => sb.periods.includes(p))),
  );
}

/** Periods actually used by these courses, so the grid can hide empty rows.
 *  Falls back to 1〜6 when nothing is scheduled, to keep the grid recognisable. */
export function usedPeriods(courses: Course[]): number[] {
  const used = new Set<number>();
  for (const c of courses) for (const s of parseSchedule(c.schedule)) for (const p of s.periods) used.add(p);
  if (!used.size) return [1, 2, 3, 4, 5, 6];
  const max = Math.max(...used);
  return PERIODS.filter((p) => p <= Math.max(max, 4));
}
