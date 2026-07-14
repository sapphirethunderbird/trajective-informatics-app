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
- **Bilingual (JP + EN)** — Japanese values kept as source of truth, English UI
  labels alongside.

## How it works

1. `src/pdf/extractText.ts` — pdf.js extracts text **with x/y positions**
   (CID-keyed Japanese fonts are decoded via bundled cmaps in `public/cmaps/`).
2. `src/pdf/rowCluster.ts` — clusters positioned text into ordered rows.
3. `src/pdf/parseSyllabus.ts` — a **rule-based** parser for the Yamaguchi
   University templates. Column boundaries in the weekly-plan table are derived
   from the 項目/内容/授業外指示 header row and the A–F AL letter row, so both
   the older template (第N回 anchors, AL summary line) and the newer one
   (第N anchors, per-week 多/中/少/あり marks) parse. Grading prefers the
   観点別 table rows; 到達目標 are split by 観点.
4. `src/pdf/classifyWeek.ts` — keyword rules classify each week's work mode
   (title-first, content fallback, AL-mark fallback).
5. `src/skills/skills.ts` — builds the skill graph: キーワード → knowledge
   nodes; AL/weeks/grading thresholds → transferable-skill nodes with evidence;
   関連科目 → course-course links. Also drafts the interview blurbs.
6. `src/skills/layout.ts` — small deterministic force layout (no dependencies).

The parser is locked against real PDFs by `src/pdf/parseSyllabus.test.ts`
(bundled HCI syllabus) and `src/pdf/samples.parse.test.ts` (the four PDFs in
`samples/`, 2023–2024 templates).

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
- Regenerate the parser snapshot fixture (`src/fixtures/hci.parsed.json`) if the
  parser changes intentionally.
