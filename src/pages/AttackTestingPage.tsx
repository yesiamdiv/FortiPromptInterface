import React from 'react';
import BackendConfigForm from '../components/common/BackendConfigForm';
// import { useAppStore } from '../store/appStore';

const AttackTestingPage: React.FC = () => {
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
        <h2 className="text-2xl font-bold">Attack Configuration</h2>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackTestingPage;