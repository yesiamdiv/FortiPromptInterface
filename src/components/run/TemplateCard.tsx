import React from 'react';
import { RunTemplate, ComponentLabel } from '../../types';

interface TemplateCardProps {
  template: RunTemplate;
  componentLabels: Record<string, ComponentLabel>;
  onSelectTemplate?: (template: RunTemplate) => void; // Optional if just for display
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, componentLabels, onSelectTemplate }) => {
  return (
    <div
      className="bg-slate-900 border border-slate-600 rounded-lg p-4 hover:border-slate-500 cursor-pointer"
      onClick={() => onSelectTemplate && onSelectTemplate(template)}
    >
      <h4 className="font-semibold mb-2">{template.name}</h4>
      <p className="text-sm text-slate-400 mb-3">{template.description}</p>
      <div className="flex flex-wrap gap-2">
        {template.components.map((comp) => {
          const label = componentLabels[comp];
          if (!label) return null;
          return (
            <span
              key={comp}
              className={`text-xs px-2 py-1 rounded bg-${label.color}-900/30 text-${label.color}-400 border border-${label.color}-700`}
            >
              {label.name}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export default TemplateCard;