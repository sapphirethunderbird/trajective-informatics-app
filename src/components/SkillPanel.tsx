import { useMemo, useState } from 'react';
import type { Course } from '../data/types';
import { buildBlurb, semesterLabel, semesterOrder, type Skill } from '../skills/skills';
import { useLang } from '../i18n/lang';

interface Props {
  skill: Skill | null;
  courses: Course[];
  topSkills: Skill[];
  onSelectSkill: (id: string) => void;
  onSelectCourse: (id: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          })
          .catch(() => {
            // Clipboard blocked (permissions/insecure context) — select-and-copy
            // still works, so stay quiet.
          });
      }}
      className="rounded-md border border-slate-300 px-2 py-0.5 text-[11px] text-slate-500 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800"
    >
      {copied ? t('copied') : t('copy')}
    </button>
  );
}

function Draft({ code, text }: { code: 'JA' | 'EN'; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 p-2.5 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:text-slate-200">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold text-slate-400">{code}</span>
        <CopyButton text={text} />
      </div>
      {text}
    </div>
  );
}

export function SkillPanel({ skill, courses, topSkills, onSelectSkill, onSelectCourse }: Props) {
  const { t, lang, courseTitle } = useLang();
  const [showOther, setShowOther] = useState(false);
  const mine = useMemo(
    () =>
      skill
        ? courses
            .filter((c) => skill.courseIds.includes(c.id))
            .sort((a, b) => semesterOrder(a) - semesterOrder(b))
        : [],
    [skill, courses],
  );
  const blurb = useMemo(() => (skill ? buildBlurb(skill, courses) : null), [skill, courses]);

  if (!skill) {
    return (
      <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="mb-2 text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('talkingPoints')}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {t('talkingPointsIntro')}
        </p>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t('mostConnected')}
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {topSkills.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSkill(s.id)}
              className="rounded-full border border-slate-300 px-2.5 py-1 text-xs text-slate-600 hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-300 dark:hover:border-blue-500 dark:hover:text-blue-400"
            >
              {s.label} <span className="text-slate-400">×{s.courseIds.length}</span>
            </button>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3">
        <span
          className={`mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
            skill.type === 'transferable'
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'
              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200'
          }`}
        >
          {t(skill.type === 'transferable' ? 'skillTypeTransferable' : 'skillTypeKnowledge')}
        </span>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {skill.label}
          {skill.labelEn && <span className="ml-2 text-sm font-normal text-slate-400">{skill.labelEn}</span>}
        </h2>
      </div>

      {/* Journey through semesters */}
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('whereBuilt')}
      </h3>
      <ol className="mb-4 space-y-2">
        {mine.map((c) => {
          const evidence = [
            ...new Set(skill.evidence.filter((e) => e.courseId === c.id).map((e) => e.detail)),
          ];
          return (
            <li key={c.id} className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/60">
              <button
                onClick={() => onSelectCourse(c.id)}
                className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-400"
              >
                {courseTitle(c)}
              </button>
              <span className="ml-2 text-[11px] text-slate-400">{semesterLabel(c)}</span>
              <ul className="mt-1 space-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                {evidence.map((d, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-slate-300 dark:text-slate-600">▸</span>
                    <span>{d}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>

      {blurb && (
        <>
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
            {t('interviewDraft')}
          </h3>
          {/* The current UI language first; both drafts stay reachable because
              students apply in both languages. */}
          <div className="space-y-2">
            <Draft code={lang === 'ja' ? 'JA' : 'EN'} text={lang === 'ja' ? blurb.ja : blurb.en} />
            <button
              onClick={() => setShowOther((v) => !v)}
              className="text-[11px] text-blue-600 hover:underline dark:text-blue-400"
            >
              {showOther ? t('hideOtherDraft') : t('showOtherDraft')}
            </button>
            {showOther && <Draft code={lang === 'ja' ? 'EN' : 'JA'} text={lang === 'ja' ? blurb.en : blurb.ja} />}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            {t('draftCaveat')}
          </p>
        </>
      )}
    </aside>
  );
}
