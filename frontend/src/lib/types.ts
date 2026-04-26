export type Entrypoint = 'DIRECT' | 'VAULT';

export interface Shard {
  id: string;
  asset: string;
  pool: string;
  entry: Entrypoint;
  amount: number;
  locked_rate: number;
  start_day: number; // negative = days in the past
}

export interface ClosedDeposit {
  id: string;
  asset: string;
  pool: string;
  entry: Entrypoint;
  amount: number;
  locked_rate: number;
  opened_day: number;
  closed_day: number;
  earned: number;
}

export interface LeaderboardUser {
  name: string;
  addr: string;
  pts_alltime: number;
}

export interface RankedUser extends LeaderboardUser {
  rank: number;
  pts: number;
}

export interface Tier {
  id: 'apex' | 't100' | 't1pct' | 't10pct' | 't1k' | 'open';
  label: string;
  short: string;
  bg: string;
  fg: string;
  border: string;
  glow: string;
}

export type LeaderboardTab = 'weekly' | 'monthly' | 'alltime';
export type RangeKey = '1W' | '1M' | '3M' | 'ALL';
export type ChartMetric = 'total' | 'daily';
