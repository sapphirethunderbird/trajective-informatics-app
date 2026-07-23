// Locks the parser against the sample PDFs in samples/ (2023–2024 templates:
// 第N anchors without 回 on the same cell, per-week AL mark columns, 観点別
// grading table). Skipped when the samples folder is absent.
import { describe, it, expect } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { clusterRows, type PositionedItem, type Row } from './rowCluster';
import { parseSyllabus } from './parseSyllabus';
import type { Course } from '../data/types';
import { buildSkillGraph } from '../skills/skills';
import { needsTextbook } from '../data/aggregate';

const SAMPLES_DIR = fileURLToPath(new URL('../../samples', import.meta.url));
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

const parse = async (file: string): Promise<Course> =>
  parseSyllabus(await extractRowsNode(join(SAMPLES_DIR, file)));

describe.skipIf(!existsSync(SAMPLES_DIR))('sample PDFs (2023–2024 templates)', () => {
  it('parses データサイエンスと社会Ⅰ — lecture course, no AL', async () => {
    const c = await parse('2023_データサイエンスと社会１.pdf');
    expect(c.id).toBe('1091211565');
    expect(c.titleJa).toBe('データサイエンスと社会Ⅰ');
    expect(c.titleEn).toBe('Data Science and Society I');
    expect(c.credits).toBe(1);
    expect(c.weeks).toHaveLength(8);
    expect(c.weeks[1].title).toBe('情報セキュリティ');
    expect(c.weeks.filter((w) => w.mode === 'lecture').length).toBeGreaterThanOrEqual(6);
    expect(c.grading).toContainEqual({ label: '演習', percent: 70 });
    expect(c.keywords).toEqual(['情報リテラシー', '情報モラル', '情報セキュリティ']);
    expect(c.goalAspects.map((g) => g.aspect)).toContain('知識・理解');
    // AL table exists but is all blank — that's "no AL", not a parse failure.
    expect(c.parseWarnings).not.toContain('weeks');
    expect(c.parseWarnings).not.toContain('grading');
  });

  it('parses 哲学思考 — group-work heavy with per-week AL marks', async () => {
    const c = await parse('2023_哲学思考.pdf');
    expect(c.titleJa).toBe('哲学思考');
    expect(c.weeks).toHaveLength(8);
    expect(c.al.group).toBeGreaterThanOrEqual(50); // A:多 in 7 of 8 weeks
    expect(c.weeks.filter((w) => w.mode === 'group').length).toBeGreaterThanOrEqual(6);
    expect(c.grading).toContainEqual({ label: '宿題・授業外レポート', percent: 80 });
    expect(c.goalAspects).toHaveLength(5);
    expect(c.parseWarnings).toEqual([]);
  });

  it('parses 社会と医療 — 少 marks stay lectures', async () => {
    const c = await parse('2023_社会と医療.pdf');
    expect(c.weeks).toHaveLength(8);
    expect(c.weeks.every((w) => w.mode === 'lecture')).toBe(true);
    expect(c.al).toEqual({ group: 8, discussion: 8, fieldwork: 8, presentation: 8 });
  });

  it('parses デザイン演習 — 16 weeks of practice and group work', async () => {
    const c = await parse('2024_デザイン演習.pdf');
    expect(c.titleJa).toBe('デザイン演習');
    expect(c.titleEn).toBe('Design Practice');
    expect(c.weeks).toHaveLength(16);
    expect(c.al).toEqual({ group: 33, discussion: 33, fieldwork: 33, presentation: 33 });
    expect(c.keywords).toContain('プロトタイピング');
    expect(c.grading).toContainEqual({ label: '発表・制作作品', percent: 60 });
    // Wrapped 関連科目 lines are re-joined, not split mid-item.
    expect(c.related).toContain('デジタルファブリケーション１（レーザー加工/CNC）');
    expect(c.division).toBe('STEAM関連科目');
    expect(c.parseWarnings).toEqual([]);
  });

  it('parses the 参考書 table — titles wrap across the 書名 label row', async () => {
    const c = await parse('2024_デザイン演習.pdf');
    expect(c.textbooks).toHaveLength(2);
    expect(c.textbooks.every((t) => t.kind === '参考書')).toBe(true);
    expect(needsTextbook(c)).toBe(false); // 参考書 only — no required textbook
    expect(c.textbooks[0]).toEqual({
      kind: '参考書',
      title: 'システム×デザイン思考で世界を変える : 慶応SDM「イノベーションのつくり方」',
      author: '前野隆司編著',
      publisher: '日経BP社',
      year: '2014',
      isbn: '4822249948',
    });
    expect(c.textbooks[1].title).toBe('デザインリサーチの教科書');
    expect(c.textbooks[1].isbn).toBe('4802511779');
    // 教科書 section holds only a 備考 for this course.
    expect(c.textbookNote).toBe('適宜レジュメ等を配付します。');
  });

  it('keeps 区分 empty when the header cell has no value', async () => {
    const c = await parse('2023_哲学思考.pdf');
    expect(c.division).toBe(''); // next cell on the row is the 対象学生 label
    expect(c.textbookNote).toBe('テキストは使用しない');
  });

  it('parses STEAM総論 — 単位数 sits far right of its label in the 2026 template', async () => {
    const c = await parse('2026_STEAM総論.pdf');
    expect(c.id).toBe('1091011002');
    expect(c.titleJa).toBe('STEAM総論');
    expect(c.credits).toBe(1); // 70 units right of the label — outside belowNearest's tolerance
    expect(c.schedule).toBe('月5～6');
    expect(c.division).toBe('STEAM関連科目');
    expect(c.parseWarnings).not.toContain('credits');
    // 参考書 only, so this course does not require a textbook.
    expect(c.textbooks.length).toBeGreaterThan(0);
    expect(needsTextbook(c)).toBe(false);
  });

  it('builds a connected skill graph from all four samples', async () => {
    const courses = await Promise.all(
      [
        '2023_データサイエンスと社会１.pdf',
        '2023_哲学思考.pdf',
        '2023_社会と医療.pdf',
        '2024_デザイン演習.pdf',
      ].map(parse),
    );
    const { skills } = buildSkillGraph(courses);
    const teamwork = skills.find((s) => s.id === 'skill:teamwork');
    expect(teamwork?.courseIds.length).toBeGreaterThanOrEqual(2); // 哲学思考 + デザイン演習
    const writing = skills.find((s) => s.id === 'skill:writing');
    expect(writing?.courseIds.length).toBeGreaterThanOrEqual(2);
    expect(skills.filter((s) => s.type === 'domain').length).toBeGreaterThanOrEqual(10);
  });
});
