import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AttackTestingPage from './pages/AttackTestingPage';
import DefenseTestingPage from './pages/DefenseTestingPage';
import ManualAttackPage from './pages/ManualAttackPage';
import { Run } from './types';
import { useAppStore } from './store/appStore';
import { websocketService } from './services/websocket';
import { fetchRuns } from './services/api';

type AppPage = 'home' | 'dashboard' | 'attack' | 'defense' | 'manual';

const App: React.FC = () => {
  const [page, setPage] = useState<AppPage>('home');

  const setRuns     = useAppStore(s => s.setRuns);
  const setActiveRun = useAppStore(s => s.setActiveRun);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    websocketService.connect(socketUrl);

    const initializeRuns = async () => {
      try {
        const runs = await fetchRuns();
        setRuns(runs);
        runs.forEach(run => websocketService.joinRun(run.runid));
      } catch (err) {
        console.error('[App] Failed to fetch runs:', err);
      }
    };

    initializeRuns();

    return () => { websocketService.disconnect(); };
  }, [setRuns]);

  const handleOpenRun = (run: Run) => {
    setActiveRun(run.runid);

    if (run.components.includes('manual' as any)) {
      setPage('manual');
    } else if (run.components.includes('attack')) {
      setPage('attack');
    } else if (run.components.includes('defense')) {
      setPage('defense');
    }
  };

  const handleBackToHome      = () => { setActiveRun(null); setPage('home'); };
  const handleBackToDashboard = () => { setActiveRun(null); setPage('dashboard'); };

  if (page === 'dashboard') return <DashboardPage onOpenRun={handleOpenRun} onBack={handleBackToHome} />;
  if (page === 'attack')    return <AttackTestingPage onBack={handleBackToDashboard} />;
  if (page === 'defense')   return <DefenseTestingPage onBack={handleBackToDashboard} />;
  if (page === 'manual')    return <ManualAttackPage onBack={handleBackToDashboard} />;

  return <HomePage onNavigate={(nextPage) => setPage(nextPage)} />;
};

export default App;
