import React, { useState, useEffect } from 'react';
import { Plus, Copy, Play, Pause, Download, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Run, ComponentType, CreateRunRequest } from '../types';
import { useAppStore, componentLabels } from '../store/appStore';
import { fetchRuns, createRun, deleteRun } from '../services/api';

interface DashboardPageProps {
  onOpenRun: (run: Run) => void;
  onBack: () => void;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenRun, onBack }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  // New-run form state
  const [newName, setNewName]           = useState('');
  const [newDesc, setNewDesc]           = useState('');
  const [newComponents, setNewComponents] = useState<ComponentType[]>(['attack', 'defense']);

  // Global store
  const runs              = useAppStore(s => s.runs);
  const setRuns           = useAppStore(s => s.setRuns);
  const addRun            = useAppStore(s => s.addRun);
  const deleteRunFromStore = useAppStore(s => s.deleteRun);
  const setActiveRun      = useAppStore(s => s.setActiveRun);  // ← ADD THIS

  // Templates — use correct ComponentType values
  const templates = [
    {
      name: 'Full Security Pipeline',
      description: 'Complete attack + defense testing environment',
      components: ['attack', 'defense'] as ComponentType[],
    },
    {
      name: 'Attack Development',
      description: 'Focus on developing attack strategies',
      components: ['attack'] as ComponentType[],
    },
    {
      name: 'Defense Optimization',
      description: 'Improve defense mechanisms and guardrails',
      components: ['defense'] as ComponentType[],
    },
  ];

  useEffect(() => { loadRuns(); }, []);

  const loadRuns = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetched = await fetchRuns();
      setRuns(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRun = async () => {
    if (!newName.trim()) return;
    try {
      const request: CreateRunRequest = {
        name: newName.trim(),
        description: newDesc.trim() || '',
        components: newComponents,
      };
      const created = await createRun(request);
      addRun(created);
      setActiveRun(created.runid);  // ← FIX: Set the created run as active
      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
      setNewComponents(['attack', 'defense']);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
      console.error('[Dashboard] Create run error:', err);
    }
  };

  const handleDeleteRun = async (runId: string) => {
    if (!window.confirm('Delete this run? This cannot be undone.')) return;
    try {
      await deleteRun(runId);
      deleteRunFromStore(runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete run');
    }
  };

  const handleTemplateSelect = (template: typeof templates[0]) => {
    setNewComponents(template.components);
    setNewName(template.name);
    setShowCreateModal(true);
    setShowTemplates(false);
  };

  const toggleComponent = (comp: ComponentType) => {
    setNewComponents(prev =>
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
  };

  return (
    <div className="dashboard-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        .dashboard-root { font-family:'DM Sans',sans-serif; background:#F7F6F3; color:#1A1A1A; min-height:100vh; }

        .db-nav { display:flex; align-items:center; justify-content:space-between; padding:0 32px; height:56px; background:#fff; border-bottom:1px solid #E8E6E0; position:sticky; top:0; z-index:100; }
        .db-nav-left { display:flex; align-items:center; gap:16px; }
        .db-back-btn { display:flex; align-items:center; gap:6px; font-size:13px; color:#888; cursor:pointer; border:none; background:none; font-family:inherit; transition:color .15s; }
        .db-back-btn:hover { color:#1A1A1A; }
        .db-nav-sep { width:1px; height:18px; background:#E8E6E0; }
        .db-logo { font-size:14px; font-weight:600; letter-spacing:-0.3px; }
        .db-badge { font-family:'DM Mono',monospace; font-size:10px; background:#F0EDE6; color:#666; padding:3px 8px; border-radius:20px; letter-spacing:0.5px; }

        .db-main { max-width:1400px; margin:0 auto; padding:24px; }
        .db-header { margin-bottom:24px; }
        .db-header-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; }
        .db-title { font-size:28px; font-weight:600; letter-spacing:-0.8px; }
        .db-desc { font-size:14px; color:#888; }
        .db-actions { display:flex; gap:8px; }

        .db-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; font-size:13px; font-weight:500; border-radius:8px; border:none; cursor:pointer; transition:all 0.15s; font-family:inherit; }
        .db-btn-secondary { background:#fff; color:#555; border:1px solid #E8E6E0; }
        .db-btn-secondary:hover { background:#F7F6F3; border-color:#D4D2CC; }
        .db-btn-primary { background:#1A1A1A; color:#fff; }
        .db-btn-primary:hover { background:#333; }

        .db-error { display:flex; align-items:center; gap:8px; padding:12px 16px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:8px; color:#DC2626; font-size:13px; margin-bottom:16px; }

        .db-templates { background:#fff; border:1px solid #E8E6E0; border-radius:10px; padding:20px; margin-bottom:24px; }
        .db-templates-title { font-size:16px; font-weight:600; margin-bottom:16px; }
        .db-templates-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; }
        .db-template-card { background:#F7F6F3; border:1px solid #E8E6E0; border-radius:8px; padding:16px; cursor:pointer; transition:all 0.15s; }
        .db-template-card:hover { border-color:#1A1A1A; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .db-template-name { font-size:14px; font-weight:600; margin-bottom:4px; }
        .db-template-desc { font-size:12px; color:#888; margin-bottom:12px; }
        .db-template-tags { display:flex; flex-wrap:wrap; gap:6px; }

        .db-tag { display:flex; align-items:center; gap:4px; font-size:10px; padding:3px 8px; border-radius:12px; font-weight:500; }
        .db-tag-attack  { background:#FEF2F2; color:#DC2626; }
        .db-tag-defense { background:#F0FDF4; color:#15803D; }

        .db-runs-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        .db-run-card { background:#fff; border:1px solid #E8E6E0; border-radius:10px; overflow:hidden; transition:all .15s; }
        .db-run-card:hover { border-color:#D4D2CC; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .db-run-header { padding:20px; border-bottom:1px solid #F0EDE6; }
        .db-run-top { display:flex; align-items:start; justify-content:space-between; margin-bottom:12px; }
        .db-run-name { font-size:16px; font-weight:600; letter-spacing:-0.3px; margin-bottom:4px; }
        .db-run-desc { font-size:13px; color:#888; margin-bottom:12px; }
        .db-run-status { display:flex; align-items:center; gap:4px; font-size:11px; padding:3px 8px; border-radius:12px; font-weight:500; white-space:nowrap; }
        .db-run-status.idle      { background:#F0EDE6; color:#888; }
        .db-run-status.running   { background:#DBEAFE; color:#1D4ED8; }
        .db-run-status.completed { background:#F0FDF4; color:#15803D; }
        .db-run-status.failed    { background:#FEF2F2; color:#DC2626; }
        .db-run-status.paused    { background:#FEF9C3; color:#92400E; }
        .db-run-components { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
        .db-run-meta { display:flex; gap:16px; font-size:11px; color:#AAA; }
        .db-run-footer { padding:16px 20px; background:#FAFAF9; display:flex; align-items:center; justify-content:space-between; }
        .db-run-open-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:#1A1A1A; color:#fff; font-size:13px; font-weight:500; border-radius:7px; border:none; cursor:pointer; transition:background .15s; }
        .db-run-open-btn:hover { background:#333; }
        .db-run-actions { display:flex; gap:6px; }
        .db-icon-btn { padding:6px; background:transparent; border:none; cursor:pointer; border-radius:6px; color:#888; transition:all .15s; }
        .db-icon-btn:hover { background:#F0EDE6; color:#1A1A1A; }
        .db-icon-btn.delete:hover { color:#DC2626; }

        .db-empty { text-align:center; padding:80px 24px; color:#CCC; }
        .db-empty-icon { margin:0 auto 16px; width:48px; height:48px; color:#E8E6E0; }
        .db-empty-text { font-size:15px; margin-bottom:8px; }
        .db-empty-sub { font-size:13px; color:#BBB; }
        .db-loading { display:flex; align-items:center; justify-content:center; padding:80px 24px; }
        .db-spinner { width:32px; height:32px; animation:spin .8s linear infinite; }
        @keyframes spin { to { transform:rotate(360deg); } }

        /* Modal */
        .db-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:200; display:flex; align-items:center; justify-content:center; }
        .db-modal { background:#fff; border-radius:12px; width:480px; max-width:calc(100vw - 32px); box-shadow:0 16px 48px rgba(0,0,0,.15); overflow:hidden; }
        .db-modal-hd { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid #E8E6E0; }
        .db-modal-title { font-size:16px; font-weight:600; letter-spacing:-.3px; }
        .db-modal-close { background:none; border:none; cursor:pointer; color:#888; padding:4px; border-radius:6px; transition:color .15s; }
        .db-modal-close:hover { color:#1A1A1A; }
        .db-modal-bd { padding:24px; display:flex; flex-direction:column; gap:16px; }
        .db-modal-ft { padding:16px 24px; border-top:1px solid #E8E6E0; display:flex; justify-content:flex-end; gap:8px; }
        .db-m-lbl { font-size:11px; font-weight:500; color:#999; letter-spacing:.3px; text-transform:uppercase; margin-bottom:6px; }
        .db-m-inp { width:100%; height:36px; background:#F7F6F3; border:1px solid #E8E6E0; border-radius:7px; padding:0 12px; font-size:13px; font-family:inherit; color:#1A1A1A; outline:none; transition:border-color .15s; }
        .db-m-inp:focus { border-color:#1A1A1A; background:#fff; }
        .db-m-comp-row { display:flex; gap:8px; }
        .db-m-comp-btn { flex:1; padding:10px 12px; border-radius:8px; border:1px solid #E8E6E0; background:#F7F6F3; cursor:pointer; font-family:inherit; font-size:12px; font-weight:500; transition:all .15s; text-align:center; }
        .db-m-comp-btn.selected.attack  { background:#FEF2F2; border-color:#FCA5A5; color:#DC2626; }
        .db-m-comp-btn.selected.defense { background:#F0FDF4; border-color:#86EFAC; color:#15803D; }
        .db-m-comp-btn:not(.selected):hover { border-color:#999; }
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
        <span className="db-badge">v0.5.0</span>
      </nav>

      <div className="db-main">
        {/* Header */}
        <div className="db-header">
          <div className="db-header-top">
            <h1 className="db-title">Dashboard</h1>
            <div className="db-actions">
              <button className="db-btn db-btn-secondary" onClick={() => setShowTemplates(!showTemplates)}>
                <Copy size={14} /> Templates
              </button>
              <button className="db-btn db-btn-primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={14} /> New Run
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
              {templates.map((t) => (  
                <div
                  key={`${t.name}-${t.description}`}               className="db-template-card"
                  onClick={() => handleTemplateSelect(t)}
                >
                  <div className="db-template-name">{t.name}</div>
                  <div className="db-template-desc">{t.description}</div>
                  <div className="db-template-tags">
                    {t.components.map((comp, index) => {
                      const label = componentLabels[comp];
                      return (
                        <span key={comp} className={`db-tag db-tag-${comp}`}>
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
        ) : !runs || runs.length === 0 ? (
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
            {(runs || []).map(run => (
              <div key={run.runid} className="db-run-card">
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
                    {(run.components || []).map(comp => {
                      const label = componentLabels[comp];
                      const Icon  = label.icon;
                      return (
                        <span key={comp} className={`db-tag db-tag-${comp}`}>
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
                  <button className="db-run-open-btn" onClick={() => {
                    setActiveRun(run.runid); 
                    onOpenRun(run);
                  }}>
                    Open Run
                  </button>
                  <div className="db-run-actions">
                    <button className="db-icon-btn" title="Edit">
                      <Edit size={16} />
                    </button>
                    <button
                      className="db-icon-btn delete"
                      onClick={() => handleDeleteRun(run.runid)}
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Run Modal — inline, no external dependency */}
      {showCreateModal && (
        <div className="db-modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className="db-modal">
            <div className="db-modal-hd">
              <span className="db-modal-title">New Run</span>
              <button className="db-modal-close" onClick={() => setShowCreateModal(false)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="db-modal-bd">
              <div>
                <div className="db-m-lbl">Run Name *</div>
                <input
                  className="db-m-inp"
                  placeholder="e.g. Initial Security Scan"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <div className="db-m-lbl">Description (optional)</div>
                <input
                  className="db-m-inp"
                  placeholder="Brief description of this run…"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>
              <div>
                <div className="db-m-lbl">Components</div>
                <div className="db-m-comp-row">
                  {(['attack', 'defense'] as ComponentType[]).map(comp => (
                    <button
                      key={comp}
                      className={`db-m-comp-btn ${newComponents.includes(comp) ? `selected ${comp}` : ''}`}
                      onClick={() => toggleComponent(comp)}
                    >
                      {componentLabels[comp].name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="db-modal-ft">
              <button className="db-btn db-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                className="db-btn db-btn-primary"
                onClick={handleCreateRun}
                disabled={!newName.trim() || newComponents.length === 0}
                style={{ opacity: (!newName.trim() || newComponents.length === 0) ? .5 : 1, cursor: (!newName.trim() || newComponents.length === 0) ? 'not-allowed' : 'pointer' }}
              >
                Create Run
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;