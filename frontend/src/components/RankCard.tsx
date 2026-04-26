import type { RankedUser } from '../lib/types';
import { getRankTier } from '../lib/rank-tier';
import { TierChip } from './RankBadge';

interface Props {
  u: RankedUser;
  totalUsers: number;
}

export function RankCard({ u, totalUsers }: Props) {
  const tier = getRankTier(u.rank, totalUsers);
  const isApex = u.rank <= 3;
  return (
    <div
      className="wf-card flex flex-col gap-2 relative"
      style={{
        padding: 14,
        borderColor: isApex ? tier.border : 'var(--color-warm-line-soft)',
        borderWidth: isApex ? 1.5 : 1,
        background: isApex
          ? `linear-gradient(180deg, ${tier.bg}10 0%, var(--color-warm-card) 60%)`
          : 'var(--color-warm-card)',
      }}
    >
      <div className="flex justify-between items-center">
        <span
          className="font-mono text-[18px] font-bold tracking-[-0.01em]"
          style={{ color: isApex ? tier.bg : 'var(--color-warm-ink)' }}
        >
          #{u.rank}
        </span>
        <TierChip rank={u.rank} totalUsers={totalUsers} />
      </div>
      <div className="flex items-center gap-2.5">
        <div
          className="wf-avatar w-8 h-8"
          style={{ borderColor: isApex ? tier.border : 'var(--color-warm-line)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[13px] truncate">{u.name}</div>
          {u.name !== u.addr && (
            <div className="font-mono text-[10px] text-warm-ink-faint">{u.addr}</div>
          )}
        </div>
      </div>
      <div className="wf-divider-dashed" style={{ margin: '4px 0' }} />
      <div>
        <div className="font-mono text-[9px] text-warm-ink-faint tracking-[0.06em] uppercase">
          Points
        </div>
        <div
          className="font-mono text-[22px] font-bold tracking-[-0.02em] text-pp-purple mt-0.5"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {u.pts.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
