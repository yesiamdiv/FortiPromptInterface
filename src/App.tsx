import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import RunShell from './pages/RunShell';
import { Run } from './types';
import { useAppStore } from './store/appStore';
import { websocketService } from './services/websocket';
import { fetchRuns } from './services/api';

type AppPage = 'home' | 'dashboard' | 'run';

const App: React.FC = () => {
  const [page, setPage] = useState<AppPage>(() => {
    // Restore page from sessionStorage so refresh doesn't boot to home
    const saved = sessionStorage.getItem('fp_page') as AppPage | null;
    return saved ?? 'home';
  });

  const setRuns       = useAppStore(s => s.setRuns);
  const setActiveRun  = useAppStore(s => s.setActiveRun);
  const resetRunState = useAppStore(s => s.resetRunState);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL ?? 'http://localhost:8000';
    websocketService.connect(socketUrl);

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
  }, [setRuns]);

  // Persist page to sessionStorage
  const navigate = (p: AppPage) => {
    sessionStorage.setItem('fp_page', p);
    setPage(p);
  };

  const handleOpenRun = (run: Run) => {
    setActiveRun(run.runid);
    resetRunState();
    navigate('run');
  };

  const handleBackToHome      = () => { setActiveRun(null); navigate('home'); };
  const handleBackToDashboard = () => { setActiveRun(null); navigate('dashboard'); };

  if (page === 'dashboard') return <DashboardPage onOpenRun={handleOpenRun} onBack={handleBackToHome} />;
  if (page === 'run')       return <RunShell onBack={handleBackToDashboard} />;

  return <HomePage onNavigate={() => navigate('dashboard')} />;
};

export default App;