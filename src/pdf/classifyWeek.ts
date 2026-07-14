import type { WorkMode, WeekALMarks } from '../data/types';

interface Rule {
  mode: WorkMode;
  keywords: string[];
}

/** Ordered keyword rules, first match wins. Tuned to the Yamaguchi syllabus
 *  vocabulary. */
const RULES: Rule[] = [
  { mode: 'group', keywords: ['グループ', 'グルーピング', 'ペアリング', 'チーム', '相互レビュー', '相互'] },
  // Bare 個人 would misfire on 個人情報 (personal information), so require
  // a work-form suffix.
  { mode: 'individual', keywords: ['個人発表', '個人ワーク', '個人課題', '個人演習', '個人製作', '個人制作'] },
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

/** When keywords are silent, the per-week AL columns still tell us the shape
 *  of the class: A グループワーク, C フィールドワーク/演習, B ディスカッション.
 *  少 (<15% of class time) is too weak a signal to reclassify a lecture. */
function fromALMarks(marks: WeekALMarks | undefined): WorkMode | null {
  if (!marks) return null;
  const strong = (v?: string) => v === '多' || v === '中';
  if (strong(marks.A)) return 'group';
  if (strong(marks.C)) return 'fieldwork';
  if (strong(marks.B)) return 'discussion';
  return null;
}

/**
 * Classify a week's work mode. The title is the canonical descriptor, so it is
 * matched first; the content (which can bleed bullets from adjacent weeks near
 * table boundaries) is only consulted when the title is neutral, and the AL
 * column marks only when both are.
 */
export function classifyWeek(title: string, content: string, alMarks?: WeekALMarks): WorkMode {
  return match(title) ?? match(content) ?? fromALMarks(alMarks) ?? 'lecture';
}

/** True for modes that involve working with others. */
export function isCollaborative(mode: WorkMode): boolean {
  return mode === 'group' || mode === 'discussion';
}
