import type { Entrypoint } from './types';

export interface ApiPoints {
  address: string;
  totalPointsRaw: string;
  totalPoints: string;
  virtualTotalPointsRaw: string;
  virtualTotalPoints: string;
  asOf: string;
}

export interface ApiShard {
  id: string;
  userAddress: string;
  entrypoint: Entrypoint;
  sourceId: string;
  sourceAsset: string;
  sourceQuantityRaw: string;
  sourceDecimals: number;
  principalUsdRaw: string;
  accruedPointsRaw: string;
  lockedRateRaw: string;
  startTime: string;
  lastAccrualTime: string;
  active: boolean;
  accruedPoints: string;
  virtualDeltaRaw: string;
  virtualAccruedPointsRaw: string;
  virtualAccruedPoints: string;
  asOf: string;
}

export interface ApiLeaderboardEntry {
  rank: number;
  address: string;
  totalPointsRaw: string;
  totalPoints: string;
}

export interface WithdrawEventPayload {
  occurredAt: string;
  userAddress: string;
  entrypoint: Entrypoint;
  sourceAsset: string;
  sourceDecimals: number;
  sourceQuantityRaw: string;
}

export interface WithdrawEventResponse {
  touchedShardIds: string[];
}

export interface CrystallizeResponse {
  crystallizedShardCount: number;
  totalDeltaRaw: string;
}
