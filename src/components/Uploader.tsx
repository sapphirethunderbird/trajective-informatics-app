import { useRef, useState } from 'react';

interface Props {
  onFiles: (files: File[]) => void;
  onLoadSample: () => void;
  busy: boolean;
  compact?: boolean;
}

export function Uploader({ onFiles, onLoadSample, busy, compact }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const pick = (list: FileList | null) => {
    if (!list) return;
    const pdfs = Array.from(list).filter((f) => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
    if (pdfs.length) onFiles(pdfs);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => pick(e.target.files)}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? 'Parsing…' : '+ Add PDFs'}
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
        pick(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 text-center transition-colors ${
        dragging
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40'
          : 'border-slate-300 dark:border-slate-700'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      <div className="text-5xl">📄</div>
      <div>
        <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          Drop your course syllabus PDFs here
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          シラバスPDFをここにドロップ · everything stays in your browser
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {busy ? 'Parsing…' : 'Choose files'}
        </button>
        <button
          onClick={onLoadSample}
          disabled={busy}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Load sample (HCI)
        </button>
      </div>
    </div>
  );
}
