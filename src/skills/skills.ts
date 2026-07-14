import type { Course } from '../data/types';

export type SkillType = 'domain' | 'transferable';

export interface SkillEvidence {
  courseId: string;
  source: 'keyword' | 'al' | 'weeks' | 'grading' | 'goal';
  /** Human-readable line shown in the talking-points panel. */
  detail: string;
}

export interface Skill {
  id: string;
  label: string;
  labelEn?: string;
  type: SkillType;
  courseIds: string[];
  evidence: SkillEvidence[];
}

/** 関連科目 link between two loaded courses. */
export interface CourseLink {
  a: string;
  b: string;
}

export interface SkillGraph {
  skills: Skill[];
  courseLinks: CourseLink[];
}

/** Canonical form used as a skill's identity: full-width → half-width,
 *  lower-cased latin, surrounding punctuation stripped. */
export function normalizeSkill(label: string): string {
  return label
    .normalize('NFKC')
    .replace(/[。、.,\s]+$/g, '')
    .replace(/^[\s・]+/g, '')
    .trim()
    .toLowerCase();
}

// ---- Semester ordering ---------------------------------------------------

/** Sortable key for 開講年度 + 開講学期, e.g. 2023 前期後半 < 2023 後期. */
export function semesterOrder(course: Course): number {
  const year = Number(course.year) || 0;
  const term = course.term;
  let t = 0;
  if (term.includes('後期')) t = 0.5;
  if (term.includes('通年')) t = 0.25;
  if (term.includes('後半')) t += 0.25;
  return year + t;
}

export function semesterLabel(course: Course): string {
  return [course.year, course.term].filter(Boolean).join(' ');
}

// ---- Transferable skills -------------------------------------------------

interface TransferableDef {
  id: string;
  label: string;
  labelEn: string;
  /** Returns evidence lines when the course develops this skill, else []. */
  collect: (c: Course) => string[];
}

const weekCount = (c: Course, mode: string) => c.weeks.filter((w) => w.mode === mode).length;

const TRANSFERABLE: TransferableDef[] = [
  {
    id: 'skill:teamwork',
    label: 'チームワーク',
    labelEn: 'Teamwork',
    collect: (c) => {
      const lines: string[] = [];
      if (c.al.group >= 15) lines.push(`授業時間の約${c.al.group}%がグループワーク`);
      const n = weekCount(c, 'group');
      if (n >= 2) lines.push(`${c.weeks.length}回中${n}回がグループ活動の回`);
      return lines;
    },
  },
  {
    id: 'skill:discussion',
    label: 'ディスカッション',
    labelEn: 'Discussion & debate',
    collect: (c) => {
      const lines: string[] = [];
      if (c.al.discussion >= 15) lines.push(`授業時間の約${c.al.discussion}%がディスカッション・ディベート`);
      const n = weekCount(c, 'discussion');
      if (n >= 2) lines.push(`${c.weeks.length}回中${n}回が議論・振り返り中心の回`);
      return lines;
    },
  },
  {
    id: 'skill:presentation',
    label: 'プレゼンテーション',
    labelEn: 'Presentation',
    collect: (c) => {
      const lines: string[] = [];
      if (c.al.presentation >= 15) lines.push(`授業時間の約${c.al.presentation}%がプレゼンテーション`);
      const g = c.grading.find((x) => x.label.includes('発表') && x.percent >= 20);
      if (g) lines.push(`成績の${g.percent}%が発表・制作作品で評価`);
      const wk = c.weeks.filter((w) => /発表|プレゼン/.test(w.title));
      if (wk.length) lines.push(`発表回: ${wk.map((w) => `第${w.week}回`).join('・')}`);
      return lines;
    },
  },
  {
    id: 'skill:handson',
    label: '実践・演習',
    labelEn: 'Hands-on practice',
    collect: (c) => {
      const lines: string[] = [];
      if (c.al.fieldwork >= 15) lines.push(`授業時間の約${c.al.fieldwork}%が演習・実習・フィールドワーク`);
      const n = weekCount(c, 'fieldwork');
      if (n >= 3) lines.push(`${c.weeks.length}回中${n}回が演習・実践の回`);
      return lines;
    },
  },
  {
    id: 'skill:writing',
    label: 'レポート・文章表現',
    labelEn: 'Report writing',
    collect: (c) => {
      const pct = c.grading
        .filter((g) => g.label.includes('レポート'))
        .reduce((s, g) => s + g.percent, 0);
      return pct >= 30 ? [`成績の${pct}%がレポートで評価`] : [];
    },
  },
];

// ---- Domain skills (キーワード) -------------------------------------------

/** Quote up to `max` sentences from the course text that mention the keyword. */
function quoteMentions(course: Course, keyword: string, max = 1): string[] {
  const norm = normalizeSkill(keyword);
  const text = [course.overview, course.goals].join('。');
  return text
    .split(/[。\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 4 && normalizeSkill(s).includes(norm))
    .slice(0, max)
    .map((s) => `「${s}。」`);
}

// ---- Graph assembly -------------------------------------------------------

export function buildSkillGraph(courses: Course[]): SkillGraph {
  const byId = new Map<string, Skill>();

  const add = (
    key: string,
    label: string,
    type: SkillType,
    course: Course,
    evidence: SkillEvidence[],
    labelEn?: string,
  ) => {
    let skill = byId.get(key);
    if (!skill) {
      skill = { id: key, label, labelEn, type, courseIds: [], evidence: [] };
      byId.set(key, skill);
    }
    if (!skill.courseIds.includes(course.id)) skill.courseIds.push(course.id);
    skill.evidence.push(...evidence);
  };

  for (const course of courses) {
    for (const kw of course.keywords) {
      const norm = normalizeSkill(kw);
      if (!norm) continue;
      const evidence: SkillEvidence[] = [
        { courseId: course.id, source: 'keyword', detail: 'シラバスのキーワードに掲載' },
        ...quoteMentions(course, kw).map(
          (q): SkillEvidence => ({ courseId: course.id, source: 'goal', detail: q }),
        ),
      ];
      add(`kw:${norm}`, kw.normalize('NFKC').trim(), 'domain', course, evidence);
    }

    for (const def of TRANSFERABLE) {
      const lines = def.collect(course);
      if (!lines.length) continue;
      add(
        def.id,
        def.label,
        'transferable',
        course,
        lines.map((detail): SkillEvidence => ({ courseId: course.id, source: 'al', detail })),
        def.labelEn,
      );
    }
  }

  // 関連科目 edges between courses that are both loaded.
  const courseLinks: CourseLink[] = [];
  const seen = new Set<string>();
  for (const course of courses) {
    for (const rel of course.related) {
      const normRel = normalizeSkill(rel);
      if (normRel.length < 2) continue;
      for (const other of courses) {
        if (other.id === course.id) continue;
        const normTitle = normalizeSkill(other.titleJa);
        if (!normTitle || !(normTitle.includes(normRel) || normRel.includes(normTitle))) continue;
        const key = [course.id, other.id].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          courseLinks.push({ a: course.id, b: other.id });
        }
      }
    }
  }

  const skills = [...byId.values()].sort(
    (a, b) => b.courseIds.length - a.courseIds.length || a.label.localeCompare(b.label, 'ja'),
  );
  return { skills, courseLinks };
}

// ---- Interview blurb -------------------------------------------------------

/** Draft first-person statements (ja + en) a student can copy into interview
 *  prep or an entry sheet, built only from what the syllabi actually say. */
export function buildBlurb(skill: Skill, courses: Course[]): { ja: string; en: string } {
  const mine = courses
    .filter((c) => skill.courseIds.includes(c.id))
    .sort((a, b) => semesterOrder(a) - semesterOrder(b));
  if (!mine.length) return { ja: '', en: '' };

  const titles = mine.map((c) => `「${c.titleJa}」`).join('、');
  const titlesEn = mine.map((c) => c.titleEn || c.titleJa).join(', ');
  const years = [...new Set(mine.map((c) => c.year).filter(Boolean))];
  const span = years.length > 1 ? `${years[0]}年度から${years[years.length - 1]}年度にかけて` : `${years[0] ?? ''}年度に`;
  const spanEn = years.length > 1 ? `from ${years[0]} to ${years[years.length - 1]}` : `in ${years[0] ?? ''}`;
  const nCourses = mine.length > 1 ? `${mine.length}科目` : '授業';

  if (skill.type === 'transferable') {
    // Lead with the strongest piece of evidence we extracted.
    const strongest = skill.evidence.find((e) => e.source === 'al')?.detail ?? '';
    const ja = `${skill.label}は、${span}${titles}の${nCourses}を通じて実践的に身につけました。${
      strongest ? `例えば${mine[0].titleJa}では、${strongest}でした。` : ''
    }`;
    const en = `I developed ${skill.labelEn ?? skill.label} through ${mine.length} course${
      mine.length > 1 ? 's' : ''
    } (${titlesEn}) ${spanEn}, in classes built around group work, discussion, and presentations.`;
    return { ja, en };
  }

  const quote = skill.evidence.find((e) => e.source === 'goal')?.detail;
  const ja = `${skill.label}については、${span}${titles}で学びました。${
    quote ? `シラバスにある${quote}という目標に取り組みました。` : ''
  }`;
  const en = `I studied ${skill.label} in ${titlesEn} ${spanEn}.`;
  return { ja, en };
}
