import type { Course, WorkMode, ALPoints } from './types';

export const ALL_MODES: WorkMode[] = ['group', 'individual', 'discussion', 'fieldwork', 'lecture'];

/** Count weeks by work mode across the given courses. */
export function modeCounts(courses: Course[]): Record<WorkMode, number> {
  const counts = { group: 0, individual: 0, discussion: 0, fieldwork: 0, lecture: 0 };
  for (const c of courses) for (const w of c.weeks) counts[w.mode]++;
  return counts;
}

export function totalWeeks(courses: Course[]): number {
  return courses.reduce((n, c) => n + c.weeks.length, 0);
}

export function totalCredits(courses: Course[]): number {
  return courses.reduce((n, c) => n + (c.credits || 0), 0);
}

/** Weeks that involve working with others (group + discussion). */
export function collaborativeShare(courses: Course[]): number {
  const counts = modeCounts(courses);
  const total = totalWeeks(courses);
  if (!total) return 0;
  return Math.round(((counts.group + counts.discussion) / total) * 100);
}

/** Average AL points across courses (each course's points are percentages). */
export function averageAL(courses: Course[]): ALPoints {
  if (!courses.length) return { group: 0, discussion: 0, fieldwork: 0, presentation: 0 };
  const sum = courses.reduce(
    (acc, c) => ({
      group: acc.group + c.al.group,
      discussion: acc.discussion + c.al.discussion,
      fieldwork: acc.fieldwork + c.al.fieldwork,
      presentation: acc.presentation + c.al.presentation,
    }),
    { group: 0, discussion: 0, fieldwork: 0, presentation: 0 },
  );
  const n = courses.length;
  return {
    group: Math.round(sum.group / n),
    discussion: Math.round(sum.discussion / n),
    fieldwork: Math.round(sum.fieldwork / n),
    presentation: Math.round(sum.presentation / n),
  };
}

export function maxWeekCount(courses: Course[]): number {
  return courses.reduce((m, c) => Math.max(m, c.weeks.length), 0);
}
