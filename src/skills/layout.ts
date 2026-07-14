/** Small deterministic force-directed layout for the course↔skill network.
 *  No randomness: nodes start on a golden-angle spiral (hubs innermost), so
 *  the same data always yields the same picture. */

export type NodeKind = 'course' | 'domain' | 'transferable';

export interface LayoutNode {
  id: string;
  kind: NodeKind;
  label: string;
  degree: number;
  r: number;
  x: number;
  y: number;
}

export interface LayoutEdge {
  source: string;
  target: string;
  kind: 'skill' | 'related';
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function nodeRadius(kind: NodeKind, degree: number): number {
  if (kind === 'course') return 16;
  return Math.min(6 + degree * 2.5, 15);
}

export function layoutNetwork(
  nodes: Omit<LayoutNode, 'x' | 'y'>[],
  edges: LayoutEdge[],
  iterations = 300,
): LayoutNode[] {
  const placed: LayoutNode[] = [...nodes]
    .sort((a, b) => b.degree - a.degree)
    .map((n, i) => ({
      ...n,
      x: Math.sqrt(i + 0.5) * 42 * Math.cos(i * GOLDEN_ANGLE),
      y: Math.sqrt(i + 0.5) * 42 * Math.sin(i * GOLDEN_ANGLE),
    }));
  const byId = new Map(placed.map((n) => [n.id, n]));
  const links = edges
    .map((e) => ({ a: byId.get(e.source), b: byId.get(e.target), kind: e.kind }))
    .filter((l): l is { a: LayoutNode; b: LayoutNode; kind: 'skill' | 'related' } => !!l.a && !!l.b);

  for (let it = 0; it < iterations; it++) {
    const temp = 1 - it / iterations; // cooling
    const step = 0.85 * temp + 0.05;

    // Pairwise repulsion (n is small — dozens of nodes — so O(n²) is fine).
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        let dx = a.x - b.x;
        let dy = a.y - b.y;
        let d2 = dx * dx + dy * dy;
        if (d2 < 1) {
          // Coincident nodes: nudge apart deterministically.
          dx = (i - j) * 0.1;
          dy = 0.1;
          d2 = dx * dx + dy * dy;
        }
        const d = Math.sqrt(d2);
        // Labels hang ~14 units below each node, so keep extra clearance.
        const minGap = a.r + b.r + 58;
        const f = Math.min((3400 + minGap * 22) / d2, 22) * step;
        const ux = (dx / d) * f;
        const uy = (dy / d) * f;
        a.x += ux;
        a.y += uy;
        b.x -= ux;
        b.y -= uy;
      }
    }

    // Springs along edges.
    for (const { a, b, kind } of links) {
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const rest = kind === 'related' ? 170 : a.r + b.r + 74;
      const f = (d - rest) * 0.04 * step;
      const ux = (dx / d) * f;
      const uy = (dy / d) * f;
      a.x += ux;
      a.y += uy;
      b.x -= ux;
      b.y -= uy;
    }

    // Mild gravity keeps disconnected clusters on screen.
    for (const n of placed) {
      n.x -= n.x * 0.012 * step;
      n.y -= n.y * 0.012 * step;
    }
  }

  return placed;
}

/** Bounding box with padding, for the SVG viewBox. */
export function bounds(nodes: LayoutNode[], pad = 70): { x: number; y: number; w: number; h: number } {
  if (!nodes.length) return { x: -100, y: -100, w: 200, h: 200 };
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}
