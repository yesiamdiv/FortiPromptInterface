import React, { useState, useEffect } from 'react';
import { Plus, Play, Pause, Trash2, Edit, AlertCircle, MessageSquare, Zap, Shield } from 'lucide-react';
import { Run, ComponentType, CreateRunRequest } from '../types';
import { useAppStore, componentLabels } from '../store/appStore';
import { fetchRuns, createRun, deleteRun } from '../services/api';

// ─── Manual run is its own run type ──────────────────────────────────────────
// We represent it as components: ['manual'] in the Run document.
// On the dashboard, manual runs are visually distinct from attack/defense ones.

type RunMode = 'automated' | 'manual';

interface DashboardPageProps {
  onOpenRun: (run: Run) => void;
  onBack: () => void;
}

const manualLabel = { name: 'Manual Attack', color: '#6366F1' };

const getRunMode = (run: Run): RunMode =>
  run.components.includes('manual' as ComponentType) ? 'manual' : 'automated';

const DashboardPage: React.FC<DashboardPageProps> = ({ onOpenRun, onBack }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplates, setShowTemplates]     = useState(false);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  // New-run form state
  const [newName, setNewName]           = useState('');
  const [newDesc, setNewDesc]           = useState('');
  const [runMode, setRunMode]           = useState<RunMode>('automated');
  const [newComponents, setNewComponents] = useState<ComponentType[]>(['attack', 'defense']);

  const runs               = useAppStore(s => s.runs);
  const setRuns            = useAppStore(s => s.setRuns);
  const addRun             = useAppStore(s => s.addRun);
  const deleteRunFromStore = useAppStore(s => s.deleteRun);
  const setActiveRun       = useAppStore(s => s.setActiveRun);

  const templates = [
    {
      name: 'Full Security Pipeline',
      description: 'Complete attack + defense testing environment',
      components: ['attack', 'defense'] as ComponentType[],
      mode: 'automated' as RunMode,
    },
    {
      name: 'Attack Development',
      description: 'Focus on developing AI attack strategies',
      components: ['attack'] as ComponentType[],
      mode: 'automated' as RunMode,
    },
    {
      name: 'Defense Optimization',
      description: 'Improve defense mechanisms and guardrails',
      components: ['defense'] as ComponentType[],
      mode: 'automated' as RunMode,
    },
    {
      name: 'Manual Red Teaming',
      description: 'Human-driven attack chat sessions with defense evaluation',
      components: ['manual'] as ComponentType[],
      mode: 'manual' as RunMode,
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

  // When switching run mode in the modal, update components accordingly
  const handleRunModeChange = (mode: RunMode) => {
    setRunMode(mode);
    if (mode === 'manual') {
      setNewComponents(['manual'] as ComponentType[]);
    } else {
      setNewComponents(['attack', 'defense']);
    }
  };

  const toggleComponent = (comp: ComponentType) => {
    if (runMode === 'manual') return; // manual is fixed
    setNewComponents(prev =>
      prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
    );
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

      const safeRun = {
        ...created,
        runid: created.runid //|| `run-${Date.now()}-${Math.random()}`
      };

      console.log('SAFE RUN:', safeRun);

      addRun(safeRun);
      setActiveRun(safeRun.runid);

      setShowCreateModal(false);
      setNewName('');
      setNewDesc('');
      setRunMode('automated');
      setNewComponents(['attack', 'defense']);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
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
    setRunMode(template.mode);
    setNewComponents(template.components);
    setNewName(template.name);
    setShowCreateModal(true);
    setShowTemplates(false);
  };

  const isValid = newName.trim().length > 0 && newComponents.length > 0;

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
        .db-templates-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .db-template-card { background:#F7F6F3; border:1px solid #E8E6E0; border-radius:8px; padding:16px; cursor:pointer; transition:all 0.15s; }
        .db-template-card:hover { border-color:#1A1A1A; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .db-template-card.manual { border-left:3px solid #6366F1; }
        .db-template-name { font-size:14px; font-weight:600; margin-bottom:4px; }
        .db-template-desc { font-size:12px; color:#888; margin-bottom:12px; }
        .db-template-tags { display:flex; flex-wrap:wrap; gap:6px; }

        .db-tag { display:flex; align-items:center; gap:4px; font-size:10px; padding:3px 8px; border-radius:12px; font-weight:500; }
        .db-tag-attack  { background:#FEF2F2; color:#DC2626; }
        .db-tag-defense { background:#F0FDF4; color:#15803D; }
        .db-tag-manual  { background:#EEF2FF; color:#4F46E5; }

        .db-runs-grid { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
        .db-run-card { background:#fff; border:1px solid #E8E6E0; border-radius:10px; overflow:hidden; transition:all .15s; }
        .db-run-card:hover { border-color:#D4D2CC; box-shadow:0 4px 12px rgba(0,0,0,.06); }
        .db-run-card.manual-run { border-left:3px solid #6366F1; }
        .db-run-header { padding:20px; border-bottom:1px solid #F0EDE6; }
        .db-run-top { display:flex; align-items:start; justify-content:space-between; margin-bottom:12px; }
        .db-run-name { font-size:16px; font-weight:600; letter-spacing:-0.3px; margin-bottom:4px; }
        .db-run-desc { font-size:13px; color:#888; margin-bottom:12px; }
        .db-run-status { display:flex; align-items:center; gap:4px; font-size:11px; padding:3px 8px; border-radius:12px; font-weight:500; white-space:nowrap; }
        .db-run-status.idle        { background:#F0EDE6; color:#888; }
        .db-run-status.initialized { background:#F0EDE6; color:#888; }
        .db-run-status.running     { background:#DBEAFE; color:#1D4ED8; }
        .db-run-status.completed   { background:#F0FDF4; color:#15803D; }
        .db-run-status.failed      { background:#FEF2F2; color:#DC2626; }
        .db-run-status.paused      { background:#FEF9C3; color:#92400E; }
        .db-run-status.active      { background:#EEF2FF; color:#4F46E5; }
        .db-run-components { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; }
        .db-run-meta { display:flex; gap:16px; font-size:11px; color:#AAA; }
        .db-run-footer { padding:16px 20px; background:#FAFAF9; display:flex; align-items:center; justify-content:space-between; }
        .db-run-open-btn { display:flex; align-items:center; gap:6px; padding:8px 16px; background:#1A1A1A; color:#fff; font-size:13px; font-weight:500; border-radius:7px; border:none; cursor:pointer; transition:background .15s; }
        .db-run-open-btn:hover { background:#333; }
        .db-run-open-btn.manual { background:#4F46E5; }
        .db-run-open-btn.manual:hover { background:#4338CA; }
        .db-run-actions { display:flex; gap:6px; }
        .db-icon-btn { padding:6px; background:transparent; border:none; cursor:pointer; border-radius:6px; color:#888; transition:all .15s; }
        .db-icon-btn:hover { background:#F0EDE6; color:#1A1A1A; }

        .db-loading { display:flex; align-items:center; justify-content:center; height:200px; }
        @keyframes db-spin { to { transform:rotate(360deg); } }
        .db-spinner { width:24px; height:24px; border:2px solid #E8E6E0; border-top-color:#1A1A1A; border-radius:50%; animation:db-spin .7s linear infinite; }

        .db-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:64px 0; color:#AAA; }
        .db-empty-icon { width:48px; height:48px; margin-bottom:16px; }
        .db-empty-text { font-size:16px; font-weight:600; color:#555; margin-bottom:8px; }
        .db-empty-sub  { font-size:13px; color:#AAA; }

        /* Modal */
        .db-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.35); display:flex; align-items:center; justify-content:center; z-index:1000; }
        .db-modal { background:#fff; border-radius:12px; max-width:500px; width:calc(100% - 32px); box-shadow:0 20px 48px rgba(0,0,0,.15); overflow:hidden; }
        .db-modal-hd { display:flex; align-items:center; justify-content:space-between; padding:18px 24px; border-bottom:1px solid #E8E6E0; }
        .db-modal-title { font-size:16px; font-weight:600; letter-spacing:-0.3px; }
        .db-modal-close { padding:4px; background:none; border:none; cursor:pointer; color:#888; border-radius:6px; }
        .db-modal-bd { padding:22px 24px; display:flex; flex-direction:column; gap:16px; }
        .db-modal-ft { display:flex; justify-content:flex-end; gap:8px; padding:16px 24px 20px; border-top:1px solid #E8E6E0; }
        .db-m-lbl { font-size:11px; font-weight:500; color:#999; letter-spacing:0.4px; text-transform:uppercase; margin-bottom:6px; }
        .db-m-inp { height:36px; background:#F7F6F3; border:1px solid #E8E6E0; border-radius:8px; padding:0 12px; font-size:13px; font-family:'DM Sans',sans-serif; color:#1A1A1A; outline:none; width:100%; transition:border-color .15s; }
        .db-m-inp:focus { border-color:#1A1A1A; background:#fff; }

        /* Mode toggle */
        .db-mode-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .db-mode-btn { display:flex; flex-direction:column; align-items:flex-start; gap:2px; padding:12px 14px; background:#F7F6F3; border:1.5px solid #E8E6E0; border-radius:9px; cursor:pointer; font-family:inherit; transition:all .15s; }
        .db-mode-btn.selected-automated { border-color:#1A1A1A; background:#1A1A1A; color:#fff; }
        .db-mode-btn.selected-manual    { border-color:#4F46E5; background:#EEF2FF; color:#4F46E5; }
        .db-mode-icon { font-size:18px; margin-bottom:4px; }
        .db-mode-name { font-size:13px; font-weight:600; }
        .db-mode-desc { font-size:11px; opacity:.65; }

        /* Component row (only shown for automated) */
        .db-m-comp-row { display:flex; gap:8px; }
        .db-m-comp-btn { flex:1; padding:9px 12px; background:#F7F6F3; border:1.5px solid #E8E6E0; border-radius:8px; cursor:pointer; font-family:inherit; font-size:12px; font-weight:500; color:#666; transition:all .15s; }
        .db-m-comp-btn.selected.attack  { border-color:#FCA5A5; background:#FEF2F2; color:#DC2626; }
        .db-m-comp-btn.selected.defense { border-color:#86EFAC; background:#F0FDF4; color:#15803D; }
        .db-m-comp-btn:hover:not(.selected) { border-color:#D4D2CC; }
      `}</style>

      {/* NAV */}
      <div className="db-nav">
        <div className="db-nav-left">
          <button className="db-back-btn" onClick={onBack}>← Home</button>
          <div className="db-nav-sep" />
          <span className="db-logo">Security Testing</span>
          <span className="db-badge">DASHBOARD</span>
        </div>
        <div className="db-actions">
          <button className="db-btn db-btn-secondary" onClick={() => setShowTemplates(v => !v)}>
            Templates
          </button>
          <button className="db-btn db-btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> New Run
          </button>
        </div>
      </div>

      <div className="db-main">
        <div className="db-header">
          <div className="db-header-top">
            <h1 className="db-title">Runs</h1>
          </div>
          <div className="db-desc">Manage automated and manual security testing runs.</div>
        </div>

        {error && (
          <div className="db-error">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {/* Templates */}
        {showTemplates && (
          <div className="db-templates">
            <div className="db-templates-title">Quick Start Templates</div>
            <div className="db-templates-grid">
              {templates.map(t => (
                <div
                  key={t.name}
                  className={`db-template-card ${t.mode === 'manual' ? 'manual' : ''}`}
                  onClick={() => handleTemplateSelect(t)}
                >
                  <div className="db-template-name">{t.name}</div>
                  <div className="db-template-desc">{t.description}</div>
                  <div className="db-template-tags">
                    {t.components.map((comp, idx) => (
                      <span key={`${comp}-${idx}`} className={`db-tag db-tag-${comp}`}>
                        {comp === 'manual' ? '⚔️ Manual Attack' : componentLabels[comp as ComponentType]?.name ?? comp}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Runs list */}
        {loading ? (
          <div className="db-loading">
            <div className="db-spinner" />
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
            {runs.map(run => {
              const isManual = getRunMode(run) === 'manual';
              return (
                <div key={run.runid} className={`db-run-card ${isManual ? 'manual-run' : ''}`}>
                  <div className="db-run-header">
                    <div className="db-run-top">
                      <div style={{ flex: 1 }}>
                        <div className="db-run-name">{run.name}</div>
                        {run.description && <div className="db-run-desc">{run.description}</div>}
                      </div>
                      <span className={`db-run-status ${run.status}`}>
                        {run.status === 'running' ? <Play size={10} /> : <Pause size={10} />}
                        {run.status}
                      </span>
                    </div>

                    <div className="db-run-components">
                      {(run.components || []).map((comp, idx) => {
                        const key = `${comp}-${idx}`;
                        if (comp === 'manual') {
                          return (
                            <span key={key} className="db-tag db-tag-manual">
                              <MessageSquare size={10} /> Manual Attack
                            </span>
                          );
                        }
                        const label = componentLabels[comp as ComponentType];
                        const Icon  = label?.icon;
                        return (
                          <span key={key} className={`db-tag db-tag-${comp}`}>
                            {Icon && <Icon size={10} />} {label?.name ?? comp}
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
                    <button
                      className={`db-run-open-btn ${isManual ? 'manual' : ''}`}
                      onClick={() => { setActiveRun(run.runid); onOpenRun(run); }}
                    >
                      {isManual ? <MessageSquare size={14} /> : <Play size={14} />}
                      Open Run
                    </button>
                    <div className="db-run-actions">
                      <button className="db-icon-btn" title="Edit"><Edit size={16} /></button>
                      <button className="db-icon-btn" onClick={() => handleDeleteRun(run.runid)} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Run Modal */}
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
              {/* Run Name */}
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

              {/* Description */}
              <div>
                <div className="db-m-lbl">Description (optional)</div>
                <input
                  className="db-m-inp"
                  placeholder="Brief description of this run…"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
              </div>

              {/* Mode */}
              <div>
                <div className="db-m-lbl">Run Type</div>
                <div className="db-mode-row">
                  <button
                    className={`db-mode-btn ${runMode === 'automated' ? 'selected-automated' : ''}`}
                    onClick={() => handleRunModeChange('automated')}
                  >
                    <span className="db-mode-icon">🤖</span>
                    <span className="db-mode-name">Automated</span>
                    <span className="db-mode-desc">AI-generated attacks</span>
                  </button>
                  <button
                    className={`db-mode-btn ${runMode === 'manual' ? 'selected-manual' : ''}`}
                    onClick={() => handleRunModeChange('manual')}
                  >
                    <span className="db-mode-icon">⚔️</span>
                    <span className="db-mode-name">Manual Attack</span>
                    <span className="db-mode-desc">Human-driven chat sessions</span>
                  </button>
                </div>
              </div>

              {/* Components (only for automated) */}
              {runMode === 'automated' && (
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
              )}

              {runMode === 'manual' && (
                <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#4338CA' }}>
                  <strong>Manual Attack</strong> — you'll type attack messages in a chat UI. Defense filter config is on the run page. Attack &amp; Defense AI components are disabled for manual runs.
                </div>
              )}
            </div>

            <div className="db-modal-ft">
              <button className="db-btn db-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button
                className="db-btn db-btn-primary"
                onClick={handleCreateRun}
                disabled={!isValid}
                style={{ opacity: isValid ? 1 : 0.45, cursor: isValid ? 'pointer' : 'not-allowed' }}
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
