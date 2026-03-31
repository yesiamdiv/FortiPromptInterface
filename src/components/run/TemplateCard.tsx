import React from 'react';
import { ComponentLabel, ComponentType } from '../../types';

// Local template shape — RunTemplate is not in the shared types
export interface RunTemplate {
  name: string;
  description: string;
  components: ComponentType[];
}

interface TemplateCardProps {
  template: RunTemplate;
  componentLabels: Record<ComponentType, ComponentLabel>;
  onSelectTemplate?: (template: RunTemplate) => void;
}

// Static color maps — avoids Tailwind dynamic-class purging issues
const COMP_STYLES: Record<ComponentType, { bg: string; color: string; border: string }> = {
  attack:  { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  defense: { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
};

const TemplateCard: React.FC<TemplateCardProps> = ({ template, componentLabels, onSelectTemplate }) => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .tc-card {
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
        }

        .tc-card:hover {
          border-color: #1A1A1A;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
          background: #fff;
        }

        .tc-name {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .tc-desc {
          font-size: 12px;
          color: #888;
          line-height: 1.5;
          margin-bottom: 12px;
        }

        .tc-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tc-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid;
        }
      `}</style>

      <div
        className="tc-card"
        onClick={() => onSelectTemplate?.(template)}
      >
        <div className="tc-name">{template.name}</div>
        <div className="tc-desc">{template.description}</div>
        <div className="tc-tags">
          {template.components.map(comp => {
            const label = componentLabels[comp];
            if (!label) return null;
            const Icon  = label.icon;
            const style = COMP_STYLES[comp];
            return (
              <span
                key={comp}
                className="tc-tag"
                style={{ background: style.bg, color: style.color, borderColor: style.border }}
              >
                <Icon size={9} />
                {label.name}
              </span>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default TemplateCard;