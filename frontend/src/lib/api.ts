import type {
  ApiLeaderboardEntry,
  ApiPoints,
  ApiShard,
  CrystallizeResponse,
  WithdrawEventPayload,
  WithdrawEventResponse,
} from './api-types';

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${body ? ` — ${body.slice(0, 160)}` : ''}`);
  }
  return res.json() as Promise<T>;
}

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text.slice(0, 160)}` : ''}`);
  }
  return res.json() as Promise<T>;
}

export function fetchUserPoints(address: string): Promise<ApiPoints> {
  return getJSON<ApiPoints>(`/v1/users/${address}/points`);
}

export function fetchUserShards(address: string): Promise<ApiShard[]> {
  return getJSON<ApiShard[]>(`/v1/users/${address}/shards`);
}

export function fetchLeaderboard(): Promise<ApiLeaderboardEntry[]> {
  return getJSON<ApiLeaderboardEntry[]>(`/v1/leaderboard`);
}

export function postWithdrawEvent(payload: WithdrawEventPayload): Promise<WithdrawEventResponse> {
  return postJSON<WithdrawEventResponse>('/v1/events/withdraw', payload);
}

export function postCrystallizeAll(): Promise<CrystallizeResponse> {
  return postJSON<CrystallizeResponse>('/v1/admin/crystallize', {});
}
