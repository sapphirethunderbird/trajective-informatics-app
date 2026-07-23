import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Course } from '../data/types';
import { strings, type Bilingual, type Lang } from './strings';

const KEY = 'syllabus-dashboard.lang';

interface LangValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** Look up a UI string. Unknown keys fall through as-is so a typo is visible. */
  t: (key: string) => string;
  /** Pick the matching half of a { ja, en } pair. */
  pick: (pair: Bilingual) => string;
  /** Course title in the current language, falling back to the Japanese name. */
  courseTitle: (course: Course) => string;
}

const LangContext = createContext<LangValue | null>(null);

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'ja' || saved === 'en') return saved;
  } catch {
    // Storage unavailable — fall through to the browser's language.
  }
  return typeof navigator !== 'undefined' && navigator.language.startsWith('ja') ? 'ja' : 'en';
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Non-fatal — the choice just won't survive a reload.
    }
  }, []);

  const value = useMemo<LangValue>(() => {
    const pick = (pair: Bilingual) => pair[lang];
    return {
      lang,
      setLang,
      t: (key) => {
        const entry = (strings as Record<string, Bilingual | undefined>)[key];
        return entry ? entry[lang] : key;
      },
      pick,
      courseTitle: (course) => (lang === 'en' ? course.titleEn || course.titleJa : course.titleJa),
    };
  }, [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
