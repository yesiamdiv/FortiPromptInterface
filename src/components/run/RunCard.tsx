import React from 'react';
import { Run, ComponentLabel } from '../../types';

interface RunCardProps {
  run: Run;
  componentLabels: Record<string, ComponentLabel>;
}

const RunCard: React.FC<RunCardProps> = ({ run, componentLabels }) => {
  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden hover:border-slate-600 transition-colors">
      {/* run Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold">{run.name}</h3>
              <span
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
                  run.status === 'running'
                    ? 'bg-green-900/30 text-green-400 border border-green-700'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {run.status}
              </span>
            </div>
            <p className="text-sm text-slate-400">{run.description}</p>
          </div>
        </div>

        {/* Components */}
        <div className="flex flex-wrap gap-2 mb-3">
          {run.components.map((comp) => {
            const label = componentLabels[comp];
            if (!label) return null; // Handle cases where component type might not be in labels
            return (
              <span
                key={comp}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded bg-${label.color}-900/30 text-${label.color}-400 border border-${label.color}-700`}
              >
                {label.name}
              </span>
            );
          })}
        </div>

        {/* Metadata */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Created: {run.created}</span>
          <span>Last active: {run.lastActive}</span>
        </div>
      </div>

      {/* run Actions */}
      <div className="p-4 bg-slate-900/50 flex items-center justify-between">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
        >
          Open run
        </button>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-700 rounded" title="Edit">
          </button>
          <button className="p-2 hover:bg-slate-700 rounded" title="Export">
          </button>
          <button className="p-2 hover:bg-slate-700 rounded text-red-400" title="Delete">
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunCard;