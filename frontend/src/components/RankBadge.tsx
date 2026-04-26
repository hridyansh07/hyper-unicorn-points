import { getRankTier } from '../lib/rank-tier';

type Size = 'sm' | 'md' | 'lg';

interface Props {
  rank: number;
  totalUsers: number;
  size?: Size;
  showRank?: boolean;
}

const SIZES: Record<Size, { pad: string; font: string; rankFont: string; rankPad: string }> = {
  sm: { pad: 'px-2 py-[3px]', font: 'text-[9.5px]', rankFont: 'text-[10px]', rankPad: 'px-[7px] py-[3px]' },
  md: { pad: 'px-[11px] py-[5px]', font: 'text-[10.5px]', rankFont: 'text-[12px]', rankPad: 'px-[10px] py-[5px]' },
  lg: { pad: 'px-[14px] py-[7px]', font: 'text-[12px]', rankFont: 'text-[14px]', rankPad: 'px-[12px] py-[7px]' },
};

export function RankBadge({ rank, totalUsers, size = 'md', showRank = true }: Props) {
  const t = getRankTier(rank, totalUsers);
  const sz = SIZES[size];
  return (
    <div
      className="inline-flex items-stretch rounded-full overflow-hidden font-mono leading-none"
      style={{
        border: `1px solid ${t.border}`,
        background: t.bg,
        boxShadow: `0 0 0 3px ${t.glow}`,
      }}
    >
      {showRank && (
        <div
          className={`${sz.rankPad} ${sz.rankFont} font-semibold flex items-center whitespace-nowrap tracking-[0.02em]`}
          style={{ background: 'rgba(255,255,255,0.18)', color: t.fg }}
        >
          #{rank.toLocaleString()}
        </div>
      )}
      <div
        className={`${sz.pad} ${sz.font} font-semibold flex items-center gap-1.5 whitespace-nowrap tracking-[0.08em] uppercase`}
        style={{ color: t.fg }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full opacity-80"
          style={{ background: t.fg }}
        />
        {t.short}
      </div>
    </div>
  );
}

export function TierChip({ rank, totalUsers }: { rank: number; totalUsers: number }) {
  const t = getRankTier(rank, totalUsers);
  return (
    <span
      className="inline-flex items-center gap-1.5 px-[7px] py-[2px] rounded-full font-mono text-[9px] tracking-[0.06em] uppercase font-semibold whitespace-nowrap"
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.border}` }}
    >
      {t.short}
    </span>
  );
}
