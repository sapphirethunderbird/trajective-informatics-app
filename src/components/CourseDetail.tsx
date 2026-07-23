import type { Course } from '../data/types';
import { fieldLabels, workModeColors } from '../data/labels';
import { useLang } from '../i18n/lang';
import { ALPointsChart } from './ALPointsChart';
import { Legend } from './Legend';
import { RequirementSelect } from './RequirementSelect';
import type { Requirement } from '../data/store';

interface Props {
  course: Course;
  requirement?: Requirement;
  onSetRequirement: (id: string, value: Requirement | null) => void;
  onBack: () => void;
  onRemove: (id: string) => void;
}

const CARD =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

function Field({ k, value }: { k: keyof typeof fieldLabels; value: string }) {
  const { pick } = useLang();
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium text-slate-400">{pick(fieldLabels[k])}</dt>
      <dd className="text-sm text-slate-800 dark:text-slate-100">{value}</dd>
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-2 font-semibold text-slate-800 dark:text-slate-100">{children}</h2>;
}

export function CourseDetail({ course, requirement, onSetRequirement, onBack, onRemove }: Props) {
  const { t, lang, courseTitle } = useLang();
  const secondaryTitle = lang === 'en' ? course.titleJa : course.titleEn;
  const notes = [course.textbookNote, course.referenceNote].filter(Boolean);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
          ← {t('back')}
        </button>
        <button
          onClick={() => onRemove(course.id)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-500 transition-colors hover:border-red-300 hover:text-red-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-red-800 dark:hover:text-red-400"
        >
          ✕ {t('remove')}
        </button>
      </div>

      <header className={CARD}>
        <div className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {course.faculty} · {course.year} · {course.term}
        </div>
        <h1 className="mt-1 text-2xl font-bold text-slate-800 dark:text-slate-100">{courseTitle(course)}</h1>
        {secondaryTitle && <div className="text-slate-500 dark:text-slate-400">{secondaryTitle}</div>}

        <div className="mt-3">
          <RequirementSelect course={course} value={requirement} onChange={onSetRequirement} />
        </div>

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
            <div className={CARD}>
              <CardTitle>{t('field.overview')}</CardTitle>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {course.overview}
              </p>
            </div>
          )}
          {course.goals && (
            <div className={CARD}>
              <CardTitle>{t('field.goals')}</CardTitle>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {course.goals}
              </p>
            </div>
          )}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Weekly plan */}
        <div className={`${CARD} lg:col-span-2`}>
          <CardTitle>{t('field.weeks')}</CardTitle>
          <Legend />
          <ol className="mt-3 space-y-1">
            {course.weeks.map((w) => (
              <li
                key={w.week}
                className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              >
                <span className="mt-0.5 w-8 shrink-0 text-right text-sm tabular-nums text-slate-400">{w.week}</span>
                <span
                  className="mt-1 h-3 w-3 shrink-0 rounded-sm"
                  style={{ backgroundColor: workModeColors[w.mode] }}
                  title={t(`mode.${w.mode}`)}
                />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    {w.title}
                    <span className="ml-2 text-xs font-normal" style={{ color: workModeColors[w.mode] }}>
                      {t(`mode.${w.mode}`)}
                    </span>
                  </div>
                  {w.content && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">{w.content.replace(/\n/g, ' · ')}</div>
                  )}
                  {w.outsideStudy && <div className="text-[11px] text-slate-400">⌛ {w.outsideStudy}</div>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Side: AL + grading + textbooks + keywords */}
        <div className="space-y-4">
          <div className={CARD}>
            <CardTitle>{t('field.al')}</CardTitle>
            <ALPointsChart al={course.al} size={140} />
          </div>

          {course.grading.length > 0 && (
            <div className={CARD}>
              <CardTitle>{t('field.grading')}</CardTitle>
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

          {(course.textbooks.length > 0 || notes.length > 0) && (
            <div className={CARD}>
              <CardTitle>{t('textbooks')}</CardTitle>
              {course.textbooks.length > 0 ? (
                <ul className="space-y-2">
                  {course.textbooks.map((b, i) => (
                    <li key={`${b.title}-${i}`} className="text-sm">
                      <span
                        className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] ${
                          b.kind === '教科書'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {b.kind}
                      </span>
                      <span className="text-slate-800 dark:text-slate-100">{b.title}</span>
                      <div className="text-xs text-slate-400">
                        {[b.author, b.publisher, b.year].filter(Boolean).join(' · ')}
                        {b.isbn && ` · ISBN ${b.isbn}`}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : null}
              {notes.map((n) => (
                <p key={n} className="mt-2 whitespace-pre-line text-xs text-slate-500 dark:text-slate-400">
                  {n}
                </p>
              ))}
            </div>
          )}

          {course.keywords.length > 0 && (
            <div className={CARD}>
              <CardTitle>{t('field.keywords')}</CardTitle>
              <div className="flex flex-wrap gap-1.5">
                {course.keywords.map((k) => (
                  <span
                    key={k}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {k}
                  </span>
                ))}
              </div>
              {course.related.length > 0 && (
                <div className="mt-3">
                  <div className="text-xs font-medium text-slate-400">{t('field.related')}</div>
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
