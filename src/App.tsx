import React from 'react';

const App: React.FC = () => {

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* <Shield className="w-8 h-8 text-red-500" /> */}
            <div>
              <h1 className="text-2xl font-bold">FortiPrompt</h1>
              <p className="text-sm text-slate-400">Red Team Security Testing Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              //onClick={handleBackToRuns}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm"
            >
              ← Back to Runs
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
              {/* <Settings className="w-4 h-4" /> */}
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs (only show when in run) */}
      {/* Main Content */}
      <div className="p-6">
      </div>
    </div>
  );
};

export default App;
