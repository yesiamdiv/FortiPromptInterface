import React, { useState } from 'react';
import BackendConfigForm from '../components/common/BackendConfigForm';

const DefenseTrainingPage: React.FC = () => {
  const [trainingActive, setTrainingActive] = useState(false);

  return (
    <div className="space-y-6">
      {/* Backend Configuration */}
      <BackendConfigForm
        title="Defense Training Backend"
        buttonText="Connect to Backend"
        buttonColorClass="green-400"
        connectionTypeOptions={['Google Colab', 'AWS SageMaker', 'Local Server', 'Custom Backend']}
      />

      {/* Training Configuration */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Defense Model Training</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setTrainingActive(!trainingActive)}
              className={`px-4 py-2 rounded ${
                trainingActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
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
          {/* Configuration */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Defense Strategy Type</label>
              <select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2">
                <option>Multi-layer Pipeline</option>
                <option>Semantic Analysis</option>
                <option>Pattern Matching</option>
                <option>ML-based Detection</option>
                <option>Hybrid Approach</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Attack Dataset (for training)</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Path or URL to attack samples"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-sm">
                    Upload Dataset
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
                  defaultValue="20"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Validation Split</label>
                <input
                  type="number"
                  defaultValue="0.2"
                  step="0.05"
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
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">False Positive Penalty Weight</label>
              <input type="range" min="0" max="1" step="0.1" defaultValue="0.3" className="w-full" />
              <div className="text-sm text-slate-400 mt-1">0.3</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Detection Threshold</label>
              <input type="range" min="0" max="1" step="0.05" defaultValue="0.75" className="w-full" />
              <div className="text-sm text-slate-400 mt-1">0.75</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Early Stopping Patience</label>
              <input
                type="number"
                defaultValue="5"
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
              />
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-4">
            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Defense Performance</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-400">True Positives:</span>
                  <div className="text-2xl font-bold text-green-400">892</div>
                </div>
                <div>
                  <span className="text-slate-400">False Positives:</span>
                  <div className="text-2xl font-bold text-yellow-400">34</div>
                </div>
                <div>
                  <span className="text-slate-400">True Negatives:</span>
                  <div className="text-2xl font-bold text-green-400">1456</div>
                </div>
                <div>
                  <span className="text-slate-400">False Negatives:</span>
                  <div className="text-2xl font-bold text-red-400">12</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Detection Rates</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Accuracy:</span>
                  <span className="font-mono">97.8%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Precision:</span>
                  <span className="font-mono">96.3%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Recall:</span>
                  <span className="font-mono">98.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">F1 Score:</span>
                  <span className="font-mono">97.5%</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Training Progress</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Epoch 8/20</span>
                    <span>40%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '40%' }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400">Val Loss:</span>
                    <span className="ml-2 font-mono">0.156</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Val Accuracy:</span>
                    <span className="ml-2 font-mono">97.8%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Attack Type Detection</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Prompt Injection:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '98%' }}></div>
                    </div>
                    <span className="font-mono w-12 text-right">98%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Jailbreak:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                    <span className="font-mono w-12 text-right">95%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Context Manipulation:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                    </div>
                    <span className="font-mono w-12 text-right">89%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">RAG Poisoning:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-slate-700 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: '76%' }}></div>
                    </div>
                    <span className="font-mono w-12 text-right">76%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefenseTrainingPage;