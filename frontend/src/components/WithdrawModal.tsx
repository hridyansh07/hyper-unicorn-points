import { useEffect, useId, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { postWithdrawEvent } from '../lib/api';
import type { ApiShard } from '../lib/api-types';

interface Props {
  address: string;
  activeShards: ApiShard[];
  onClose: () => void;
  onSuccess: () => void;
}

interface WithdrawSource {
  key: string;
  entrypoint: ApiShard['entrypoint'];
  sourceAsset: string;
  sourceDecimals: number;
  availableRaw: bigint;
  shardCount: number;
}

function sourceKey(shard: Pick<ApiShard, 'entrypoint' | 'sourceAsset' | 'sourceDecimals'>): string {
  return `${shard.entrypoint}:${shard.sourceAsset}:${shard.sourceDecimals}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

function rawUnit(decimals: number): bigint {
  return 10n ** BigInt(decimals);
}

function formatRaw(raw: bigint, decimals: number): string {
  const unit = rawUnit(decimals);
  const whole = raw / unit;
  const fraction = raw % unit;
  if (fraction === 0n) return whole.toString();

  const fractionText = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');
  return `${whole.toString()}.${fractionText}`;
}

function parseAmountRaw(value: string, decimals: number): bigint | null {
  const trimmed = value.trim();
  if (!/^(?:\d+|\d+\.\d+|\.\d+)$/.test(trimmed)) return null;

  const [wholePart, fractionPart = ''] = trimmed.split('.');
  if (fractionPart.length > decimals) return null;

  const whole = BigInt(wholePart || '0') * rawUnit(decimals);
  const fraction = fractionPart
    ? BigInt(fractionPart.padEnd(decimals, '0'))
    : 0n;

  return whole + fraction;
}

function groupWithdrawSources(shards: ApiShard[]): WithdrawSource[] {
  const grouped = new Map<string, WithdrawSource>();

  for (const shard of shards) {
    const key = sourceKey(shard);
    const existing = grouped.get(key);
    if (existing) {
      existing.availableRaw += BigInt(shard.sourceQuantityRaw);
      existing.shardCount += 1;
      continue;
    }

    grouped.set(key, {
      key,
      entrypoint: shard.entrypoint,
      sourceAsset: shard.sourceAsset,
      sourceDecimals: shard.sourceDecimals,
      availableRaw: BigInt(shard.sourceQuantityRaw),
      shardCount: 1,
    });
  }

  return [...grouped.values()].sort((a, b) => {
    if (a.entrypoint !== b.entrypoint) return a.entrypoint.localeCompare(b.entrypoint);
    return a.sourceAsset.localeCompare(b.sourceAsset);
  });
}

export function WithdrawModal({ address, activeShards, onClose, onSuccess }: Props) {
  const titleId = useId();
  const sources = useMemo(() => groupWithdrawSources(activeShards), [activeShards]);
  const [selectedKey, setSelectedKey] = useState('');
  const [amount, setAmount] = useState('');
  const [occurredAt, setOccurredAt] = useState(nowIso);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const selectedSource = sources.find((source) => source.key === selectedKey) ?? sources[0] ?? null;

  useEffect(() => {
    setSelectedKey((current) => {
      if (sources.some((source) => source.key === current)) return current;
      return sources[0]?.key ?? '';
    });
  }, [sources]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, submitting]);

  const validate = (): { source: WithdrawSource; amountRaw: bigint; iso: string } | null => {
    setError(null);
    setSuccess(null);

    if (!selectedSource) {
      setError('Select an active source to withdraw from.');
      return null;
    }

    if (!occurredAt.trim()) {
      setError('Enter an occurredAt timestamp.');
      return null;
    }

    const timestamp = Date.parse(occurredAt);
    if (Number.isNaN(timestamp)) {
      setError('Enter a valid ISO timestamp for occurredAt.');
      return null;
    }

    const amountRaw = parseAmountRaw(amount, selectedSource.sourceDecimals);
    if (amountRaw === null) {
      setError(`Enter a positive source-unit amount with up to ${selectedSource.sourceDecimals} decimals.`);
      return null;
    }

    if (amountRaw <= 0n) {
      setError('Withdraw amount must be greater than zero.');
      return null;
    }

    if (amountRaw > selectedSource.availableRaw) {
      setError(`Amount exceeds available balance of ${formatRaw(selectedSource.availableRaw, selectedSource.sourceDecimals)}.`);
      return null;
    }

    return {
      source: selectedSource,
      amountRaw,
      iso: new Date(timestamp).toISOString(),
    };
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const valid = validate();
    if (!valid) return;

    setSubmitting(true);
    try {
      const result = await postWithdrawEvent({
        occurredAt: valid.iso,
        userAddress: address,
        entrypoint: valid.source.entrypoint,
        sourceAsset: valid.source.sourceAsset,
        sourceDecimals: valid.source.sourceDecimals,
        sourceQuantityRaw: valid.amountRaw.toString(),
      });

      setSuccess(`Withdraw submitted across ${result.touchedShardIds.length} shard${result.touchedShardIds.length === 1 ? '' : 's'}.`);
      onSuccess();
      window.setTimeout(onClose, 650);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-warm-ink/30 px-4 py-6 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={() => !submitting && onClose()}
    >
      <div
        className="wf-card wf-card-dashed w-full max-w-[760px] max-h-[calc(100vh-48px)] overflow-auto p-5 sm:p-6 shadow-[0_24px_70px_rgba(42,31,58,0.24)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <div className="wf-eyebrow">Mock event</div>
            <h2 id={titleId} className="mt-1 text-[22px] font-bold tracking-normal text-warm-ink">
              Withdraw liquidity
            </h2>
            <p className="mt-1 font-mono text-[12px] leading-5 text-warm-ink-soft">
              Choose a source, enter source units, and submit a backend withdraw event.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close withdraw form"
            disabled={submitting}
            onClick={onClose}
            className="w-8 h-8 flex-shrink-0 rounded-full border border-dashed border-warm-line bg-transparent font-mono text-[14px] leading-none text-warm-ink-soft transition-colors hover:border-pp-purple hover:text-pp-purple disabled:opacity-50"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <div>
            <div className="wf-eyebrow mb-2">Withdraw source</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sources.map((source) => {
                const selected = source.key === selectedSource?.key;
                return (
                  <button
                    key={source.key}
                    type="button"
                    onClick={() => {
                      setSelectedKey(source.key);
                      setError(null);
                      setSuccess(null);
                    }}
                    className={[
                      'text-left rounded-[10px] border p-3.5 transition-all duration-200',
                      selected
                        ? 'border-pp-purple bg-pp-purple/[0.06] shadow-[0_0_0_3px_rgba(78,20,208,0.12)]'
                        : 'border-warm-line-soft bg-warm-card hover:border-warm-line',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-semibold text-[13px] text-warm-ink">{source.sourceAsset}</div>
                        <div className="mt-1 font-mono text-[10px] text-warm-ink-faint">
                          {source.entrypoint} / {source.sourceDecimals} decimals / {source.shardCount} shard{source.shardCount === 1 ? '' : 's'}
                        </div>
                      </div>
                      <span
                        className="font-mono text-[9px] px-1.5 py-0.5 rounded-[3px] tracking-[0.06em]"
                        style={{
                          background: source.entrypoint === 'VAULT' ? 'rgba(0,208,145,0.12)' : 'rgba(78,20,208,0.10)',
                          color: source.entrypoint === 'VAULT' ? '#008c61' : '#4E14D0',
                        }}
                      >
                        {source.entrypoint}
                      </span>
                    </div>
                    <div className="wf-divider-dashed" style={{ margin: '10px 0' }} />
                    <div className="font-mono text-[10px] text-warm-ink-soft">
                      available {formatRaw(source.availableRaw, source.sourceDecimals)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-2">
              <span className="wf-eyebrow">Amount</span>
              <input
                value={amount}
                onChange={(event) => {
                  setAmount(event.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                placeholder={selectedSource ? `max ${formatRaw(selectedSource.availableRaw, selectedSource.sourceDecimals)}` : '0'}
                inputMode="decimal"
                className="h-10 rounded-[8px] border border-dashed border-warm-line bg-warm-card px-3 font-mono text-[12px] text-warm-ink outline-none transition-colors focus:border-pp-purple"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="wf-eyebrow">occurredAt</span>
              <input
                value={occurredAt}
                onChange={(event) => {
                  setOccurredAt(event.target.value);
                  setError(null);
                  setSuccess(null);
                }}
                className="h-10 rounded-[8px] border border-dashed border-warm-line bg-warm-card px-3 font-mono text-[12px] text-warm-ink outline-none transition-colors focus:border-pp-purple"
              />
            </label>
          </div>

          {selectedSource && (
            <div className="rounded-[8px] border border-dashed border-warm-line bg-pp-purple/[0.04] px-3 py-2 font-mono text-[11px] leading-5 text-warm-ink-soft">
              DTO derives {selectedSource.entrypoint} / {selectedSource.sourceAsset} / {selectedSource.sourceDecimals} decimals from the selected source.
            </div>
          )}

          {error && (
            <div className="rounded-[8px] border border-dashed border-red-300 bg-red-50/50 px-3 py-2 font-mono text-[11px] leading-5 text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-[8px] border border-dashed border-pp-green bg-pp-green/[0.08] px-3 py-2 font-mono text-[11px] leading-5 text-warm-ink-soft">
              {success}
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-dashed border-warm-line bg-transparent font-mono text-[11px] text-warm-ink-soft transition-colors hover:border-warm-line hover:text-warm-ink disabled:opacity-50"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={submitting || sources.length === 0}
              className="px-4 py-2 rounded-full bg-pp-purple font-mono text-[11px] font-semibold text-white shadow-[0_4px_16px_rgba(78,20,208,0.24)] transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'submitting…' : 'submit withdraw'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
