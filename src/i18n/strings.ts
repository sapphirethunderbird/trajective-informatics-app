import { fieldLabels, workModeLabels, alLabels } from '../data/labels';

export type Lang = 'ja' | 'en';
export type Bilingual = { ja: string; en: string };

/** UI chrome. Content lifted from the PDF stays Japanese — only the interface
 *  switches. Field/work-mode names reuse the existing bilingual label tables. */
const ui = {
  appName: { ja: 'シラバス ダッシュボード', en: 'Syllabus Dashboard' },
  tagline: {
    ja: '学期の負荷をひと目で・就活で話せるスキルネットワーク',
    en: 'Workload at a glance · a skill network for job hunting',
  },

  // Navigation / rail
  dashboard: { ja: 'ダッシュボード', en: 'Dashboard' },
  skillsView: { ja: 'スキルネットワーク', en: 'Skill network' },
  simulate: { ja: 'シミュレート', en: 'Simulate' },
  upload: { ja: 'アップロード', en: 'Upload' },
  term: { ja: '時期', en: 'Term' },
  allTerms: { ja: '全期間', en: 'All terms' },
  profile: { ja: 'プロフィール', en: 'Profile' },
  language: { ja: '言語', en: 'Language' },
  back: { ja: '戻る', en: 'Back' },
  close: { ja: '閉じる', en: 'Close' },

  // Dashboard
  courses: { ja: '科目', en: 'Courses' },
  courseList: { ja: '科目一覧', en: 'Courses' },
  credits: { ja: '単位', en: 'Credits' },
  classWeeks: { ja: '授業週', en: 'Class weeks' },
  collaborative: { ja: '協働', en: 'Collaborative' },
  collaborativeSub: { ja: 'グループ＋議論', en: 'group + discussion' },
  semesterWorkload: { ja: '学期の負荷', en: 'Semester workload' },
  activeLearning: { ja: '平均AL', en: 'Active learning' },
  weeklySchedule: { ja: '週の時間割', en: 'Weekly schedule' },
  topSkills: { ja: 'トップスキル', en: 'Top skills' },
  noGridSlot: { ja: '時間割枠なし（集中講義など）', en: 'No fixed slot (intensive etc.)' },
  emptySchedule: { ja: 'この学期の授業はありません', en: 'No courses in this term' },
  openSkillNetwork: { ja: 'ネットワークを開く', en: 'Open the network' },

  // Timeline
  timelineTitle: { ja: 'グループ／個人 タイムライン', en: 'Group vs. individual timeline' },
  timelineIntro: {
    ja: '各行が1科目の学期全体です。グループワークが重なる週に注目してください。',
    en: 'Each row is a course across the semester. Watch for columns where group work stacks up.',
  },
  weeksArrow: { ja: '週 →', en: 'weeks →' },
  hoverHint: { ja: 'セルにカーソルを合わせると詳細', en: 'Hover a cell for details' },
  noAlData: { ja: 'ALデータなし', en: 'no AL data' },

  // Course meta
  needsTextbook: { ja: '教科書あり', en: 'Textbook needed' },
  noTextbook: { ja: '教科書なし', en: 'No textbook' },
  textbooks: { ja: '教科書・参考書', en: 'Textbooks & references' },
  requirement: { ja: '履修区分', en: 'Requirement' },
  requirementUnset: { ja: '未設定', en: 'Not set' },
  requirementHint: {
    ja: '必修かどうかはシラバスPDFに載っていないため、自分で設定します。',
    en: "Required/elective isn't printed in the syllabus PDF — set it yourself.",
  },
  partiallyParsed: { ja: '一部読み取れず', en: 'Partially parsed' },
  remove: { ja: '削除', en: 'Remove' },
  removeConfirm: { ja: 'この科目を削除しますか？', en: 'Remove this course?' },
  weeksLabel: { ja: '週', en: 'weeks' },

  // Uploader
  dropTitle: { ja: 'シラバスPDFのフォルダをここにドロップ', en: 'Drop a folder of syllabus PDFs here' },
  dropSub: { ja: 'すべてブラウザ内で処理されます', en: 'everything stays in your browser' },
  chooseFolder: { ja: 'フォルダを選ぶ', en: 'Choose folder' },
  chooseFiles: { ja: 'ファイルを選ぶ', en: 'Choose files' },
  loadSample: { ja: 'サンプルを読み込む (HCI)', en: 'Load sample (HCI)' },
  addFolder: { ja: '＋ フォルダ', en: '+ Add folder' },
  addPdfs: { ja: '＋ PDF', en: '+ PDFs' },
  parsing: { ja: '読み取り中…', en: 'Parsing…' },
  emptyStateHelp: {
    ja: '大学のシラバスは科目ごとに別のPDFです。保存しているフォルダを指定すると、学期ごとの負荷と、面接で話せるスキルネットワークが作れます。',
    en: 'Your university publishes a separate PDF per course. Point this at the folder where you keep them — see your workload per semester, and build a skill network you can talk from in interviews.',
  },
  failedToParse: { ja: '読み取れませんでした:', en: 'Failed to parse:' },

  // Lookup by ID
  lookupTitle: { ja: '授業番号で取得', en: 'Fetch by course number' },
  lookupYear: { ja: '年度', en: 'Year' },
  lookupCode: { ja: '時間割番号（10桁）', en: 'Course number (10 digits)' },
  lookupSubmit: { ja: '取得', en: 'Fetch' },
  lookupInvalid: { ja: '年度4桁と時間割番号10桁を入力してください。', en: 'Enter a 4-digit year and a 10-digit course number.' },
  lookupNotFound: { ja: 'この授業は見つかりませんでした。', en: 'Course not found.' },
  lookupUnavailable: {
    ja: '取得できませんでした。開発サーバー以外では番号検索が使えません — PDFをアップロードしてください。',
    en: 'Lookup unavailable outside the dev server — upload the PDF instead.',
  },

  // Skill panel / network
  sharedOnly: { ja: '複数科目のスキルのみ', en: 'Shared skills only' },
  fullscreen: { ja: '全画面', en: 'Fullscreen' },
  exitFullscreen: { ja: '全画面を終了', en: 'Exit fullscreen' },
  moreInfo: { ja: '詳細', en: 'More info' },
  skillNetworkTitle: { ja: 'スキルのつながり', en: 'Skill network' },
  legendCourse: { ja: '科目', en: 'Course' },
  legendKnowledge: { ja: '知識・トピック', en: 'Knowledge & topics' },
  legendTransferable: { ja: '汎用スキル', en: 'Transferable skills' },
  networkHint: {
    ja: 'スキルをクリックで詳細、科目をクリックでシラバスへ。',
    en: 'Click a skill for talking points · click a course to open its syllabus.',
  },
  networkAria: {
    ja: '科目と、そこで身につくスキルのネットワーク',
    en: 'Network of courses and the skills they develop',
  },
  noSkills: {
    ja: 'まだスキルがありません — キーワード欄のあるシラバスPDFを追加してください。',
    en: 'No skills extracted yet — add syllabus PDFs with キーワード sections.',
  },
  selectNodeHint: { ja: 'ノードをクリックすると詳細が表示されます。', en: 'Click a node to see the details.' },
  talkingPoints: { ja: '面接で話す材料', en: 'Talking points' },
  talkingPointsIntro: {
    ja: 'ネットワークでスキルを選ぶと、そのスキルを育てた科目・シラバス上の根拠・面接用の下書きが表示されます。',
    en: 'Pick a skill in the network to see which courses built it, the evidence from each syllabus, and a ready-to-edit interview blurb.',
  },
  mostConnected: { ja: 'よく登場するスキル', en: 'Most connected' },
  skillTypeTransferable: { ja: '汎用スキル', en: 'Transferable' },
  skillTypeKnowledge: { ja: '知識・技術', en: 'Knowledge' },
  whereBuilt: { ja: '学んだ科目', en: 'Where it was built' },
  interviewDraft: { ja: '面接・ES用ドラフト', en: 'Interview draft' },
  showOtherDraft: { ja: '英語の下書きを表示', en: 'Show the Japanese draft' },
  hideOtherDraft: { ja: '英語の下書きを隠す', en: 'Hide the Japanese draft' },
  draftCaveat: {
    ja: 'シラバスの記載だけから作成しています。自分の経験を加えてから使ってください。',
    en: 'Drafted only from what the syllabi say — edit in your own experience before using.',
  },
  copy: { ja: 'コピー', en: 'Copy' },
  copied: { ja: 'コピーしました ✓', en: 'Copied ✓' },

  // Simulate
  simulateTitle: { ja: 'この授業を取ったら', en: 'If I take this course' },
  simulateIntro: {
    ja: '候補の授業を選ぶと、スキルと負荷がどう変わるかを表示します。追加するまで保存されません。',
    en: 'Pick a candidate course to see how your skills and workload would change. Nothing is saved until you add it.',
  },
  simulateSearch: { ja: '登録済みの科目から選ぶ', en: 'Pick from your courses' },
  simulateSearchPlaceholder: { ja: '科目名または時間割番号', en: 'Course name or number' },
  candidate: { ja: '候補の授業', en: 'Candidate course' },
  clearCandidate: { ja: '候補を外す', en: 'Clear candidate' },
  newSkills: { ja: '新しく得られるスキル', en: 'New skills' },
  strengthenedSkills: { ja: '強化されるスキル', en: 'Strengthened skills' },
  noSkillChange: { ja: 'スキルの構成は変わりません。', en: 'No change to your skill set.' },
  scheduleConflict: { ja: '時間割の重複', en: 'Timetable conflict' },
  noConflict: { ja: '時間割の重複はありません。', en: 'No timetable conflict.' },
  addToCourses: { ja: '科目に追加', en: 'Add to my courses' },
  alreadyAdded: { ja: 'すでに登録済みです', en: 'Already in your courses' },
  workloadChange: { ja: '負荷の変化', en: 'Workload change' },
} satisfies Record<string, Bilingual>;

/** Field names and work-mode names come from the existing label tables so the
 *  Japanese wording matches the PDF exactly. */
export const strings = {
  ...ui,
  ...(Object.fromEntries(Object.entries(fieldLabels).map(([k, v]) => [`field.${k}`, v])) as Record<
    string,
    Bilingual
  >),
  ...(Object.fromEntries(Object.entries(workModeLabels).map(([k, v]) => [`mode.${k}`, v])) as Record<
    string,
    Bilingual
  >),
  ...(Object.fromEntries(Object.entries(alLabels).map(([k, v]) => [`al.${k}`, v])) as Record<
    string,
    Bilingual
  >),
};

export type StringKey = keyof typeof ui | string;
