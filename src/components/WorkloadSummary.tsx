import type { Course } from '../data/types';
import { ALL_MODES, modeCounts, totalWeeks, totalCredits, collaborativeShare, averageAL } from '../data/aggregate';
import { workModeColors, workModeLabels } from '../data/labels';
import { ALPointsChart } from './ALPointsChart';

interface Props {
  courses: Course[];
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 dark:bg-slate-800/60">
      <div className="text-2xl font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</div>
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      {sub && <div className="text-[11px] text-slate-400">{sub}</div>}
    </div>
  );
}

export function WorkloadSummary({ courses }: Props) {
  const counts = modeCounts(courses);
  const total = totalWeeks(courses);
  const collab = collaborativeShare(courses);

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Semester workload
          <span className="ml-2 text-sm font-normal text-slate-400">学期の負荷</span>
        </h2>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Courses ／ 科目" value={String(courses.length)} />
          <Stat label="Credits ／ 単位" value={String(totalCredits(courses))} />
          <Stat label="Class weeks ／ 週" value={String(total)} />
          <Stat label="Collaborative ／ 協働" value={`${collab}%`} sub="group + discussion" />
        </div>

        {/* Distribution bar */}
        <div className="mb-2 flex h-6 w-full overflow-hidden rounded-lg">
          {ALL_MODES.map((mode) =>
            counts[mode] > 0 ? (
              <div
                key={mode}
                className="h-full"
                style={{ width: `${(counts[mode] / total) * 100}%`, backgroundColor: workModeColors[mode] }}
                title={`${workModeLabels[mode].en}: ${counts[mode]} weeks`}
              />
            ) : null,
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {ALL_MODES.map((mode) => (
            <span key={mode} className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: workModeColors[mode] }} />
              {workModeLabels[mode].en} {counts[mode]}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
          Active learning
          <span className="ml-2 text-sm font-normal text-slate-400">平均AL</span>
        </h2>
        <ALPointsChart al={averageAL(courses)} size={150} />
      </div>
    </section>
  );
}
