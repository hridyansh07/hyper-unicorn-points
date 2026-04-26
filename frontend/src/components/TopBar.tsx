import { NavLink } from 'react-router-dom';
import { RankBadge } from './RankBadge';
import { AddressSwitcher } from './AddressSwitcher';
import { useActiveAddress } from '../state/ActiveAddressContext';
import { useLeaderboard } from '../state/LeaderboardContext';

export function TopBar() {
  const { address } = useActiveAddress();
  const lb = useLeaderboard();
  const list = lb.data ?? [];
  const totalUsers = list.length;
  const me = list.find((e) => e.address.toLowerCase() === address.toLowerCase()) ?? null;
  return (
    <div className="flex items-center justify-between gap-4 px-4 sm:px-7 py-3.5 border-b border-dashed border-warm-line bg-warm-card/50 backdrop-blur-sm flex-shrink-0">
      <div className="flex items-center gap-7 min-w-0">
        <div className="flex items-center gap-2.5 font-bold text-[15px] tracking-[-0.01em]">
          <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[13px] font-bold shadow-[0_2px_8px_rgba(78,20,208,0.3)] bg-gradient-to-br from-pp-purple to-pp-light-purple">
            H
          </span>
          <span className="hidden sm:inline">HyperUnicorn</span>
        </div>
        <nav className="flex gap-1 bg-pp-purple/[0.06] p-1 rounded-full font-mono text-[11px]">
          <Tab to="/dashboard">Dashboard</Tab>
          <Tab to="/leaderboard">Leaderboard</Tab>
        </nav>
      </div>
      <div className="flex items-center gap-3.5">
        {me && totalUsers > 0 && <RankBadge rank={me.rank} totalUsers={totalUsers} size="md" />}
        <AddressSwitcher />
      </div>
    </div>
  );
}

function Tab({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'px-3.5 py-1.5 rounded-full tracking-[0.02em] transition-colors',
          isActive
            ? 'bg-warm-card text-pp-purple font-semibold shadow-[0_1px_3px_rgba(78,20,208,0.12)]'
            : 'text-warm-ink-soft hover:text-warm-ink',
        ].join(' ')
      }
    >
      {children}
    </NavLink>
  );
}
