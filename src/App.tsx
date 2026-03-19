import React from 'react';
import { Shield, Zap, Play, Pause, Settings } from 'lucide-react';
import { useAppStore } from './store/appStore';
import RunManagerPage from './pages/SessionManagerPage';
import AttackTestingPage from './pages/AttackTestingPage';
import DefenseTestingPage from './pages/DefenseTestingPage';
import { ComponentType, ComponentLabel, Run } from './types'; // Import Run type

// Mock componentLabels for RunManager
const mockComponentLabels = {
  'attack-testing': { name: 'Attack Testing', icon: Zap },
  'defense-testing': { name: 'Defense Testing', icon: Shield },
};

// Mock RunManager component (as provided in the original App.tsx)
const MockRunManager: React.FC<{ onOpenRun: (run: Run) => void }> = ({ onOpenRun }) => {
  // Mock runs data
  const runs: Run[] = [
    {
      id: '1',
      name: "RAG Jailbreak Testing",
      description: "Full pipeline test for RAG security vulnerabilities",
      components: ['attack-testing', 'defense-testing'],
      status: 'running',
      lastActive: '2 hours ago',
      created: 'Jan 20, 2026'
    },
    // {
    //   id: '2',
    //   name: "Red Team Model Training",
    //   description: "Training attack generation model",
    //   components: ['attack-training'], // This component will be filtered out
    //   status: 'idle',
    //   lastActive: '1 day ago',
    //   created: 'Jan 18, 2026'
    // },
    // {
    //   id: '3',
    //   name: "Comprehensive Security Suite",
    //   description: "Full attack and defense testing with model training capabilities",
    //   components: ['attack-testing', 'defense-testing', 'attack-training', 'defense-training'], // These will be filtered out
    //   status: 'idle',
    //   lastActive: 'Just now',
    //   created: 'Jan 21, 2026'
    // }
  ];

  // Filter runs to only include those with components that are present in mockComponentLabels
  const filteredRuns = runs.filter(run =>
    run.components.some(comp => comp in mockComponentLabels)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Security Testing Runs</h2>
          <p className="text-slate-400">Create and manage isolated testing environments</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
            <Settings className="w-4 h-4" />
            Settings
          </button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {filteredRuns.map(run => (
          <div key={run.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => onOpenRun(run)}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{run.name}</h3>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${run.status === 'running' ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                {run.status.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-slate-400 mb-4">{run.description}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>Last Active: {run.lastActive}</span>
              <span>Created: {run.created}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const App: React.FC = () => {
    const { activeRun, activeTab, currentView,setCurrentView, setActiveTab, setActiveRun } =
    useAppStore();

  const componentLabels: Record<ComponentType, ComponentLabel> = {
    'attack-testing': { name: 'Attack Testing', icon: Zap, color:'red' },
    'defense-testing': { name: 'Defense Testing', icon: Shield , color:'blue'},
  };

  // Define the handler function here
  const handleOpenRun = (run: Run) => {
    setActiveRun(run);
    setCurrentView('run-workspace');
    // Set the active tab to the first component of the run, or a default if none
    if (run.components.length > 0) {
      setActiveTab(run.components[0]);
    } else {
      setActiveTab('overview'); // Or some default tab
    }
  };

  const handleBackToRuns = () => {
    setCurrentView('run-manager');
    setActiveRun(null);
    setActiveTab('overview');
  };


  const renderPage = () => {
    if (!activeRun) return null;

    switch (activeTab) {
      case 'attack-testing':
        return <AttackTestingPage />;
      case 'defense-testing':
        return <DefenseTestingPage />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-red-500" />
            <div>
              <h1 className="text-2xl font-bold">FortiPrompt</h1>
              <p className="text-sm text-slate-400">Red Team Security Testing Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
      {activeRun && (
              <button
                onClick={handleBackToRuns}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
              >
                ← Back to Runs
              </button>
            )}
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {activeRun && (
        <div className="bg-slate-800/50 border-b border-slate-700 px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Active Run:</span>
              <span className="font-semibold">{activeRun.name}</span>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  activeRun.status === 'running'
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {activeRun.status === 'running' ? (
                  <Play className="w-3 h-3" />
                ) : (
                  <Pause className="w-3 h-3" />
                )}
                {activeRun.status}
              </span>
            </div>
            <span className="text-sm text-slate-400">{activeRun.description}</span>
          </div>
        </div>
      )}

      {/* Navigation Tabs (only show when in run) */}
      {activeRun && (
        <div className="bg-slate-800 border-b border-slate-700 px-6">
          <div className="flex gap-1">
            {activeRun.components.map((comp: ComponentType) => {
              const label = componentLabels[comp];
              const Icon = label.icon;
              return (
                <button
                  key={comp}
                  onClick={() => setActiveTab(comp)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    activeTab === comp
                      ? 'border-red-500 text-white'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        {/* Render RunManagerPage and pass the handler */}
        {currentView === 'run-manager' && <RunManagerPage onOpenRun={handleOpenRun} />}
        {currentView === 'run-workspace' && renderPage()}
      </div>
    </div>
  );
};

export default App;
