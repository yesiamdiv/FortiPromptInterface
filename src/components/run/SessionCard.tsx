import React from 'react';
import { Run, ComponentLabel, ComponentType } from '../../types';
import { Play, Pause, Trash2, Edit } from 'lucide-react';

interface RunCardProps {
  run: Run;
  componentLabels: Record<ComponentType, ComponentLabel>;
  onOpenRun: (run: Run) => void;
  onDeleteRun?: (runId: string) => void;
}

// Static color maps — avoids Tailwind dynamic-class purging issues
const COMP_STYLES: Record<ComponentType, { bg: string; color: string; border: string }> = {
  attack:  { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  defense: { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  manual:  { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  idle:      { bg: '#F0EDE6', color: '#888'    },
  running:   { bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { bg: '#F0FDF4', color: '#15803D' },
  failed:    { bg: '#FEF2F2', color: '#DC2626' },
  stopped:    { bg: '#FEF9C3', color: '#92400E' },
};

const RunCard: React.FC<RunCardProps> = ({ run, componentLabels, onOpenRun, onDeleteRun }) => {
  const statusStyle = STATUS_STYLES[run.status] ?? STATUS_STYLES.idle;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .rc-card {
          background: #fff;
          border: 1px solid #E8E6E0;
          border-radius: 10px;
          overflow: hidden;
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
        }

        .rc-card:hover {
          border-color: #D4D2CC;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .rc-header {
          padding: 20px;
          border-bottom: 1px solid #F0EDE6;
        }

        .rc-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .rc-name {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .rc-desc {
          font-size: 13px;
          color: #888;
          line-height: 1.45;
        }

        .rc-status {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 12px;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .rc-components {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 10px;
        }

        .rc-comp-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          font-weight: 500;
          padding: 3px 8px;
          border-radius: 12px;
          border: 1px solid;
        }

        .rc-meta {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #AAA;
          font-family: 'DM Mono', monospace;
        }

        .rc-footer {
          padding: 14px 20px;
          background: #FAFAF9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .rc-open-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: #1A1A1A;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          border-radius: 7px;
          border: none;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: background 0.15s;
        }

        .rc-open-btn:hover {
          background: #333;
        }

        .rc-actions {
          display: flex;
          gap: 4px;
        }

        .rc-icon-btn {
          padding: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          color: #888;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .rc-icon-btn:hover {
          background: #F0EDE6;
          color: #1A1A1A;
        }

        .rc-icon-btn.delete:hover {
          background: #FEF2F2;
          color: #DC2626;
        }
      `}</style>

      <div className="rc-card">
        {/* Header */}
        <div className="rc-header">
          <div className="rc-top">
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="rc-name">{run.name}</div>
              {run.description && (
                <div className="rc-desc">{run.description}</div>
              )}
            </div>
            <span
              className="rc-status"
              style={{ background: statusStyle.bg, color: statusStyle.color }}
            >
              {run.status === 'running' ? <Play size={9} /> : <Pause size={9} />}
              {run.status}
            </span>
          </div>

          {/* Components */}
          <div className="rc-components">
            {run.components.map(comp => {
              const label = componentLabels[comp];
              if (!label) return null;
              const Icon  = label.icon;
              const style = COMP_STYLES[comp];
              return (
                <span
                  key={comp}
                  className="rc-comp-tag"
                  style={{ background: style.bg, color: style.color, borderColor: style.border }}
                >
                  <Icon size={9} />
                  {label.name}
                </span>
              );
            })}
          </div>

          {/* Metadata */}
          <div className="rc-meta">
            <span>Created: {new Date(run.createdAt).toLocaleDateString()}</span>
            <span>Updated: {new Date(run.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="rc-footer">
          <button className="rc-open-btn" onClick={() => onOpenRun(run)}>
            Open Run
          </button>
          <div className="rc-actions">
            <button className="rc-icon-btn" title="Edit">
              <Edit size={15} />
            </button>
            {onDeleteRun && (
              <button
                className="rc-icon-btn delete"
                title="Delete"
                onClick={() => onDeleteRun(run.runid)}
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RunCard;