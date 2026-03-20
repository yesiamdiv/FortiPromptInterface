import React from 'react';
import { DefenseLog } from '../types';
import BackendConfigForm from '../components/common/BackendConfigForm';
// import { useAppStore } from '../store/appStore';

const DefenseTestingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Backend Configuration */}
      <BackendConfigForm
        title="Defense Backend Connection"
        buttonText="Connect to Defense System"
        buttonColorClass="blue-400"
        connectionTypeOptions={['External API', 'Local Server', 'Cloud Function']}
        additionalFields={
          <div>
            <label className="block text-sm font-medium mb-2">WebSocket URL (for live logs)</label>
            <input
              type="text"
              placeholder="wss://defense-backend.com/ws"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
            />
          </div>
        }
      />

      {/* Defense Dashboard */}
      <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
        <h2 className="text-2xl font-bold">Defense Monitoring</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* Defense Layers */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold mb-4">Pipeline Layers</h3>
            <div className="space-y-3">
              {['Input Sanitizer', 'Semantic Filter', 'Regex Scanner', 'Context Validator', 'Output Filter'].map((layer, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-600 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-sm">{layer}</span>
                    </div>
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Results & Statistics */}
          <div className="col-span-2 space-y-4">
            {/* Statistics */}
            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Session Statistics</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-2xl font-bold text-green-400">892</div>
                  <div className="text-xs text-slate-400">Blocked Attacks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-400">12</div>
                  <div className="text-xs text-slate-400">Breached Attempts</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">904</div>
                  <div className="text-xs text-slate-400">Total Requests</div>
                </div>
              </div>
            </div>

            {/* Live Logs */}
            <div className="bg-slate-900 rounded p-4">
              <h3 className="font-semibold mb-3">Live Session Logs</h3>
              <div className="overflow-auto max-h-96">
                {/* Logs will go here */}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefenseTestingPage;