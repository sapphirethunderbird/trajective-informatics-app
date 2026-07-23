import type { Course } from '../data/types';
import { REQUIREMENTS, type Requirement } from '../data/store';
import { useLang } from '../i18n/lang';

interface Props {
  course: Course;
  value?: Requirement;
  onChange: (id: string, value: Requirement | null) => void;
}

const STYLES: Record<Requirement, string> = {
  必修: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200',
  選択: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200',
  自由: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

/**
 * 必修/選択 is not printed in the syllabus PDFs, so it's a student-set tag.
 * The parsed 区分 (when the template has one) is offered as the hint.
 */
export function RequirementSelect({ course, value, onChange }: Props) {
  const { t, courseTitle } = useLang();
  const style = value ? STYLES[value] : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';

  return (
    <label className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] ${style}`}>
      <span className="sr-only">
        {t('requirement')} — {courseTitle(course)}
      </span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(course.id, (e.target.value || null) as Requirement | null)}
        title={course.division ? `${t('field.faculty')}: ${course.division}` : t('requirementHint')}
        className="cursor-pointer appearance-none bg-transparent pr-1 text-[11px] outline-none"
      >
        <option value="">{t('requirementUnset')}</option>
        {REQUIREMENTS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {course.division && <span className="ml-1 opacity-60">· {course.division}</span>}
    </label>
  );
}
