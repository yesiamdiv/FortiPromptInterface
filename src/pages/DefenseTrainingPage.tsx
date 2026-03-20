import React from 'react';
import BackendConfigForm from '../components/common/BackendConfigForm';

const DefenseTrainingPage: React.FC = () => {
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
        <h2 className="text-2xl font-bold">Defense Model Training</h2>
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
                  step="0.01"
                  className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
                />
              </div>
            </div>
          </div>

          {/* Training Progress */}
          <div className="space-y-4">
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefenseTrainingPage;