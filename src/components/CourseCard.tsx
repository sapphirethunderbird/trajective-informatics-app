import type { Course } from '../data/types';
import { modeCounts } from '../data/aggregate';
import { workModeColors } from '../data/labels';

interface Props {
  course: Course;
  onOpen: (id: string) => void;
  onRemove: (id: string) => void;
}

export function CourseCard({ course, onOpen, onRemove }: Props) {
  const counts = modeCounts([course]);
  const group = counts.group + counts.discussion;

  return (
    <div className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <button
        onClick={() => onRemove(course.id)}
        className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full text-slate-300 hover:bg-slate-100 hover:text-red-500 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
        title="Remove ／ 削除"
        aria-label={`Remove ${course.titleEn || course.titleJa}`}
      >
        ✕
      </button>

      <button onClick={() => onOpen(course.id)} className="text-left">
        <div className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {course.term} · {course.schedule} · {course.credits} credits
        </div>
        <h3 className="mt-1 text-base font-semibold text-slate-800 hover:text-blue-600 dark:text-slate-100">
          {course.titleEn || course.titleJa}
        </h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">{course.titleJa}</div>
        <div className="mt-1 text-xs text-slate-400">{course.instructor}</div>
      </button>

      {/* mini mode strip */}
      <div className="mt-3 flex h-2 gap-0.5">
        {course.weeks.map((w) => (
          <div key={w.week} className="flex-1 rounded-sm" style={{ backgroundColor: workModeColors[w.mode] }} title={`W${w.week} ${w.title}`} />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>
          <span className="font-semibold" style={{ color: workModeColors.group }}>{group}</span> group/discussion ·{' '}
          <span className="font-semibold" style={{ color: workModeColors.individual }}>{counts.individual}</span> individual
        </span>
        <span className="text-slate-400">{course.weeks.length} wk</span>
      </div>

      {course.keywords.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {course.keywords.slice(0, 4).map((k) => (
            <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {k}
            </span>
          ))}
        </div>
      )}

      {course.parseWarnings.length > 0 && (
        <div className="mt-3 rounded-lg bg-amber-50 px-2 py-1 text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
          ⚠ partially parsed: {course.parseWarnings.join(', ')}
        </div>
      )}
    </div>
  );
}
