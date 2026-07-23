import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Course } from './data/types';
import { loadCourses, saveCourses, loadTags, saveTags, type Requirement, type Tags } from './data/store';
import { extractRows } from './pdf/extractText';
import { parseSyllabus } from './pdf/parseSyllabus';
import { buildSkillGraph, semesterLabel, semesterOrder } from './skills/skills';
import { totalCredits } from './data/aggregate';
import { useLang } from './i18n/lang';
import { AppShell, type View } from './components/AppShell';
import { Uploader } from './components/Uploader';
import { LookupForm } from './components/LookupForm';
import { WorkloadSummary } from './components/WorkloadSummary';
import { WeeklySchedule } from './components/WeeklySchedule';
import { GroupIndividualTimeline } from './components/GroupIndividualTimeline';
import { CourseCard } from './components/CourseCard';
import { CourseDetail } from './components/CourseDetail';
import { SkillNetwork } from './components/SkillNetwork';
import { SkillPanel } from './components/SkillPanel';
import { SimulateView } from './components/SimulateView';

const SAMPLE_URL = `${import.meta.env.BASE_URL}sample-HCI_syllabus.pdf`;

export default function App() {
  const { t, courseTitle } = useLang();
  const [courses, setCourses] = useState<Course[]>(() => loadCourses());
  const [tags, setTags] = useState<Tags>(() => loadTags());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<View>('dashboard');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [semester, setSemester] = useState<string>('all');
  const [uploadOpen, setUploadOpen] = useState(false);
  const [candidate, setCandidate] = useState<Course | null>(null);

  useEffect(() => {
    saveCourses(courses);
  }, [courses]);

  useEffect(() => {
    saveTags(tags);
  }, [tags]);

  /** Parse PDFs; `commit` decides whether they join the saved course list. */
  const parseFiles = useCallback(
    async (files: File[], commit: (parsed: Course[]) => void) => {
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
      if (parsed.length) commit(parsed);
      if (failed.length) setError(`${t('failedToParse')} ${failed.join(', ')}`);
      setBusy(false);
    },
    [t],
  );

  const addCourses = useCallback((parsed: Course[]) => {
    setCourses((prev) => {
      const rest = prev.filter((c) => !parsed.some((p) => p.id === c.id)); // de-dupe by timetable no.
      return [...rest, ...parsed];
    });
  }, []);

  const importFiles = useCallback(
    (files: File[]) => parseFiles(files, addCourses),
    [parseFiles, addCourses],
  );

  const importCandidate = useCallback(
    (files: File[]) => parseFiles(files, (parsed) => setCandidate(parsed[0])),
    [parseFiles],
  );

  const loadSample = async () => {
    setBusy(true);
    setError(null);
    try {
      const buf = await (await fetch(SAMPLE_URL)).arrayBuffer();
      const course = parseSyllabus(await extractRows(buf));
      addCourses([course]);
    } catch (e) {
      setError(e instanceof Error ? e.message : t('failedToParse'));
    } finally {
      setBusy(false);
    }
  };

  const removeCourse = (id: string) => {
    const course = courses.find((c) => c.id === id);
    if (course && !window.confirm(`${t('removeConfirm')}\n${courseTitle(course)}`)) return;
    setCourses((prev) => prev.filter((c) => c.id !== id));
    if (selected === id) setSelected(null);
  };

  const setRequirement = (id: string, value: Requirement | null) =>
    setTags((prev) => {
      const next = { ...prev };
      if (value) next[id] = value;
      else delete next[id];
      return next;
    });

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

  const openCourse = (id: string) => {
    setSelected(id);
    setView('dashboard');
  };

  // Empty state: the full-page dropzone, no shell chrome to get in the way.
  if (courses.length === 0) {
    return (
      <div className="min-h-full bg-slate-50 px-4 py-10 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold">{t('appName')}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t('tagline')}</p>
            </div>
            <div className="flex overflow-hidden rounded-xl border border-slate-300 text-xs dark:border-slate-700">
              <LangToggle />
            </div>
          </div>
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}
          <Uploader busy={busy} onFiles={importFiles} onLoadSample={loadSample} />
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <LookupForm onCourse={(c) => addCourses([c])} />
          </div>
          <p className="mt-4 text-center text-sm text-slate-400">{t('emptyStateHelp')}</p>
        </div>
      </div>
    );
  }

  return (
    <AppShell
      view={view}
      onView={(v) => {
        setView(v);
        setSelected(null);
      }}
      semesters={semesters}
      semester={semester}
      onSemester={setSemester}
      courseCount={courses.length}
      creditCount={totalCredits(courses)}
      onUpload={() => setUploadOpen(true)}
    >
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      {uploadOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setUploadOpen(false)}
        >
          <div
            className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('upload')}</h2>
              <button
                onClick={() => setUploadOpen(false)}
                aria-label={t('close')}
                className="rounded-lg px-2 py-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>
            <Uploader
              busy={busy}
              onFiles={(files) => {
                importFiles(files);
                setUploadOpen(false);
              }}
              onLoadSample={() => {
                void loadSample();
                setUploadOpen(false);
              }}
            />
            <LookupForm onCourse={(c) => addCourses([c])} />
          </div>
        </div>
      )}

      {selectedCourse ? (
        <CourseDetail
          course={selectedCourse}
          requirement={tags[selectedCourse.id]}
          onSetRequirement={setRequirement}
          onBack={() => setSelected(null)}
          onRemove={removeCourse}
        />
      ) : view === 'simulate' ? (
        <SimulateView
          courses={sorted}
          candidate={candidate}
          busy={busy}
          onCandidate={setCandidate}
          onPickFiles={importCandidate}
          onAdd={(c) => {
            addCourses([c]);
            setCandidate(null);
            setView('dashboard');
          }}
        />
      ) : view === 'skills' ? (
        <div className="grid items-start gap-5 xl:grid-cols-[1.7fr_1fr]">
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
          <WorkloadSummary courses={filtered} />
          <div className="grid items-start gap-5 xl:grid-cols-2">
            <WeeklySchedule courses={filtered} tags={tags} onSelectCourse={setSelected} />
            <TopSkillsCard onOpen={() => setView('skills')} graphSkills={graph.skills} />
          </div>
          <GroupIndividualTimeline courses={filtered} onSelectCourse={setSelected} />
          <section>
            <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-100">{t('courseList')}</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((c) => (
                <CourseCard
                  key={c.id}
                  course={c}
                  requirement={tags[c.id]}
                  onSetRequirement={setRequirement}
                  onOpen={setSelected}
                  onRemove={removeCourse}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </AppShell>
  );
}

/** EN/JP switch for the empty state, which renders outside the shell. */
function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <>
      {(['en', 'ja'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`px-3 py-1.5 font-medium transition-colors ${
            lang === l
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          {l === 'en' ? 'EN' : 'JP'}
        </button>
      ))}
    </>
  );
}

/** Wireframe's "Top Skills" panel — the entry point into the network view. */
function TopSkillsCard({
  graphSkills,
  onOpen,
}: {
  graphSkills: ReturnType<typeof buildSkillGraph>['skills'];
  onOpen: () => void;
}) {
  const { t } = useLang();
  const top = [...graphSkills].sort((a, b) => b.courseIds.length - a.courseIds.length).slice(0, 12);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{t('topSkills')}</h2>
        <button onClick={onOpen} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
          {t('openSkillNetwork')} →
        </button>
      </div>
      {top.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-400">{t('noSkills')}</p>
      ) : (
        <ul className="space-y-1.5">
          {top.map((s) => {
            const share = (s.courseIds.length / Math.max(top[0].courseIds.length, 1)) * 100;
            return (
              <li key={s.id}>
                <button onClick={onOpen} className="group block w-full text-left">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="truncate text-slate-700 group-hover:text-blue-600 dark:text-slate-200">
                      {s.label}
                    </span>
                    <span className="ml-2 shrink-0 tabular-nums text-xs text-slate-400">
                      ×{s.courseIds.length}
                    </span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${
                        s.type === 'transferable' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
