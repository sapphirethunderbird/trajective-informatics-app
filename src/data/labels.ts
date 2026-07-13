import type { WorkMode } from './types';

/** Bilingual UI labels. Japanese values from the PDF stay as source of truth;
 *  these provide English labels for the interface. */
export const fieldLabels: Record<string, { ja: string; en: string }> = {
  year: { ja: '開講年度', en: 'Year' },
  faculty: { ja: '開講学部等', en: 'Faculty' },
  term: { ja: '開講学期', en: 'Term' },
  schedule: { ja: '曜日時限', en: 'Day / Period' },
  credits: { ja: '単位数', en: 'Credits' },
  language: { ja: '使用言語', en: 'Language' },
  instructor: { ja: '担当教員', en: 'Instructor' },
  targetYear: { ja: '対象年次', en: 'Target Year' },
  overview: { ja: '授業の目的と概要', en: 'Purpose & Overview' },
  goals: { ja: '授業の到達目標', en: 'Learning Goals' },
  weeks: { ja: '授業計画', en: 'Weekly Plan' },
  al: { ja: 'アクティブ・ラーニング', en: 'Active Learning' },
  grading: { ja: '成績評価法', en: 'Grading' },
  keywords: { ja: 'キーワード', en: 'Keywords' },
  sdgs: { ja: '持続可能な開発目標', en: 'SDGs' },
  related: { ja: '関連科目', en: 'Related Courses' },
  contact: { ja: '連絡先', en: 'Contact' },
  officeHours: { ja: 'オフィスアワー', en: 'Office Hours' },
};

export const workModeLabels: Record<WorkMode, { ja: string; en: string }> = {
  group: { ja: 'グループ', en: 'Group' },
  individual: { ja: '個人', en: 'Individual' },
  discussion: { ja: '議論・共有', en: 'Discussion' },
  fieldwork: { ja: '実践・演習', en: 'Practical' },
  lecture: { ja: '講義', en: 'Lecture' },
};

/** Colorblind-safe categorical palette (Okabe–Ito derived). */
export const workModeColors: Record<WorkMode, string> = {
  group: '#0072b2', // strong blue — collaborative
  individual: '#d55e00', // vermillion — solo
  discussion: '#009e73', // bluish green
  fieldwork: '#cc79a7', // reddish purple
  lecture: '#8a8f98', // neutral grey — passive
};

export const alLabels = {
  group: workModeLabels.group,
  discussion: workModeLabels.discussion,
  fieldwork: { ja: 'フィールドワーク', en: 'Fieldwork' },
  presentation: { ja: 'プレゼンテーション', en: 'Presentation' },
} as const;

export const alColors = {
  group: workModeColors.group,
  discussion: workModeColors.discussion,
  fieldwork: workModeColors.fieldwork,
  presentation: '#e69f00', // orange
} as const;
