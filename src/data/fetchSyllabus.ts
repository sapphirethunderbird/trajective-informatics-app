import type { Course } from './types';
import { extractRows } from '../pdf/extractText';
import { parseSyllabus } from '../pdf/parseSyllabus';

/** Same-origin path proxied to the 修学支援システム PDF endpoint (see vite.config.ts).
 *  The upstream sends no CORS headers, so a direct browser fetch is impossible. */
const PROXY_PATH = '/syllabus-pdf';

export type LookupError = 'invalid' | 'notFound' | 'unavailable';

export class SyllabusLookupError extends Error {
  constructor(readonly reason: LookupError) {
    super(reason);
    this.name = 'SyllabusLookupError';
  }
}

export const isValidYear = (year: string) => /^\d{4}$/.test(year.trim());
export const isValidCode = (code: string) => /^\d{10}$/.test(code.trim());

/** Build the proxied URL for one syllabus PDF. The upstream's Sid parameter
 *  turns out to be optional — year + course code is enough. */
export function syllabusUrl(year: string, code: string): string {
  const detail = `/portal/Public/SyllabusV2/DetailMain.aspx?Pdf=1&lct_year=${year}&lct_cd=${code}&je_cd=1`;
  const params = new URLSearchParams({
    PageH: '297',
    PageW: '210',
    PaperH: '450',
    PaperW: '300',
    Margin: '25',
    TextSize: '',
    Url: detail,
  });
  return `${PROXY_PATH}?${params.toString()}`;
}

/**
 * Fetch and parse one syllabus by 年度 + 時間割番号.
 *
 * Unknown course codes still come back as HTTP 200 with a stub PDF reading
 * 「入学時に配布された冊子シラバスを参照してください」, so not-found is detected
 * from the parsed content rather than the status.
 */
export async function fetchSyllabus(year: string, code: string): Promise<Course> {
  if (!isValidYear(year) || !isValidCode(code)) throw new SyllabusLookupError('invalid');

  let buf: ArrayBuffer;
  try {
    const res = await fetch(syllabusUrl(year.trim(), code.trim()));
    if (!res.ok) throw new Error(String(res.status));
    buf = await res.arrayBuffer();
  } catch {
    // No proxy (static deploy) or the network refused the request.
    throw new SyllabusLookupError('unavailable');
  }

  let course: Course;
  try {
    course = parseSyllabus(await extractRows(buf));
  } catch {
    throw new SyllabusLookupError('notFound');
  }
  // The stub PDF has no 時間割番号, so the parser falls back to a synthetic id.
  if (course.id !== code.trim() || !course.weeks.length) throw new SyllabusLookupError('notFound');
  return course;
}
