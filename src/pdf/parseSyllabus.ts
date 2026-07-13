import type { Course, WeekPlan, ALPoints, GradingItem } from '../data/types';
import type { Row, Cell } from './rowCluster';
import { classifyWeek } from './classifyWeek';

/** Known section headers in the Yamaguchi template, in document order.
 *  Rows whose text matches one of these delimit the section bodies. */
const SECTION_TITLES = [
  '授業の目的と概要',
  '授業の到達目標',
  '授業計画',
  '成績評価法',
  '教科書にかかわる情報',
  '参考書にかかわる情報',
  'メッセージ',
  'キーワード',
  '持続可能な開発目標',
  '関連科目',
  '履修条件',
  '連絡先',
  'オフィスアワー',
];

function isSectionHeader(row: Row): string | null {
  const t = row.text.trim();
  for (const title of SECTION_TITLES) {
    if (t === title || t.startsWith(title)) return title;
  }
  return null;
}

interface Section {
  title: string;
  rows: Row[];
}

/** Split rows into the leading header region and the labelled sections. */
function splitSections(rows: Row[]): { header: Row[]; sections: Section[] } {
  const header: Row[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const row of rows) {
    const title = isSectionHeader(row);
    if (title) {
      current = { title, rows: [] };
      sections.push(current);
    } else if (current) {
      current.rows.push(row);
    } else {
      header.push(row);
    }
  }
  return { header, sections };
}

// ---- Header metadata table helpers -------------------------------------

function findLabel(rows: Row[], label: string): { rowIndex: number; cell: Cell } | null {
  for (let i = 0; i < rows.length; i++) {
    const cell = rows[i].cells.find((c) => c.str.startsWith(label));
    if (cell) return { rowIndex: i, cell };
  }
  return null;
}

/** Value sitting to the right of a label on the same row. */
function sameRowRight(rows: Row[], label: string): string {
  const found = findLabel(rows, label);
  if (!found) return '';
  const right = rows[found.rowIndex].cells
    .filter((c) => c.x > found.cell.x + 5)
    .sort((a, b) => a.x - b.x)[0];
  return right?.str.trim() ?? '';
}

/** Value in a row below the label, aligned to (near) the label's x-position.
 *  Scans the next few rows because value rows can be interleaved. */
function belowNearest(rows: Row[], label: string, xTol = 60, maxRows = 4): string {
  const found = findLabel(rows, label);
  if (!found) return '';
  const { rowIndex, cell } = found;
  for (let i = rowIndex + 1; i <= rowIndex + maxRows && i < rows.length; i++) {
    const candidates = rows[i].cells.filter((c) => Math.abs(c.x - cell.x) <= xTol);
    if (candidates.length) {
      candidates.sort((a, b) => Math.abs(a.x - cell.x) - Math.abs(b.x - cell.x));
      return candidates[0].str.trim();
    }
  }
  return '';
}

function parseTitle(header: Row[]): { titleJa: string; titleEn: string } {
  // The course-name cell sits in the x≈89 column, between the 科目名 label row
  // and the 担当教員 label row, and spans two physical rows.
  const nameLabel = findLabel(header, '科目名');
  const teacherLabel = findLabel(header, '担当教員');
  const yTop = nameLabel ? header[nameLabel.rowIndex].y : Infinity;
  const yBottom = teacherLabel ? header[teacherLabel.rowIndex].y : -Infinity;

  const frags = header
    .filter((r) => r.y < yTop && r.y > yBottom)
    .flatMap((r) => r.cells.filter((c) => c.x >= 80 && c.x <= 140).map((c) => ({ y: r.y, str: c.str })))
    .sort((a, b) => b.y - a.y)
    .map((f) => f.str)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  const titleJa = frags.split('(')[0].trim();
  const enMatch = frags.match(/\(([^)]+)\)/);
  const titleEn = enMatch ? enMatch[1].trim() : '';
  return { titleJa, titleEn };
}

// ---- Weekly plan -------------------------------------------------------

const WEEK_RE = /^第(\d+)回/;

function parseWeeks(rows: Row[]): WeekPlan[] {
  // Anchor rows: those whose first cell begins with 第N回.
  interface Anchor {
    week: number;
    y: number;
    title: string;
  }
  const anchors: Anchor[] = [];
  for (const row of rows) {
    const first = row.cells[0];
    if (!first) continue;
    const m = first.str.match(WEEK_RE);
    if (!m) continue;
    const week = Number(m[1]);
    const titleCells = row.cells.filter((c) => c.x < 180).map((c) => c.str).join('');
    const title = titleCells.replace(/^第\d+回\s*/, '').trim();
    anchors.push({ week, y: row.y, title });
  }
  if (!anchors.length) return [];

  // Assign each content / outside-study cell to the nearest anchor by y.
  const nearest = (y: number) =>
    anchors.reduce((best, a) => (Math.abs(a.y - y) < Math.abs(best.y - y) ? a : best), anchors[0]);

  const content: Record<number, string[]> = {};
  const outside: Record<number, string[]> = {};
  const notes: Record<number, string[]> = {};

  for (const row of rows) {
    const isAnchor = WEEK_RE.test(row.cells[0]?.str ?? '');
    // Non-week narrative rows (AL notes, preamble) have no anchor-range cells we want.
    for (const c of row.cells) {
      const target = nearest(row.y).week;
      if (c.x >= 180 && c.x < 300) {
        (content[target] ??= []).push(c.str.replace(/^[・･]\s*/, '').trim());
      } else if (c.x >= 300 && c.x < 460) {
        (outside[target] ??= []).push(c.str.trim());
      } else if (c.x >= 460) {
        (notes[target] ??= []).push(c.str.trim());
      }
    }
    void isAnchor;
  }

  return anchors
    .sort((a, b) => a.week - b.week)
    .map((a) => {
      const contentStr = (content[a.week] ?? []).filter(Boolean).join('\n');
      return {
        week: a.week,
        title: a.title,
        content: contentStr,
        outsideStudy: (outside[a.week] ?? []).filter(Boolean).join(' '),
        note: (notes[a.week] ?? []).filter(Boolean).join(' '),
        mode: classifyWeek(a.title, contentStr),
      } satisfies WeekPlan;
    });
}

function parseALPoints(text: string): ALPoints {
  const m = text.match(/A[:：]\s*(\d+)\s*%.*?B[:：]\s*(\d+)\s*%.*?C[:：]\s*(\d+)\s*%.*?D[:：]\s*(\d+)\s*%/s);
  if (!m) return { group: 0, discussion: 0, fieldwork: 0, presentation: 0 };
  return {
    group: Number(m[1]),
    discussion: Number(m[2]),
    fieldwork: Number(m[3]),
    presentation: Number(m[4]),
  };
}

function parseGrading(text: string): GradingItem[] {
  const items: GradingItem[] = [];
  const re = /([^\d、,。\s][^\d、,。]*?)\s*(\d+)\s*[%％]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const label = m[1].trim();
    if (label) items.push({ label, percent: Number(m[2]) });
  }
  return items;
}

function sectionText(sections: Section[], title: string): string {
  const s = sections.find((x) => x.title === title);
  if (!s) return '';
  return s.rows.map((r) => r.text).join('\n').trim();
}

function splitList(text: string): string[] {
  return text
    .split(/[、,，]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseSyllabus(rows: Row[]): Course {
  const warnings: string[] = [];
  const { header, sections } = splitSections(rows);
  const fullText = rows.map((r) => r.text).join('\n');

  const idMatch = fullText.match(/\b(\d{10})\b/);
  const { titleJa, titleEn } = parseTitle(header);

  const planSection = sections.find((s) => s.title === '授業計画');
  const weeks = planSection ? parseWeeks(planSection.rows) : [];
  if (!weeks.length) warnings.push('weeks');

  const planText = planSection ? planSection.rows.map((r) => r.text).join('\n') : '';
  const al = parseALPoints(planText);
  if (!al.group && !al.discussion && !al.fieldwork && !al.presentation) warnings.push('al');

  const grading = parseGrading(sectionText(sections, '成績評価法'));
  if (!grading.length) warnings.push('grading');

  const creditsRaw = belowNearest(header, '単位数');
  const credits = Number(creditsRaw.replace(/[^\d.]/g, '')) || 0;

  const course: Course = {
    id: idMatch?.[1] ?? `${titleJa}-${Date.now()}`,
    year: belowNearest(header, '開講年度'),
    faculty: belowNearest(header, '開講学部等'),
    term: belowNearest(header, '開講学期'),
    schedule: belowNearest(header, '曜日時限'),
    titleJa: titleJa || '(無題)',
    titleEn,
    credits,
    language: belowNearest(header, '使用言語'),
    instructor: belowNearest(header, '担当教員（責任）') || belowNearest(header, '担当教員'),
    targetYear: sameRowRight(header, '対象年次'),
    overview: sectionText(sections, '授業の目的と概要'),
    goals: sectionText(sections, '授業の到達目標'),
    weeks,
    al,
    grading,
    keywords: splitList(sectionText(sections, 'キーワード')),
    sdgs: sectionText(sections, '持続可能な開発目標')
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    related: splitList(sectionText(sections, '関連科目')),
    contact: sectionText(sections, '連絡先'),
    officeHours: sectionText(sections, 'オフィスアワー'),
    parseWarnings: warnings,
  };
  return course;
}
