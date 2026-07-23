import { describe, it, expect } from 'vitest';
import { parseSchedule, conflicts, usedPeriods } from './schedule';
import type { Course } from './types';

const course = (schedule: string): Course => ({ schedule } as Course);

describe('parseSchedule', () => {
  it('parses a period range with the wave dash used in the PDFs', () => {
    // U+FF5E (as extracted from the 2026 template) and U+301C both occur.
    expect(parseSchedule('火1～2')).toEqual([{ day: 1, periods: [1, 2] }]);
    expect(parseSchedule('木7〜8')).toEqual([{ day: 3, periods: [7, 8] }]);
  });

  it('parses a single period', () => {
    expect(parseSchedule('月5')).toEqual([{ day: 0, periods: [5] }]);
  });

  it('parses several slots in one string', () => {
    expect(parseSchedule('月1,水3〜4')).toEqual([
      { day: 0, periods: [1] },
      { day: 2, periods: [3, 4] },
    ]);
  });

  it('normalizes full-width digits', () => {
    expect(parseSchedule('水３〜４')).toEqual([{ day: 2, periods: [3, 4] }]);
  });

  it('returns nothing for values with no grid position', () => {
    expect(parseSchedule('集中')).toEqual([]);
    expect(parseSchedule('')).toEqual([]);
    expect(parseSchedule('土2〜3')).toEqual([]); // weekend — outside the grid
  });
});

describe('conflicts', () => {
  it('detects an overlapping period on the same day', () => {
    expect(conflicts(course('火1～2'), course('火2〜3'))).toBe(true);
  });

  it('ignores the same period on a different day', () => {
    expect(conflicts(course('火1～2'), course('水1〜2'))).toBe(false);
  });

  it('never conflicts with an unscheduled course', () => {
    expect(conflicts(course('火1～2'), course('集中'))).toBe(false);
  });
});

describe('usedPeriods', () => {
  it('trims the grid to the periods in use, keeping at least 1〜4', () => {
    expect(usedPeriods([course('火1～2')])).toEqual([1, 2, 3, 4]);
    expect(usedPeriods([course('木7〜8')])).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
