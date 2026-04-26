import { Navigate, Route, Routes } from 'react-router-dom';
import { ActiveAddressProvider } from './state/ActiveAddressContext';
import { LeaderboardProvider } from './state/LeaderboardContext';
import { Dashboard } from './pages/Dashboard';
import { Leaderboard } from './pages/Leaderboard';

export function App() {
  return (
    <ActiveAddressProvider>
      <LeaderboardProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      </LeaderboardProvider>
    </ActiveAddressProvider>
  );
}
