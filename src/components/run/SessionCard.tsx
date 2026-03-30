import React from 'react';
import { Run, ComponentLabel } from '../../types';
import { Play, Pause, Download, Trash2, Edit } from 'lucide-react';
import { exportRun } from '../../utils/run'; // Assuming you'll create this utility

interface RunCardProps {
  run: Run;
  componentLabels: Record<string, ComponentLabel>;
  onOpenRun: (run: Run) => void;
}

const RunCard: React.FC<RunCardProps> = ({ run, componentLabels, onOpenRun }) => {
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
                {run.status === 'running' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
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
            const Icon = label.icon;
            return (
              <span
                key={comp}
                className={`flex items-center gap-1 text-xs px-2 py-1 rounded bg-${label.color}-900/30 text-${label.color}-400 border border-${label.color}-700`}
              >
                <Icon className="w-3 h-3" />
                {label.name}
              </span>
            );
          })}
        </div>

        {/* Metadata */}
        <div className="flex gap-4 text-xs text-slate-500">
          <span>Created: {run.createdAt}</span>
          <span>Last active: {run.updatedAt}</span>
        </div>
      </div>

      {/* run Actions */}
      <div className="p-4 bg-slate-900/50 flex items-center justify-between">
        <button
          onClick={() => onOpenRun(run)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium"
        >
          Open run
        </button>
        <div className="flex gap-2">
          <button className="p-2 hover:bg-slate-700 rounded" title="Edit">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={() => exportRun(run)} className="p-2 hover:bg-slate-700 rounded" title="Export">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 hover:bg-slate-700 rounded text-red-400" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RunCard;
