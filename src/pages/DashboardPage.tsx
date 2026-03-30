import React, { useState, useEffect } from 'react';
import { Plus, Upload, Copy, Play, Pause, Download, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Run, ComponentType } from '../types';
import { useAppStore, componentLabels } from '../store/appStore';
import { fetchRuns, createRun, deleteRun } from '../services/api';
import { exportRun, generateRunId, nowISO } from '../utils/run';
import CreateRunModal from '../components/run/CreateRunModal';

interface DashboardPageProps {
  onOpenRun: (run: Run) => void;
  onBack: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenRun, onBack }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Global store
  const runs = useAppStore(s => s.runs);
  const setRuns = useAppStore(s => s.setRuns);
  const addRun = useAppStore(s => s.addRun);
  const deleteRunFromStore = useAppStore(s => s.deleteRun);

  // Templates
  const templates = [
    {
      name: 'Full Security Pipeline',
      description: 'Complete attack + defense testing environment',
      components: ['attack-testing', 'defense-testing'] as ComponentType[],
    },
    {
      name: 'Attack Development',
      description: 'Focus on developing attack strategies',
      components: ['attack-testing'] as ComponentType[],
    },
    {
      name: 'Defense Optimization',
      description: 'Improve defense mechanisms and guardrails',
      components: ['defense-testing'] as ComponentType[],
    },
  ];

  // Fetch runs on mount
  useEffect(() => {
    loadRuns();
  }, []);

  const loadRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRuns = await fetchRuns();
      setRuns(fetchedRuns);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load runs';
      setError(msg);
      console.error('[Dashboard] Failed to fetch runs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async (name: string, description: string, components: ComponentType[]) => {
    try {
      const newRun: Partial<Run> = {
        name,
        description,
        components,
        status: 'idle',
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };

      const created = await createRun(newRun);
      addRun(created);
      setShowCreateModal(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create run';
      setError(msg);
      console.error('[Dashboard] Failed to create run:', err);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!window.confirm('Are you sure you want to delete this run? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteRun(runId);
      deleteRunFromStore(runId);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete run';
      setError(msg);
      console.error('[Dashboard] Failed to delete run:', err);
    }
  };

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setShowCreateModal(true);
    // Could pre-populate modal with template data
  };

  return (
    <div className="dashboard-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        
        .dashboard-root {
          font-family: 'DM Sans', sans-serif;
          background: #F7F6F3;
          color: #1A1A1A;
          min-height: 100vh;
        }

        .db-nav {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 32px;
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #E8E6E0;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .db-nav-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .db-back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: #888;
          cursor: pointer;
          border: none;
          background: none;
          font-family: inherit;
          transition: color .15s;
        }

        .db-back-btn:hover { color: #1A1A1A; }

        .db-nav-sep {
          width: 1px;
          height: 18px;
          background: #E8E6E0;
        }

        .db-logo {
          font-size: 14px;
          font-weight: 600;
          letter-spacing: -0.3px;
        }

        .db-badge {
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          background: #F0EDE6;
          color: #666;
          padding: 3px 8px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }

        .db-main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
        }

        .db-header {
          margin-bottom: 24px;
        }

        .db-header-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .db-title {
          font-size: 28px;
          font-weight: 600;
          letter-spacing: -0.8px;
        }

        .db-actions {
          display: flex;
          gap: 8px;
        }

        .db-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }

        .db-btn-secondary {
          background: #fff;
          color: #555;
          border: 1px solid #E8E6E0;
        }

        .db-btn-secondary:hover {
          background: #F7F6F3;
          border-color: #D4D2CC;
        }

        .db-btn-primary {
          background: #1A1A1A;
          color: #fff;
        }

        .db-btn-primary:hover {
          background: #333;
        }

        .db-desc {
          font-size: 14px;
          color: #888;
        }

        .db-error {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: #FEF2F2;
          border: 1px solid #FCA5A5;
          border-radius: 8px;
          color: #DC2626;
          font-size: 13px;
          margin-bottom: 16px;
        }

        .db-templates {
          background: #fff;
          border: 1px solid #E8E6E0;
          border-radius: 10px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .db-templates-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .db-templates-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .db-template-card {
          background: #F7F6F3;
          border: 1px solid #E8E6E0;
          border-radius: 8px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.15s;
        }

        .db-template-card:hover {
          border-color: #1A1A1A;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .db-template-name {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .db-template-desc {
          font-size: 12px;
          color: #888;
          margin-bottom: 12px;
        }

        .db-template-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .db-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .db-tag-attack {
          background: #FEF2F2;
          color: #DC2626;
        }

        .db-tag-defense {
          background: #F0FDF4;
          color: #15803D;
        }

        .db-runs-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .db-run-card {
          background: #fff;
          border: 1px solid #E8E6E0;
          border-radius: 10px;
          overflow: hidden;
          transition: all 0.15s;
        }

        .db-run-card:hover {
          border-color: #D4D2CC;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
        }

        .db-run-header {
          padding: 20px;
          border-bottom: 1px solid #F0EDE6;
        }

        .db-run-top {
          display: flex;
          align-items: start;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .db-run-name {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.3px;
          margin-bottom: 4px;
        }

        .db-run-status {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 12px;
          font-weight: 500;
        }

        .db-run-status.idle { background: #F0EDE6; color: #888; }
        .db-run-status.running { background: #DBEAFE; color: #1D4ED8; }
        .db-run-status.completed { background: #F0FDF4; color: #15803D; }
        .db-run-status.failed { background: #FEF2F2; color: #DC2626; }

        .db-run-desc {
          font-size: 13px;
          color: #888;
          margin-bottom: 12px;
        }

        .db-run-components {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }

        .db-run-meta {
          display: flex;
          gap: 16px;
          font-size: 11px;
          color: #AAA;
        }

        .db-run-footer {
          padding: 16px 20px;
          background: #FAFAF9;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .db-run-open-btn {
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
          transition: background 0.15s;
        }

        .db-run-open-btn:hover {
          background: #333;
        }

        .db-run-actions {
          display: flex;
          gap: 6px;
        }

        .db-icon-btn {
          padding: 6px;
          background: transparent;
          border: none;
          cursor: pointer;
          border-radius: 6px;
          color: #888;
          transition: all 0.15s;
        }

        .db-icon-btn:hover {
          background: #F0EDE6;
          color: #1A1A1A;
        }

        .db-icon-btn.delete:hover {
          color: #DC2626;
        }

        .db-empty {
          text-align: center;
          padding: 80px 24px;
          color: #CCC;
        }

        .db-empty-icon {
          margin: 0 auto 16px;
          width: 48px;
          height: 48px;
          color: #E8E6E0;
        }

        .db-empty-text {
          font-size: 15px;
          margin-bottom: 8px;
        }

        .db-empty-sub {
          font-size: 13px;
          color: #BBB;
        }

        .db-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
        }

        .db-spinner {
          width: 32px;
          height: 32px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Nav */}
      <nav className="db-nav">
        <div className="db-nav-left">
          <button className="db-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Home
          </button>
          <div className="db-nav-sep" />
          <span className="db-logo">FortiPrompt</span>
        </div>
        <div>
          <span className="db-badge">v0.5.0</span>
        </div>
      </nav>

      {/* Main Content */}
      <div className="db-main">
        {/* Header */}
        <div className="db-header">
          <div className="db-header-top">
            <h1 className="db-title">Dashboard</h1>
            <div className="db-actions">
              <button 
                className="db-btn db-btn-secondary"
                onClick={() => setShowTemplates(!showTemplates)}
              >
                <Copy size={14} />
                Templates
              </button>
              <button className="db-btn db-btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={14} />
                New Run
              </button>
            </div>
          </div>
          <p className="db-desc">Create and manage isolated testing environments</p>
        </div>

        {/* Error */}
        {error && (
          <div className="db-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Templates */}
        {showTemplates && (
          <div className="db-templates">
            <h3 className="db-templates-title">Run Templates</h3>
            <div className="db-templates-grid">
              {templates.map((template, idx) => (
                <div
                  key={idx}
                  className="db-template-card"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="db-template-name">{template.name}</div>
                  <div className="db-template-desc">{template.description}</div>
                  <div className="db-template-tags">
                    {template.components.map(comp => {
                      const label = componentLabels[comp];
                      return (
                        <span
                          key={comp}
                          className={`db-tag ${comp === 'attack-testing' ? 'db-tag-attack' : 'db-tag-defense'}`}
                        >
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

        {/* Runs */}
        {loading ? (
          <div className="db-loading">
            <svg className="db-spinner" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="12" stroke="#E8E6E0" strokeWidth="2.5"/>
              <path d="M16 4a12 12 0 0 1 12 12" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
        ) : runs.length === 0 ? (
          <div className="db-empty">
            <svg className="db-empty-icon" viewBox="0 0 48 48" fill="none">
              <rect x="8" y="12" width="32" height="28" rx="3" stroke="currentColor" strokeWidth="2"/>
              <path d="M16 8v8M32 8v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <div className="db-empty-text">No runs yet</div>
            <div className="db-empty-sub">Create your first security testing run to get started</div>
          </div>
        ) : (
          <div className="db-runs-grid">
            {runs.map(run => (
              <div key={run.id} className="db-run-card">
                <div className="db-run-header">
                  <div className="db-run-top">
                    <div style={{ flex: 1 }}>
                      <div className="db-run-name">{run.name}</div>
                      {run.description && (
                        <div className="db-run-desc">{run.description}</div>
                      )}
                    </div>
                    <span className={`db-run-status ${run.status}`}>
                      {run.status === 'running' ? <Play size={10} /> : <Pause size={10} />}
                      {run.status}
                    </span>
                  </div>

                  <div className="db-run-components">
                    {run.components.map(comp => {
                      const label = componentLabels[comp];
                      const Icon = label.icon;
                      return (
                        <span
                          key={comp}
                          className={`db-tag ${comp === 'attack-testing' ? 'db-tag-attack' : 'db-tag-defense'}`}
                        >
                          <Icon size={10} />
                          {label.name}
                        </span>
                      );
                    })}
                  </div>

                  <div className="db-run-meta">
                    <span>Created: {new Date(run.createdAt).toLocaleDateString()}</span>
                    <span>Updated: {new Date(run.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="db-run-footer">
                  <button className="db-run-open-btn" onClick={() => onOpenRun(run)}>
                    Open Run
                  </button>
                  <div className="db-run-actions">
                    <button className="db-icon-btn" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button className="db-icon-btn" onClick={() => exportRun(run)} title="Export">
                      <Download size={16} />
                    </button>
                    <button className="db-icon-btn delete" onClick={() => handleDeleteRun(run.id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateRunModal
          onClose={() => setShowCreateModal(false)}
          onCreateRun={handleCreateRun}
          componentLabels={componentLabels}
        />
      )}
    </div>
  );
};

export default DashboardPage;
