import { useMemo, useState } from 'react';
import type { Course } from '../data/types';
import { buildSkillGraph, semesterLabel } from '../skills/skills';
import { collaborativeShare, totalCredits, totalWeeks } from '../data/aggregate';
import { conflicts } from '../data/schedule';
import { useLang } from '../i18n/lang';
import { LookupForm } from './LookupForm';

interface Props {
  courses: Course[];
  candidate: Course | null;
  busy: boolean;
  onCandidate: (course: Course | null) => void;
  onPickFiles: (files: File[]) => void;
  onAdd: (course: Course) => void;
}

const CARD =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900';

function Delta({ label, before, after, suffix = '' }: { label: string; before: number; after: number; suffix?: string }) {
  const diff = after - before;
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-800/60">
      <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
      <div className="text-lg font-semibold tabular-nums text-slate-800 dark:text-slate-100">
        {after}
        {suffix}
        {diff !== 0 && (
          <span className={`ml-1.5 text-xs ${diff > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
            {diff > 0 ? '+' : ''}
            {diff}
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export function SimulateView({ courses, candidate, busy, onCandidate, onPickFiles, onAdd }: Props) {
  const { t, courseTitle } = useLang();
  const [query, setQuery] = useState('');

  const alreadyAdded = !!candidate && courses.some((c) => c.id === candidate.id);
  const withCandidate = useMemo(
    () => (candidate && !alreadyAdded ? [...courses, candidate] : courses),
    [courses, candidate, alreadyAdded],
  );

  const before = useMemo(() => buildSkillGraph(courses), [courses]);
  const after = useMemo(() => buildSkillGraph(withCandidate), [withCandidate]);

  const { newSkills, strengthened } = useMemo(() => {
    const beforeById = new Map(before.skills.map((s) => [s.id, s]));
    const added = after.skills.filter((s) => !beforeById.has(s.id));
    const stronger = after.skills.filter((s) => {
      const prev = beforeById.get(s.id);
      return prev && s.courseIds.length > prev.courseIds.length;
    });
    return { newSkills: added, strengthened: stronger };
  }, [before, after]);

  const clashes = useMemo(
    () => (candidate ? courses.filter((c) => c.id !== candidate.id && conflicts(c, candidate)) : []),
    [courses, candidate],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return courses
      .filter((c) => `${c.titleJa} ${c.titleEn} ${c.id}`.toLowerCase().includes(q))
      .slice(0, 6);
  }, [courses, query]);

  return (
    <div className="space-y-5">
      <section className={CARD}>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('simulateTitle')}</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('simulateIntro')}</p>

        <div className="mt-4 grid gap-5 md:grid-cols-3">
          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{t('upload')}</h3>
            <input
              type="file"
              accept="application/pdf"
              disabled={busy}
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                if (files.length) onPickFiles(files);
                e.target.value = '';
              }}
              className="block w-full text-xs text-slate-500 file:mr-2 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-500 dark:text-slate-400"
            />
          </div>

          <div>
            <LookupForm onCourse={onCandidate} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">{t('simulateSearch')}</h3>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('simulateSearchPlaceholder')}
              className="w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
            {matches.length > 0 && (
              <ul className="mt-1 space-y-1">
                {matches.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => {
                        onCandidate(c);
                        setQuery('');
                      }}
                      className="w-full truncate rounded-lg px-2 py-1 text-left text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {courseTitle(c)} <span className="text-slate-400">{semesterLabel(c)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {candidate && (
        <>
          <section className={CARD}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  {t('candidate')} · {semesterLabel(candidate)} · {candidate.schedule}
                </div>
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{courseTitle(candidate)}</h3>
                <div className="text-sm text-slate-500 dark:text-slate-400">{candidate.instructor}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onCandidate(null)}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {t('clearCandidate')}
                </button>
                <button
                  onClick={() => onAdd(candidate)}
                  disabled={alreadyAdded}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {alreadyAdded ? t('alreadyAdded') : t('addToCourses')}
                </button>
              </div>
            </div>

            <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {t('workloadChange')}
            </h4>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Delta label={t('courses')} before={courses.length} after={withCandidate.length} />
              <Delta label={t('credits')} before={totalCredits(courses)} after={totalCredits(withCandidate)} />
              <Delta label={t('classWeeks')} before={totalWeeks(courses)} after={totalWeeks(withCandidate)} />
              <Delta
                label={t('collaborative')}
                before={collaborativeShare(courses)}
                after={collaborativeShare(withCandidate)}
                suffix="%"
              />
            </div>

            <div className="mt-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('scheduleConflict')}
              </h4>
              {clashes.length ? (
                <ul className="space-y-1">
                  {clashes.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-lg bg-red-50 px-2 py-1 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
                    >
                      ⚠ {courseTitle(c)} — {c.schedule} · {semesterLabel(c)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('noConflict')}</p>
              )}
            </div>
          </section>

          <section className={CARD}>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{t('newSkills')}</h4>
            {newSkills.length ? (
              <div className="flex flex-wrap gap-1.5">
                {newSkills.map((s) => (
                  <span
                    key={s.id}
                    className={`rounded-full px-2.5 py-1 text-xs ${
                      s.type === 'transferable'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">{t('noSkillChange')}</p>
            )}

            {strengthened.length > 0 && (
              <>
                <h4 className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {t('strengthenedSkills')}
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {strengthened.map((s) => (
                    <span
                      key={s.id}
                      className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 dark:border-slate-600 dark:text-slate-300"
                    >
                      {s.label} <span className="text-slate-400">×{s.courseIds.length}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
}
