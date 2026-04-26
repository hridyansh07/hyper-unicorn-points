import type { Shard } from '../lib/types';
import { shardCurrentRate } from '../lib/shards';
import { timeMult, T_CAP_DAYS } from '../lib/points-math';

interface Props {
  s: Shard;
  active: boolean;
  earned: number;
  onClick: () => void;
}

export function ShardCard({ s, active, earned, onClick }: Props) {
  const rate = shardCurrentRate(s);
  const ageDays = -s.start_day;
  const mult = timeMult(ageDays);
  const totalMult = s.locked_rate * mult;
  const multProgress = Math.min(ageDays / T_CAP_DAYS, 1);
  const isVault = s.entry === 'VAULT';
  const tagStyle = {
    background: isVault ? 'rgba(0,208,145,0.12)' : 'rgba(78,20,208,0.10)',
    color: isVault ? '#008c61' : '#4E14D0',
  };

  return (
    <button
      onClick={onClick}
      className={[
        'text-left p-3.5 rounded-[10px] cursor-pointer transition-all duration-200 font-sans text-warm-ink',
        active
          ? 'bg-pp-purple/[0.06] border-[1.5px] border-pp-purple shadow-[0_4px_20px_rgba(78,20,208,0.18)]'
          : 'bg-warm-card border border-warm-line-soft hover:border-warm-line',
      ].join(' ')}
    >
      <div className="flex justify-between items-center">
        <span className="font-semibold text-[13px]">{s.asset}</span>
        <div className="flex items-center gap-1.5">
          <span
            className="font-mono text-[9px] px-1.5 py-0.5 rounded-[3px] tracking-[0.06em]"
            style={tagStyle}
          >
            {s.entry}
          </span>
          <span
            className="font-mono text-[9px] px-1.5 py-0.5 rounded-[3px] tracking-[0.04em] font-semibold"
            style={tagStyle}
            title={`${s.locked_rate.toFixed(2)}x locked rate × ${mult.toFixed(2)}x time multiplier`}
          >
            {totalMult.toFixed(2)}x
          </span>
        </div>
      </div>
      <div className="font-mono text-[9px] text-warm-ink-faint mt-0.5">
        {s.id} · {s.pool}
      </div>
      <div className="flex items-baseline gap-1.5 mt-3">
        <span
          className="text-[24px] font-bold text-pp-purple tracking-[-0.02em]"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {rate.toFixed(1)}
        </span>
        <span className="font-mono text-[10px] text-warm-ink-soft whitespace-nowrap">
          pts/hr
        </span>
      </div>
      <div className="mt-2 h-1 bg-warm-line-soft rounded-full overflow-hidden">
        <div
          className="h-full bg-pp-purple rounded-full"
          style={{ width: `${multProgress * 100}%` }}
        />
      </div>
      <div className="wf-divider-dashed" style={{ margin: '10px 0' }} />
      <div className="flex justify-between gap-3 text-[10px] font-mono">
        <span className="text-warm-ink-soft">${(s.amount / 1000).toFixed(1)}k · {ageDays}d old</span>
        <span className="text-warm-ink font-semibold text-right whitespace-nowrap">
          {Math.round(earned).toLocaleString()} pts
        </span>
      </div>
    </button>
  );
}
