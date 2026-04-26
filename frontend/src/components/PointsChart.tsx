import { useEffect, useMemo, useRef, useState } from 'react';
import type { ChartMetric, RangeKey, Shard } from '../lib/types';
import { integralTimeMult, timeMult } from '../lib/points-math';
import { fmtCompact } from '../lib/format';

const CHART_W = 800;
const CHART_H = 280;
const PAD = { l: 52, r: 28, t: 22, b: 32 };

const TOTAL_RANGE_DAYS: Record<RangeKey, { past: number; future: number }> = {
  '1W':  { past: 5,  future: 7 },
  '1M':  { past: 14, future: 30 },
  '3M':  { past: 30, future: 60 },
  'ALL': { past: 60, future: 120 },
};

const DAILY_RANGE_DAYS: Record<RangeKey, { past: number; future: number }> = {
  '1W':  { past: 7,   future: 7 },
  '1M':  { past: 30,  future: 30 },
  '3M':  { past: 90,  future: 90 },
  'ALL': { past: 180, future: 210 },
};

function pointsForWindow(s: Shard, ageStart: number, ageEnd: number): number {
  if (ageEnd <= ageStart) return 0;
  return s.amount * s.locked_rate * integralTimeMult(ageStart, ageEnd);
}

function dailyPointsAt(s: Shard, dayOffsetFromNow: number): number {
  const age = dayOffsetFromNow - s.start_day;
  if (age < 0) return 0;
  return s.amount * s.locked_rate * timeMult(age);
}

function buildTotalSeries(
  shards: Shard[],
  pastDays: number,
  futureDays: number,
  currentValue: number,
): number[] {
  const total = pastDays + futureDays + 1;
  const pts: number[] = [];
  for (let d = 0; d < total; d++) {
    const dayOffsetFromNow = d - pastDays;
    let delta = 0;
    for (const s of shards) {
      const ageNow = Math.max(0, -s.start_day);
      const ageAtDay = Math.max(0, dayOffsetFromNow - s.start_day);
      if (dayOffsetFromNow < 0) {
        delta -= pointsForWindow(s, ageAtDay, ageNow);
      } else if (dayOffsetFromNow > 0) {
        delta += pointsForWindow(s, ageNow, ageAtDay);
      }
    }
    pts.push(Math.max(0, currentValue + delta));
  }
  return pts;
}

function buildDailySeries(shards: Shard[], pastDays: number, futureDays: number): number[] {
  const total = pastDays + futureDays + 1;
  const pts: number[] = [];
  for (let d = 0; d < total; d++) {
    const dayOffsetFromNow = d - pastDays;
    pts.push(shards.reduce((sum, s) => sum + dailyPointsAt(s, dayOffsetFromNow), 0));
  }
  return pts;
}

function curvePath(points: number[], xFor: (i: number) => number, yFor: (v: number) => number): string {
  if (!points.length) return '';
  let d = `M ${xFor(0)} ${yFor(points[0])}`;
  for (let i = 1; i < points.length; i++) {
    const x0 = xFor(i - 1), y0 = yFor(points[i - 1]);
    const x1 = xFor(i),     y1 = yFor(points[i]);
    const cx = (x0 + x1) / 2;
    d += ` C ${cx} ${y0}, ${cx} ${y1}, ${x1} ${y1}`;
  }
  return d;
}

// Pick 3 nicely-rounded gridline values inside [0, maxVal].
function niceGridValues(maxVal: number): number[] {
  if (maxVal <= 0) return [];
  const target = maxVal / 4;
  const mag = Math.pow(10, Math.floor(Math.log10(target)));
  const candidates = [1, 2, 2.5, 5, 10].map((m) => m * mag);
  const step = candidates.find((c) => c >= target) ?? mag * 10;
  const vals: number[] = [];
  for (let v = step; v < maxVal * 0.96; v += step) vals.push(v);
  return vals.slice(0, 4);
}

interface Props {
  shards: Shard[];
  range: RangeKey;
  isolatedShard: string | null;
  metric: ChartMetric;
  currentValue: number;
}

export function PointsChart({ shards, range, isolatedShard, metric, currentValue }: Props) {
  const { past, future } = (metric === 'daily' ? DAILY_RANGE_DAYS : TOTAL_RANGE_DAYS)[range];
  const activeShards = isolatedShard ? shards.filter((s) => s.id === isolatedShard) : shards;

  const series = useMemo(
    () => metric === 'daily'
      ? buildDailySeries(activeShards, past, future)
      : buildTotalSeries(activeShards, past, future, currentValue),
    [activeShards, currentValue, metric, past, future],
  );

  const days = past + future + 1;
  const nowIdx = past;
  const max = Math.max(...series, 1) * 1.08;
  const xFor = (i: number) => PAD.l + (i / (days - 1)) * (CHART_W - PAD.l - PAD.r);
  const yFor = (v: number) => PAD.t + (1 - v / max) * (CHART_H - PAD.t - PAD.b);

  const past_ = series.slice(0, nowIdx + 1);
  const future_ = series.slice(nowIdx);
  const pastPath = curvePath(past_, (i) => xFor(i), (v) => yFor(v));
  const futurePath = curvePath(future_, (i) => xFor(i + nowIdx), (v) => yFor(v));

  const baselineY = CHART_H - PAD.b;
  const pastArea = `${pastPath} L ${xFor(nowIdx)} ${baselineY} L ${xFor(0)} ${baselineY} Z`;
  const futureArea = `${futurePath} L ${xFor(days - 1)} ${baselineY} L ${xFor(nowIdx)} ${baselineY} Z`;

  const nowX = xFor(nowIdx);
  const endX = xFor(days - 1);
  const endY = yFor(series[days - 1]);
  const gridVals = useMemo(() => niceGridValues(max), [max]);

  const innerW = CHART_W - PAD.l - PAD.r;
  const barWidth = Math.max(2, (innerW / days) * 0.62);

  // ─── Reveal animation: replays whenever metric changes ───────────────────
  const [revealKey, setRevealKey] = useState(0);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    setIntroDone(false);
    setRevealKey((k) => k + 1);
    const raf = requestAnimationFrame(() => setIntroDone(true));
    return () => cancelAnimationFrame(raf);
  }, [metric]);

  // ─── Pointer-following tooltip ───────────────────────────────────────────
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!introDone) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width / CHART_W, rect.height / CHART_H);
    const offsetX = (rect.width - CHART_W * scale) / 2;
    const vbX = (e.clientX - rect.left - offsetX) / scale;
    const tFrac = (vbX - PAD.l) / innerW;
    if (tFrac < 0 || tFrac > 1) {
      setHoverIdx(null);
      return;
    }
    const idx = Math.round(tFrac * (days - 1));
    setHoverIdx(Math.max(0, Math.min(days - 1, idx)));
  };
  const onLeave = () => setHoverIdx(null);

  const activeIdx = hoverIdx ?? nowIdx;
  const activeX = xFor(activeIdx);
  const activeY = yFor(series[activeIdx]);
  const activeVal = series[activeIdx];
  const activeIsFuture = activeIdx > nowIdx;
  const dayDelta = activeIdx - nowIdx;
  const dayLabel = dayDelta === 0 ? 'now' : `${dayDelta > 0 ? '+' : '−'}${Math.abs(dayDelta)}d`;
  const accent = activeIsFuture ? '#9B6FFF' : '#4E14D0';
  const unit = metric === 'daily' ? ' pts/d' : ' pts';
  const prefix = activeIsFuture ? '~' : '';
  const tipText = `${dayLabel} · ${prefix}${fmtCompact(activeVal)}${unit}`;

  // Mono font at 11px → ~6.7px per glyph. Pad for 12px L/R inner gutter.
  const BADGE_W = Math.max(118, Math.ceil(tipText.length * 6.7 + 24));
  const BADGE_H = 26;
  const BADGE_GAP = 16; // distance from marker dot to badge bottom edge
  const badgeX = Math.max(
    PAD.l + BADGE_W / 2 + 2,
    Math.min(CHART_W - PAD.r - BADGE_W / 2 - 2, activeX),
  );
  const badgeY = Math.max(PAD.t + BADGE_H + BADGE_GAP, activeY - BADGE_GAP);

  // End-of-projection callout (total mode only; in daily mode the endpoint
  // isn't a meaningful headline).
  const showEndCallout = metric === 'total' && future > 0;
  const endCalloutAnchor: 'start' | 'end' = activeIdx >= days - 6 ? 'end' : 'start';
  const endCalloutX = endCalloutAnchor === 'end' ? endX - 8 : endX + 8;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CHART_W} ${CHART_H}`}
      className="w-full h-full block touch-none"
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      onPointerCancel={onLeave}
    >
      <defs>
        <linearGradient id="pp-past-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4E14D0" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#4E14D0" stopOpacity="0.05" />
        </linearGradient>
        <linearGradient id="pp-future-grad" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#9B6FFF" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#9B6FFF" stopOpacity="0.02" />
        </linearGradient>
        <pattern id="pp-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#9B6FFF" strokeWidth="1" strokeOpacity="0.4" />
        </pattern>
        <filter id="pp-tip-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#2a1f3a" floodOpacity="0.18" />
        </filter>
        <clipPath id="pp-reveal-clip">
          <rect
            key={revealKey}
            x="0"
            y="0"
            height={CHART_H}
            width={CHART_W}
            style={{
              transformOrigin: '0 0',
              transform: introDone ? 'scaleX(1)' : 'scaleX(0)',
              transition: 'transform 1400ms cubic-bezier(.45,.05,.2,1)',
            }}
          />
        </clipPath>
      </defs>

      {/* horizontal gridlines + y-axis labels */}
      {gridVals.map((v) => (
        <g key={`grid-${v}`}>
          <line
            x1={PAD.l}
            x2={CHART_W - PAD.r}
            y1={yFor(v)}
            y2={yFor(v)}
            stroke="#e8dccf"
            strokeWidth="0.6"
            strokeDasharray="2 4"
          />
          <text
            x={PAD.l - 8}
            y={yFor(v) + 3}
            fontSize="9"
            fontFamily="IBM Plex Mono, monospace"
            fill="#a99a8b"
            textAnchor="end"
          >
            {fmtCompact(v)}
          </text>
        </g>
      ))}

      {/* baseline */}
      <line x1={PAD.l} y1={baselineY} x2={CHART_W - PAD.r} y2={baselineY} stroke="#d8c9bd" strokeWidth="0.6" />

      {/* x-axis labels */}
      <text
        x={xFor(0)}
        y={CHART_H - 10}
        fontSize="10"
        fontFamily="IBM Plex Mono, monospace"
        fill="#a99a8b"
        textAnchor="start"
      >
        −{past}d
      </text>
      <text
        x={nowX}
        y={CHART_H - 10}
        fontSize="10"
        fontFamily="IBM Plex Mono, monospace"
        fill="#4E14D0"
        textAnchor="middle"
        fontWeight={600}
      >
        now
      </text>
      <text
        x={xFor(days - 1)}
        y={CHART_H - 10}
        fontSize="10"
        fontFamily="IBM Plex Mono, monospace"
        fill="#a99a8b"
        textAnchor="end"
      >
        +{future}d
      </text>

      {/* All data viz inside the reveal clip — areas + strokes draw together. */}
      <g clipPath="url(#pp-reveal-clip)">
        {metric === 'total' ? (
          <>
            <path className="pp-anim-d" d={pastArea} fill="url(#pp-past-grad)" />
            <path className="pp-anim-d" d={futureArea} fill="url(#pp-future-grad)" />
            <path className="pp-anim-d" d={futureArea} fill="url(#pp-hatch)" opacity="0.7" />
            <path
              className="pp-anim-d"
              d={pastPath}
              fill="none"
              stroke="#4E14D0"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <path
              className="pp-anim-d"
              d={futurePath}
              fill="none"
              stroke="#9B6FFF"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="5 4"
            />
            <circle cx={endX} cy={endY} r="4" fill="#fbf6f0" stroke="#9B6FFF" strokeWidth="1.6" />
          </>
        ) : (
          <>
            {series.map((v, i) => {
              const isFuture = i > nowIdx;
              const x = xFor(i) - barWidth / 2;
              const y = yFor(v);
              const h = Math.max(0, baselineY - y);
              return (
                <rect
                  key={`bar-${i}`}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={h}
                  rx={Math.min(2, barWidth / 3)}
                  fill={isFuture ? 'url(#pp-future-grad)' : 'url(#pp-past-grad)'}
                  stroke={isFuture ? '#9B6FFF' : '#4E14D0'}
                  strokeOpacity={isFuture ? 0.35 : 0.55}
                  strokeWidth="0.8"
                />
              );
            })}
          </>
        )}
      </g>

      {/* now vertical guide */}
      <line
        x1={nowX}
        y1={PAD.t}
        x2={nowX}
        y2={baselineY}
        stroke="#4E14D0"
        strokeWidth="1"
        strokeDasharray="2 3"
        opacity="0.5"
      />

      {/* end-of-projection callout (total mode) */}
      {showEndCallout && introDone && (
        <text
          x={endCalloutX}
          y={endY - 8}
          fontSize="10"
          fontFamily="IBM Plex Mono, monospace"
          fill="#9B6FFF"
          textAnchor={endCalloutAnchor}
          fontWeight={600}
        >
          +{future}d → {fmtCompact(series[days - 1])}
        </text>
      )}

      {/* hover crosshair (only when hovering somewhere other than now) */}
      {introDone && hoverIdx !== null && hoverIdx !== nowIdx && (
        <line
          x1={activeX}
          y1={PAD.t}
          x2={activeX}
          y2={baselineY}
          stroke={accent}
          strokeWidth="1"
          strokeDasharray="2 3"
          opacity="0.6"
        />
      )}

      {/* active marker + badge — hidden during intro */}
      {introDone && (
        <>
          {/* thin connector line from marker to badge */}
          <line
            className="pp-anim-cxy"
            x1={activeX}
            y1={activeY}
            x2={badgeX}
            y2={badgeY - 2}
            stroke={accent}
            strokeWidth="1"
            strokeOpacity="0.5"
            strokeDasharray="2 2"
          />
          <circle className="pp-anim-cy" cx={activeX} cy={activeY} r="6" fill="#fbf6f0" stroke={accent} strokeWidth="2.4" />
          <circle className="pp-anim-cy" cx={activeX} cy={activeY} r="2.5" fill={accent} />
          <g className="pp-anim-cxy" transform={`translate(${badgeX},${badgeY})`}>
            <rect
              x={-BADGE_W / 2}
              y={-BADGE_H - 4}
              width={BADGE_W}
              height={BADGE_H}
              rx="6"
              fill="#fbf6f0"
              stroke={accent}
              strokeWidth="1.2"
              filter="url(#pp-tip-shadow)"
            />
            <text
              x="0"
              y={-BADGE_H / 2 - 4 + 4}
              fontSize="11"
              fontFamily="IBM Plex Mono, monospace"
              fill={accent}
              textAnchor="middle"
              fontWeight={600}
            >
              {tipText}
            </text>
          </g>
        </>
      )}
    </svg>
  );
}
