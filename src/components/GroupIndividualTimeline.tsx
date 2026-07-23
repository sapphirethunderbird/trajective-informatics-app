import { useState } from 'react';
import type { Course, WeekPlan } from '../data/types';
import { workModeColors } from '../data/labels';
import { maxWeekCount } from '../data/aggregate';
import { Legend } from './Legend';
import { useLang } from '../i18n/lang';

interface Props {
  courses: Course[];
  onSelectCourse?: (id: string) => void;
}

interface Hover {
  course: string;
  week: WeekPlan;
}

export function GroupIndividualTimeline({ courses, onSelectCourse }: Props) {
  const { t, courseTitle } = useLang();
  const [hover, setHover] = useState<Hover | null>(null);
  const cols = Math.max(maxWeekCount(courses), 16);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-1 flex items-baseline justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('timelineTitle')}
        </h2>
        <span className="text-xs text-slate-400">{t('weeksArrow')}</span>
      </div>
      <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
        {t('timelineIntro')}
      </p>

      <div className="overflow-x-auto">
        <div className="min-w-[640px]">
          {/* Week number header */}
          <div className="mb-1 flex items-center gap-2">
            <div className="w-40 shrink-0" />
            <div className="grid flex-1 gap-1" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
              {Array.from({ length: cols }, (_, i) => (
                <div key={i} className="text-center text-[10px] text-slate-400">
                  {i + 1}
                </div>
              ))}
            </div>
          </div>

          {courses.map((course) => (
            <div key={course.id} className="mb-1 flex items-center gap-2">
              <button
                onClick={() => onSelectCourse?.(course.id)}
                className="w-40 shrink-0 truncate text-left text-sm font-medium text-slate-700 hover:text-blue-600 dark:text-slate-200 dark:hover:text-blue-400"
                title={`${courseTitle(course)} · ${course.titleJa}`}
              >
                {courseTitle(course)}
              </button>
              <div
                className="grid flex-1 gap-1"
                style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
              >
                {Array.from({ length: cols }, (_, i) => {
                  const week = course.weeks.find((w) => w.week === i + 1);
                  if (!week) return <div key={i} className="h-7 rounded-sm bg-slate-100 dark:bg-slate-800" />;
                  const active = hover?.course === course.id && hover.week.week === week.week;
                  return (
                    <div
                      key={i}
                      onMouseEnter={() => setHover({ course: course.id, week })}
                      onMouseLeave={() => setHover(null)}
                      className={`h-7 cursor-default rounded-sm transition-transform ${active ? 'scale-110 ring-2 ring-slate-900/40 dark:ring-white/50' : ''}`}
                      style={{ backgroundColor: workModeColors[week.mode] }}
                      title={`W${week.week} ${week.title} — ${t(`mode.${week.mode}`)}`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <Legend />
        <div className="min-h-[2.5rem] text-sm">
          {hover ? (
            <div className="rounded-lg bg-slate-50 px-3 py-1.5 dark:bg-slate-800">
              <span className="font-semibold" style={{ color: workModeColors[hover.week.mode] }}>
                W{hover.week.week} · {t(`mode.${hover.week.mode}`)}
              </span>
              <span className="ml-2 text-slate-700 dark:text-slate-200">{hover.week.title}</span>
              {hover.week.content && (
                <span className="ml-2 text-slate-400">{hover.week.content.replace(/\n/g, ' · ')}</span>
              )}
            </div>
          ) : (
            <span className="text-slate-400">{t('hoverHint')}</span>
          )}
        </div>
      </div>
    </section>
  );
}
