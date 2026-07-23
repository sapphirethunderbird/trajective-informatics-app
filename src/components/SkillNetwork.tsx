import { useEffect, useMemo, useRef, useState } from 'react';
import type { Course } from '../data/types';
import type { SkillGraph } from '../skills/skills';
import { layoutNetwork, bounds, nodeRadius, type LayoutEdge, type NodeKind } from '../skills/layout';
import { useLang } from '../i18n/lang';

interface Props {
  courses: Course[];
  graph: SkillGraph;
  selectedSkillId: string | null;
  onSelectSkill: (id: string | null) => void;
  onSelectCourse: (id: string) => void;
}

/** Validated categorical palette (dataviz slots 1–3; light / dark pairs). */
const NODE_FILL: Record<NodeKind, string> = {
  course: 'fill-[#2a78d6] dark:fill-[#3987e5]',
  domain: 'fill-[#1baf7a] dark:fill-[#199e70]',
  transferable: 'fill-[#eda100] dark:fill-[#c98500]',
};

const truncate = (s: string, n = 16) => (s.length > n ? `${s.slice(0, n)}…` : s);

/** The node mark: courses are rounded squares, domain skills circles,
 *  transferable skills diamonds — identity never rides on color alone. */
function NodeShape({ kind, r, className }: { kind: NodeKind; r: number; className: string }) {
  if (kind === 'course') {
    return <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={5} className={className} />;
  }
  if (kind === 'transferable') {
    return (
      <rect
        x={-r * 0.9}
        y={-r * 0.9}
        width={r * 1.8}
        height={r * 1.8}
        rx={2.5}
        transform="rotate(45)"
        className={className}
      />
    );
  }
  return <circle r={r} className={className} />;
}

export function SkillNetwork({ courses, graph, selectedSkillId, onSelectSkill, onSelectCourse }: Props) {
  const { t, courseTitle } = useLang();
  const [sharedOnly, setSharedOnly] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Element fullscreen is unreliable across browsers, so the CSS overlay is the
  // real mechanism; the Fullscreen API is attempted as a bonus and its exit
  // event keeps our state in sync.
  useEffect(() => {
    if (!fullscreen) return;
    void containerRef.current?.requestFullscreen?.().catch(() => {});
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    const onFsChange = () => {
      if (!document.fullscreenElement) setFullscreen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('fullscreenchange', onFsChange);
      if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
    };
  }, [fullscreen]);

  const { nodes, edges, neighbors } = useMemo(() => {
    const skills = graph.skills.filter((s) => !sharedOnly || s.courseIds.length >= 2);
    const skillCount = new Map<string, number>();
    for (const s of skills) for (const cid of s.courseIds) skillCount.set(cid, (skillCount.get(cid) ?? 0) + 1);

    const rawNodes = [
      ...courses.map((c) => {
        const degree = skillCount.get(c.id) ?? 0;
        return {
          id: c.id,
          kind: 'course' as NodeKind,
          label: courseTitle(c),
          degree,
          r: nodeRadius('course', degree),
        };
      }),
      ...skills.map((s) => ({
        id: s.id,
        kind: s.type as NodeKind,
        label: s.label,
        degree: s.courseIds.length,
        r: nodeRadius(s.type, s.courseIds.length),
      })),
    ];
    const rawEdges: LayoutEdge[] = [
      ...skills.flatMap((s) => s.courseIds.map((cid) => ({ source: s.id, target: cid, kind: 'skill' as const }))),
      ...graph.courseLinks.map((l) => ({ source: l.a, target: l.b, kind: 'related' as const })),
    ];

    const neighbors = new Map<string, Set<string>>();
    const link = (a: string, b: string) => {
      (neighbors.get(a) ?? neighbors.set(a, new Set()).get(a)!).add(b);
      (neighbors.get(b) ?? neighbors.set(b, new Set()).get(b)!).add(a);
    };
    for (const e of rawEdges) link(e.source, e.target);

    return { nodes: layoutNetwork(rawNodes, rawEdges), edges: rawEdges, neighbors };
  }, [courses, graph, sharedOnly, courseTitle]);

  const nodeById = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const vb = useMemo(() => bounds(nodes), [nodes]);

  const focus = hovered ?? selectedSkillId;
  const isDimmed = (id: string) =>
    !!focus && focus !== id && !(neighbors.get(focus)?.has(id) ?? false);
  const edgeActive = (e: LayoutEdge) => !!focus && (e.source === focus || e.target === focus);

  if (!graph.skills.length) {
    return (
      <p className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-400 dark:border-slate-800 dark:bg-slate-900">
        {t('noSkills')}
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className={
        fullscreen
          ? 'fixed inset-0 z-50 overflow-auto bg-white p-5 dark:bg-slate-900'
          : 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900'
      }
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('skillNetworkTitle')}</h2>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <input
              type="checkbox"
              checked={sharedOnly}
              onChange={(e) => setSharedOnly(e.target.checked)}
              className="accent-blue-600"
            />
            {t('sharedOnly')}
          </label>
          <button
            onClick={() => setFullscreen((v) => !v)}
            aria-pressed={fullscreen}
            title={fullscreen ? t('exitFullscreen') : t('fullscreen')}
            aria-label={fullscreen ? t('exitFullscreen') : t('fullscreen')}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm text-slate-600 transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-600 dark:text-slate-300"
          >
            {fullscreen ? '✕' : '⛶'}
          </button>
        </div>
      </div>

      {/* Legend — identity by shape + color */}
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="-7 -7 14 14">
            <NodeShape kind="course" r={6} className={NODE_FILL.course} />
          </svg>
          {t('legendCourse')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="-7 -7 14 14">
            <NodeShape kind="domain" r={6} className={NODE_FILL.domain} />
          </svg>
          {t('legendKnowledge')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="-8 -8 16 16">
            <NodeShape kind="transferable" r={6} className={NODE_FILL.transferable} />
          </svg>
          {t('legendTransferable')}
        </span>
      </div>

      <svg
        viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
        className={`w-full select-none ${fullscreen ? 'h-[calc(100vh-11rem)]' : 'h-[460px]'}`}
        role="img"
        aria-label={t('networkAria')}
        onClick={() => onSelectSkill(null)}
      >
        {/* Edges under nodes */}
        {edges.map((e, i) => {
          const a = nodeById.get(e.source);
          const b = nodeById.get(e.target);
          if (!a || !b) return null;
          const active = edgeActive(e);
          const dim = !!focus && !active;
          return (
            <line
              key={i}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              strokeDasharray={e.kind === 'related' ? '5 4' : undefined}
              className={`stroke-[#c9c8c1] transition-opacity dark:stroke-[#3a3a37] ${
                active ? 'opacity-100' : dim ? 'opacity-20' : 'opacity-70'
              }`}
              strokeWidth={active ? 2 : 1.2}
            />
          );
        })}

        {nodes.map((n) => {
          const dim = isDimmed(n.id);
          const selected = n.id === selectedSkillId;
          const isCourse = n.kind === 'course';
          return (
            <g
              key={n.id}
              transform={`translate(${n.x},${n.y})`}
              role="button"
              tabIndex={0}
              aria-label={n.label}
              className={`cursor-pointer transition-opacity ${dim ? 'opacity-25' : 'opacity-100'}`}
              onClick={(ev) => {
                ev.stopPropagation();
                if (isCourse) onSelectCourse(n.id);
                else onSelectSkill(selected ? null : n.id);
              }}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') {
                  ev.preventDefault();
                  if (isCourse) onSelectCourse(n.id);
                  else onSelectSkill(selected ? null : n.id);
                }
              }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <title>{n.label}</title>
              {/* 2px surface ring separates overlapping marks; doubles as the
                  selection halo. */}
              <NodeShape
                kind={n.kind}
                r={n.r + 2}
                className={selected ? 'fill-slate-800 dark:fill-slate-100' : 'fill-white dark:fill-slate-900'}
              />
              <NodeShape kind={n.kind} r={n.r} className={NODE_FILL[n.kind]} />
              <text
                y={n.r + (n.kind === 'transferable' ? 6 : 3) + 10}
                textAnchor="middle"
                className={`pointer-events-none fill-slate-700 dark:fill-slate-300 ${
                  isCourse ? 'text-[11px] font-semibold' : 'text-[10px]'
                }`}
              >
                {truncate(n.label)}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="mt-2 text-xs text-slate-400">
        {t('networkHint')}
      </p>
    </div>
  );
}
