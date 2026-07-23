# Syllabus Dashboard · シラバス ダッシュボード

A privacy-friendly dashboard for university students whose school publishes each
course syllabus as a **separate PDF**. Point it at the folder where you keep your
syllabus PDFs and get:

- **A skill network for job hunting** — every course is linked to the knowledge
  it teaches (キーワード) and the transferable skills it trains (teamwork,
  discussion, presentation, hands-on practice, report writing — derived from the
  AL columns, weekly plans, and grading tables). Click a skill to see which
  courses built it, the evidence from each syllabus, and a ready-to-edit
  interview blurb (JA + EN).
- **Workload over the semester** — group vs. lecture vs. individual work per
  week, per course, with a semester filter across years.

Everything runs client-side. **PDFs never leave your browser**; parsed courses
are cached in `localStorage`.

## Features

- **Folder upload** — pick or drop the whole folder; PDFs are found recursively.
- **Fetch by 年度 + 時間割番号** — pull a syllabus straight from the university
  portal without opening it yourself (dev server only, see Notes).
- **Weekly timetable** — 曜日時限 parsed into a 月–金 × period grid, with 📕 for
  courses that need a textbook and 必 for ones you've tagged as required.
- **Simulate a course** — take a candidate (uploaded PDF, portal lookup, or one
  of your own courses) and see the new skills, the workload delta, and any
  timetable clash before you register. Nothing is saved until you add it.
- **Skill network** — force-directed graph of courses (squares), knowledge
  (circles), and transferable skills (diamonds). Skills shared by several
  courses become hubs; 関連科目 links appear as dashed edges.
- **Talking points panel** — per skill: the courses that built it in semester
  order, syllabus evidence (AL share, grading weight, quoted goals), and a
  copyable first-person draft for interviews / entry sheets.
- **Group vs. Individual timeline** — every course as a colour-coded 16-week
  strip on a shared week axis, so clusters of group deadlines stand out.
- **Semester workload summary** — % collaborative, credits, week distribution,
  with a per-semester filter.
- **Per-course detail** — full weekly plan, grading breakdown, overview & goals.
- **Bilingual (JP + EN)** — an EN/JP switch in the rail changes the whole
  interface. Text lifted from the PDF stays Japanese (it is the source of
  truth); course names use the syllabus's own 英文名 in English mode.

## How it works

1. `src/pdf/extractText.ts` — pdf.js extracts text **with x/y positions**
   (CID-keyed Japanese fonts are decoded via bundled cmaps in `public/cmaps/`).
2. `src/pdf/rowCluster.ts` — clusters positioned text into ordered rows.
3. `src/pdf/parseSyllabus.ts` — a **rule-based** parser for the Yamaguchi
   University templates. Column boundaries in the weekly-plan table are derived
   from the 項目/内容/授業外指示 header row and the A–F AL letter row, so both
   the older template (第N回 anchors, AL summary line) and the newer one
   (第N anchors, per-week 多/中/少/あり marks) parse. Grading prefers the
   観点別 table rows; 到達目標 are split by 観点. 教科書/参考書 tables are read
   per entry (each ends with its 著者名 row, and a 書名 can wrap across the rows
   above and below its own label).
4. `src/pdf/classifyWeek.ts` — keyword rules classify each week's work mode
   (title-first, content fallback, AL-mark fallback).
5. `src/skills/skills.ts` — builds the skill graph: キーワード → knowledge
   nodes; AL/weeks/grading thresholds → transferable-skill nodes with evidence;
   関連科目 → course-course links. Also drafts the interview blurbs.
6. `src/skills/layout.ts` — small deterministic force layout (no dependencies).
7. `src/data/schedule.ts` — parses 曜日時限 (`火1〜2`, `月1,水3〜4`, full-width
   digits, both wave dashes) into grid slots; also powers conflict detection.

The parser is locked against real PDFs by `src/pdf/parseSyllabus.test.ts`
(bundled HCI syllabus) and `src/pdf/samples.parse.test.ts` (the five PDFs in
`samples/`, 2023–2026 templates).

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # parser + classifier + skill-graph tests against real PDFs
npm run build    # type-check + production build
```

Click **Load sample (HCI)** in the app to try it with the bundled
`科学技術論演習I` syllabus, or drop the `samples/` folder onto the upload zone.

## Notes / limits

- The parser targets Yamaguchi University's syllabus templates. A syllabus from
  a different template will under-fill fields (shown as a "partially parsed"
  badge on the course card) rather than crash.
- Skill extraction is rule-based and conservative: knowledge nodes come only
  from the キーワード section; transferable skills need real evidence (AL ≥ 15%,
  ≥ 2–3 matching weeks, or grading weight) before they attach to a course.
- **必修/選択 is not in these PDFs.** The header field (`区分` on 2023–2024
  templates, `特定科目区分` on 2026) is blank for most courses — it holds
  `STEAM関連科目` on デザイン演習 and STEAM総論, and nothing on the rest. The app
  shows the parsed value when there is one, and otherwise lets you tag each
  course 必修/選択/自由 yourself; tags live in `localStorage` beside the courses.
- **Fetch by course number needs a proxy.** The portal's PDF endpoint
  (`/portal/Pdf/Pdf.aspx?…lct_year=…&lct_cd=…`) needs no login and ignores its
  `Sid` parameter, but sends no CORS headers, so the browser cannot call it
  directly. `vite.config.ts` proxies `/syllabus-pdf` to it in **dev only** — in a
  static production build the lookup fails and the UI says to upload the PDF
  instead. An unknown course code returns HTTP 200 with a stub PDF, so
  not-found is detected from the parsed content.
- Courses are cached under `syllabus-dashboard.courses.v2`; a `v1` cache is
  migrated on load.
