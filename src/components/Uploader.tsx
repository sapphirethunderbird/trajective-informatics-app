import { useRef, useState } from 'react';
import { useLang } from '../i18n/lang';

interface Props {
  onFiles: (files: File[]) => void;
  onLoadSample: () => void;
  busy: boolean;
  compact?: boolean;
}

const isPdf = (f: File) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');

/** Walk dropped items (files and whole folders) and collect every PDF inside.
 *  Uses the webkitGetAsEntry directory API; falls back to plain files. */
async function collectDroppedPdfs(dt: DataTransfer): Promise<File[]> {
  const entries = Array.from(dt.items ?? [])
    .map((it) => it.webkitGetAsEntry?.())
    .filter((e): e is FileSystemEntry => !!e);

  if (!entries.length) return Array.from(dt.files).filter(isPdf);

  const out: File[] = [];
  const walk = async (entry: FileSystemEntry): Promise<void> => {
    if (entry.isFile) {
      const file = await new Promise<File>((res, rej) => (entry as FileSystemFileEntry).file(res, rej));
      if (isPdf(file)) out.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      // readEntries returns batches (≤100 in Chromium) — drain until empty.
      let batch: FileSystemEntry[];
      do {
        batch = await new Promise<FileSystemEntry[]>((res, rej) => reader.readEntries(res, rej));
        for (const e of batch) await walk(e);
      } while (batch.length);
    }
  };
  for (const e of entries) await walk(e);
  return out;
}

export function Uploader({ onFiles, onLoadSample, busy, compact }: Props) {
  const { t } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const pdfs = Array.from(list).filter(isPdf);
    if (pdfs.length) onFiles(pdfs);
  };

  const inputs = (
    <>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
      {/* Folder picker — webkitdirectory isn't in React's typings yet. */}
      <input
        ref={folderRef}
        type="file"
        multiple
        className="hidden"
        {...({ webkitdirectory: '' } as Record<string, string>)}
        onChange={(e) => {
          pick(e.target.files);
          e.target.value = '';
        }}
      />
    </>
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {inputs}
        <button
          onClick={() => folderRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? t('parsing') : t('addFolder')}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('addPdfs')}
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void collectDroppedPdfs(e.dataTransfer).then((pdfs) => {
          if (pdfs.length) onFiles(pdfs);
        });
      }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    >
      {inputs}
      <div className="text-5xl">📂</div>
      <div>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {t('dropTitle')}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {t('dropSub')}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => folderRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? t('parsing') : t('chooseFolder')}
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('chooseFiles')}
        </button>
        <button
          onClick={onLoadSample}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('loadSample')}
        </button>
      </div>
    </div>
  );
}
