import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, Play, Pause, Trash2, Edit, AlertCircle, MessageSquare,
  Zap, Shield, Settings, ChevronRight, Loader, RefreshCw, Layers, SlidersHorizontal,
} from 'lucide-react';
import { Run, ComponentType, CreateRunRequest, StrategySchema, NodeSchema, RunConfig } from '../types';
import { useAppStore, componentLabels } from '../store/appStore';
import {
  fetchRuns, createRun, deleteRun,
  startAutomaticRun, createManualSession, getStrategies, getNodes,
} from '../services/api';
import { websocketService } from '../services/websocket';

type RunMode  = 'automatic' | 'manual' | 'batch';
type WizardStep = 'type' | 'config' | 'review';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  idle:      { bg: '#F0EDE6', color: '#888'    },
  running:   { bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { bg: '#F0FDF4', color: '#15803D' },
  failed:    { bg: '#FEF2F2', color: '#DC2626' },
  paused:    { bg: '#FEF9C3', color: '#92400E' },
};

const COMP_STYLES: Record<ComponentType, { bg: string; color: string; border: string }> = {
  attack:  { bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  defense: { bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  manual:  { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
};

const TEMPLATES = [
  {
    name: 'Full Security Pipeline',
    description: 'Attack + Defense auto-loop',
    mode: 'automatic' as RunMode,
    attackNode: 'default_attack',
    defenseNode: 'default_defence',
    evaluationNode: 'default_eval',
    strategy: 'default',
  },
  {
    name: 'Attack Only',
    description: 'Generate adversarial prompts',
    mode: 'automatic' as RunMode,
    attackNode: 'default_attack',
    defenseNode: 'none',
    evaluationNode: 'none',
    strategy: 'default',
  },
  {
    name: 'Defense Evaluation',
    description: 'Evaluate guardrail strength',
    mode: 'automatic' as RunMode,
    attackNode: 'none',
    defenseNode: 'default_defence',
    evaluationNode: 'default_eval',
    strategy: 'default',
  },
  {
    name: 'Manual Red Team',
    description: 'Human-driven chat sessions',
    mode: 'manual' as RunMode,
    attackNode: 'none',
    defenseNode: 'none',
    evaluationNode: 'none',
    strategy: 'manual',
  },
];

// ─── Dynamic schema form renderer (now removed from Dashboard, but kept for reference if needed elsewhere) ────────────────────────────
// const SchemaForm: React.FC<{
//   schema: Record<string, any>;
//   values: Record<string, any>;
//   onChange: (key: string, val: any) => void;
// }> = ({ schema, values, onChange }) => { /* ... (SchemaForm implementation remains for now, but will be removed) ... */ };

// ─── Component ────────────────────────────────────────────────────────────────

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [showCreate,    setShowCreate]    = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [creating,      setCreating]      = useState(false);

  // Wizard
  const [wizardStep, setWizardStep] = useState<WizardStep>('type');
  // Seeded node param defaults (populated when schema loads, sent on create)
  const [seededAttackParams,   setSeededAttackParams]   = useState<Record<string, any>>({});
  const [seededDefenseParams,  setSeededDefenseParams]  = useState<Record<string, any>>({});
  const [seededEvalParams,     setSeededEvalParams]     = useState<Record<string, any>>({});
  const [seededStrategyParams, setSeededStrategyParams] = useState<Record<string, any>>({});
  const [runMode,    setRunMode]    = useState<RunMode>('automatic');
  const [newName,    setNewName]    = useState('');
  const [newDesc,    setNewDesc]    = useState('');

  // New: Node and Strategy selection state
  const [selectedAttackNode,     setSelectedAttackNode]     = useState('none');
  const [selectedDefenseNode,    setSelectedDefenseNode]    = useState('none');
  const [selectedEvaluationNode, setSelectedEvaluationNode] = useState('none');
  const [selectedStrategy,       setSelectedStrategy]       = useState('none');

  // Discovery data
  const [strategies,       setStrategies]       = useState<StrategySchema[]>([]);
  const [attackNodeTypes,  setAttackNodeTypes]  = useState<NodeSchema[]>([]);
  const [defenseNodeTypes, setDefenseNodeTypes] = useState<NodeSchema[]>([]);
  const [evalNodeTypes,    setEvalNodeTypes]    = useState<NodeSchema[]>([]);
  const [loadingNodes,     setLoadingNodes]     = useState(false);

  // Store
  const runs               = useAppStore(s => s.runs);
  const setRuns            = useAppStore(s => s.setRuns);
  const addRun             = useAppStore(s => s.addRun);
  const deleteRunFromStore = useAppStore(s => s.deleteRun);
  const setActiveRun       = useAppStore(s => s.setActiveRun);
  const resetRunState      = useAppStore(s => s.resetRunState);

  // ── Load runs on mount ────────────────────────────────────────────────────

  useEffect(() => { loadRuns(); }, []);

  const loadRuns = async () => {
    try {
      setLoading(true); setError(null);
      const fetched = await fetchRuns();
      setRuns(fetched);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load runs');
    } finally {
      setLoading(false);
    }
  };

  // ── Load node types and strategies when entering config step ─────────────────────────────

  useEffect(() => {
    if (wizardStep !== 'config') return;
    const loadDiscoveryData = async () => {
      setLoadingNodes(true);
      try {
        const [strats, attackNodes, defenseNodes, evalNodes] = await Promise.all([
          getStrategies(),
          getNodes('attack'),
          getNodes('defense'),
          getNodes('evaluation'),
        ]);
        setStrategies(strats);
        setAttackNodeTypes(attackNodes);
        setDefenseNodeTypes(defenseNodes);
        setEvalNodeTypes(evalNodes);

        // Set initial selections based on defaults or first available
        if (attackNodes.length > 0 && selectedAttackNode === 'none') setSelectedAttackNode(attackNodes[0].node_name);
        if (defenseNodes.length > 0 && selectedDefenseNode === 'none') setSelectedDefenseNode(defenseNodes[0].node_name);
        if (evalNodes.length > 0 && selectedEvaluationNode === 'none') setSelectedEvaluationNode(evalNodes[0].node_name);
        if (strats.length > 0 && selectedStrategy === 'none') setSelectedStrategy(strats[0].strategy_name);

        // Seed default param values from schemas so they are sent on create
        // even if the user never touches the sliders
        const seedSchema = (schema: Record<string, any>) => {
          const props = schema?.properties ?? {};
          const out: Record<string, any> = {};
          for (const [k, def] of Object.entries(props) as [string, any][]) {
            if (def.default !== undefined) out[k] = def.default;
            else if (def.enum?.length) out[k] = def.enum[0];
            else if (def.type === 'boolean') out[k] = false;
            else if (def.type === 'integer' || def.type === 'number') out[k] = def.minimum ?? 0;
          }
          return out;
        };
        const atkN  = attackNodes[0];
        const defN  = defenseNodes[0];
        const evalN = evalNodes[0];
        const stratN = strats[0];
        setSeededAttackParams(atkN   ? seedSchema(atkN.schema_definition   ?? {}) : {});
        setSeededDefenseParams(defN  ? seedSchema(defN.schema_definition   ?? {}) : {});
        setSeededEvalParams(evalN    ? seedSchema(evalN.schema_definition  ?? {}) : {});
        setSeededStrategyParams(stratN ? seedSchema(stratN.schema_definition ?? {}) : {});

      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoadingNodes(false);
      }
    };
    loadDiscoveryData();
  }, [wizardStep]);

  // ── Mode toggle ───────────────────────────────────────────────────────────

  const handleModeChange = (mode: RunMode) => {
    setRunMode(mode);
    // Reset node/strategy selections to defaults for the new mode if applicable
    if (mode === 'manual') {
      // setSelectedAttackNode('default');
      // setSelectedDefenseNode('default');
      // setSelectedEvaluationNode('default');
      setSelectedStrategy('manual');
    } else {
      // Automated defaults
      // setSelectedAttackNode('default');
      // setSelectedDefenseNode('default');
      // setSelectedEvaluationNode('default');
      setSelectedStrategy('none');
    }
  };

  // ── Wizard navigation ─────────────────────────────────────────────────────

  const wizardNext = () => {
    if (wizardStep === 'type')   setWizardStep('config');
    if (wizardStep === 'config') setWizardStep('review');
  };

  const wizardBack = () => {
    if (wizardStep === 'config') setWizardStep('type');
    if (wizardStep === 'review') setWizardStep('config');
  };

  const canAdvanceType   = newName.trim().length > 0;

  /*
  we need to have option of slecting the various nodes even incase of manual also.
  */
  const canAdvanceConfig =(
    (selectedAttackNode && selectedDefenseNode && selectedEvaluationNode && selectedStrategy)
  );

  // ── Create Run ────────────────────────────────────────────────────────────

  const handleCreateRun = async () => {
    if (!newName.trim()) return;
    setCreating(true); setError(null);

    try {
      const runConfig: RunConfig = {
        graph_type:             runMode,
        attack_node_config:     selectedAttackNode === 'none' ? undefined : {
          node_type:   selectedAttackNode,
          node_params: seededAttackParams,
        },
        defense_node_config:    selectedDefenseNode === 'none' ? undefined : {
          node_type:   selectedDefenseNode,
          node_params: seededDefenseParams,
        },
        evaluation_node_config: selectedEvaluationNode === 'none' ? undefined : {
          node_type:   selectedEvaluationNode,
          node_params: seededEvalParams,
        },
        strategy_config: {
          strategy_name:   selectedStrategy,
          strategy_params: { ...seededStrategyParams },
        },
      };

      const request: CreateRunRequest = {
        name:        newName.trim(),
        description: newDesc.trim() || '',
        config:      runConfig, // Use the new RunConfig structure
        payload:     { }, // Optional: Add runtime_config or initial_prompt here if needed later
      };

      const created = await createRun(request);
      addRun(created);
      setActiveRun(created.runid);
      resetRunState();

      // For manual: immediately create a session and navigate
      // Determine graph_type from the created run's returned config
      if (created.config?.graph_type === 'manual') {
        try {
          const session = await createManualSession(created.runid, {
            name: `Session 1`,
          });
          websocketService.joinSessionRoom(session.session_id);
        } catch {
          // session creation failure is non-fatal for navigation
        }
      }

      const defaultTab = created.config?.graph_type === 'manual' ? 'manual' : 'attack';
      navigate(`/runs/${created.runid}/${defaultTab}`);
      resetModal();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create run');
    } finally {
      setCreating(false);
    }
  };

  const resetModal = () => {
    setShowCreate(false);
    setWizardStep('type');
    setRunMode('automatic');
    setNewName('');
    setNewDesc('');
    setSeededAttackParams({});
    setSeededDefenseParams({});
    setSeededEvalParams({});
    setSeededStrategyParams({});
    // Reset node/strategy selections to initial defaults
    // Set initial selections based on defaults or first available
        if (attackNodeTypes.length > 0) setSelectedAttackNode(attackNodeTypes[0].node_name); else setSelectedAttackNode('none');
        if (defenseNodeTypes.length > 0) setSelectedDefenseNode(defenseNodeTypes[0].node_name); else setSelectedDefenseNode('none');
        if (evalNodeTypes.length > 0) setSelectedEvaluationNode(evalNodeTypes[0].node_name); else setSelectedEvaluationNode('none');
        if (strategies.length > 0) setSelectedStrategy(strategies[0].strategy_name); else setSelectedStrategy('none');
  };

  // ── Delete ────────────────────────────────────────────────────────────────

  const handleDelete = async (runId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this run? This cannot be undone.')) return;
    try {
      await deleteRun(runId);
      deleteRunFromStore(runId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete run');
    }
  };

  // ── Template select ───────────────────────────────────────────────────────

  const handleTemplateSelect = (t: typeof TEMPLATES[0]) => {
    setRunMode(t.mode);
    setNewName(t.name);
    setNewDesc(t.description);
    setSelectedAttackNode(t.attackNode);
    setSelectedDefenseNode(t.defenseNode);
    setSelectedEvaluationNode(t.evaluationNode);
    setSelectedStrategy(t.strategy);
    setShowCreate(true);
    setWizardStep('type');
    setShowTemplates(false);
  };

  // ─────────────────────────────────────────────────────────────────────────

  // const selectedStrategySchema = strategies.find(s => s.strategy_name === selectedStrategy); // Removed

  return (
    <div className="db-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        .db-root{font-family:'DM Sans',sans-serif;background:#F7F6F3;color:#1A1A1A;min-height:100vh}

        /* Nav */
        .db-nav{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:56px;background:#fff;border-bottom:1px solid #E8E6E0;position:sticky;top:0;z-index:100}
        .db-nav-left{display:flex;align-items:center;gap:16px}
        .db-back{display:flex;align-items:center;gap:6px;font-size:13px;color:#888;cursor:pointer;border:none;background:none;font-family:inherit;transition:color .15s}
        .db-back:hover{color:#1A1A1A}
        .db-sep{width:1px;height:18px;background:#E8E6E0}
        .db-logo{font-size:14px;font-weight:600;letter-spacing:-.3px}
        .db-badge{font-family:'DM Mono',monospace;font-size:10px;background:#F0EDE6;color:#666;padding:3px 8px;border-radius:20px;letter-spacing:.5px}
        .db-nav-actions{display:flex;gap:8px}

        /* Buttons */
        .db-btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;font-size:13px;font-weight:500;border-radius:8px;border:none;cursor:pointer;transition:all .15s;font-family:inherit}
        .db-btn-sec{background:#fff;color:#555;border:1px solid #E8E6E0}.db-btn-sec:hover{background:#F7F6F3;border-color:#D4D2CC}
        .db-btn-pri{background:#1A1A1A;color:#fff}.db-btn-pri:hover{background:#333}
        .db-btn-pri:disabled{opacity:.45;cursor:not-allowed}

        /* Main */
        .db-main{max-width:1400px;margin:0 auto;padding:28px 32px}
        .db-header{margin-bottom:24px;display:flex;align-items:flex-end;justify-content:space-between}
        .db-title{font-size:28px;font-weight:600;letter-spacing:-.8px}
        .db-desc{font-size:13px;color:#888;margin-top:4px}

        /* Error */
        .db-error{display:flex;align-items:center;gap:8px;padding:12px 16px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:8px;color:#DC2626;font-size:13px;margin-bottom:20px}

        /* Templates */
        .db-tpl-wrap{background:#fff;border:1px solid #E8E6E0;border-radius:10px;padding:20px;margin-bottom:24px}
        .db-tpl-hd{font-size:13px;font-weight:600;margin-bottom:14px}
        .db-tpl-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
        .db-tpl-card{background:#F7F6F3;border:1px solid #E8E6E0;border-radius:8px;padding:14px;cursor:pointer;transition:all .15s}
        .db-tpl-card:hover{border-color:#1A1A1A;box-shadow:0 4px 12px rgba(0,0,0,.06)}
        .db-tpl-name{font-size:13px;font-weight:600;margin-bottom:3px}
        .db-tpl-desc{font-size:11px;color:#888;margin-bottom:10px}
        .db-tpl-tags{display:flex;flex-wrap:wrap;gap:5px}

        /* Run grid */
        .db-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
        .db-run-card{background:#fff;border:1px solid #E8E6E0;border-radius:10px;overflow:hidden;transition:all .15s}
        .db-run-card:hover{border-color:#D4D2CC;box-shadow:0 4px 16px rgba(0,0,0,.07)}
        .db-run-card.manual{border-left:3px solid #6366F1}
        .db-run-hd{padding:20px;border-bottom:1px solid #F0EDE6}
        .db-run-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px}
        .db-run-name{font-size:15px;font-weight:600;letter-spacing:-.3px;margin-bottom:3px}
        .db-run-desc{font-size:12px;color:#888;line-height:1.45}
        .db-run-status{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500;padding:3px 9px;border-radius:12px;white-space:nowrap;flex-shrink:0}
        .db-run-comps{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
        .db-run-comp{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500;padding:3px 8px;border:1px solid;border-radius:12px}
        .db-run-meta{display:flex;gap:16px;font-size:11px;color:#AAA;font-family:'DM Mono',monospace}
        .db-run-ft{padding:14px 20px;background:#FAFAF9;display:flex;align-items:center;justify-content:space-between}
        .db-open-btn{display:flex;align-items:center;gap:6px;padding:8px 16px;background:#1A1A1A;color:#fff;font-size:13px;font-weight:500;border-radius:7px;border:none;cursor:pointer;transition:background .15s;font-family:inherit}
        .db-open-btn:hover{background:#333}
        .db-open-btn.manual{background:#4F46E5}.db-open-btn.manual:hover{background:#4338CA}
        .db-run-acts{display:flex;gap:4px}
        .db-icon-btn{padding:6px;background:transparent;border:none;cursor:pointer;border-radius:6px;color:#888;transition:all .15s;display:flex;align-items:center}
        .db-icon-btn:hover{background:#F0EDE6;color:#1A1A1A}
        .db-icon-btn.del:hover{background:#FEF2F2;color:#DC2626}

        /* Tag */
        .db-tag{display:inline-flex;align-items:center;gap:4px;font-size:10px;font-weight:500;padding:3px 8px;border-radius:12px}
        .db-tag-attack{background:#FEF2F2;color:#DC2626}.db-tag-defense{background:#F0FDF4;color:#15803D}.db-tag-manual{background:#EEF2FF;color:#4F46E5}

        /* Loading / empty */
        .db-loading{display:flex;align-items:center;justify-content:center;height:200px}
        @keyframes db-spin{to{transform:rotate(360deg)}}
        .db-spinner{width:24px;height:24px;border:2px solid #E8E6E0;border-top-color:#1A1A1A;border-radius:50%;animation:db-spin .7s linear infinite}
        .db-empty{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 0;color:#AAA}
        .db-empty-icon{margin-bottom:16px}
        .db-empty-title{font-size:16px;font-weight:600;color:#555;margin-bottom:6px}
        .db-empty-sub{font-size:13px;color:#AAA}

        /* Modal */
        .db-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);display:flex;align-items:center;justify-content:center;z-index:1000}
        .db-modal{background:#fff;border-radius:12px;width:520px;max-width:calc(100% - 32px);box-shadow:0 24px 56px rgba(0,0,0,.18);overflow:hidden;animation:db-slide .2s ease-out}
        @keyframes db-slide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        .db-modal-hd{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-bottom:1px solid #E8E6E0}
        .db-modal-title{font-size:16px;font-weight:600;letter-spacing:-.3px}
        .db-modal-close{padding:4px;background:none;border:none;cursor:pointer;color:#888;border-radius:6px;display:flex}
        .db-modal-close:hover{background:#F0EDE6;color:#1A1A1A}
        .db-modal-bd{padding:22px 24px;display:flex;flex-direction:column;gap:16px;max-height:60vh;overflow-y:auto}
        .db-modal-ft{display:flex;justify-content:space-between;align-items:center;padding:16px 24px 20px;border-top:1px solid #E8E6E0}
        .db-modal-ft-right{display:flex;gap:8px}

        /* Wizard steps */
        .db-steps{display:flex;gap:0;margin-bottom:20px}
        .db-step{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500;color:#BBB}
        .db-step.active{color:#1A1A1A}
        .db-step.done{color:#22C55E}
        .db-step-num{width:20px;height:20px;border-radius:50%;background:#E8E6E0;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;flex-shrink:0}
        .db-step.active .db-step-num{background:#1A1A1A;color:#fff}
        .db-step.done .db-step-num{background:#22C55E;color:#fff}
        .db-step-sep{width:20px;height:1px;background:#E8E6E0;margin:0 4px}

        /* Form */
        .db-m-lbl{font-size:11px;font-weight:500;color:#999;letter-spacing:.4px;text-transform:uppercase;display:block;margin-bottom:6px}
        .db-m-inp{height:36px;background:#F7F6F3;border:1px solid #E8E6E0;border-radius:8px;padding:0 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1A1A1A;outline:none;width:100%;transition:border-color .15s}
        .db-m-inp:focus{border-color:#1A1A1A;background:#fff}
        .db-m-sel{height:36px;background:#F7F6F3;border:1px solid #E8E6E0;border-radius:8px;padding:0 32px 0 12px;font-size:13px;font-family:'DM Sans',sans-serif;color:#1A1A1A;outline:none;width:100%;appearance:none;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}
        .db-m-sel:focus{border-color:#1A1A1A}
        .db-schema-desc{font-size:11px;color:#AAA;margin-top:4px;line-height:1.45}
        .db-schema-row{display:flex;flex-direction:column;gap:0}

        /* Schema toggle */
        .db-schema-toggle{display:flex;align-items:center;justify-content:space-between;cursor:pointer}
        .db-schema-lbl{font-size:13px;font-weight:500;color:#1A1A1A}
        .db-schema-toggle input{position:absolute;opacity:0;width:0;height:0}
        .db-schema-slider{position:relative;display:inline-block;width:34px;height:18px;border-radius:9px;background:#E8E6E0;transition:background .2s;flex-shrink:0}
        .db-schema-slider::before{content:'';position:absolute;width:12px;height:12px;border-radius:50%;background:#fff;left:3px;top:3px;transition:transform .2s}
        input:checked + .db-schema-slider{background:#1A1A1A}
        input:checked + .db-schema-slider::before{transform:translateX(16px)}

        /* Mode buttons */
        .db-mode-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .db-mode-btn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;background:#F7F6F3;border:1.5px solid #E8E6E0;border-radius:9px;cursor:pointer;font-family:inherit;transition:all .15s;text-align:left}
        .db-mode-btn.sel-auto{border-color:#1A1A1A;background:#1A1A1A;color:#fff}
        .db-mode-btn.sel-manual{border-color:#4F46E5;background:#EEF2FF;color:#4F46E5}
        .db-mode-btn.sel-batch{border-color:#7C3AED;background:#F5F3FF;color:#7C3AED}
        .db-mode-icon{font-size:18px;margin-bottom:4px}
        .db-mode-name{font-size:13px;font-weight:600}
        .db-mode-desc{font-size:11px;opacity:.65}

        /* Component toggle */
        .db-comp-row{display:flex;gap:8px}
        .db-comp-btn{flex:1;padding:9px 12px;background:#F7F6F3;border:1.5px solid #E8E6E0;border-radius:8px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:500;color:#666;transition:all .15s;display:flex;align-items:center;gap:6px}
        .db-comp-btn.sel-attack{border-color:#FCA5A5;background:#FEF2F2;color:#DC2626}
        .db-comp-btn.sel-defense{border-color:#86EFAC;background:#F0FDF4;color:#15803D}
        .db-comp-btn:hover:not(.sel-attack):not(.sel-defense){border-color:#D4D2CC}

        /* Info callout */
        .db-callout{background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:12px 14px;font-size:12px;color:#4338CA;line-height:1.55}

        /* Review section */
        .db-review-row{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #F0EDE6;font-size:13px}
        .db-review-row:last-child{border-bottom:none}
        .db-review-key{color:#888}
        .db-review-val{font-weight:500;text-align:right}
        .db-tag-node { background:#ECFDF5; color:#047857; }
        .db-tag-strategy { background:#E0F2FE; color:#0369A1; }
        .db-grid-3 { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
        .db-select { height:36px; background:#F7F6F3; border:1px solid #E8E6E0; border-radius:8px; padding:0 32px 0 12px; font-size:13px; font-family:'DM Sans',sans-serif; color:#1A1A1A; outline:none; width:100%; appearance:none; background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;cursor:pointer}
        .db-select:focus{border-color:#1A1A1A}
        .db-option-none { color: #AAA; }
        .db-select-placeholder { color: #AAA; }
      `}</style>

      {/* NAV */}
      <nav className="db-nav">
        <div className="db-nav-left">
          <button className="db-back" onClick={() => navigate('/')}>← Home</button>
          <div className="db-sep" />
          <span className="db-logo">FortiPrompt</span>
          <span className="db-badge">DASHBOARD</span>
        </div>
        <div className="db-nav-actions">
          <button className="db-btn db-btn-sec" onClick={() => setShowTemplates(v => !v)}>
            Templates
          </button>
          <button className="db-btn db-btn-pri" onClick={() => { setShowCreate(true); setWizardStep('type'); }}>
            <Plus size={14} /> New Run
          </button>
        </div>
      </nav>

      <div className="db-main">
        {/* Header */}
        <div className="db-header">
          <div>
            <h1 className="db-title">Runs</h1>
            <div className="db-desc">Manage automated and manual security testing runs.</div>
          </div>
          <button className="db-btn db-btn-sec" onClick={loadRuns} title="Refresh">
            <RefreshCw size={13} />
          </button>
        </div>

        {error && (
          <div className="db-error"><AlertCircle size={14} /> {error}</div>
        )}

        {/* Templates */}
        {showTemplates && (
          <div className="db-tpl-wrap">
            <div className="db-tpl-hd">Quick Start Templates</div>
            <div className="db-tpl-grid">
              {TEMPLATES.map(t => (
                <div key={t.name} className="db-tpl-card" onClick={() => handleTemplateSelect(t)}>
                  <div className="db-tpl-name">{t.name}</div>
                  <div className="db-tpl-desc">{t.description}</div>
                  <div className="db-tpl-tags">
                    {t.mode === 'manual' ? (
                      <span className="db-tag db-tag-manual"><MessageSquare size={9}/> Manual Attack</span>
                    ) : (
                      <>
                        {t.attackNode && t.attackNode !== 'none' && <span className="db-tag db-tag-attack"><Zap size={9}/> Attack</span>}
                        {t.defenseNode && t.defenseNode !== 'none' && <span className="db-tag db-tag-defense"><Shield size={9}/> Defense</span>}
                        {t.evaluationNode && t.evaluationNode !== 'none' && <span className="db-tag db-tag-node"><Layers size={9}/> Eval</span>}
                        {t.strategy && <span className="db-tag db-tag-strategy"><SlidersHorizontal size={9}/> {t.strategy}</span>}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Runs */}
        {loading ? (
          <div className="db-loading"><div className="db-spinner" /></div>
        ) : !runs || runs.length === 0 ? (
          <div className="db-empty">
            <div className="db-empty-icon">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                <rect x="8" y="12" width="32" height="28" rx="3" stroke="#DDD" strokeWidth="2"/>
                <path d="M16 8v8M32 8v8M8 22h32" stroke="#DDD" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="db-empty-title">No runs yet</div>
            <div className="db-empty-sub">Create your first security testing run to get started</div>
          </div>
        ) : (
          <div className="db-grid">
            {runs.map(run => {
              const isManual = run.config?.graph_type === 'manual'; // Use config to determine type
              const statusStyle = STATUS_STYLES[run.status] ?? STATUS_STYLES.idle;
              return (
                <div key={run.runid} className={`db-run-card ${isManual ? 'manual' : ''}`}>
                  <div className="db-run-hd">
                    <div className="db-run-top">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="db-run-name">{run.name}</div>
                        {run.description && <div className="db-run-desc">{run.description}</div>}
                      </div>
                      <span className="db-run-status" style={{ background: statusStyle.bg, color: statusStyle.color }}>
                        {run.status === 'running' ? <Play size={9}/> : <Pause size={9}/>}
                        {run.status}
                      </span>
                    </div>

                    <div className="db-run-comps">
                      {isManual ? (
                        <span className="db-run-comp" style={{ background: COMP_STYLES.manual.bg, color: COMP_STYLES.manual.color, borderColor: COMP_STYLES.manual.border }}>
                          <MessageSquare size={9}/> {componentLabels.manual.name}
                        </span>
                      ) : (
                        <>
                          {run.config?.attack_node_config?.node_type && (
                            <span className="db-run-comp" style={{ background: COMP_STYLES.attack.bg, color: COMP_STYLES.attack.color, borderColor: COMP_STYLES.attack.border }}>
                              <Zap size={9}/> {run.config.attack_node_config.node_type}
                            </span>
                          )}
                          {run.config?.defense_node_config?.node_type && (
                            <span className="db-run-comp" style={{ background: COMP_STYLES.defense.bg, color: COMP_STYLES.defense.color, borderColor: COMP_STYLES.defense.border }}>
                              <Shield size={9}/> {run.config.defense_node_config.node_type}
                            </span>
                          )}
                          {run.config?.evaluation_node_config?.node_type && (
                            <span className="db-run-comp" style={{ background: '#ECFDF5', color: '#047857', borderColor: '#A7F3D0' }}>
                              <Layers size={9}/> {run.config.evaluation_node_config.node_type}
                            </span>
                          )}
                          {run.config?.strategy_config?.strategy_name && (
                            <span className="db-run-comp" style={{ background: '#E0F2FE', color: '#0369A1', borderColor: '#BAE6FD' }}>
                              <SlidersHorizontal size={9}/> {run.config.strategy_config?.strategy_name}
                            </span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="db-run-meta">
                      <span>Created {new Date(run.createdAt).toLocaleDateString()}</span>
                      <span>Updated {new Date(run.updatedAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="db-run-ft">
                    <button
                      className={`db-open-btn ${isManual ? 'manual' : ''}`}
                      onClick={() => { setActiveRun(run.runid); resetRunState(); navigate(`/runs/${run.runid}/attack`); }}
                    >
                      {isManual ? <MessageSquare size={13}/> : <Play size={13}/>}
                      Open Run
                    </button>
                    <div className="db-run-acts">
                      <button className="db-icon-btn del" onClick={e => handleDelete(run.runid, e)}>
                        <Trash2 size={15}/>
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
      {showCreate && (
        <div className="db-overlay" onClick={e => { if (e.target === e.currentTarget) resetModal(); }}>
          <div className="db-modal" onClick={e => e.stopPropagation()}>
            <div className="db-modal-hd">
              <span className="db-modal-title">New Run</span>
              <button className="db-modal-close" onClick={resetModal}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div className="db-modal-bd">
              {/* Step indicator */}
              <div className="db-steps">
                {(['type', 'config', 'review'] as WizardStep[]).map((step, i) => {
                  const stepIdx  = ['type','config','review'].indexOf(wizardStep);
                  const thisIdx  = i;
                  const isDone   = thisIdx < stepIdx;
                  const isActive = thisIdx === stepIdx;
                  return (
                    <React.Fragment key={step}>
                      {i > 0 && <div className="db-step-sep" />}
                      <div className={`db-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                        <span className="db-step-num">{isDone ? '✓' : i + 1}</span>
                        <span>{step === 'type' ? 'Details' : step === 'config' ? 'Configuration' : 'Review'}</span>
                      </div>
                    </React.Fragment>
                  );
                })}
              </div>

              {/* STEP 1: DETAILS */}
              {wizardStep === 'type' && (
                <>
                  <div>
                    <label className="db-m-lbl">Run Name *</label>
                    <input className="db-m-inp" placeholder="e.g. Production Security Test" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
                  </div>
                  <div>
                    <label className="db-m-lbl">Description (optional)</label>
                    <input className="db-m-inp" placeholder="Brief description…" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="db-m-lbl">Run Type</label>
                    <div className="db-mode-grid">
                      <button className={`db-mode-btn ${runMode === 'automatic' ? 'sel-auto' : ''}`} onClick={() => handleModeChange('automatic')}>
                        <span className="db-mode-icon">🤖</span>
                        <span className="db-mode-name">Automated</span>
                        <span className="db-mode-desc">AI-generated attack loops</span>
                      </button>
                      <button className={`db-mode-btn ${runMode === 'manual' ? 'sel-manual' : ''}`} onClick={() => handleModeChange('manual')}>
                        <span className="db-mode-icon">⚔️</span>
                        <span className="db-mode-name">Manual Attack</span>
                        <span className="db-mode-desc">Human-driven chat sessions</span>
                      </button>
                      <button className={`db-mode-btn ${runMode === 'batch' ? 'sel-batch' : ''}`} onClick={() => handleModeChange('batch')}>
                        <span className="db-mode-icon">📦</span>
                        <span className="db-mode-name">Batch</span>
                        <span className="db-mode-desc">Upload prompts file (JSON/CSV)</span>
                      </button>
                    </div>
                  </div>

                  {runMode === 'manual' && (
                    <div className="db-callout">
                      <strong>Manual Attack Mode</strong> — you'll type attack messages in a real-time chat UI.
                      Defense evaluation and scoring happen automatically after each turn.
                    </div>
                  )}
                  {runMode === 'batch' && (
                    <div className="db-callout" style={{ borderColor: '#7C3AED', background: '#F5F3FF' }}>
                      <strong>Batch Mode</strong> — upload a <code>.json</code> or <code>.csv</code> file containing attack prompts.
                      The run uses the same automatic pipeline, sourcing prompts from your file instead of the strategy node.
                    </div>
                  )}
                </>
              )}

              {/* STEP 2: CONFIGURATION */}
              {wizardStep === 'config' && (
                <>
                  {
                  // runMode === 'manual' ? (
                  //   <div className="db-callout">
                  //     Manual runs use a fixed strategy and do not require node configuration.
                  //     Click <strong>Next</strong> to review.
                  //   </div>
                  // ) :
                   loadingNodes ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 10 }}>
                      <Loader size={18} style={{ animation: 'db-spin .7s linear infinite' }} />
                      <span style={{ fontSize: 13, color: '#888' }}>Loading configuration options…</span>
                    </div>
                  ) : (
                    <>
                      {/* Attack Node */}
                      <div className="db-field">
                        <label className="db-m-lbl">Attack Node</label>
                        <select className="db-select" value={selectedAttackNode} onChange={e => setSelectedAttackNode(e.target.value)}>
                          <option value="none" className="db-select-placeholder">No Attack Node</option>
                          {attackNodeTypes.map(node => (
                            <option key={node.node_name} value={node.node_name}>{node.node_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Defense Node */}
                      <div className="db-field">
                        <label className="db-m-lbl">Defense Node</label>
                        <select className="db-select" value={selectedDefenseNode} onChange={e => setSelectedDefenseNode(e.target.value)}>
                          <option value="none" className="db-select-placeholder">No Defense Node</option>
                          {defenseNodeTypes.map(node => (
                            <option key={node.node_name} value={node.node_name}>{node.node_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Evaluation Node */}
                      <div className="db-field">
                        <label className="db-m-lbl">Evaluation Node</label>
                        <select className="db-select" value={selectedEvaluationNode} onChange={e => setSelectedEvaluationNode(e.target.value)}>
                          <option value="none" className="db-select-placeholder">No Evaluation Node</option>
                          {evalNodeTypes.map(node => (
                            <option key={node.node_name} value={node.node_name}>{node.node_name}</option>
                          ))}
                        </select>
                      </div>

                      {/* Strategy */}
                      <div className="db-field">
                        <label className="db-m-lbl">Strategy</label>
                        <select className="db-select" value={selectedStrategy} onChange={e => setSelectedStrategy(e.target.value)}>
                          {strategies.map(strat => (
                            <option key={strat.strategy_name} value={strat.strategy_name}>{strat.strategy_name}</option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}
                </>
              )}
              {/* STEP 3: REVIEW */}
              {wizardStep === 'review' && (
                <div>
                  <div className="db-review-row"><span className="db-review-key">Name</span><span className="db-review-val">{newName}</span></div>
                  {newDesc && <div className="db-review-row"><span className="db-review-key">Description</span><span className="db-review-val">{newDesc}</span></div>}
                  <div className="db-review-row"><span className="db-review-key">Type</span><span className="db-review-val">{runMode === 'manual' ? '⚔️ Manual Attack' : runMode === 'batch' ? '📦 Batch' : '🤖 Automatic'}</span></div>
                  {runMode === 'batch' && (
                    <div className="db-callout" style={{ borderColor: '#7C3AED', background: '#F5F3FF', marginTop: 10 }}>
                      📂 After creating the run, upload your prompts file in the <strong>Strategy</strong> section of the left panel.
                    </div>
                  )}
                  {runMode === 'automatic' && (
                    <>
                      <div className="db-review-row"><span className="db-review-key">Attack Node</span><span className="db-review-val">{selectedAttackNode}</span></div>
                      <div className="db-review-row"><span className="db-review-key">Defense Node</span><span className="db-review-val">{selectedDefenseNode}</span></div>
                      <div className="db-review-row"><span className="db-review-key">Evaluation Node</span><span className="db-review-val">{selectedEvaluationNode}</span></div>
                      <div className="db-review-row"><span className="db-review-key">Strategy</span><span className="db-review-val">{selectedStrategy}</span></div>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="db-modal-ft">
              {wizardStep !== 'type' ? (
                <button className="db-btn db-btn-sec" onClick={wizardBack}>← Back</button>
              ) : (
                <button className="db-btn db-btn-sec" onClick={resetModal}>Cancel</button>
              )}
              <div className="db-modal-ft-right">
                {wizardStep !== 'review' ? (
                  <button
                    className="db-btn db-btn-pri"
                    onClick={wizardNext}
                    disabled={wizardStep === 'type' ? !canAdvanceType : !canAdvanceConfig || loadingNodes}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    className="db-btn db-btn-pri"
                    onClick={handleCreateRun}
                    disabled={creating}
                  >
                    {creating ? <><Loader size={13} style={{ animation: 'db-spin .7s linear infinite' }} /> Creating…</> : 'Create & Open Run'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;