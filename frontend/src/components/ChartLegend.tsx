import type { ChartMetric } from '../lib/types';

interface Props {
  metric: ChartMetric;
}

export function ChartLegend({ metric }: Props) {
  const pastLabel = metric === 'daily' ? 'daily' : 'earned';
  const futureLabel = metric === 'daily' ? 'proj daily' : 'projected';

  return (
    <div className="flex gap-4 font-mono text-[10.5px] text-warm-ink-soft">
      <span className="inline-flex items-center gap-1.5">
        <span className="w-[18px] h-[9px] rounded-sm bg-pp-purple/40" />
        {pastLabel}
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span
          className="w-[18px] h-[9px] rounded-sm border-b border-dashed border-pp-light-purple"
          style={{
            background:
              'repeating-linear-gradient(45deg, rgba(155,111,255,0.4) 0 2px, transparent 2px 4px)',
          }}
        />
        {futureLabel}
      </span>
    </div>
  );
}
