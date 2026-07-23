import { describe, it, expect } from 'vitest';
import type { Course } from '../data/types';
import { buildSkillGraph, normalizeSkill, semesterOrder } from './skills';

function course(partial: Partial<Course>): Course {
  return {
    id: 'x',
    year: '2023',
    faculty: '',
    term: '前期',
    schedule: '',
    titleJa: '科目',
    titleEn: '',
    credits: 2,
    language: '',
    instructor: '',
    targetYear: '',
    division: '',
    textbooks: [],
    textbookNote: '',
    referenceNote: '',
    overview: '',
    goals: '',
    goalAspects: [],
    weeks: [],
    al: { group: 0, discussion: 0, fieldwork: 0, presentation: 0 },
    grading: [],
    keywords: [],
    sdgs: [],
    related: [],
    contact: '',
    officeHours: '',
    parseWarnings: [],
    ...partial,
  };
}

describe('normalizeSkill', () => {
  it('unifies width and case', () => {
    expect(normalizeSkill('ＨＣＩ')).toBe('hci');
    expect(normalizeSkill('デザイン思考。')).toBe('デザイン思考');
    expect(normalizeSkill('データサイエンスと社会Ⅱ')).toBe('データサイエンスと社会ii');
  });
});

describe('semesterOrder', () => {
  it('orders year, then term, then half', () => {
    const a = course({ year: '2023', term: '前期前半' });
    const b = course({ year: '2023', term: '前期後半' });
    const c = course({ year: '2023', term: '後期' });
    const d = course({ year: '2024', term: '前期' });
    expect(semesterOrder(a)).toBeLessThan(semesterOrder(b));
    expect(semesterOrder(b)).toBeLessThan(semesterOrder(c));
    expect(semesterOrder(c)).toBeLessThan(semesterOrder(d));
  });
});

describe('buildSkillGraph', () => {
  it('merges the same keyword across courses', () => {
    const c1 = course({ id: '1', keywords: ['デザイン思考'] });
    const c2 = course({ id: '2', keywords: ['デザイン思考', 'HCI'] });
    const { skills } = buildSkillGraph([c1, c2]);
    const dt = skills.find((s) => s.label === 'デザイン思考');
    expect(dt?.courseIds).toEqual(['1', '2']);
    expect(dt?.type).toBe('domain');
    expect(skills.find((s) => s.label === 'HCI')?.courseIds).toEqual(['2']);
  });

  it('derives transferable skills from AL points and grading', () => {
    const c = course({
      id: '1',
      al: { group: 66, discussion: 21, fieldwork: 0, presentation: 7 },
      grading: [
        { label: '宿題・授業外レポート', percent: 80 },
        { label: '授業態度・参加度', percent: 20 },
      ],
    });
    const { skills } = buildSkillGraph([c]);
    const ids = skills.map((s) => s.id);
    expect(ids).toContain('skill:teamwork');
    expect(ids).toContain('skill:discussion');
    expect(ids).toContain('skill:writing');
    expect(ids).not.toContain('skill:presentation');
    const teamwork = skills.find((s) => s.id === 'skill:teamwork')!;
    expect(teamwork.evidence[0].detail).toContain('66%');
  });

  it('links courses through 関連科目 despite width differences', () => {
    const c1 = course({ id: '1', titleJa: 'データサイエンスと社会Ⅰ', related: ['データサイエンスと社会II'] });
    const c2 = course({ id: '2', titleJa: 'データサイエンスと社会Ⅱ' });
    const { courseLinks } = buildSkillGraph([c1, c2]);
    expect(courseLinks).toEqual([{ a: '1', b: '2' }]);
  });

  it('quotes goal sentences that mention a keyword', () => {
    const c = course({
      id: '1',
      keywords: ['デザイン思考'],
      overview: 'デザイン思考プロセスの実践を通して、課題解決のスキルを習得する。',
    });
    const { skills } = buildSkillGraph([c]);
    const dt = skills.find((s) => s.label === 'デザイン思考')!;
    expect(dt.evidence.some((e) => e.source === 'goal' && e.detail.includes('デザイン思考プロセス'))).toBe(true);
  });
});
