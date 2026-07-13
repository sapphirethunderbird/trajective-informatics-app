export interface Cell {
  str: string;
  x: number;
}

export interface Row {
  page: number;
  y: number; // PDF y-coordinate (higher = further up the page)
  cells: Cell[]; // left-to-right
  text: string; // all cell strings joined with a space
}

export interface PositionedItem {
  str: string;
  x: number;
  y: number;
}

const Y_TOLERANCE = 3; // items within this many units share a row

/** Cluster positioned text items from one page into ordered rows
 *  (top-to-bottom), each keeping its cells' x-positions. Pure — no pdfjs. */
export function clusterRows(items: PositionedItem[], page: number): Row[] {
  const clean = items.filter((it) => it.str && it.str.trim() !== '');
  clean.sort((a, b) => (Math.abs(a.y - b.y) > Y_TOLERANCE ? b.y - a.y : a.x - b.x));

  const rows: Row[] = [];
  let current: { y: number; cells: Cell[] } | null = null;
  for (const it of clean) {
    if (!current || Math.abs(it.y - current.y) > Y_TOLERANCE) {
      if (current) rows.push(finalize(page, current));
      current = { y: it.y, cells: [] };
    }
    current.cells.push({ str: it.str, x: it.x });
  }
  if (current) rows.push(finalize(page, current));
  return rows;
}

function finalize(page: number, r: { y: number; cells: Cell[] }): Row {
  const cells = [...r.cells].sort((a, b) => a.x - b.x);
  return { page, y: r.y, cells, text: cells.map((c) => c.str).join(' ') };
}
