import type { ReactNode } from 'react';
import { useLang } from '../i18n/lang';
import type { Lang } from '../i18n/strings';

export type View = 'dashboard' | 'skills' | 'simulate';

interface Props {
  view: View;
  onView: (view: View) => void;
  semesters: string[];
  semester: string;
  onSemester: (value: string) => void;
  courseCount: number;
  creditCount: number;
  onUpload: () => void;
  children: ReactNode;
}

const RAIL_BUTTON =
  'w-full rounded-xl border px-2 py-2 text-center text-xs font-medium transition-colors';

function RailButton({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
  title?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={`${RAIL_BUTTON} ${
        active
          ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
          : 'border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300 dark:hover:border-blue-500'
      }`}
    >
      {children}
    </button>
  );
}

/** The wireframe's left rail: profile, 時期, EN/JP, upload, simulate. */
export function AppShell({
  view,
  onView,
  semesters,
  semester,
  onSemester,
  courseCount,
  creditCount,
  onUpload,
  children,
}: Props) {
  const { t, lang, setLang } = useLang();

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-[1400px] gap-4 p-4">
        <nav
          aria-label={t('appName')}
          className="sticky top-4 flex h-fit w-28 shrink-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-col items-center gap-1 pb-1">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-slate-300 text-sm font-semibold text-slate-500 dark:border-slate-600 dark:text-slate-300"
              title={t('profile')}
            >
              {courseCount}
            </div>
            <div className="text-center text-[10px] leading-tight text-slate-400">
              {courseCount} {t('courses')}
              <br />
              {creditCount} {t('credits')}
            </div>
          </div>

          <label className="flex flex-col gap-1">
            <span className="text-[10px] font-medium text-slate-400">{t('term')}</span>
            <select
              value={semester}
              onChange={(e) => onSemester(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-1.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              <option value="all">{t('allTerms')}</option>
              {semesters.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>

          <div className="flex overflow-hidden rounded-xl border border-slate-300 text-xs dark:border-slate-700">
            {(['en', 'ja'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`flex-1 py-1.5 font-medium transition-colors ${
                  lang === l
                    ? 'bg-blue-600 text-white dark:bg-blue-500'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                {l === 'en' ? 'EN' : 'JP'}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
            <RailButton active={view === 'dashboard'} onClick={() => onView('dashboard')}>
              {t('dashboard')}
            </RailButton>
            <RailButton active={view === 'skills'} onClick={() => onView('skills')}>
              {t('topSkills')}
            </RailButton>
            <RailButton onClick={onUpload}>{t('upload')}</RailButton>
            <RailButton active={view === 'simulate'} onClick={() => onView('simulate')}>
              {t('simulate')}
            </RailButton>
          </div>
        </nav>

        <main className="min-w-0 flex-1 space-y-5">{children}</main>
      </div>

      <footer className="mx-auto max-w-[1400px] px-4 pb-8 text-center text-xs text-slate-400">
        {lang === 'ja'
          ? 'ブラウザ内で解析しています。PDFはアップロードされません。'
          : 'Parsed locally in your browser · nothing is uploaded.'}
      </footer>
    </div>
  );
}
