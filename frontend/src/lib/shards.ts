import type { Shard } from './types';
import { timeMult } from './points-math';

// pts per hour at the current instant
export function shardCurrentRate(s: Shard): number {
  const age = -s.start_day;
  return (s.amount * s.locked_rate * timeMult(age)) / 24;
}
