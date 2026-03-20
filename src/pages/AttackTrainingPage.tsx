import React from 'react';
import BackendConfigForm from '../components/common/BackendConfigForm';

const AttackTrainingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Backend Connection Configuration */}
      <BackendConfigForm
        title="Training Backend Connection"
        buttonText="Connect to Training Backend"
        buttonColorClass="purple-400"
        connectionTypeOptions={['Google Colab', 'AWS SageMaker', 'Local GPU Server', 'Azure ML', 'Hugging Face Spaces']}
        additionalFields={
          <>
            <div>
              <label className="block text-sm font-medium mb-2">API Endpoint (if applicable)</label>
              <input
                type="text"
                placeholder="https://your-training-api.com/train"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Auth Token (Optional)</label>
              <input
                type="password"
                placeholder="Enter auth token"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              />
            </div>
          </>
        }
      />

      {/* Training Configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold">Attack Model Training</h2>
        <div className="grid grid-cols-2 gap-6">
          {/* Training Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Attack Strategy</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
                <option>Prompt Injection</option>
                <option>Jailbreak Generation</option>
                <option>Context Manipulation</option>
                <option>Multi-turn Exploitation</option>
                <option>Mixed Strategy</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Base Model Selection</label>
              <div className="space-y-2">
                <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
                  <option>GPT-4o-mini</option>
                  <option>Claude-3.5-Haiku</option>
                  <option>Llama-3.1-8B</option>
                  <option>Mistral-7B</option>
                </select>
                <button className="w-full px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                  + Add Custom Model
                </button>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Dataset</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
                <option>OWASP Top 10</option>
                <option>PromptBench</option>
                <option>Custom Dataset</option>
              </select>
            </div>

            <div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackTrainingPage;