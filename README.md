# Syllabus Dashboard · シラバス ダッシュボード

A privacy-friendly dashboard for university students whose school publishes each
course syllabus as a **separate PDF**. Drop in all your course PDFs and get one
unified view — schedule, credits, grading, keywords — plus a visual that shows
**group work vs. individual work** across the whole semester.

Everything runs client-side. **PDFs never leave your browser**; parsed courses
are cached in `localStorage`.

## Features

- **Multi-course dashboard** — aggregate any number of syllabus PDFs.
- **Group vs. Individual timeline** — every course as a colour-coded 16-week
  strip on a shared week axis, so clusters of group deadlines stand out.
- **Semester workload summary** — % collaborative, credits, week distribution.
- **Active-Learning donut** — the syllabus's AL points (group / discussion /
  fieldwork / presentation).
- **Per-course detail** — full weekly plan, grading breakdown, overview & goals.
- **Bilingual (JP + EN)** — Japanese values kept as source of truth, English UI
  labels alongside.

## How it works

1. `src/pdf/extractText.ts` — pdf.js extracts text **with x/y positions**
   (CID-keyed Japanese fonts are decoded via bundled cmaps in `public/cmaps/`).
2. `src/pdf/rowCluster.ts` — clusters positioned text into ordered rows.
3. `src/pdf/parseSyllabus.ts` — a **rule-based** parser tuned to the Yamaguchi
   University template: section anchors (`■■` labels), the header metadata table,
   and the 16-week class-plan table (reconstructed from column x-positions).
4. `src/pdf/classifyWeek.ts` — keyword rules classify each week's work mode
   (title-first, content fallback).

The parser is locked against the real sample PDF by `src/pdf/parseSyllabus.test.ts`.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # parser + classifier tests against the real HCI PDF
npm run build    # type-check + production build
```

Click **Load sample (HCI)** in the app to try it with the bundled
`科学技術論演習I` syllabus.

## Notes / limits

- The parser targets Yamaguchi University's fixed syllabus template. A syllabus
  from a different template will under-fill fields (shown as a "partially parsed"
  badge on the course card) rather than crash.
- Regenerate the parser snapshot fixture (`src/fixtures/hci.parsed.json`) if the
  parser changes intentionally.
