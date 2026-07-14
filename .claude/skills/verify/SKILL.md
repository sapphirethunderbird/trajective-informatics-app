---
name: verify
description: Build, launch, and drive the syllabus dashboard (Vite React app) in a headless browser to verify changes end-to-end.
---

# Verify the syllabus dashboard

## Launch

```bash
npm run dev -- --port 5199 --strictPort   # background; ready when GET / returns 200
```

## Drive (Playwright)

No Playwright in the project. Install it in the scratchpad (NOT the project) and
match the version to the cached browser in `~/Library/Caches/ms-playwright/`
(e.g. `chromium-1228` → `playwright@1.61.x`; check `browsers.json` on unpkg for
other revisions). Grant `permissions: ['clipboard-write']` in the context or the
Copy buttons can't be verified.

Flows worth driving (see a working script pattern below):

1. Clear `localStorage`, reload → empty state with folder drop zone.
2. Folder upload: `page.locator('input[webkitdirectory]').setInputFiles('<dir>')`
   accepts a directory path directly. `samples/` holds 4 real Yamaguchi PDFs.
3. Workload tab: semester chips filter the course grid.
4. Skills tab: network nodes are `svg [role="button"][aria-label="<label>"]`
   — skill click opens the talking-points panel, course click opens CourseDetail.
5. Bad-PDF probe: a garbage `.pdf` in a batch must show
   "Failed to parse: <name>" while good files still import.
6. Dark mode via `page.emulateMedia({ colorScheme: 'dark' })`.

Capture `console` errors and `pageerror` — the run should end with none.

## Gotchas

- PDF parsing needs the cmaps; the dev server serves them from `public/cmaps/`
  automatically — nothing to configure.
- Parsing happens in a worker; wait for `text=Semester workload` (up to ~20s
  for several PDFs) rather than a fixed timeout.
