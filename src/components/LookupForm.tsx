import { useState } from 'react';
import type { Course } from '../data/types';
import { fetchSyllabus, SyllabusLookupError } from '../data/fetchSyllabus';
import { useLang } from '../i18n/lang';

interface Props {
  onCourse: (course: Course) => void;
  compact?: boolean;
}

const ERROR_KEY = {
  invalid: 'lookupInvalid',
  notFound: 'lookupNotFound',
  unavailable: 'lookupUnavailable',
} as const;

/** 年度 + 10桁の時間割番号 for a syllabus straight from the university portal. */
export function LookupForm({ onCourse, compact }: Props) {
  const { t } = useLang();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onCourse(await fetchSyllabus(year, code));
      setCode('');
    } catch (err) {
      const reason = err instanceof SyllabusLookupError ? err.reason : 'unavailable';
      setError(t(ERROR_KEY[reason]));
    } finally {
      setBusy(false);
    }
  };

  const input =
    'rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100';

  return (
    <form onSubmit={submit} className={compact ? '' : 'space-y-2'}>
      {!compact && (
        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">{t('lookupTitle')}</h3>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">{t('lookupYear')}</span>
          <input
            value={year}
            onChange={(e) => setYear(e.target.value)}
            inputMode="numeric"
            maxLength={4}
            className={`${input} w-20`}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] text-slate-400">{t('lookupCode')}</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={10}
            placeholder="1091011002"
            className={`${input} w-36 tabular-nums`}
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? t('parsing') : t('lookupSubmit')}
        </button>
      </div>
      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-2 py-1 text-xs text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
