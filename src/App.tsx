import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import RunShell from './pages/RunShell';
import { useAppStore } from './store/appStore';
import { websocketService } from './services/websocket';
import { fetchRuns } from './services/api';
import { env } from './config';

const AppInner: React.FC = () => {
  const setRuns = useAppStore(s => s.setRuns);

  useEffect(() => {
    // Connect WS and fetch runs on mount.
    // setRuns is a stable Zustand action — intentionally omitted from dep array.
    websocketService.connect(env.socketUrl);

    const initRuns = async () => {
      try {
        const runs = await fetchRuns();
        setRuns(runs);
        runs.forEach(run => websocketService.joinRun(run.runid));
      } catch (err) {
        console.error('[App] Failed to fetch runs:', err);
      }
    };

    initRuns();
    return () => { websocketService.disconnect(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Routes>
      <Route path="/"                 element={<HomePage />} />
      <Route path="/dashboard"        element={<DashboardPage />} />
      <Route path="/runs/:runId/:tab" element={<RunShell />} />
      {/* Redirect bare /runs/:runId → attack tab */}
      <Route path="/runs/:runId"      element={<RunShellRedirect />} />
      <Route path="*"                 element={<Navigate to="/" replace />} />
    </Routes>
  );
};

// Redirect /runs/:runId → /runs/:runId/attack
const RunShellRedirect: React.FC = () => {
  const { runId } = useParams<{ runId: string }>();
  return <Navigate to={`/runs/${runId}/attack`} replace />;
};

const App: React.FC = () => (
  <BrowserRouter>
    <AppInner />
  </BrowserRouter>
);

export default App;
