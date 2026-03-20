import React from 'react';

// // Mock RunManager component (as provided in the original App.tsx)
// const MockRunManager: React.FC<{ onOpenRun: (run: Run) => void }> = ({ onOpenRun }) => {
//   // Mock runs data
//   const runs: Run[] = [
//     {
//       id: '1',
//       name: "RAG Jailbreak Testing",
//       description: "Full pipeline test for RAG security vulnerabilities",
//       components: ['attack-testing', 'defense-testing'],
//       status: 'running',
//       lastActive: '2 hours ago',
//       created: 'Jan 20, 2026'
//     },
//     // {
//     //   id: '2',
//     //   name: "Red Team Model Training",
//     //   description: "Training attack generation model",
//     //   components: ['attack-training'], // This component will be filtered out
//     //   status: 'idle',
//     //   lastActive: '1 day ago',
//     //   created: 'Jan 18, 2026'
//     // },
//     // {
//     //   id: '3',
//     //   name: "Comprehensive Security Suite",
//     //   description: "Full attack and defense testing with model training capabilities",
//     //   components: ['attack-testing', 'defense-testing', 'attack-training', 'defense-training'], // These will be filtered out
//     //   status: 'idle',
//     //   lastActive: 'Just now',
//     //   created: 'Jan 21, 2026'
//     // }
//   ];

//   // Filter runs to only include those with components that are present in mockComponentLabels
//   const filteredRuns = runs.filter(run =>
//     run.components.some(comp => comp in mockComponentLabels)
//   );

//   return (
//     <div className="space-y-6">
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-3xl font-bold mb-2">Security Testing Runs</h2>
//           <p className="text-slate-400">Create and manage isolated testing environments</p>
//         </div>
//         <div className="flex gap-3">
//           <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
//             <Settings className="w-4 h-4" />
//             Settings
//           </button>
//         </div>
//       </div>
//       <div className="grid grid-cols-2 gap-6">
//         {filteredRuns.map(run => (
//           <div key={run.id} className="bg-slate-800 rounded-lg p-6 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer" onClick={() => onOpenRun(run)}>
//             <div className="flex items-center justify-between mb-4">
//               <h3 className="text-xl font-semibold">{run.name}</h3>
//               <span className={`px-2 py-1 rounded text-xs font-semibold ${run.status === 'running' ? 'bg-green-900/50 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
//                 {run.status.toUpperCase()}
//               </span>
//             </div>
//             <p className="text-sm text-slate-400 mb-4">{run.description}</p>
//             <div className="flex items-center gap-3 text-xs text-slate-500">
//               <span>Last Active: {run.lastActive}</span>
//               <span>Created: {run.created}</span>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

const App: React.FC = () => {

  // Define the handler function here
  // const handleOpenRun = (run: Run) => {
  // };

  const handleBackToRuns = () => {
  };

  const renderPage = () => {
    return null;
  };

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
