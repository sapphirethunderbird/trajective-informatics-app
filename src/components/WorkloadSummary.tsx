import type { Course } from '../data/types';
import {
  ALL_MODES,
  modeCounts,
  totalWeeks,
  totalCredits,
  collaborativeShare,
  averageAL,
  needsTextbook,
} from '../data/aggregate';
import { workModeColors } from '../data/labels';
import { useLang } from '../i18n/lang';
import { ALPointsChart } from './ALPointsChart';

interface Props {
  courses: Course[];
}

/** One of the wireframe's dashboard pills. */
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
  const { t } = useLang();
  const counts = modeCounts(courses);
  const total = totalWeeks(courses);
  const collab = collaborativeShare(courses);
  const withTextbook = courses.filter(needsTextbook).length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">{t('semesterWorkload')}</h2>

      <div className="grid gap-5 lg:grid-cols-[1fr_auto]">
        <div>
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label={t('courses')} value={String(courses.length)} />
            <Stat label={t('credits')} value={String(totalCredits(courses))} />
            <Stat label={t('classWeeks')} value={String(total)} />
            <Stat label={t('collaborative')} value={`${collab}%`} sub={t('collaborativeSub')} />
            <Stat label={t('needsTextbook')} value={String(withTextbook)} sub="📕" />
          </div>

          {/* Distribution bar */}
          {total > 0 && (
            <>
              <div className="mb-2 flex h-6 w-full overflow-hidden rounded-lg">
                {ALL_MODES.map((mode) =>
                  counts[mode] > 0 ? (
                    <div
                      key={mode}
                      className="h-full"
                      style={{ width: `${(counts[mode] / total) * 100}%`, backgroundColor: workModeColors[mode] }}
                      title={`${t(`mode.${mode}`)}: ${counts[mode]}`}
                    />
                  ) : null,
                )}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {ALL_MODES.map((mode) => (
                  <span key={mode} className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: workModeColors[mode] }}
                    />
                    {t(`mode.${mode}`)} {counts[mode]}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-100 pt-4 dark:border-slate-800 lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <h3 className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">{t('activeLearning')}</h3>
          <ALPointsChart al={averageAL(courses)} size={130} />
        </div>
      </div>
    </section>
  );
}
