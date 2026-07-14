export type WorkMode = 'group' | 'individual' | 'lecture' | 'discussion' | 'fieldwork';

/** Per-week AL (active learning) column marks: A グループワーク, B ディスカッション,
 *  C フィールドワーク, D プレゼンテーション, E 振り返り, F 宿題.
 *  Values are the raw marks: 多 / 中 / 少 / あり. */
export type ALColumn = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type WeekALMarks = Partial<Record<ALColumn, string>>;

export interface WeekPlan {
  week: number; // 1..16
  title: string; // 項目 e.g. "グループプロジェクト1"
  content: string; // 内容
  outsideStudy: string; // 授業時間外学習
  note: string; // 備考
  mode: WorkMode; // derived by classifyWeek
  alMarks?: WeekALMarks; // present when the syllabus has per-week AL columns
}

/** One 観点 (aspect) of 授業の到達目標, e.g. 知識・理解 → its can-do statements. */
export interface GoalAspect {
  aspect: string; // 知識・理解 | 思考・判断 | 関心・意欲 | 態度 | 技能・表現
  text: string;
}

export interface ALPoints {
  group: number; // A グループワーク %
  discussion: number; // B ディスカッション %
  fieldwork: number; // C フィールドワーク %
  presentation: number; // D プレゼンテーション %
}

export interface GradingItem {
  label: string;
  percent: number;
}

export interface Course {
  id: string; // 時間割番号 (timetable no.) as stable key
  year: string; // 開講年度
  faculty: string; // 開講学部等
  term: string; // 開講学期 (後期 …)
  schedule: string; // 曜日時限 e.g. 火1〜2
  titleJa: string; // 科目名
  titleEn: string; // [英文名]
  credits: number; // 単位数
  language: string; // 使用言語
  instructor: string; // 担当教員 責任
  targetYear: string; // 対象年次
  overview: string; // 授業の目的と概要
  goals: string; // 授業の到達目標
  goalAspects: GoalAspect[]; // 到達目標 broken down by 観点 (empty when absent)
  weeks: WeekPlan[]; // 授業計画
  al: ALPoints;
  grading: GradingItem[]; // 成績評価法 breakdown
  keywords: string[]; // キーワード
  sdgs: string[]; // 持続可能な開発目標
  related: string[]; // 関連科目
  contact: string; // 連絡先
  officeHours: string; // オフィスアワー
  /** Sections that failed to parse cleanly — surfaced in the UI. */
  parseWarnings: string[];
}
