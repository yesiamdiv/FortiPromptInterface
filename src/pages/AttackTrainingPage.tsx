import React, { useState } from 'react';
import BackendConfigForm from '../components/common/BackendConfigForm';

const AttackTrainingPage: React.FC = () => {
  const [trainingActive, setTrainingActive] = useState(false);
  const [consoleOutput] = useState([
    '[INFO] Initializing training environment...',
    '[INFO] Loading base model: GPT-4o-mini',
    '[INFO] Dataset loaded: 1,250 attack samples',
    '[TRAIN] Epoch 1/10 - Loss: 0.456, Success Rate: 34.2%',
    '[TRAIN] Epoch 2/10 - Loss: 0.389, Success Rate: 45.8%',
  ]);

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Attack Model Training</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTrainingActive(!trainingActive)}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                trainingActive ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {trainingActive ? 'Stop' : 'Start'} Training
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
              Save Model
            </button>
          </div>
        </div>

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

            <div>
              <label className="block text-sm font-medium mb-2">Training Dataset</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Path or URL to dataset"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                    Upload File
                  </button>
                  <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                    Link URL
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Learning Rate</label>
                <input
                  type="number"
                  defaultValue="0.0001"
                  step="0.0001"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Batch Size</label>
                <input
                  type="number"
                  defaultValue="32"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-2">Epochs</label>
                <input
                  type="number"
                  defaultValue="10"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Warmup Steps</label>
                <input
                  type="number"
                  defaultValue="500"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Optimizer</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
                <option>AdamW</option>
                <option>Adam</option>
                <option>SGD</option>
                <option>RMSprop</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Gradient Accumulation Steps</label>
              <input
                type="number"
                defaultValue="4"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Success Reward Weight</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.8" className="w-full" />
              <div className="text-sm text-slate-400 mt-1">0.8</div>
            </div>
          </div>

          {/* Training Metrics & Console */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Training Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Epoch 3/10</span>
                    <span>30%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Loss:</span>
                    <span className="ml-2 font-mono">0.234</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Success Rate:</span>
                    <span className="ml-2 font-mono">67.3%</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Learning Rate:</span>
                    <span className="ml-2 font-mono">0.0001</span>
                  </div>
                  <div>
                    <span className="text-slate-400">GPU Usage:</span>
                    <span className="ml-2 font-mono">87%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Console Output</h3>
              <div className="bg-black rounded p-3 h-48 overflow-y-auto font-mono text-xs">
                {consoleOutput.map((line, idx) => (
                  <div key={idx} className={`mb-1 ${
                    line.includes('[ERROR]') ? 'text-red-400' :
                    line.includes('[WARN]') ? 'text-yellow-400' :
                    line.includes('[SUCCESS]') ? 'text-green-400' :
                    'text-slate-300'
                  }`}>
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Model Improvement</h3>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Success Rate:</span>
                  <span>23.4%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Success Rate:</span>
                  <span className="text-green-400">67.3%</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-400">Improvement:</span>
                  <span className="text-green-400">+43.9%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Recent Evaluations</h3>
              <div className="space-y-2 text-sm font-mono max-h-32 overflow-y-auto">
                <div className="text-green-400">✓ Bypass successful (reward: +0.9)</div>
                <div className="text-red-400">✗ Blocked by filter (reward: -0.2)</div>
                <div className="text-green-400">✓ Information leak (reward: +0.85)</div>
                <div className="text-yellow-400">~ Partial success (reward: +0.4)</div>
                <div className="text-green-400">✓ Context manipulation (reward: +0.75)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttackTrainingPage;