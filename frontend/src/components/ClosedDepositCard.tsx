import type { ClosedDeposit } from '../lib/types';

export function ClosedDepositCard({ d }: { d: ClosedDeposit }) {
  const lifetime = d.closed_day - d.opened_day;
  return (
    <div className="p-3.5 border border-dashed border-warm-line rounded-[10px] opacity-85 bg-transparent">
      <div className="flex justify-between items-center">
        <span className="font-semibold text-[13px] line-through decoration-warm-ink-faint">{d.asset}</span>
        <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-[3px] bg-black/[0.04] text-warm-ink-faint tracking-[0.06em]">
          CLOSED
        </span>
      </div>
      <div className="font-mono text-[9px] text-warm-ink-faint mt-0.5">{d.id} · {d.pool}</div>
      <div
        className="text-[24px] font-bold text-warm-ink-soft mt-3 tracking-[-0.02em]"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {(d.earned / 1000).toFixed(1)}k
      </div>
      <div className="font-mono text-[9px] text-warm-ink-faint -mt-0.5">pts earned · locked in</div>
      <div className="wf-divider-dashed" style={{ margin: '10px 0' }} />
      <div className="flex justify-between text-[10px] font-mono">
        <span className="text-warm-ink-faint">${(d.amount / 1000).toFixed(1)}k · {lifetime}d held</span>
        <span className="text-warm-ink-faint">closed {-d.closed_day}d ago</span>
      </div>
    </div>
  );
}
