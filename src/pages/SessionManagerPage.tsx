import React from 'react';
import { Plus, Upload, Copy, Zap, Shield, Brain, Database } from 'lucide-react';
import { Run, RunTemplate, ComponentLabel, ComponentType } from '../types';
import TemplateCard from '../components/session/TemplateCard';
import CreateRunModal from '../components/session/CreateSessionModal';

interface RunManagerPageProps {
  onOpenRun: (run: Run) => void;
}

const RunManagerPage: React.FC<RunManagerPageProps> = ({ onOpenRun }) => {
  const [showCreateModal, setShowCreateModal] = React.useState(false);
  const [showTemplates, setShowTemplates] = React.useState(false);

  const templates: RunTemplate[] = [
    {
      name: 'Full Security Pipeline',
      description: 'Complete testing environment',
      components: ['attack-testing', 'defense-testing'],
    },
    {
      name: 'Attack Development',
      description: 'Focus on developing attack strategies',
      components: ['attack-testing'],
    },
    {
      name: 'Defense Optimization',
      description: 'Improve defense mechanisms',
      components: ['defense-testing'],
    },
    {
      name: 'Quick Testing',
      description: 'Simple attack vs defense test',
      components: ['attack-testing', 'defense-testing'],
    },
  ];

  const componentLabels = {
    'attack-testing': { name: 'Attack Testing', icon: Zap, color: 'red' },
    'defense-testing': { name: 'Defense Testing', icon: Shield, color: 'blue' },
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold mb-2">Security Testing Runs</h2>
          <p className="text-slate-400">
            Create and manage isolated testing environments
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowTemplates(!showTemplates)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded"
          >
            <Copy className="w-4 h-4" />
            Templates
          </button>

          <button className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded">
            <Upload className="w-4 h-4" />
            Import
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded"
          >
            <Plus className="w-4 h-4" />
            New Run
          </button>
        </div>
      </div>

      {/* Templates Section */}
      {showTemplates && (
        <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <h3 className="text-xl font-semibold mb-4">Run Templates</h3>

          <div className="grid grid-cols-2 gap-4">
            {templates.map((template, idx) => (
              <div
                key={idx}
                className="bg-slate-900 border border-slate-600 rounded-lg p-4 hover:border-slate-500 cursor-pointer"
              >
                <h4 className="font-semibold mb-2">{template.name}</h4>
                <p className="text-sm text-slate-400 mb-3">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {template.components.map((comp) => {
                    const label = componentLabels[comp];
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
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Runs Section */}
      <div className="grid grid-cols-2 gap-6">
        {/* Runs will go here */}
      </div>

      {/* Create Run Modal */}
      {/* {showCreateModal && (
        // <CreateRunModal
        //   onClose={() => setShowCreateModal(false)}
        //   onCreateRun={handleCreateRun}
        //   componentLabels={componentLabels}
        // />
      )} */}
    </div>
  );
};

export default RunManagerPage;