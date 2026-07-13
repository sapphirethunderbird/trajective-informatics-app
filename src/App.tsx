import { useEffect, useMemo, useState } from 'react';
import type { Course } from './data/types';
import { loadCourses, saveCourses } from './data/store';
import { extractRows } from './pdf/extractText';
import { parseSyllabus } from './pdf/parseSyllabus';
import { Uploader } from './components/Uploader';
import { WorkloadSummary } from './components/WorkloadSummary';
import { GroupIndividualTimeline } from './components/GroupIndividualTimeline';
import { CourseCard } from './components/CourseCard';
import { CourseDetail } from './components/CourseDetail';

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-HCI_syllabus.pdf`;

export default function App() {
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  const addCourse = (course: Course) => {
    setCourses((prev) => {
      const rest = prev.filter((c) => c.id !== course.id); // de-dupe by timetable no.
      return [...rest, course];
    });
  };

  const importFiles = async (files: File[]) => {
    setBusy(true);
    setError(null);
    try {
      for (const file of files) {
        const buf = await file.arrayBuffer();
        const rows = await extractRows(buf);
        const course = parseSyllabus(rows);
        addCourse(course);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to parse a PDF.');
    } finally {
      setBusy(false);
    }
  };

  const loadSample = async () => {
    setBusy(true);
    setError(null);
    try {
      const buf = await (await fetch(SAMPLE_URL)).arrayBuffer();
      addCourse(parseSyllabus(await extractRows(buf)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load sample.');
    } finally {
      setBusy(false);
    }
  };

  const removeCourse = (id: string) => {
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  };

  const selectedCourse = useMemo(() => courses.find((c) => c.id === selected) ?? null, [courses, selected]);
  const sorted = useMemo(() => [...courses].sort((a, b) => a.schedule.localeCompare(b.schedule)), [courses]);

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold">
              Syllabus Dashboard <span className="font-normal text-slate-400">シラバス ダッシュボード</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              All your course PDFs in one view · group vs. individual at a glance
            </p>
          </div>
          {courses.length > 0 && <Uploader compact busy={busy} onFiles={importFiles} onLoadSample={loadSample} />}
        </div>
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
              Your university makes you download a separate PDF per course. Drop them all here to
              compare schedules, grading, and how much of each course is group work.
            </p>
          </div>
        ) : selectedCourse ? (
          <CourseDetail course={selectedCourse} onBack={() => setSelected(null)} />
        ) : (
          <>
            <WorkloadSummary courses={sorted} />
            <GroupIndividualTimeline courses={sorted} onSelectCourse={setSelected} />
            <section>
              <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">
                Courses <span className="text-sm font-normal text-slate-400">科目一覧</span>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {sorted.map((c) => (
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
