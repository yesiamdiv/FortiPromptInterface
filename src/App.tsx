import React, { useState, useEffect } from 'react';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import AttackTestingPage from './pages/AttackTestingPage';
import DefenseTestingPage from './pages/DefenseTestingPage';
import { Run } from './types';
import { useAppStore } from './store/appStore';
import { websocketService } from './services/websocket';
import { fetchRuns } from './services/api';

type AppPage = 'home' | 'dashboard' | 'attack' | 'defense';

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
        // Join Socket.io room for each existing run (use runid)
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

    // Navigate based on run components — values are now 'attack' | 'defense'
    if (run.components.includes('attack')) {
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

  return <HomePage onNavigate={(nextPage) => setPage(nextPage)} />;
};

export default App;


// import React, { useState, useEffect } from 'react';
// import HomePage from './pages/HomePage';
// import DashboardPage from './pages/DashboardPage';
// import AttackTestingPage from './pages/AttackTestingPage';
// import DefenseTestingPage from './pages/DefenseTestingPage';
// import { Run } from './types';
// import { useAppStore } from './store/appStore';
// import { websocketService } from './services/websocket';
// import { fetchRuns } from './services/api';

// type AppPage = 'home' | 'dashboard' | 'attack' | 'defense';

// const App: React.FC = () => {
//   const [page, setPage] = useState<AppPage>('home');
  
//   // Global store
//   const setRuns = useAppStore(s => s.setRuns);
//   const setActiveRun = useAppStore(s => s.setActiveRun);

//   // Initialize WebSocket connection on app mount
//   useEffect(() => {
//     const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';
    
//     // Connect to WebSocket server
//     websocketService.connect(socketUrl);

//     // Fetch existing runs and join their rooms
//     const initializeRuns = async () => {
//       try {
//         const runs = await fetchRuns();
//         setRuns(runs);
        
//         // Join Socket.io rooms for each run
//         runs.forEach(run => {
//           websocketService.joinRun(run.id);
//         });
//       } catch (err) {
//         console.error('[App] Failed to fetch runs:', err);
//       }
//     };

//     initializeRuns();

//     // Cleanup on unmount
//     return () => {
//       websocketService.disconnect();
//     };
//   }, [setRuns]);

//   const handleOpenRun = (run: Run) => {
//     setActiveRun(run.id);
    
//     // Navigate to appropriate page based on run components
//     if (run.components.includes('attack-testing')) {
//       setPage('attack');
//     } else if (run.components.includes('defense-testing')) {
//       setPage('defense');
//     }
//   };

//   const handleBackToHome = () => {
//     setActiveRun(null);
//     setPage('home');
//   };

//   const handleBackToDashboard = () => {
//     setActiveRun(null);
//     setPage('dashboard');
//   };

//   // Routing
//   if (page === 'dashboard') {
//     return (
//       <DashboardPage
//         onOpenRun={handleOpenRun}
//         onBack={handleBackToHome}
//       />
//     );
//   }

//   if (page === 'attack') {
//     return <AttackTestingPage onBack={handleBackToDashboard} />;
//   }

//   if (page === 'defense') {
//     return <DefenseTestingPage onBack={handleBackToDashboard} />;
//   }

//   return (
//     <HomePage
//       onNavigate={(nextPage) => {
//         setPage(nextPage);
//       }}
//     />
//   );
// };

// export default App;
