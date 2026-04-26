import { createContext, useContext, type ReactNode } from 'react';
import { fetchLeaderboard } from '../lib/api';
import type { ApiLeaderboardEntry } from '../lib/api-types';
import { useFetch } from '../lib/use-fetch';

interface Ctx {
  data: ApiLeaderboardEntry[] | null;
  error: Error | null;
  loading: boolean;
  refetch: () => void;
}

const LeaderboardContext = createContext<Ctx | null>(null);

export function LeaderboardProvider({ children }: { children: ReactNode }) {
  const value = useFetch('leaderboard', fetchLeaderboard);
  return <LeaderboardContext.Provider value={value}>{children}</LeaderboardContext.Provider>;
}

export function useLeaderboard(): Ctx {
  const ctx = useContext(LeaderboardContext);
  if (!ctx) throw new Error('useLeaderboard must be used inside LeaderboardProvider');
  return ctx;
}
