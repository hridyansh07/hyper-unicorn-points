import type { ChartMetric } from '../lib/types';

const METRICS: Array<{ id: ChartMetric; label: string }> = [
  { id: 'total', label: 'Total pts' },
  { id: 'daily', label: 'Daily pts' },
];

interface Props {
  value: ChartMetric;
  onChange: (metric: ChartMetric) => void;
}

export function ChartMetricToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-pp-purple/[0.05] rounded-full font-mono text-[10px]">
      {METRICS.map((metric) => {
        const active = value === metric.id;
        return (
          <button
            key={metric.id}
            type="button"
            onClick={() => onChange(metric.id)}
            className={[
              'px-3 py-[5px] rounded-full border-none cursor-pointer tracking-[0.04em] font-semibold transition-colors whitespace-nowrap',
              active ? 'bg-pp-purple text-white' : 'bg-transparent text-warm-ink-soft hover:text-warm-ink',
            ].join(' ')}
          >
            {metric.label}
          </button>
        );
      })}
    </div>
  );
}
