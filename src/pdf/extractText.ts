import * as pdfjsLib from 'pdfjs-dist';
// Vite resolves these to URLs for the worker + cmap bundles.
import PdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { clusterRows, type Row, type PositionedItem } from './rowCluster';

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

// CMaps are required to decode the CID-keyed Japanese fonts in these PDFs.
// Bundled under public/cmaps so the app works fully offline.
const CMAP_URL = `${import.meta.env.BASE_URL}cmaps/`;

export type { Row, Cell } from './rowCluster';

/**
 * Extract a PDF into ordered rows (top-to-bottom, page-by-page). Each row keeps
 * its cells' x-positions so the parser can reconstruct table columns.
 */
export async function extractRows(data: ArrayBuffer): Promise<Row[]> {
  const doc = await pdfjsLib.getDocument({ data, cMapUrl: CMAP_URL, cMapPacked: true }).promise;
  const rows: Row[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items: PositionedItem[] = [];
    for (const it of content.items as Array<{ str?: string; transform?: number[] }>) {
      if (typeof it.str === 'string' && it.transform) {
        items.push({ str: it.str, x: it.transform[4], y: it.transform[5] });
      }
    }
    rows.push(...clusterRows(items, pageNum));
  }
  return rows;
}
