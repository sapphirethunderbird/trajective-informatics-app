import type { WorkMode } from '../data/types';

interface Rule {
  mode: WorkMode;
  keywords: string[];
}

/** Ordered keyword rules, first match wins. Tuned to the Yamaguchi syllabus
 *  vocabulary. */
const RULES: Rule[] = [
  { mode: 'group', keywords: ['グループ', 'グルーピング', 'ペアリング', '相互レビュー', '相互'] },
  { mode: 'individual', keywords: ['個人発表', '個人'] },
  { mode: 'fieldwork', keywords: ['フィールドワーク', '実習', '活用実践', '実践演習', '演習'] },
  { mode: 'discussion', keywords: ['ディスカッション', 'ディベート', '議論', '振り返り', '共有'] },
  { mode: 'lecture', keywords: ['講義', 'オリエンテーション', '理論', '紹介', 'ガイダンス', '総括'] },
];

function match(text: string): WorkMode | null {
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => text.includes(kw))) return rule.mode;
  }
  return null;
}

/**
 * Classify a week's work mode. The title is the canonical descriptor, so it is
 * matched first; the content (which can bleed bullets from adjacent weeks near
 * table boundaries) is only consulted when the title is neutral.
 */
export function classifyWeek(title: string, content: string): WorkMode {
  return match(title) ?? match(content) ?? 'lecture';
}

/** True for modes that involve working with others. */
export function isCollaborative(mode: WorkMode): boolean {
  return mode === 'group' || mode === 'discussion';
}
