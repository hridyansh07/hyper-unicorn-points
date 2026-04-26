import { useMemo, useState } from 'react';
import { TopBar } from '../components/TopBar';
import { PointsChart } from '../components/PointsChart';
import { ShardCard } from '../components/ShardCard';
import { ClosedDepositCard } from '../components/ClosedDepositCard';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { RangeToggle } from '../components/RangeToggle';
import { ChartLegend } from '../components/ChartLegend';
import { ChartMetricToggle } from '../components/ChartMetricToggle';
import { WithdrawModal } from '../components/WithdrawModal';
import { useActiveAddress } from '../state/ActiveAddressContext';
import { fetchUserPoints, fetchUserShards } from '../lib/api';
import { useFetch } from '../lib/use-fetch';
import { splitShards } from '../lib/adapters';
import { shardCurrentRate } from '../lib/shards';
import type { ChartMetric, RangeKey } from '../lib/types';

const POLL_MS = 30_000;

export function Dashboard() {
  const { address } = useActiveAddress();
  const [range, setRange] = useState<RangeKey>('1M');
  const [chartMetric, setChartMetric] = useState<ChartMetric>('total');
  const [iso, setIso] = useState<string | null>(null);
  const [withdrawOpen, setWithdrawOpen] = useState(false);

  const points = useFetch(`points:${address}`, () => fetchUserPoints(address), {
    refetchInterval: POLL_MS,
  });
  const shards = useFetch(`shards:${address}`, () => fetchUserShards(address), {
    refetchInterval: POLL_MS,
  });

  const split = useMemo(() => (shards.data ? splitShards(shards.data) : null), [shards.data]);

  const totals = useMemo(() => {
    if (!split) return { ratePerHour: 0, sorted: [] as ReturnType<typeof splitShards>['active'] };
    const ratePerHour = split.active.reduce((acc, s) => acc + shardCurrentRate(s), 0);
    const sorted = [...split.active].sort((a, b) => shardCurrentRate(b) - shardCurrentRate(a));
    return { ratePerHour, sorted };
  }, [split]);

  const isolated = iso && split ? split.active.find((s) => s.id === iso) ?? null : null;
  const headlineValue = isolated && split
    ? split.earnedById[isolated.id] ?? 0
    : Number(points.data?.virtualTotalPoints ?? 0);

  const err = points.error ?? shards.error;
  const ready = !!split && !!points.data;
  const activeApiShards = useMemo(() => shards.data?.filter((s) => s.active) ?? [], [shards.data]);
  const canWithdraw = activeApiShards.length > 0 && !shards.loading;

  return (
    <div className="wf-screen">
      <TopBar />
      <div className="flex-1 overflow-auto p-5 sm:px-7 sm:py-[22px] flex flex-col gap-[18px]">
        {err && (
          <div className="wf-card border border-dashed border-red-300 bg-red-50/40 px-4 py-3 font-mono text-[12px] text-red-700">
            backend unreachable — {err.message}
          </div>
        )}

        {/* hero card */}
        <div className="wf-card wf-card-dashed p-6 relative">
          <div className="flex items-start justify-between gap-6 flex-wrap mb-3.5">
            <div className="min-w-0">
              <div className="wf-eyebrow">
                {isolated ? `Earned · ${isolated.asset}` : ready ? 'Total points earned' : 'loading…'}
              </div>
              <AnimatedNumber
                value={headlineValue}
                className="text-pp-purple mt-1.5 leading-none"
                style={{
                  fontSize: 'clamp(40px, 5.5vw, 64px)',
                  fontWeight: 700,
                  letterSpacing: '-0.03em',
                  fontVariantNumeric: 'tabular-nums',
                }}
              />
              <div className="font-mono text-[13px] text-warm-ink-soft mt-2">
                accruing {totals.ratePerHour.toFixed(1)} pts/hr · across {split?.active.length ?? 0} deposits
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex items-center justify-end gap-2 flex-wrap">
                <ChartMetricToggle value={chartMetric} onChange={setChartMetric} />
                <RangeToggle value={range} onChange={setRange} />
              </div>
              <ChartLegend metric={chartMetric} />
            </div>
          </div>
          <div className="w-full" style={{ aspectRatio: '800 / 280', maxHeight: '420px' }}>
            <PointsChart
              shards={split?.active ?? []}
              range={range}
              isolatedShard={iso}
              metric={chartMetric}
              currentValue={headlineValue}
            />
          </div>
        </div>

        {/* active deposits */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <span className="wf-eyebrow">Active deposits · {split?.active.length ?? 0}</span>
            <button
              onClick={() => setIso(null)}
              disabled={!iso}
              className={[
                'font-mono text-[11px] px-3 py-[5px] rounded-full border border-dashed border-warm-line tracking-[0.04em]',
                iso ? 'bg-pp-purple text-white cursor-pointer' : 'bg-transparent text-warm-ink-faint cursor-default',
              ].join(' ')}
            >
              show all
            </button>
          </div>
          <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {totals.sorted.map((s) => (
              <ShardCard
                key={s.id}
                s={s}
                active={iso === s.id}
                earned={split?.earnedById[s.id] ?? 0}
                onClick={() => setIso(iso === s.id ? null : s.id)}
              />
            ))}
          </div>
        </div>

        {/* closed deposits */}
        {split && split.closed.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-3 gap-3 flex-wrap">
              <span className="wf-eyebrow">Closed deposits · {split.closed.length}</span>
              <span className="font-mono text-[11px] text-warm-ink-faint">
                points crystallized at withdrawal — already in your total
              </span>
            </div>
            <div className="grid gap-2.5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {split.closed.map((d) => (
                <ClosedDepositCard key={d.id} d={d} />
              ))}
            </div>
          </div>
        )}
      </div>

      {canWithdraw && (
        <button
          type="button"
          aria-label="Open withdraw form"
          onClick={() => setWithdrawOpen(true)}
          className="fixed bottom-5 right-5 z-40 w-13 h-13 rounded-full bg-pp-purple text-white text-[30px] leading-none shadow-[0_12px_34px_rgba(78,20,208,0.32)] border border-pp-light-purple/40 transition-transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-pp-light-purple/30"
        >
          +
        </button>
      )}

      {withdrawOpen && (
        <WithdrawModal
          address={address}
          activeShards={activeApiShards}
          onClose={() => setWithdrawOpen(false)}
          onSuccess={() => {
            points.refetch();
            shards.refetch();
          }}
        />
      )}
    </div>
  );
}
