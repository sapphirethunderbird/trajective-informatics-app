import type {
  Course,
  WeekPlan,
  ALPoints,
  GradingItem,
  GoalAspect,
  WeekALMarks,
  ALColumn,
  TextbookRef,
} from '../data/types';
import type { Row, Cell } from './rowCluster';
import { classifyWeek } from './classifyWeek';

/** Known section headers in the Yamaguchi template, in document order.
 *  Rows whose text matches one of these delimit the section bodies. */
const SECTION_TITLES = [
  '開設科目名',
  '概要',
  '一般目標',
  '授業の目的と概要',
  '授業の到達目標',
  '授業計画',
  '成績評価法',
  'ルーブリック等の評価基準',
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

/** Monotonic top-to-bottom document coordinate (pages are < 1200 units tall). */
function docY(row: Row): number {
  return row.page * 1200 - row.y;
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

/** Labels that share a row with 区分 — a cell matching one of these is the next
 *  column's header, not 区分's (usually empty) value. */
const HEADER_LABELS =
  /^(対象学生|対象年次|使用言語|単位数|メディア授業|授業区分|授業形態|YFL|AL（|開講|曜日時限|科目名|時間割番号|担当教員|特定科目区分|区分)/;

/** Value to the right of a label on the same row, rejecting the next label. */
function sameRowValue(rows: Row[], label: string): string {
  const v = sameRowRight(rows, label);
  return v && !HEADER_LABELS.test(v) ? v : '';
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

/** Value below the label, bounded by the label's own column rather than a fixed
 *  x-tolerance. Numeric values (単位数) are right-aligned in a wide column, so
 *  they can sit 70+ units from a left-aligned label — too far for
 *  `belowNearest`, but still inside the column that ends at the next label. */
function belowInColumn(rows: Row[], label: string, maxRows = 4): string {
  const found = findLabel(rows, label);
  if (!found) return '';
  const { rowIndex, cell } = found;
  const nextLabel = rows[rowIndex].cells.find((c) => c.x > cell.x + 5);
  const right = nextLabel ? nextLabel.x : Infinity;
  const left = cell.x - 40;
  for (let i = rowIndex + 1; i <= rowIndex + maxRows && i < rows.length; i++) {
    const hit = rows[i].cells.filter((c) => c.x >= left && c.x < right);
    if (hit.length) return hit[hit.length - 1].str.trim();
  }
  return '';
}

function parseTitle(header: Row[]): { titleJa: string; titleEn: string } {
  // The course-name cell sits in the x≈89 column, between the 科目名 label row
  // and the 担当教員 label row, and spans up to two physical rows.
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

  // 英文名 appears as 「科目名[English]」 or 「科目名(English)」; when both are
  // present the parenthesized one is the course's descriptive subtitle — prefer it.
  const titleJa = frags.split(/[[［(（]/)[0].trim();
  const enMatch = frags.match(/[(（]([^)）]+)[)）]/) ?? frags.match(/[[［]([^\]］]+)[\]］]/);
  const titleEn = enMatch ? enMatch[1].trim() : '';
  return { titleJa, titleEn };
}

// ---- Weekly plan -------------------------------------------------------

/** Cell that starts a week entry. 回 may be absent or wrapped onto its own row. */
const WEEK_ANCHOR_RE = /^第\s*(\d+)\s*(回|週)?$/;
const WEEK_PREFIX_RE = /^第\s*(\d+)\s*(回|週)?/;

const AL_MARK_RE = /多|中|少|あり/;

interface PlanColumns {
  bContent: number; // title col < bContent ≤ content col
  bOutside: number; // content col < bOutside ≤ outside-study col
  bNote: number; // outside-study col < bNote ≤ note col
  bAL: number; // ≥ bAL is the per-week AL mark region (Infinity when absent)
  alLetters: { letter: ALColumn; x: number }[];
}

/** Legacy boundaries for templates where the 項目/内容 header row isn't found. */
const LEGACY_COLUMNS: PlanColumns = { bContent: 180, bOutside: 300, bNote: 460, bAL: Infinity, alLetters: [] };

/** Derive column boundaries from the 項目/内容/授業外指示/授業記録 header row and
 *  the A–F active-learning letter row. Labels are centered over their columns,
 *  so boundaries are midpoints between adjacent label positions. */
function detectColumns(rows: Row[]): PlanColumns | null {
  for (let i = 0; i < rows.length; i++) {
    const cells = rows[i].cells;
    const item = cells.find((c) => c.str.trim() === '項目');
    const content = cells.find((c) => c.str.trim() === '内容');
    if (!item || !content) continue;
    const outside = cells.find((c) => /^(授業外指示|授業時間外学習)/.test(c.str.trim()));
    const note = cells.find((c) => /^(授業記録|備考)/.test(c.str.trim()));

    let alLetters: { letter: ALColumn; x: number }[] = [];
    for (let j = Math.max(0, i - 2); j <= Math.min(rows.length - 1, i + 2); j++) {
      const letters = rows[j].cells.filter((c) => /^[A-F]$/.test(c.str.trim()));
      if (letters.length >= 4) {
        alLetters = letters.map((c) => ({ letter: c.str.trim() as ALColumn, x: c.x }));
        break;
      }
    }

    const bContent = (item.x + content.x) / 2;
    const bOutside = outside ? (content.x + outside.x) / 2 : bContent + 120;
    const bAL = alLetters.length ? Math.min(...alLetters.map((l) => l.x)) - 15 : Infinity;
    const bNote = note && outside ? (outside.x + note.x) / 2 : Math.min(bOutside + 160, bAL);
    return { bContent, bOutside, bNote: Math.min(bNote, bAL), bAL, alLetters };
  }
  return null;
}

function parseWeeks(rows: Row[]): WeekPlan[] {
  const cols = detectColumns(rows) ?? LEGACY_COLUMNS;

  interface Anchor {
    week: number;
    docY: number;
  }
  const anchors: Anchor[] = [];
  for (const row of rows) {
    const first = row.cells[0];
    if (!first) continue;
    // Anchor cell is either 「第N」/「第N回」 alone, or 「第N回 …title…」 in one cell.
    const m = first.str.trim().match(WEEK_ANCHOR_RE) ?? first.str.trim().match(/^第(\d+)回/);
    if (!m) continue;
    anchors.push({ week: Number(m[1]), docY: docY(row) });
  }
  if (!anchors.length) return [];
  anchors.sort((a, b) => a.docY - b.docY);

  // Week-block boundaries: anchors sit vertically centered in their table row,
  // so a block spans from midway to the previous anchor to midway to the next.
  const gap = anchors.length > 1 ? anchors[1].docY - anchors[0].docY : 100;
  const startDocY = anchors[0].docY - gap / 2;
  // Rows after the table (the ※AL legend) are not part of any week.
  let endDocY = Infinity;
  for (const row of rows) {
    if (docY(row) > anchors[anchors.length - 1].docY && row.text.trim().startsWith('※')) {
      endDocY = docY(row);
      break;
    }
  }
  const boundaries = anchors.map((a, i) =>
    i + 1 < anchors.length ? (a.docY + anchors[i + 1].docY) / 2 : Infinity,
  );
  const blockOf = (y: number): number => {
    for (let i = 0; i < boundaries.length; i++) if (y < boundaries[i]) return i;
    return anchors.length - 1;
  };

  interface Acc {
    title: string[];
    content: string[];
    outside: string[];
    note: string[];
    alMarks: WeekALMarks;
  }
  const acc: Acc[] = anchors.map(() => ({ title: [], content: [], outside: [], note: [], alMarks: {} }));

  for (const row of rows) {
    const y = docY(row);
    if (y < startDocY || y >= endDocY) continue;
    const a = acc[blockOf(y)];
    for (const c of row.cells) {
      const s = c.str.trim();
      if (!s) continue;
      if (c.x >= cols.bAL) {
        const letter = cols.alLetters.find((l) => Math.abs(l.x - c.x) <= 13)?.letter;
        const mark = s.match(AL_MARK_RE);
        if (letter && mark) a.alMarks[letter] = a.alMarks[letter] ?? mark[0];
      } else if (c.x >= cols.bNote) {
        a.note.push(s);
      } else if (c.x >= cols.bOutside) {
        a.outside.push(s);
      } else if (c.x >= cols.bContent) {
        a.content.push(s.replace(/^[・･]\s*/, ''));
      } else {
        // Title column — skip the 第N anchor fragments themselves.
        if (WEEK_ANCHOR_RE.test(s) || /^(回|週)$/.test(s)) continue;
        a.title.push(s);
      }
    }
  }

  return anchors
    .map((anchor, i) => {
      const a = acc[i];
      // Japanese wraps mid-word, so title fragments join without a separator.
      const title = a.title.join('').replace(WEEK_PREFIX_RE, '').trim();
      const content = a.content.filter(Boolean).join('\n');
      const alMarks = Object.keys(a.alMarks).length ? a.alMarks : undefined;
      return {
        week: anchor.week,
        title,
        content,
        outsideStudy: a.outside.filter(Boolean).join(' '),
        note: a.note.filter(Boolean).join(' '),
        mode: classifyWeek(title, content, alMarks),
        alMarks,
      } satisfies WeekPlan;
    })
    .sort((a, b) => a.week - b.week);
}

// ---- AL points ----------------------------------------------------------

/** Older templates print a summary line 「A：20% B：20% …」. */
function parseALSummary(text: string): ALPoints | null {
  const m = text.match(/A[:：]\s*(\d+)\s*%.*?B[:：]\s*(\d+)\s*%.*?C[:：]\s*(\d+)\s*%.*?D[:：]\s*(\d+)\s*%/s);
  if (!m) return null;
  return { group: Number(m[1]), discussion: Number(m[2]), fieldwork: Number(m[3]), presentation: Number(m[4]) };
}

/** Share of class time a 多/中/少 mark stands for (midpoints of the template's bands). */
const MARK_WEIGHT: Record<string, number> = { 多: 75, 中: 33, 少: 8, あり: 33 };

/** Newer templates mark AL per week instead — average the marks per column. */
function alFromWeeks(weeks: WeekPlan[]): ALPoints {
  const avg = (col: ALColumn) => {
    if (!weeks.length) return 0;
    const total = weeks.reduce((sum, w) => sum + (MARK_WEIGHT[w.alMarks?.[col] ?? ''] ?? 0), 0);
    return Math.round(total / weeks.length);
  };
  return { group: avg('A'), discussion: avg('B'), fieldwork: avg('C'), presentation: avg('D') };
}

// ---- Grading ------------------------------------------------------------

/** Row labels of the 観点別 grading table, with display labels. */
const GRADING_ROWS: Array<{ prefix: string; label: string }> = [
  { prefix: '定期試験', label: '定期試験' },
  { prefix: '小テスト・授業内レポート', label: '小テスト・授業内レポート' },
  { prefix: '宿題・授業外レポート', label: '宿題・授業外レポート' },
  { prefix: '授業態度・授業への参加度', label: '授業態度・参加度' },
  { prefix: '受講者の発表', label: '発表・制作作品' },
  { prefix: '演習', label: '演習' },
  { prefix: 'その他', label: 'その他' },
];

const PERCENT_RE = /(\d+)\s*[%％]/;

/** Preferred: read the 観点別 table rows (label … NN%). */
function parseGradingTable(rows: Row[]): GradingItem[] {
  const items: GradingItem[] = [];
  for (let i = 0; i < rows.length; i++) {
    const text = rows[i].text.trim();
    const def = GRADING_ROWS.find((g) => text.startsWith(g.prefix));
    if (!def) continue;
    // The percent usually sits on the label row; wrapped labels push it one row down.
    let m = text.match(PERCENT_RE);
    if (!m && i + 1 < rows.length && !GRADING_ROWS.some((g) => rows[i + 1].text.trim().startsWith(g.prefix))) {
      m = rows[i + 1].text.match(PERCENT_RE);
    }
    if (m) items.push({ label: def.label, percent: Number(m[1]) });
  }
  return items;
}

/** Fallback for templates that spell out the breakdown in prose. */
function parseGradingText(text: string): GradingItem[] {
  const items: GradingItem[] = [];
  const re = /([^\d、,。\s][^\d、,。]*?)\s*(\d+)\s*[%％]/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const label = m[1].trim();
    if (label) items.push({ label, percent: Number(m[2]) });
  }
  return items;
}

// ---- Textbooks -----------------------------------------------------------

/** Column x-positions in the 教科書/参考書 tables (see the sample PDFs):
 *  ~37 kind (教科書/参考書), ~90 field label, ~129 value, ~415/519 ISBN & 出版年
 *  labels with their values to the right. */
const BOOK_VALUE_X = 110;
const BOOK_RIGHT_X = 400;

/** Value cell immediately right of a label cell on one row. */
function rightOf(row: Row, label: string): string {
  const i = row.cells.findIndex((c) => c.str.trim() === label);
  if (i === -1) return '';
  return row.cells[i + 1]?.str.trim() ?? '';
}

/** Parse one 教科書/参考書 section. Each book entry ends with its 著者名 row, so
 *  the section rows split cleanly at those rows; a 書名 can wrap across the rows
 *  above and below its own label. Rows left over after the last entry (or all
 *  rows, when the section is just a 備考) become the note. */
function parseBookSection(rows: Row[], defaultKind: TextbookRef['kind']): {
  books: TextbookRef[];
  note: string;
} {
  const books: TextbookRef[] = [];
  const noteRows: Row[] = [];
  let block: Row[] = [];

  const flush = (authorRow: Row) => {
    const entryRows = [...block, authorRow];
    const kindCell = entryRows
      .flatMap((r) => r.cells)
      .find((c) => c.str.trim() === '教科書' || c.str.trim() === '参考書');
    const title = block
      .flatMap((r) => r.cells)
      .filter((c) => c.x >= BOOK_VALUE_X && c.x < BOOK_RIGHT_X)
      .map((c) => c.str.trim())
      .join('')
      .trim();
    const isbn = block.map((r) => rightOf(r, 'ISBN')).find(Boolean) ?? '';
    books.push({
      kind: (kindCell?.str.trim() as TextbookRef['kind']) ?? defaultKind,
      title,
      author: rightOf(authorRow, '著者名'),
      publisher: rightOf(authorRow, '出版社'),
      year: rightOf(authorRow, '出版年'),
      isbn,
    });
    block = [];
  };

  for (const row of rows) {
    if (row.cells.some((c) => c.str.trim() === '著者名')) flush(row);
    else block.push(row);
  }
  // Anything after the last entry (or the whole section when there were none).
  noteRows.push(...block);

  const note = noteRows
    .map((r) =>
      r.cells
        .filter((c) => c.str.trim() !== '備考')
        .map((c) => c.str.trim())
        .join('')
        .trim(),
    )
    .filter(Boolean)
    .join('\n')
    .trim();

  return { books, note };
}

// ---- Goals by 観点 -------------------------------------------------------

const ASPECT_RE = /^(知識・理解|思考・判断|関心・意欲|態度|技能・表現)の観点/;

/** Break 授業の到達目標 into per-観点 statements. Aspect labels sit in a left
 *  column, vertically centered beside their statements, so statements are
 *  assigned to the nearest label block (same technique as the week table). */
function parseGoalAspects(rows: Row[]): GoalAspect[] {
  interface Anchor {
    aspect: string;
    x: number;
    docY: number;
  }
  const anchors: Anchor[] = [];
  for (const row of rows) {
    for (const c of row.cells) {
      const m = c.str.trim().match(ASPECT_RE);
      if (m) anchors.push({ aspect: m[1], x: c.x, docY: docY(row) });
    }
  }
  if (!anchors.length) return [];
  anchors.sort((a, b) => a.docY - b.docY);

  const gap = anchors.length > 1 ? anchors[1].docY - anchors[0].docY : 60;
  const startDocY = anchors[0].docY - gap / 2;
  const boundaries = anchors.map((a, i) =>
    i + 1 < anchors.length ? (a.docY + anchors[i + 1].docY) / 2 : Infinity,
  );
  const labelX = Math.min(...anchors.map((a) => a.x));
  const texts: string[][] = anchors.map(() => []);

  for (const row of rows) {
    const y = docY(row);
    if (y < startDocY) continue;
    let block = boundaries.findIndex((b) => y < b);
    if (block === -1) block = anchors.length - 1;
    const line = row.cells
      .filter((c) => c.x > labelX + 20)
      .map((c) => c.str.trim())
      .join('')
      .trim();
    if (line) texts[block].push(line);
  }

  return anchors
    .map((a, i) => ({ aspect: a.aspect, text: texts[i].join('\n').trim() }))
    .filter((g) => g.text);
}

// ---- Assembly ------------------------------------------------------------

function sectionText(sections: Section[], title: string): string {
  const s = sections.find((x) => x.title === title);
  if (!s) return '';
  return s.rows.map((r) => r.text).join('\n').trim();
}

function splitList(text: string): string[] {
  const raw = text
    .split(/[、,，\n]/)
    .map((s) => s.trim().replace(/^[^「]*「(.+)」$/, '$1').replace(/[「」]/g, ''))
    .map((s) => s.trim())
    .filter(Boolean);
  // Re-join items that a PDF line break split mid-way (unbalanced brackets).
  const items: string[] = [];
  for (const part of raw) {
    const prev = items[items.length - 1];
    const opens = (s: string) => (s.match(/[（(]/g) ?? []).length - (s.match(/[）)]/g) ?? []).length;
    if (prev && opens(prev) > 0) items[items.length - 1] = prev + part;
    else items.push(part);
  }
  return items;
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
  const hasWeekMarks = weeks.some((w) => w.alMarks);
  const al = parseALSummary(planText) ?? alFromWeeks(weeks);
  const hasAL = al.group || al.discussion || al.fieldwork || al.presentation;
  // Only warn when the AL info failed to parse — a table of blank marks is a
  // legitimate "no active learning" course, not a parse failure.
  if (!hasAL && !hasWeekMarks) warnings.push('al');

  const gradingRows = sections.find((s) => s.title === '成績評価法')?.rows ?? [];
  const grading = parseGradingTable(gradingRows);
  const gradingFinal = grading.length ? grading : parseGradingText(sectionText(sections, '成績評価法'));
  if (!gradingFinal.length) warnings.push('grading');

  const creditsRaw = belowInColumn(header, '単位数') || belowNearest(header, '単位数');
  const credits = Number(creditsRaw.replace(/[^\d.]/g, '')) || 0;
  if (!credits) warnings.push('credits');

  const goalRows = sections.find((s) => s.title === '授業の到達目標')?.rows ?? [];

  const textbookSection = parseBookSection(
    sections.find((s) => s.title === '教科書にかかわる情報')?.rows ?? [],
    '教科書',
  );
  const referenceSection = parseBookSection(
    sections.find((s) => s.title === '参考書にかかわる情報')?.rows ?? [],
    '参考書',
  );

  // Some templates label the overview section 概要 instead of 授業の目的と概要.
  const overview = sectionText(sections, '授業の目的と概要') || sectionText(sections, '概要');
  const generalGoal = sectionText(sections, '一般目標');
  const goals = sectionText(sections, '授業の到達目標') || generalGoal;

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
    division: sameRowValue(header, '特定科目区分') || sameRowValue(header, '区分'),
    overview,
    goals,
    goalAspects: parseGoalAspects(goalRows),
    weeks,
    al,
    grading: gradingFinal,
    textbooks: [...textbookSection.books, ...referenceSection.books],
    textbookNote: textbookSection.note,
    referenceNote: referenceSection.note,
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
