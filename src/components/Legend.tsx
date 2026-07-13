import { ALL_MODES } from '../data/aggregate';
import { workModeColors, workModeLabels } from '../data/labels';

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
      {ALL_MODES.map((mode) => (
        <span key={mode} className="inline-flex items-center gap-1.5">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: workModeColors[mode] }}
          />
          <span className="text-slate-700 dark:text-slate-200">{workModeLabels[mode].en}</span>
          <span className="text-slate-400 dark:text-slate-500">{workModeLabels[mode].ja}</span>
        </span>
      ))}
    </div>
  );
}
