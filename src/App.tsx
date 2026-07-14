import { useEffect, useMemo, useState } from 'react';
import type { Course } from './data/types';
import { loadCourses, saveCourses } from './data/store';
import { extractRows } from './pdf/extractText';
import { parseSyllabus } from './pdf/parseSyllabus';
import { buildSkillGraph, semesterLabel, semesterOrder } from './skills/skills';
import { Uploader } from './components/Uploader';
import { WorkloadSummary } from './components/WorkloadSummary';
import { GroupIndividualTimeline } from './components/GroupIndividualTimeline';
import { CourseCard } from './components/CourseCard';
import { CourseDetail } from './components/CourseDetail';
import { SkillNetwork } from './components/SkillNetwork';
import { SkillPanel } from './components/SkillPanel';

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-HCI_syllabus.pdf`;

type View = 'workload' | 'skills';

export default function App() {
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<View>('workload');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [semester, setSemester] = useState<string>('all');

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  const importFiles = async (files: File[]) => {
    setBusy(true);
    setError(null);
    const failed: string[] = [];
    const parsed: Course[] = [];
    for (const file of files) {
      try {
        const buf = await file.arrayBuffer();
        parsed.push(parseSyllabus(await extractRows(buf)));
      } catch {
        failed.push(file.name);
      }
    }
    if (parsed.length) {
      setCourses((prev) => {
        const rest = prev.filter((c) => !parsed.some((p) => p.id === c.id)); // de-dupe by timetable no.
        return [...rest, ...parsed];
      });
    }
    if (failed.length) setError(`Failed to parse: ${failed.join(', ')}`);
    setBusy(false);
  };

  const loadSample = async () => {
    setBusy(true);
    setError(null);
    try {
      const buf = await (await fetch(SAMPLE_URL)).arrayBuffer();
      const course = parseSyllabus(await extractRows(buf));
      setCourses((prev) => [...prev.filter((c) => c.id !== course.id), course]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sample.');
    } finally {
      setBusy(false);
    }
  };

  const removeCourse = (id: string) => {
    const course = courses.find((c) => c.id === id);
    if (course && !window.confirm(`Remove "${course.titleEn || course.titleJa}"? ／ この科目を削除しますか？`)) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  };

  const selectedCourse = useMemo(() => courses.find((c) => c.id === selected) ?? null, [courses, selected]);
  const sorted = useMemo(
    () => [...courses].sort((a, b) => semesterOrder(a) - semesterOrder(b) || a.schedule.localeCompare(b.schedule)),
    [courses],
  );

  const semesters = useMemo(() => {
    const seen = new Map<string, number>();
    for (const c of sorted) {
      const label = semesterLabel(c) || '不明';
      if (!seen.has(label)) seen.set(label, semesterOrder(c));
    }
    return [...seen.entries()].sort((a, b) => a[1] - b[1]).map(([label]) => label);
  }, [sorted]);

  const filtered = useMemo(
    () => (semester === 'all' ? sorted : sorted.filter((c) => (semesterLabel(c) || '不明') === semester)),
    [sorted, semester],
  );

  const graph = useMemo(() => buildSkillGraph(sorted), [sorted]);
  const activeSkill = useMemo(
    () => graph.skills.find((s) => s.id === selectedSkill) ?? null,
    [graph, selectedSkill],
  );

  const openCourse = (id: string) => setSelected(id);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">
              Syllabus Dashboard <span className="font-normal text-slate-400">シラバス ダッシュボード</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Workload at a glance · a skill network for job hunting
            </p>
          </div>
          {courses.length > 0 && <Uploader compact busy={busy} onFiles={importFiles} onLoadSample={loadSample} />}
        </div>
        {courses.length > 0 && !selectedCourse && (
          <nav className="mx-auto flex max-w-6xl gap-1 px-4">
            {(
              [
                ['workload', 'Workload ／ 学びのかたち'],
                ['skills', 'Skills ／ スキルネットワーク'],
              ] as [View, string][]
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  view === v
                    ? 'border-blue-600 text-blue-700 dark:border-blue-500 dark:text-blue-400'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </div>
        )}

        {courses.length === 0 ? (
          <div className="mx-auto max-w-2xl pt-8">
            <Uploader busy={busy} onFiles={importFiles} onLoadSample={loadSample} />
            <p className="mt-4 text-center text-sm text-slate-400">
              Your university publishes a separate PDF per course. Point this at the folder where
              you keep them — see your workload per semester, and build a skill network you can
              talk from in interviews.
            </p>
          </div>
        ) : selectedCourse ? (
          <CourseDetail course={selectedCourse} onBack={() => setSelected(null)} onRemove={removeCourse} />
        ) : view === 'skills' ? (
          <div className="grid items-start gap-6 lg:grid-cols-[1.7fr_1fr]">
            <SkillNetwork
              courses={sorted}
              graph={graph}
              selectedSkillId={selectedSkill}
              onSelectSkill={setSelectedSkill}
              onSelectCourse={openCourse}
            />
            <SkillPanel
              skill={activeSkill}
              courses={sorted}
              topSkills={graph.skills.filter((s) => s.courseIds.length >= 2).slice(0, 10)}
              onSelectSkill={setSelectedSkill}
              onSelectCourse={openCourse}
            />
          </div>
        ) : (
          <>
            {semesters.length > 1 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className="mr-1 text-slate-400">Semester ／ 学期:</span>
                {['all', ...semesters].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSemester(s)}
                    className={`rounded-full border px-2.5 py-1 transition-colors ${
                      semester === s
                        ? 'border-blue-600 bg-blue-600 text-white dark:border-blue-500 dark:bg-blue-500'
                        : 'border-slate-300 text-slate-600 hover:border-blue-400 dark:border-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {s === 'all' ? 'All ／ 全期間' : s}
                  </button>
                ))}
              </div>
            )}
            <WorkloadSummary courses={filtered} />
            <GroupIndividualTimeline courses={filtered} onSelectCourse={setSelected} />
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                Courses <span className="text-sm font-normal text-slate-400">科目一覧</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <CourseCard key={c.id} course={c} onOpen={setSelected} onRemove={removeCourse} />
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <footer className="mx-auto max-w-6xl px-4 py-8 text-center text-xs text-slate-400">
        Parsed locally in your browser · nothing is uploaded. Built for Yamaguchi Univ. syllabus PDFs.
      </footer>
    </div>
  );
}
