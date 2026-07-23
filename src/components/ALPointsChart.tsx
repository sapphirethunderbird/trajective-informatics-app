import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { ALPoints } from '../data/types';
import { alColors } from '../data/labels';
import { useLang } from '../i18n/lang';

interface Props {
  al: ALPoints;
  size?: number;
}

const KEYS: (keyof ALPoints)[] = ['group', 'discussion', 'fieldwork', 'presentation'];

export function ALPointsChart({ al, size = 160 }: Props) {
  const { t } = useLang();
  const data = KEYS.map((k) => ({ key: k, name: t(`al.${k}`), value: al[k], color: alColors[k] })).filter(
    (d) => d.value > 0,
  );
  const empty = data.length === 0;

  return (
    <div className="flex items-center gap-4">
      <div style={{ width: size, height: size }} className="shrink-0">
        {empty ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-400">{t('noAlData')}</div>
        ) : (
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={size * 0.3}
                outerRadius={size * 0.48}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d) => (
                  <Cell key={d.key} fill={d.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number, n: string) => [`${v}%`, n]}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <ul className="space-y-1 text-sm">
        {KEYS.map((k) => (
          <li key={k} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: alColors[k] }} />
            <span className="text-slate-700 dark:text-slate-200">{t(`al.${k}`)}</span>
            <span className="ml-auto tabular-nums font-medium text-slate-800 dark:text-slate-100">
              {al[k]}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
