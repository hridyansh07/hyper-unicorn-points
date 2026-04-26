import type { RangeKey } from '../lib/types';

const RANGES: RangeKey[] = ['1W', '1M', '3M', 'ALL'];

interface Props {
  value: RangeKey;
  onChange: (r: RangeKey) => void;
}

export function RangeToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-pp-purple/[0.05] rounded-full font-mono text-[10px]">
      {RANGES.map((r) => {
        const active = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={[
              'px-3 py-[5px] rounded-full border-none cursor-pointer tracking-[0.04em] font-semibold transition-colors',
              active ? 'bg-pp-purple text-white' : 'bg-transparent text-warm-ink-soft hover:text-warm-ink',
            ].join(' ')}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}
