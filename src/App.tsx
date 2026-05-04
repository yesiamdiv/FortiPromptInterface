import React, { useState, useEffect } from 'react';
import HomePage from './pages/homepage';
import DashboardPage from './pages/DashboardPage';
import AttackTestingPage from './pages/AttackTestingPage';
import DefenseTestingPage from './pages/DefenseTestingPage';
import ManualChatPage from './pages/ManualChatPage'; // New import
import { Run } from './types';
import { useAppStore } from './store/appStore';
import { useManualStore } from './store/manualStore'; // New import
import { websocketService } from './services/websocket';
import { fetchRuns } from './services/api';

type AppPage = 'home' | 'dashboard' | 'attack' | 'defense' | 'manual-chat'; // Updated type

const App: React.FC = () => {
  const [page, setPage] = useState<AppPage>('home');

  const setRuns           = useAppStore(s => s.setRuns);
  const setActiveRun      = useAppStore(s => s.setActiveRun);
  const resetRunState     = useAppStore(s => s.resetRunState); // New
  const resetManualState  = useManualStore(s => s.resetManualState); // New

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000'; // Updated default port
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
    resetRunState(); // Reset automatic run state
    resetManualState(); // Reset manual run state

    if (run.graph_config?.graph_type === 'manual') {
      setPage('manual-chat');
    } else if (run.components.includes('attack')) {
      setPage('attack');
    } else if (run.components.includes('defense')) {
      setPage('defense');
    } else {
      // Fallback for runs without explicit type or components (e.g., legacy)
      setPage('attack');
    }
  };

  const handleBackToHome      = () => { setActiveRun(null); resetRunState(); resetManualState(); setPage('home'); }; // Reset all states
  const handleBackToDashboard = () => { setActiveRun(null); resetRunState(); resetManualState(); setPage('dashboard'); }; // Reset all states

  if (page === 'dashboard')   return <DashboardPage onOpenRun={handleOpenRun} onBack={handleBackToHome} />;
  if (page === 'attack')      return <AttackTestingPage onBack={handleBackToDashboard} />;
  if (page === 'defense')     return <DefenseTestingPage onBack={handleBackToDashboard} />;
  if (page === 'manual-chat') return (
    <ManualChatPage
      onBack={handleBackToDashboard}
      runId={useAppStore.getState().activeRunId!}
      sessionId={useManualStore.getState().activeSession?.session_id!}
    />
  );

  return <HomePage onNavigate={(nextPage) => setPage(nextPage)} />;
};

export default App;
