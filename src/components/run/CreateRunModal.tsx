import React from 'react';
import { ComponentLabel, ComponentType } from '../../types';

interface CreateRunModalProps {
  componentLabels: Record<ComponentType, ComponentLabel>;
}

const CreateRunModal: React.FC<CreateRunModalProps> = ({ componentLabels }) =>{
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700">
        <h3 className="text-2xl font-bold mb-4">Create New Run</h3>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Run Name</label>
            <input
              type="text"
              placeholder="e.g., RAG Security Test"
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              placeholder="Describe the purpose of this run..."
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 h-20"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-3">Select Components</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(componentLabels).map(([key, label]) => {
                const Icon = label.icon;
                return (
                  <label
                    key={key}
                    className="flex items-center gap-3 p-3 bg-slate-900 border border-slate-600 rounded cursor-pointer hover:border-slate-500"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                    />
                    <Icon className={`w-5 h-5 text-${label.color}-400`} />
                    <span>{label.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
          >
            Cancel
          </button>
          <button className="px-4 py-2 bg-red-600 rounded">
            Create Run
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRunModal;