import { useEffect, useMemo, useRef, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { LBTabs } from '../components/LBTabs';
import { TierLadder } from '../components/TierLadder';
import { RankCard } from '../components/RankCard';
import { useActiveAddress } from '../state/ActiveAddressContext';
import { useLeaderboard } from '../state/LeaderboardContext';
import { shortAddr } from '../lib/format';
import { postCrystallizeAll } from '../lib/api';
import { USER_PERSONAS, type SeededAddress } from '../lib/personas';
import type { LeaderboardTab, RankedUser } from '../lib/types';

function nameFor(addr: string): string {
  const persona = USER_PERSONAS[addr.toLowerCase() as SeededAddress];
  return persona ? persona.label : shortAddr(addr);
}

export function Leaderboard() {
  const { address } = useActiveAddress();
  const [tab, setTab] = useState<LeaderboardTab>('alltime');
  const lb = useLeaderboard();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const statusTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (statusTimer.current) window.clearTimeout(statusTimer.current);
    };
  }, []);

  async function handleCrystallize() {
    if (busy) return;
    setBusy(true);
    setStatus(null);
    try {
      const r = await postCrystallizeAll();
      lb.refetch();
      setStatus({ kind: 'ok', msg: `crystallized ${r.crystallizedShardCount} shards` });
    } catch (e) {
      setStatus({ kind: 'err', msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setBusy(false);
      if (statusTimer.current) window.clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setStatus(null), 3000);
    }
  }

  const ranked: RankedUser[] = useMemo(
    () =>
      (lb.data ?? []).map((e) => ({
        rank: e.rank,
        addr: shortAddr(e.address),
        name: nameFor(e.address),
        pts: Number(e.totalPoints),
        pts_alltime: Number(e.totalPoints),
      })),
    [lb.data],
  );

  const totalUsers = ranked.length;
  const me = (lb.data ?? []).find((e) => e.address.toLowerCase() === address.toLowerCase()) ?? null;
  const myPts = me ? Number(me.totalPoints) : 0;

  return (
    <div className="wf-screen">
      <TopBar />
      <div className="flex-1 overflow-auto p-5 sm:px-7 sm:py-[22px] flex flex-col gap-[18px]">
        {lb.error && (
          <div className="wf-card border border-dashed border-red-300 bg-red-50/40 px-4 py-3 font-mono text-[12px] text-red-700">
            backend unreachable — {lb.error.message}
          </div>
        )}
        <div className="wf-card wf-card-dashed p-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div>
              <div className="wf-eyebrow">Where you stand</div>
              <div className="flex items-baseline gap-3.5 mt-1.5">
                <span
                  className="text-pp-purple leading-none"
                  style={{
                    fontSize: 'clamp(40px, 5.5vw, 64px)',
                    fontWeight: 700,
                    letterSpacing: '-0.03em',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {me ? `#${me.rank}` : '—'}
                </span>
                <span className="font-mono text-[14px] text-warm-ink-soft">
                  of {totalUsers.toLocaleString()}
                </span>
              </div>
              <div className="font-mono text-[13px] text-warm-ink-soft mt-2">
                {myPts.toLocaleString()} pts all-time · keep climbing
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <LBTabs active={tab} onChange={setTab} />
            </div>
          </div>
          {me && <TierLadder myRank={me.rank} totalUsers={Math.max(totalUsers, 1)} />}
        </div>

        <div>
          <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
            <div className="wf-eyebrow">Top {ranked.length} all-time</div>
            <div className="flex items-center gap-3">
              {status && (
                <span
                  className="font-mono text-[11px]"
                  style={{ color: status.kind === 'ok' ? 'var(--color-warm-ink-soft)' : '#b91c1c' }}
                >
                  {status.msg}
                </span>
              )}
              <button
                type="button"
                onClick={handleCrystallize}
                disabled={busy}
                className="font-mono text-[11px] uppercase tracking-[0.06em] px-2.5 py-1 rounded-md border border-dashed text-pp-purple transition-opacity"
                style={{
                  borderColor: 'var(--color-warm-line)',
                  opacity: busy ? 0.5 : 1,
                  cursor: busy ? 'not-allowed' : 'pointer',
                }}
              >
                {busy ? 'crystallizing…' : 'crystallize now'}
              </button>
            </div>
          </div>
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {ranked.map((u) => (
              <RankCard key={u.addr} u={u} totalUsers={Math.max(totalUsers, 1)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
