import { useMemo } from 'react';
import type { Course, WorkMode } from '../data/types';
import { modeCounts, needsTextbook, ALL_MODES } from '../data/aggregate';
import { workModeColors } from '../data/labels';
import { DAYS, DAY_LABELS_EN, parseSchedule, usedPeriods } from '../data/schedule';
import type { Requirement } from '../data/store';
import { useLang } from '../i18n/lang';

interface Props {
  courses: Course[];
  tags: Record<string, Requirement>;
  onSelectCourse: (id: string) => void;
}

/** The work mode a course spends most of its weeks in — colours its cell. */
function dominantMode(course: Course): WorkMode {
  const counts = modeCounts([course]);
  return ALL_MODES.reduce((best, m) => (counts[m] > counts[best] ? m : best), ALL_MODES[0]);
}

export function WeeklySchedule({ courses, tags, onSelectCourse }: Props) {
  const { t, lang, courseTitle } = useLang();
  const periods = useMemo(() => usedPeriods(courses), [courses]);

  /** cells[day][period] — several courses can share a slot across terms. */
  const cells = useMemo(() => {
    const map = new Map<string, Course[]>();
    for (const c of courses) {
      for (const slot of parseSchedule(c.schedule)) {
        for (const p of slot.periods) {
          const key = `${slot.day}-${p}`;
          map.set(key, [...(map.get(key) ?? []), c]);
        }
      }
    }
    return map;
  }, [courses]);

  const unscheduled = useMemo(() => courses.filter((c) => parseSchedule(c.schedule).length === 0), [courses]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">{t('weeklySchedule')}</h2>

      {courses.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">{t('emptySchedule')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] table-fixed border-separate border-spacing-1">
            <thead>
              <tr>
                <th className="w-8" />
                {DAYS.map((d, i) => (
                  <th key={d} className="pb-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                    {lang === 'ja' ? d : DAY_LABELS_EN[i]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p}>
                  <th className="text-right align-middle text-xs font-normal tabular-nums text-slate-400">{p}</th>
                  {DAYS.map((_, day) => {
                    const here = cells.get(`${day}-${p}`) ?? [];
                    if (!here.length) {
                      return (
                        <td key={day} className="h-16 rounded-lg bg-slate-50 dark:bg-slate-800/50" />
                      );
                    }
                    return (
                      <td key={day} className="h-16 align-top">
                        <div className="flex h-full flex-col gap-1">
                          {here.map((c) => {
                            const mode = dominantMode(c);
                            return (
                              <button
                                key={c.id}
                                onClick={() => onSelectCourse(c.id)}
                                title={`${courseTitle(c)} · ${c.term} · ${c.instructor}`}
                                className="flex min-h-0 flex-1 flex-col justify-center overflow-hidden rounded-lg border-l-4 bg-slate-50 px-1.5 py-1 text-left transition-colors hover:bg-slate-100 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                                style={{ borderLeftColor: workModeColors[mode] }}
                              >
                                <span className="line-clamp-2 text-[11px] font-medium leading-tight text-slate-800 dark:text-slate-100">
                                  {courseTitle(c)}
                                </span>
                                <span className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-400">
                                  {tags[c.id] === '必修' && (
                                    <span className="rounded bg-rose-100 px-1 text-rose-700 dark:bg-rose-900/60 dark:text-rose-200">
                                      必
                                    </span>
                                  )}
                                  {needsTextbook(c) && <span title={t('needsTextbook')}>📕</span>}
                                  <span className="truncate">{c.term}</span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {unscheduled.length > 0 && (
        <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
          <h3 className="mb-1 text-xs font-medium text-slate-400">{t('noGridSlot')}</h3>
          <div className="flex flex-wrap gap-1.5">
            {unscheduled.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectCourse(c.id)}
                className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-300"
              >
                {courseTitle(c)}
                {c.schedule && <span className="ml-1 text-slate-400">{c.schedule}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
