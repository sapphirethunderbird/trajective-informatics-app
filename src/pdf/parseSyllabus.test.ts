import { describe, it, expect } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { clusterRows, type PositionedItem, type Row } from './rowCluster';
import { parseSyllabus } from './parseSyllabus';
import { classifyWeek } from './classifyWeek';
import { needsTextbook } from '../data/aggregate';

const PDF_PATH = fileURLToPath(new URL('../../HCI_syllabus.pdf', import.meta.url));
const CMAP_URL = fileURLToPath(new URL('../../node_modules/pdfjs-dist/cmaps/', import.meta.url));

async function extractRowsNode(path: string): Promise<Row[]> {
  const data = new Uint8Array(readFileSync(path));
  const doc = await getDocument({ data, cMapUrl: CMAP_URL, cMapPacked: true }).promise;
  const rows: Row[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const items: PositionedItem[] = content.items
      .filter((it: any) => 'str' in it)
      .map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
    rows.push(...clusterRows(items, p));
  }
  return rows;
}

describe('parseSyllabus (HCI fixture)', () => {
  it('extracts the header metadata', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    expect(course.id).toBe('1091011074');
    expect(course.year).toBe('2026');
    expect(course.term).toBe('後期');
    expect(course.schedule).toBe('火1～2');
    expect(course.credits).toBe(2);
    expect(course.language).toBe('英語');
    expect(course.titleJa).toBe('科学技術論演習Ⅰ');
    expect(course.titleEn).toBe('Human Computer Interaction');
    expect(course.instructor).toContain('杉野');
    expect(course.targetYear).toBe('2～');
    expect(course.parseWarnings).toEqual([]);
  });

  it('parses all 16 weeks with correct titles', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    expect(course.weeks).toHaveLength(16);
    expect(course.weeks[0].title).toBe('オリエンテーション');
    expect(course.weeks[11].title).toBe('中間個人発表');
    expect(course.weeks[12].title).toBe('グループプロジェクト１');
    expect(course.weeks[14].title).toBe('最終グループプレゼンテーション');
    expect(course.weeks[15].title).toBe('総括');
  });

  it('classifies week work modes (title-first)', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    const modes = course.weeks.map((w) => w.mode);
    expect(modes[1]).toBe('group'); // Wk2 grouping/pairing (from content)
    expect(modes[4]).toBe('discussion'); // Wk5 共有と振り返り
    expect(modes[11]).toBe('individual'); // Wk12 中間個人発表 — not contaminated by グループ再編
    expect(modes[12]).toBe('group'); // Wk13 group project
    expect(modes[14]).toBe('group'); // Wk15 final group presentation
  });

  it('parses AL points and grading', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    expect(course.al).toEqual({ group: 20, discussion: 20, fieldwork: 40, presentation: 20 });
    expect(course.grading).toEqual([
      { label: 'クラス内活動', percent: 30 },
      { label: '実践演習の成果', percent: 50 },
      { label: 'プレゼンテーション', percent: 20 },
    ]);
  });

  it('reads the textbook sections as notes — this course lists no books', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    expect(course.textbooks).toEqual([]);
    expect(course.textbookNote).toBe('講義資料は適宜Moodleを通じて共有する。');
    expect(course.referenceNote).toBe('参考資料は必要に応じて講義中に共有または配布する。');
    expect(needsTextbook(course)).toBe(false);
  });

  it('leaves 区分 empty rather than picking up the next column label', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    expect(course.division).toBe(''); // 特定科目区分 is blank in this syllabus
  });

  it('parses keywords and related courses', async () => {
    const course = parseSyllabus(await extractRowsNode(PDF_PATH));
    expect(course.keywords).toContain('HCI');
    expect(course.keywords).toContain('計算機科学');
    expect(course.related.length).toBeGreaterThanOrEqual(2);
  });
});

describe('classifyWeek', () => {
  it('classifies the sanity-check weeks', () => {
    expect(classifyWeek('オリエンテーション', '・ガイダンス')).toBe('lecture');
    expect(classifyWeek('計算機社会への招待', '・グルーピング/ペアリング')).toBe('group');
    expect(classifyWeek('共有と振り返り１', '・振り返り\n・議論')).toBe('discussion');
    expect(classifyWeek('中間個人発表', '・中間個人発表')).toBe('individual');
    expect(classifyWeek('グループプロジェクト１', '・グループプロジェクトを進める')).toBe('group');
    expect(classifyWeek('最終グループプレゼンテーション', '・相互レビュー')).toBe('group');
  });
});
