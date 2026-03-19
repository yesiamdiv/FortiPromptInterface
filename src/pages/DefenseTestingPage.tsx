import React, { useState } from 'react';
import { DefenseLog } from '../types';
import BackendConfigForm from '../components/common/BackendConfigForm';

const DefenseTestingPage: React.FC = () => {
  const [defenseRunning, setDefenseRunning] = useState(false);
  const [logs] = useState<DefenseLog[]>([
    { id: 1, type: 'pass', layer: 'Semantic Filter', prompt: 'Hello, how are you?', result: 'Passed - Normal query', time: '10:23:41' },
    { id: 2, type: 'block', layer: 'Regex Scanner', prompt: 'Ignore previous instructions...', result: 'Blocked - Injection pattern detected', time: '10:23:42' },
    { id: 3, type: 'pass', layer: 'Context Validator', prompt: 'What is 2+2?', result: 'Passed - Valid context', time: '10:23:43' },
  ]);

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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Defense Monitoring</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setDefenseRunning(!defenseRunning)}
              className={`flex items-center gap-2 px-4 py-2 rounded ${
                defenseRunning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {defenseRunning ? 'Stop' : 'Start'} Defense
            </button>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded">
              Export Logs
            </button>
            <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
              Clear All
            </button>
          </div>
        </div>

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
                  <div className="text-2xl font-bold text-blue-400">1456</div>
                  <div className="text-xs text-slate-400">Passed Legitimate</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-400">97.8%</div>
                  <div className="text-xs text-slate-400">Accuracy</div>
                </div>
              </div>
            </div>

            {/* Results Viewer */}
            <div>
              <h3 className="font-semibold mb-3">Attack Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map(log => (
                  <div key={log.id} className={`bg-slate-900 border rounded p-3 ${
                    log.type === 'block' ? 'border-red-700' : 'border-green-700'
                  }`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.type === 'block' ? 'bg-red-900/50 text-red-400' : 'bg-green-900/50 text-green-400'
                        }`}>
                          {log.type.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium">{log.layer}</span>
                      </div>
                      <span className="text-xs text-slate-500">{log.time}</span>
                    </div>
                    <div className="text-sm text-slate-300 mb-1">
                      <span className="text-slate-500">Prompt:</span> {log.prompt}
                    </div>
                    <div className="text-sm text-slate-400">
                      <span className="text-slate-500">Result:</span> {log.result}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data Management */}
        <div className="mt-6 bg-slate-900 rounded p-4">
          <h3 className="font-semibold mb-3">Data Management</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Save Location</label>
              <select className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm">
                <option>Local File</option>
                <option>Database (PostgreSQL)</option>
                <option>Cloud Storage (S3)</option>
                <option>MongoDB</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Database URL/Path</label>
              <input
                type="text"
                placeholder="mongodb://localhost:27017/fortiprompt"
                className="w-full bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                Save Current Session
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DefenseTestingPage;