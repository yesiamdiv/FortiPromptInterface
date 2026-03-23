import React, { useState } from 'react';
import HomePage from './pages/homepage';
import AttackTestingPage from './pages/AttackTestingPage';
import DefenseTestingPage from './pages/DefenseTestingPage';

type AppPage = 'home' | 'attack' | 'defense';

const App: React.FC = () => {
  const [page, setPage] = useState<AppPage>('home');

  if (page === 'attack') {
    return <AttackTestingPage onBack={() => setPage('home')} />;
  }

  if (page === 'defense') {
    return <DefenseTestingPage onBack={() => setPage('home')} />;
  }

  return (
    <HomePage
      onNavigate={(nextPage) => {
        setPage(nextPage);
      }}
    />
  );
};

export default App;
