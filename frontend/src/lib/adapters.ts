import type { ApiShard } from './api-types';
import type { ClosedDeposit, Shard } from './types';

const DAY_MS = 86_400_000;
const SCALE = 1e18;

function poolLabel(entrypoint: ApiShard['entrypoint']): string {
  return entrypoint === 'VAULT' ? 'Vault' : 'Direct LP';
}

function dayOffsetFromNow(iso: string, nowMs: number): number {
  return Math.floor((Date.parse(iso) - nowMs) / DAY_MS);
}

export function adaptShard(api: ApiShard, nowMs: number = Date.now()): Shard {
  return {
    id: api.id,
    asset: api.sourceAsset,
    pool: poolLabel(api.entrypoint),
    entry: api.entrypoint,
    amount: Number(api.principalUsdRaw) / SCALE,
    locked_rate: Number(api.lockedRateRaw) / SCALE,
    start_day: dayOffsetFromNow(api.startTime, nowMs),
  };
}

export function adaptClosed(api: ApiShard, nowMs: number = Date.now()): ClosedDeposit {
  return {
    id: api.id,
    asset: api.sourceAsset,
    pool: poolLabel(api.entrypoint),
    entry: api.entrypoint,
    amount: Number(api.principalUsdRaw) / SCALE,
    locked_rate: Number(api.lockedRateRaw) / SCALE,
    opened_day: dayOffsetFromNow(api.startTime, nowMs),
    closed_day: dayOffsetFromNow(api.lastAccrualTime, nowMs),
    earned: Number(api.accruedPoints),
  };
}

export interface SplitShards {
  active: Shard[];
  closed: ClosedDeposit[];
  earnedById: Record<string, number>;
}

export function splitShards(api: ApiShard[], nowMs: number = Date.now()): SplitShards {
  const active: Shard[] = [];
  const closed: ClosedDeposit[] = [];
  const earnedById: Record<string, number> = {};
  for (const s of api) {
    earnedById[s.id] = Number(s.virtualAccruedPoints);
    if (s.active) active.push(adaptShard(s, nowMs));
    else closed.push(adaptClosed(s, nowMs));
  }
  return { active, closed, earnedById };
}
