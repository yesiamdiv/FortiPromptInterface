import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ComponentLabel, ComponentType } from '../../types';

interface CreateRunModalProps {
  onClose: () => void;
  onCreateRun: (name: string, description: string, components: ComponentType[]) => void;
  componentLabels: Record<ComponentType, ComponentLabel>;
}

const CreateRunModal: React.FC<CreateRunModalProps> = ({ onClose, onCreateRun, componentLabels }) => {
  const [runName, setRunName]                       = useState('');
  const [description, setDescription]               = useState('');
  const [selectedComponents, setSelectedComponents] = useState<ComponentType[]>([]);

  const handleComponentChange = (componentKey: ComponentType, isChecked: boolean) => {
    setSelectedComponents(prev =>
      isChecked ? [...prev, componentKey] : prev.filter(c => c !== componentKey)
    );
  };

  const handleSubmit = () => {
    if (runName.trim() && selectedComponents.length > 0) {
      onCreateRun(runName.trim(), description.trim(), selectedComponents);
      onClose();
    }
  };

  const isValid = runName.trim().length > 0 && selectedComponents.length > 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .crm-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: crm-fadeIn 0.15s ease-out;
        }

        @keyframes crm-fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .crm-modal {
          background: #fff;
          border-radius: 12px;
          max-width: 520px;
          width: calc(100% - 32px);
          box-shadow: 0 20px 48px rgba(0, 0, 0, 0.15);
          font-family: 'DM Sans', sans-serif;
          animation: crm-slideUp 0.2s ease-out;
          overflow: hidden;
        }

        @keyframes crm-slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0);    }
        }

        .crm-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #E8E6E0;
        }

        .crm-title {
          font-size: 18px;
          font-weight: 600;
          letter-spacing: -0.4px;
          color: #1A1A1A;
        }

        .crm-close {
          padding: 5px;
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

        .crm-close:hover {
          background: #F0EDE6;
          color: #1A1A1A;
        }

        .crm-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .crm-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .crm-label {
          font-size: 11px;
          font-weight: 500;
          color: #999;
          letter-spacing: 0.4px;
          text-transform: uppercase;
        }

        .crm-input {
          height: 38px;
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s, background 0.15s;
          width: 100%;
          box-sizing: border-box;
        }

        .crm-input:focus {
          border-color: #1A1A1A;
          background: #fff;
        }

        .crm-textarea {
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 13px;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
          outline: none;
          resize: vertical;
          min-height: 68px;
          transition: border-color 0.15s, background 0.15s;
          width: 100%;
          box-sizing: border-box;
          line-height: 1.55;
        }

        .crm-textarea:focus {
          border-color: #1A1A1A;
          background: #fff;
        }

        .crm-components {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .crm-comp-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          background: #F7F6F3;
          border: 1.5px solid #E8E6E0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
          user-select: none;
        }

        .crm-comp-label:hover {
          border-color: #D4D2CC;
          background: #F0EDE6;
        }

        .crm-comp-label.selected-attack {
          border-color: #FCA5A5;
          background: #FEF2F2;
        }

        .crm-comp-label.selected-defense {
          border-color: #86EFAC;
          background: #F0FDF4;
        }

        .crm-comp-checkbox {
          width: 15px;
          height: 15px;
          cursor: pointer;
          flex-shrink: 0;
          accent-color: #1A1A1A;
        }

        .crm-comp-name {
          font-size: 13px;
          font-weight: 500;
          color: #1A1A1A;
        }

        .crm-footer {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          padding: 16px 24px 20px;
          border-top: 1px solid #E8E6E0;
        }

        .crm-btn {
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .crm-btn-cancel {
          background: #F0EDE6;
          color: #555;
        }

        .crm-btn-cancel:hover {
          background: #E8E6E0;
        }

        .crm-btn-create {
          background: #1A1A1A;
          color: #fff;
        }

        .crm-btn-create:hover:not(:disabled) {
          background: #333;
        }

        .crm-btn-create:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }
      `}</style>

      <div className="crm-overlay" onClick={onClose}>
        <div className="crm-modal" onClick={e => e.stopPropagation()}>

          {/* Header */}
          <div className="crm-header">
            <span className="crm-title">Create New Run</span>
            <button className="crm-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="crm-body">
            <div className="crm-field">
              <label className="crm-label">Run Name *</label>
              <input
                type="text"
                className="crm-input"
                placeholder="e.g. Production RAG Security Test"
                value={runName}
                onChange={e => setRunName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="crm-field">
              <label className="crm-label">Description (optional)</label>
              <textarea
                className="crm-textarea"
                placeholder="Describe the purpose of this testing run…"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="crm-field">
              <label className="crm-label">Components *</label>
              <div className="crm-components">
                {(Object.entries(componentLabels) as [ComponentType, ComponentLabel][]).map(([key, label]) => {
                  const Icon       = label.icon;
                  const isSelected = selectedComponents.includes(key);
                  const selClass   = isSelected
                    ? key === 'attack' ? 'selected-attack' : 'selected-defense'
                    : '';
                  return (
                    <label key={key} className={`crm-comp-label ${selClass}`}>
                      <input
                        type="checkbox"
                        className="crm-comp-checkbox"
                        checked={isSelected}
                        onChange={e => handleComponentChange(key, e.target.checked)}
                      />
                      <Icon size={16} style={{ color: label.color, flexShrink: 0 }} />
                      <span className="crm-comp-name">{label.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="crm-footer">
            <button className="crm-btn crm-btn-cancel" onClick={onClose}>Cancel</button>
            <button
              className="crm-btn crm-btn-create"
              onClick={handleSubmit}
              disabled={!isValid}
            >
              Create Run
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default CreateRunModal;