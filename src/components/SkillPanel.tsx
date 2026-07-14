import { useMemo, useState } from 'react';
import type { Course } from '../data/types';
import { buildBlurb, semesterLabel, semesterOrder, type Skill } from '../skills/skills';

interface Props {
  skill: Skill | null;
  courses: Course[];
  topSkills: Skill[];
  onSelectSkill: (id: string) => void;
  onSelectCourse: (id: string) => void;
}

function CopyButton({ text }: { text: string }) {
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
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  );
}

export function SkillPanel({ skill, courses, topSkills, onSelectSkill, onSelectCourse }: Props) {
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
          Talking points <span className="text-sm font-normal text-slate-400">面接で話す材料</span>
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          Pick a skill in the network to see which courses built it, the evidence from each
          syllabus, and a ready-to-edit interview blurb.
        </p>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
          Most connected ／ よく登場するスキル
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
          {skill.type === 'transferable' ? 'Transferable ／ 汎用スキル' : 'Knowledge ／ 知識・技術'}
        </span>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {skill.label}
          {skill.labelEn && <span className="ml-2 text-sm font-normal text-slate-400">{skill.labelEn}</span>}
        </h2>
      </div>

      {/* Journey through semesters */}
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
        Where it was built ／ 学んだ科目
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
                {c.titleJa}
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
            Interview draft ／ 面接・ES用ドラフト
          </h3>
          <div className="space-y-2">
            <div className="rounded-lg border border-slate-200 p-2.5 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">JA</span>
                <CopyButton text={blurb.ja} />
              </div>
              {blurb.ja}
            </div>
            <div className="rounded-lg border border-slate-200 p-2.5 text-xs leading-relaxed text-slate-700 dark:border-slate-700 dark:text-slate-200">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400">EN</span>
                <CopyButton text={blurb.en} />
              </div>
              {blurb.en}
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            Drafted only from what the syllabi say — edit in your own experience before using.
          </p>
        </>
      )}
    </aside>
  );
}
