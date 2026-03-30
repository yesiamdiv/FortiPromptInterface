import React, { useState } from 'react';
import { X } from 'lucide-react';
import { ComponentLabel, ComponentType } from '../../types';

interface CreateRunModalProps {
  onClose: () => void;
  onCreateRun: (name: string, description: string, components: ComponentType[]) => void;
  componentLabels: Record<ComponentType, ComponentLabel>;
}

const CreateRunModal: React.FC<CreateRunModalProps> = ({ onClose, onCreateRun, componentLabels }) => {
  const [runName, setRunName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedComponents, setSelectedComponents] = useState<ComponentType[]>([]);

  const handleComponentChange = (componentKey: ComponentType, isChecked: boolean) => {
    setSelectedComponents(prev =>
      isChecked ? [...prev, componentKey] : prev.filter(c => c !== componentKey)
    );
  };

  const handleSubmit = () => {
    if (runName && selectedComponents.length > 0) {
      onCreateRun(runName, description, selectedComponents);
      onClose();
    } else {
      alert('Please fill in the run name and select at least one component.');
    }
  };

  return (
    <>
      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.15s ease-out;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-content {
          background: #fff;
          border-radius: 12px;
          max-width: 560px;
          width: 100%;
          margin: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.2s ease-out;
        }

        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 24px 20px;
          border-bottom: 1px solid #F0EDE6;
        }

        .modal-title {
          font-size: 20px;
          font-weight: 600;
          letter-spacing: -0.5px;
        }

        .modal-close {
          padding: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          color: #888;
          transition: all 0.15s;
        }

        .modal-close:hover {
          background: #F0EDE6;
          color: #1A1A1A;
        }

        .modal-body {
          padding: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group:last-child {
          margin-bottom: 0;
        }

        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 500;
          color: #888;
          letter-spacing: 0.3px;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .form-input {
          width: 100%;
          height: 40px;
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          padding: 0 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s;
        }

        .form-input:focus {
          border-color: #1A1A1A;
        }

        .form-textarea {
          width: 100%;
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          padding: 12px;
          font-size: 14px;
          font-family: 'DM Sans', sans-serif;
          color: #1A1A1A;
          outline: none;
          transition: border-color 0.15s;
          resize: vertical;
          min-height: 72px;
        }

        .form-textarea:focus {
          border-color: #1A1A1A;
        }

        .components-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .component-option {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .component-option:hover {
          border-color: #D4D2CC;
        }

        .component-option.selected {
          border-color: #1A1A1A;
          background: #fff;
        }

        .component-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .component-icon {
          flex-shrink: 0;
        }

        .component-name {
          font-size: 13px;
          font-weight: 500;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding: 20px 24px 24px;
          border-top: 1px solid #F0EDE6;
        }

        .modal-btn {
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }

        .modal-btn-cancel {
          background: #F0EDE6;
          color: #555;
        }

        .modal-btn-cancel:hover {
          background: #E8E6E0;
        }

        .modal-btn-create {
          background: #1A1A1A;
          color: #fff;
        }

        .modal-btn-create:hover {
          background: #333;
        }

        .modal-btn-create:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">Create New Run</h2>
            <button className="modal-close" onClick={onClose}>
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Run Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Production RAG Security Test"
                value={runName}
                onChange={(e) => setRunName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                placeholder="Describe the purpose of this testing run..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Select Components</label>
              <div className="components-grid">
                {(Object.entries(componentLabels) as [ComponentType, ComponentLabel][]).map(([key, label]) => {
                  const Icon = label.icon;
                  const isSelected = selectedComponents.includes(key);
                  
                  return (
                    <label
                      key={key}
                      className={`component-option ${isSelected ? 'selected' : ''}`}
                    >
                      <input
                        type="checkbox"
                        className="component-checkbox"
                        checked={isSelected}
                        onChange={(e) => handleComponentChange(key, e.target.checked)}
                      />
                      <Icon className="component-icon" size={18} style={{ color: label.color }} />
                      <span className="component-name">{label.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button className="modal-btn modal-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="modal-btn modal-btn-create"
              onClick={handleSubmit}
              disabled={!runName || selectedComponents.length === 0}
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
