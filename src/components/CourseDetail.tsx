import type { Course } from '../data/types';
import { fieldLabels, workModeColors, workModeLabels } from '../data/labels';
import { ALPointsChart } from './ALPointsChart';
import { Legend } from './Legend';

interface Props {
  course: Course;
  onBack: () => void;
}

function Field({ k, value }: { k: keyof typeof fieldLabels; value: string }) {
  if (!value) return null;
  const l = fieldLabels[k];
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">
        {l.en} <span className="text-slate-300 dark:text-slate-600">{l.ja}</span>
      </dt>
      <dd className="text-sm text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}

export function CourseDetail({ course, onBack }: Props) {
  return (
    <div className="space-y-5">
      <button onClick={onBack} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
        ← Back to dashboard ／ 一覧へ
      </button>

      <header className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {course.faculty} · {course.year} · {course.term}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">
          {course.titleEn || course.titleJa}
        </h1>
        <div className="text-slate-500 dark:text-slate-400">{course.titleJa}</div>

        <dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <Field k="schedule" value={course.schedule} />
          <Field k="credits" value={String(course.credits)} />
          <Field k="language" value={course.language} />
          <Field k="targetYear" value={course.targetYear} />
          <Field k="instructor" value={course.instructor} />
          <Field k="contact" value={course.contact} />
        </dl>
      </header>

      {(course.overview || course.goals) && (
        <section className="grid gap-4 md:grid-cols-2">
          {course.overview && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
                {fieldLabels.overview.en} <span className="text-sm font-normal text-slate-400">{fieldLabels.overview.ja}</span>
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{course.overview}</p>
            </div>
          )}
          {course.goals && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
                {fieldLabels.goals.en} <span className="text-sm font-normal text-slate-400">{fieldLabels.goals.ja}</span>
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">{course.goals}</p>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Weekly plan */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800 dark:text-slate-100">
              {fieldLabels.weeks.en} <span className="text-sm font-normal text-slate-400">{fieldLabels.weeks.ja}</span>
            </h2>
          </div>
          <Legend />
          <ol className="mt-3 space-y-1">
            {course.weeks.map((w) => (
              <li key={w.week} className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                <span className="mt-0.5 w-8 shrink-0 text-right text-sm tabular-nums text-slate-400">{w.week}</span>
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: workModeColors[w.mode] }}
                  title={workModeLabels[w.mode].en}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {w.title}
                    <span className="ml-2 text-xs font-normal" style={{ color: workModeColors[w.mode] }}>
                      {workModeLabels[w.mode].en}
                    </span>
                  </div>
                  {w.content && <div className="text-xs text-slate-500 dark:text-slate-400">{w.content.replace(/\n/g, ' · ')}</div>}
                  {w.outsideStudy && <div className="text-[11px] text-slate-400">⌛ {w.outsideStudy}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Side: AL + grading + keywords */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
              {fieldLabels.al.en} <span className="text-sm font-normal text-slate-400">{fieldLabels.al.ja}</span>
            </h2>
            <ALPointsChart al={course.al} size={140} />
          </div>

          {course.grading.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-3 font-semibold text-slate-800 dark:text-slate-100">
                {fieldLabels.grading.en} <span className="text-sm font-normal text-slate-400">{fieldLabels.grading.ja}</span>
              </h2>
              <ul className="space-y-2">
                {course.grading.map((g) => (
                  <li key={g.label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-200">{g.label}</span>
                      <span className="font-medium tabular-nums text-slate-800 dark:text-slate-100">{g.percent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-blue-500" style={{ width: `${g.percent}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {course.keywords.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">
                {fieldLabels.keywords.en} <span className="text-sm font-normal text-slate-400">{fieldLabels.keywords.ja}</span>
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {course.keywords.map((k) => (
                  <span key={k} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {k}
                  </span>
                ))}
              </div>
              {course.related.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-400">{fieldLabels.related.en} ／ {fieldLabels.related.ja}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300">{course.related.join('、')}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
