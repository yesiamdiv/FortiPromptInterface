import React from 'react';
import { AttackPrompt } from '../types';
import BackendConfigForm from '../components/common/BackendConfigForm';
import { useAppStore } from '../store/appStore';

const AttackTestingPage: React.FC = () => {
  const { attackRunning, setAttackRunning, attackPrompts, fetchAttackPrompts, activeRun, expandedPrompt, setExpandedPrompt } = useAppStore((state) => ({
    attackRunning: state.attackRunning,
    setAttackRunning: state.setAttackRunning,
    attackPrompts: state.attackPrompts,
    fetchAttackPrompts: state.fetchAttackPrompts,
    setExpandedPrompt: state.setExpandedPrompt,
  }));

  React.useEffect(() => {
    // Assuming activeRun is available and has an id
    if (activeRun?.id) {
      fetchAttackPrompts(activeRun.id);
    }
  }, [fetchAttackPrompts, activeRun?.id]);

  return (
    <div className="space-y-6">
      {/* Backend Configuration */}
      <BackendConfigForm
        title="Attacker Backend Connection"
        buttonText="Test Connection"
        buttonColorClass="red-400"
        connectionTypeOptions={['Google Colab', 'External API', 'Local Server', 'Cloud Function']}
        modelOptions={['GPT-4o-mini', 'Claude-3.5-Haiku', 'Llama-3.1-8B', 'Custom Model']}
      />

      {/* Attack Configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Attack Configuration</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setAttackRunning(!attackRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                attackRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              {attackRunning ? 'Stop' : 'Start'} Attack
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Attack Type</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
                <option>Direct Injection</option>
                <option>Indirect RAG Poisoning</option>
                <option>Jailbreak</option>
                <option>Context Manipulation</option>
                <option>Multi-turn Chain</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target URL/API Endpoint</label>
              <input
                type="text"
                placeholder="https://api.target.com/chat"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attack Rate (req/sec)</label>
              <input type="range" min="0.1" max="10" step="0.1" defaultValue="1" className="w-full" />
              <div className="text-sm text-slate-400 mt-1">1.0 req/s</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Max Iterations</label>
              <input type="number" defaultValue="100" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Success Threshold</label>
              <input type="range" min="0" max="1" step="0.01" defaultValue="0.7" className="w-full" />
              <div className="text-sm text-slate-400 mt-1">0.70</div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Initial Attack Prompt</label>
              <textarea
                placeholder="Enter your initial attack prompt..."
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attack Scenario</label>
              <textarea
                placeholder="Describe the attack scenario..."
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Target Information</label>
              <textarea
                placeholder="What are you trying to extract?"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 h-24"
              />
            </div>
          </div>
        </div>

        {attackRunning && (
          <div className="mt-6 bg-red-900/20 border border-red-700 rounded p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Attack in Progress</span>
              <span className="text-sm">Iteration 34/100</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div className="bg-red-500 h-2 rounded-full" style={{ width: '34%' }}></div>
            </div>
          </div>
        )}
      </div>

      {/* Attack Prompt Viewer */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Generated Attack Prompts</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {attackPrompts.map(attack => (
            <div key={attack.id} className="bg-slate-900 border border-slate-600 rounded overflow-hidden">
              {/* Collapsed Header */}
              <button
                onClick={() => setExpandedPrompt(expandedPrompt === attack.id ? null : attack.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    attack.status === 'success' ? 'bg-green-900/50 text-green-400' :
                    attack.status === 'partial' ? 'bg-yellow-900/50 text-yellow-400' :
                    'bg-red-900/50 text-red-400'
                  }`}>
                    {attack.status.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium">
                    {attack.type === 'chain' ? `Chain Attack (${attack.prompts.length} turns)` : 'Single Attack'}
                  </span>
                  <span className="text-xs text-slate-500">{attack.timestamp}</span>
                </div>
                <span className="text-slate-400">
                  {expandedPrompt === attack.id ? '▼' : '▶'}
                </span>
              </button>

              {/* Expanded Content */}
              {expandedPrompt === attack.id && (
                <div className="px-4 py-3 border-t border-slate-700 bg-slate-950">
                  {attack.type === 'chain' ? (
                    <div className="space-y-3">
                      {attack.prompts.map((prompt, idx) => (
                        <div key={idx} className="border-l-2 border-red-500 pl-3">
                          <div className="text-xs text-slate-500 mb-1">Turn {idx + 1}</div>
                          <div className="text-sm text-slate-200">{prompt}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-200">{attack.prompts[0]}</div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttackTestingPage;