import type { Tier } from './types';

interface TierDef {
  id: Tier['id'];
  label: string;
  short: string;
  bg: string;
  fg: string;
  border: string;
  glow: string;
  // Color used in the ladder strip (vs. the badge bg).
  ladderColor: string;
  // Inclusive upper bound for this tier given a total-user count.
  maxRank: (totalUsers: number) => number;
}

// Single source of truth — `getRankTier` (badge styling) and
// `getTierLadder` (ladder strip) both derive from this list.
const TIERS: TierDef[] = [
  { id: 'apex',   label: 'Apex · top 10',    short: 'APEX',    bg: '#2a0a6e', fg: '#fff',     border: '#4E14D0', glow: 'rgba(78,20,208,0.55)',  ladderColor: '#2a0a6e', maxRank: () => 10 },
  { id: 't100',   label: 'Top 100 holders',  short: 'TOP 100', bg: '#4E14D0', fg: '#fff',     border: '#4E14D0', glow: 'rgba(78,20,208,0.40)',  ladderColor: '#4E14D0', maxRank: () => 100 },
  { id: 't1pct',  label: 'Top 1%',           short: 'TOP 1%',  bg: '#7e44ff', fg: '#fff',     border: '#9B6FFF', glow: 'rgba(155,111,255,0.40)', ladderColor: '#7e44ff', maxRank: (n) => Math.ceil(n * 0.01) },
  { id: 't10pct', label: 'Top 10%',          short: 'TOP 10%', bg: '#9B6FFF', fg: '#fff',     border: '#9B6FFF', glow: 'rgba(155,111,255,0.30)', ladderColor: '#9B6FFF', maxRank: (n) => Math.ceil(n * 0.10) },
  { id: 't1k',    label: 'Top 1,000',        short: 'TOP 1K',  bg: '#c5aaff', fg: '#2a0a6e', border: '#9B6FFF', glow: 'rgba(155,111,255,0.20)', ladderColor: '#c5aaff', maxRank: () => 1000 },
  { id: 'open',   label: 'Climbing',         short: 'CLIMB',   bg: '#e6dfd1', fg: '#6b5a3d', border: '#d8c9a8', glow: 'rgba(0,0,0,0.05)',       ladderColor: '#e6dfd1', maxRank: (n) => n },
];

function tierFromDef(def: TierDef): Tier {
  return {
    id: def.id,
    label: def.label,
    short: def.short,
    bg: def.bg,
    fg: def.fg,
    border: def.border,
    glow: def.glow,
  };
}

export function getRankTier(rank: number, totalUsers: number): Tier {
  for (const t of TIERS) {
    if (rank <= t.maxRank(totalUsers)) return tierFromDef(t);
  }
  return tierFromDef(TIERS[TIERS.length - 1]);
}

export interface TierLadderEntry {
  id: Tier['id'];
  label: string;
  color: string;
  maxRank: number;
}

export function getTierLadder(totalUsers: number): TierLadderEntry[] {
  const resolved = TIERS.map((t) => ({
    id: t.id,
    label: t.label,
    color: t.ladderColor,
    maxRank: t.maxRank(totalUsers),
  })).sort((a, b) => a.maxRank - b.maxRank);

  // Drop adjacent duplicates (e.g. when totalUsers < 100, the t1pct/t10pct
  // thresholds collapse onto smaller fixed thresholds).
  const uniq: TierLadderEntry[] = [];
  for (const t of resolved) {
    if (!uniq.length || uniq[uniq.length - 1].maxRank !== t.maxRank) uniq.push(t);
  }
  return uniq;
}
