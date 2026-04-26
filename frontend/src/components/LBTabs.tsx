import type { LeaderboardTab } from '../lib/types';

interface TabDef {
  id: LeaderboardTab;
  label: string;
  disabled?: boolean;
}

const TABS: TabDef[] = [
  { id: 'weekly',  label: 'Weekly',   disabled: true },
  { id: 'monthly', label: 'Monthly',  disabled: true },
  { id: 'alltime', label: 'All-time' },
];

interface Props {
  active: LeaderboardTab;
  onChange: (t: LeaderboardTab) => void;
}

export function LBTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-pp-purple/[0.05] rounded-full font-mono text-[10.5px]">
      {TABS.map((t) => {
        const isActive = active === t.id;
        const disabled = !!t.disabled;
        return (
          <button
            key={t.id}
            disabled={disabled}
            onClick={() => !disabled && onChange(t.id)}
            title={disabled ? 'Coming soon — backend supports all-time only' : undefined}
            className={[
              'px-3.5 py-1.5 rounded-full border-none tracking-[0.04em] font-semibold transition-colors',
              disabled
                ? 'bg-transparent text-warm-ink-faint opacity-50 cursor-not-allowed line-through decoration-warm-ink-faint/40'
                : isActive
                  ? 'bg-pp-purple text-white cursor-pointer'
                  : 'bg-transparent text-warm-ink-soft hover:text-warm-ink cursor-pointer',
            ].join(' ')}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
