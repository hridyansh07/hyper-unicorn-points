import { getTierLadder } from '../lib/rank-tier';

interface Props {
  myRank: number;
  totalUsers: number;
}

export function TierLadder({ myRank, totalUsers }: Props) {
  const tiers = getTierLadder(totalUsers);

  let myTierId = tiers[tiers.length - 1]?.id ?? 'open';
  for (const t of tiers) {
    if (myRank <= t.maxRank) {
      myTierId = t.id;
      break;
    }
  }

  return (
    <div className="mt-[18px] pt-[18px] border-t border-dashed border-warm-line">
      <div className="wf-eyebrow mb-2.5">Tier ladder</div>
      <div
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` }}
      >
        {tiers.map((t) => {
          const active = t.id === myTierId;
          return (
            <div
              key={t.id}
              className="rounded-lg px-3 py-2.5 font-mono text-[10px] tracking-[0.04em] transition-all duration-200"
              style={{
                background: active ? t.color : 'transparent',
                border: active ? `1.5px solid ${t.color}` : '1px dashed var(--color-warm-line)',
                color: active ? '#fff' : 'var(--color-warm-ink-soft)',
                boxShadow: active ? `0 0 0 4px ${t.color}25` : 'none',
              }}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: active ? '#fff' : t.color,
                    opacity: active ? 0.9 : 0.7,
                  }}
                />
                <span className="uppercase font-semibold">{t.label}</span>
              </div>
              <div className="mt-1 text-[9px]" style={{ opacity: active ? 0.85 : 0.6 }}>
                ≤ #{t.maxRank.toLocaleString()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
