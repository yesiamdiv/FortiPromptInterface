import React, { useState, useEffect } from 'react';
import {
  AttackConfig,
  AttackPrompt,
  AttackStatus,
  AttackStrategy,
  AttackDomain,
} from '../types';
import { useAppStore } from '../store/appStore';
import { testConnection, startAttack, stopAttack, updateAttackConfig } from '../services/api';
import {
  fetchAttackPrompts,
  fetchAttackStats,
} from '../services/api';
import { websocketService } from 'services/websocket';

interface AttackTestingPageProps {
  onBack: () => void;
}

// Simplified status config - only showing statuses, not filtering by them
const STATUS_CONFIG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
  generated: { label: 'Generated', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  sent:      { label: 'Sent',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  failed:    { label: 'Failed',    bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  breached:  { label: 'Breached',  bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
  blocked:   { label: 'Blocked',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
};

const DEFAULT_CONFIG: AttackConfig = {
  model: 'dolphin-mistral:7b',
  attackStrategy: 'default',
  domain: 'cybersecurity',
  modelUrl: 'http://localhost:11434/api/generate',
  iterations: 100,
  parameters: {
    temperature: 0.7,
    engine: 'ollama',
  },
};

const ATTACK_STRATEGIES: { value: AttackStrategy; label: string }[] = [
  { value: 'default',            label: 'Default'            },
  { value: 'jailbreak',          label: 'Jailbreak'          },
  { value: 'prompt_injection',   label: 'Prompt Injection'   },
  { value: 'indirect_injection', label: 'Indirect Injection' },
  { value: 'prompt_leaking',     label: 'Prompt Leaking'     },
  { value: 'chain_attack',       label: 'Chain Attack'       },
  { value: 'role_play_exploit',  label: 'Role Play Exploit'  },
];

const DOMAINS: { value: AttackDomain; label: string }[] = [
  { value: 'copyright',      label: 'Copyright'      },
  { value: 'cybersecurity',  label: 'Cybersecurity'  },
  { value: 'harassment',     label: 'Harassment'     },
  { value: 'harmful',        label: 'Harmful'        },
  { value: 'illegal',        label: 'Illegal'        },
  { value: 'misinformation', label: 'Misinformation' },
];

// Model options with engine and model
const MODEL_OPTIONS = [
  { engine: 'ollama', model: 'dolphin-mistral:7b', label: 'Ollama - Dolphin Mistral 7B' },
  { engine: 'ollama', model: 'llama2:7b', label: 'Ollama - Llama 2 7B' },
  { engine: 'openai', model: 'gpt-4o-mini', label: 'OpenAI - GPT-4o Mini' },
  { engine: 'openai', model: 'gpt-4o', label: 'OpenAI - GPT-4o' },
  { engine: 'anthropic', model: 'claude-3-5-sonnet-20241022', label: 'Anthropic - Claude 3.5 Sonnet' },
];

const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ onBack }) => {
  // Local UI state
  const [config, setConfig]     = useState<AttackConfig>(DEFAULT_CONFIG);
  const [apiKey, setApiKey]     = useState('');
  const [activeTab, setActiveTab] = useState<'attack' | 'defense'>('attack');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Global store — read
  const activeRunId      = useAppStore(s => s.activeRunId);
  const attackPrompts    = useAppStore(s => s.attackPrompts);
  const attackStats      = useAppStore(s => s.attackStats);
  const isAttacking      = useAppStore(s => s.isAttacking);
  const attackError      = useAppStore(s => s.attackError);
  const connectionStatus = useAppStore(s => s.connectionStatus);

  // Global store — write
  const setAttackConfig     = useAppStore(s => s.setAttackConfig);
  const clearAttackPrompts  = useAppStore(s => s.clearAttackPrompts);
  const setIsAttacking      = useAppStore(s => s.setIsAttacking);
  const setAttackError      = useAppStore(s => s.setAttackError);
  const setConnectionStatus = useAppStore(s => s.setConnectionStatus);
  const updateRun           = useAppStore(s => s.updateRun);

  const update = <K extends keyof AttackConfig>(key: K, val: AttackConfig[K]) =>
    setConfig(prev => ({ ...prev, [key]: val }));

  const updateParam = (key: string, val: unknown) =>
    setConfig(prev => ({ ...prev, parameters: { ...prev.parameters, [key]: val } }));

  // Handle model selection - sets both engine and model
  const handleModelSelect = (selectedModel: typeof MODEL_OPTIONS[0]) => {
    setConfig(prev => ({
      ...prev,
      model: selectedModel.model,
      parameters: {
        ...prev.parameters,
        engine: selectedModel.engine,
      },
    }));
  };

  // Get current selected model option
  const currentModelOption = MODEL_OPTIONS.find(
    opt => opt.model === config.model && opt.engine === config.parameters?.engine
  ) || MODEL_OPTIONS[0];

  // ── Test connection ─────────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    if (!config.modelUrl) return;
    setConnectionStatus('testing');
    const ok = await testConnection(config.modelUrl, apiKey || undefined);
    setConnectionStatus(ok ? 'connected' : 'failed');
  };

  // ── Start attack ────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!activeRunId) return;
    setAttackError(null);
    clearAttackPrompts();

    setAttackConfig(config);
    setIsAttacking(true);
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });

    try {
      await updateAttackConfig(activeRunId, config, apiKey || undefined);
      await startAttack(activeRunId, { resumeFromLastSaved: false }, apiKey || undefined);
      // Prompts arrive via WebSocket — nothing more to do here
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Attack failed';
      setAttackError(msg);
      setIsAttacking(false);
      updateRun(activeRunId, { status: 'failed', updatedAt: new Date().toISOString() });
    }
  };

  // ── Stop attack ─────────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!activeRunId) return;
    try { await stopAttack(activeRunId); } catch { /* best-effort */ }
    setIsAttacking(false);
    updateRun(activeRunId, { status: 'paused', updatedAt: new Date().toISOString() });
  };

  // ── Initial data fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRunId) return;

    const init = async () => {
      try {
        console.log('[INIT] Fetching existing prompts & stats');

        const [prompts, stats] = await Promise.all([
          fetchAttackPrompts(activeRunId),
          fetchAttackStats(activeRunId),
        ]);

        const { setAttackPrompts, setAttackStats, updateRun, setIsAttacking } = useAppStore.getState();

        setAttackPrompts(prompts || []);
        setAttackStats(stats || null);

        // Sync attacking state from stats
        const isRunning = stats?.pendingAttacks > 0;
        setIsAttacking(isRunning);

        updateRun(activeRunId, {
          status: isRunning ? 'running' : 'completed',
          updatedAt: new Date().toISOString(),
        });

      } catch (err) {
        console.error('[INIT] Failed to load attack state', err);
      }
    };

    init();
  }, [activeRunId]);

  // ── WebSocket subscription ─────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRunId) return;

    websocketService.joinRun(activeRunId);

    return () => {
      websocketService.leaveRun(activeRunId);
    };
  }, [activeRunId]);

  const isRunning = attackStats && attackStats.pendingAttacks > 0;

  return (
    <div className="at-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .at-root{font-family:'DM Sans',sans-serif;background:#F7F6F3;color:#1A1A1A;min-height:100vh;display:flex;flex-direction:column}
        .at-nav{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:56px;background:#fff;border-bottom:1px solid #E8E6E0;position:sticky;top:0;z-index:100}
        .at-nav-left{display:flex;align-items:center;gap:16px}
        .at-back-btn{display:flex;align-items:center;gap:6px;font-size:13px;color:#888;cursor:pointer;border:none;background:none;font-family:inherit;transition:color .15s}
        .at-back-btn:hover{color:#1A1A1A}
        .at-nav-sep{width:1px;height:18px;background:#E8E6E0}
        .at-logo{font-size:14px;font-weight:600;letter-spacing:-.3px}
        .at-run-badge{display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px}
        .at-run-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:fp-pulse 2s infinite}
        @keyframes fp-pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .at-tab-group{display:flex;gap:2px;background:#F0EDE6;padding:3px;border-radius:8px}
        .at-tab{padding:5px 14px;font-size:13px;font-weight:500;border-radius:6px;cursor:pointer;border:none;background:transparent;color:#888;font-family:inherit;transition:all .15s}
        .at-tab.active{background:#fff;color:#1A1A1A;box-shadow:0 1px 3px rgba(0,0,0,.08)}
        .at-main{display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:1400px;width:100%;margin:0 auto;padding:24px;align-items:start}
        .at-col{display:flex;flex-direction:column;gap:16px}
        .at-card{background:#fff;border:1px solid #E8E6E0;border-radius:10px;overflow:hidden}
        .at-card-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #F0EDE6}
        .at-card-title{font-size:13px;font-weight:600;letter-spacing:-.2px}
        .at-card-sub{font-size:11px;color:#BBB;margin-top:1px}
        .at-card-bd{padding:20px}
        .at-form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px}
        .at-form-grp{display:flex;flex-direction:column;gap:5px}
        .at-form-grp.full{grid-column:1/-1}
        .at-lbl{font-size:11px;font-weight:500;color:#999;letter-spacing:.3px;text-transform:uppercase}
        .at-sel,.at-inp{height:36px;background:#F7F6F3;border:1px solid #E8E6E0;border-radius:7px;padding:0 12px;font-size:13px;font-family:inherit;color:#1A1A1A;outline:none;transition:border-color .15s;width:100%}
        .at-sel{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
        .at-sel:focus,.at-inp:focus{border-color:#1A1A1A;background:#fff}
        .at-slider-wrap{display:flex;flex-direction:column;gap:6px}
        .at-slider-hd{display:flex;justify-content:space-between;align-items:center}
        .at-slider-val{font-family:'DM Mono',monospace;font-size:12px;font-weight:500}
        .at-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:#E8E6E0;outline:none;cursor:pointer}
        .at-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#1A1A1A;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer}
        .at-btn-test{width:100%;height:36px;border-radius:7px;border:1px solid #E8E6E0;background:#fff;font-family:inherit;font-size:13px;font-weight:500;color:#1A1A1A;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px}
        .at-btn-test:hover:not(:disabled){background:#F7F6F3}
        .at-btn-test:disabled{opacity:.6;cursor:not-allowed}
        .at-btn-test.connected{border-color:#22C55E;color:#15803D;background:#F0FDF4}
        .at-btn-test.failed{border-color:#EF4444;color:#DC2626;background:#FEF2F2}
        .at-btn-start{height:36px;padding:0 20px;border-radius:7px;border:none;background:#1A1A1A;font-family:inherit;font-size:13px;font-weight:500;color:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;white-space:nowrap}
        .at-btn-start:hover:not(:disabled){background:#333}
        .at-btn-start:disabled{opacity:.45;cursor:not-allowed}
        .at-btn-start.stop{background:#EF4444}
        .at-btn-start.stop:hover{background:#DC2626}
        .at-conn-ok{font-size:11px;color:#15803D;background:#F0FDF4;padding:3px 8px;border-radius:20px;font-weight:500}
        .at-conn-fail{font-size:11px;color:#DC2626;background:#FEF2F2;padding:3px 8px;border-radius:20px;font-weight:500}
        .at-error-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:7px;font-size:12px;color:#DC2626;margin-bottom:12px}
        .at-full{grid-column:1/-1}
        .at-table{width:100%;border-collapse:collapse;font-size:13px}
        .at-table th{text-align:left;padding:10px 16px;font-size:11px;font-weight:500;color:#BBB;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid #F0EDE6;background:#FAFAF9;white-space:nowrap}
        .at-table td{padding:12px 16px;border-bottom:1px solid #F9F8F6;vertical-align:middle}
        .at-table tr.data:hover td{background:#FAFAF9}
        .at-table tr:last-child td{border-bottom:none}
        .at-table tr.data{cursor:pointer}
        .at-st-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;white-space:nowrap}
        .at-st-dot{width:5px;height:5px;border-radius:50%}
        .at-prompt-txt{font-family:'DM Mono',monospace;font-size:11px;color:#666;max-width:520px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5}
        tr.expanded .at-prompt-txt{white-space:normal}
        .at-ts{font-family:'DM Mono',monospace;font-size:11px;color:#CCC}
        .at-idx{font-family:'DM Mono',monospace;font-size:11px;color:#DDD}
        .at-tbl-empty{text-align:center;padding:48px 20px;color:#CCC;font-size:13px}
        .at-tbl-summary{display:flex;gap:16px;padding:12px 16px;border-top:1px solid #F0EDE6;background:#FAFAF9;align-items:center;flex-wrap:wrap}
        .at-sum-item{display:flex;align-items:center;gap:6px;font-size:12px;color:#999}
        .at-sum-dot{width:6px;height:6px;border-radius:50%}
        .at-sum-count{font-family:'DM Mono',monospace;font-weight:500;color:#1A1A1A}
        .at-stats-row{display:flex;gap:16px;margin-left:auto;font-family:'DM Mono',monospace;font-size:11px;color:#999}
        .at-stats-val{color:#1A1A1A;font-weight:500}
        @keyframes spin{to{transform:rotate(360deg)}}
        .at-spinner{animation:spin .8s linear infinite}
        .at-no-run{display:flex;align-items:center;justify-content:center;padding:80px 24px;color:#CCC;font-size:14px;grid-column:1/-1}
      `}</style>

      {/* Nav */}
      <nav className="at-nav">
        <div className="at-nav-left">
          <button className="at-back-btn" onClick={onBack}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Runs
          </button>
          <div className="at-nav-sep" />
          <span className="at-logo">FortiPrompt</span>
          {activeRunId && (
            <div className="at-run-badge">
              <span className="at-run-dot" />
              Run: {activeRunId.slice(-8)}
            </div>
          )}
        </div>
        <div className="at-tab-group">
          <button className={`at-tab ${activeTab === 'attack' ? 'active' : ''}`} onClick={() => setActiveTab('attack')}>Attack Testing</button>
          <button className={`at-tab ${activeTab === 'defense' ? 'active' : ''}`} onClick={() => setActiveTab('defense')}>Defense Testing</button>
        </div>
      </nav>

      {!activeRunId ? (
        <div className="at-no-run">
          No active run selected — go back to the dashboard and open a run first.
        </div>
      ) : (
        <div className="at-main">
          {/* LEFT COL - CONSOLIDATED Attack Configuration */}
          <div className="at-col">
            <div className="at-card">
              <div className="at-card-hd">
                <div>
                  <div className="at-card-title">Attack Configuration</div>
                  <div className="at-card-sub">Configure model, backend, and attack parameters</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {connectionStatus === 'connected' && <span className="at-conn-ok">● Connected</span>}
                  {connectionStatus === 'failed'    && <span className="at-conn-fail">✕ Failed</span>}
                  <button
                    className={`at-btn-start ${isRunning ? 'stop' : ''}`}
                    onClick={isRunning ? handleStop : handleStart}
                    disabled={!isRunning && !config.modelUrl}
                    title={!isRunning && !config.modelUrl ? 'Enter a Model URL first' : undefined}
                  >
                    {isRunning ? 'Stop' : 'Start Attack'}
                  </button>
                </div>
              </div>
              <div className="at-card-bd">
                {attackError && (
                  <div className="at-error-bar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5V7M7 9.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    {attackError}
                  </div>
                )}

                {/* Model & Engine */}
                <div className="at-form-row">
                  <div className="at-form-grp full">
                    <label className="at-lbl">Model & Engine</label>
                    <select 
                      className="at-sel" 
                      value={`${currentModelOption.engine}:${currentModelOption.model}`}
                      onChange={e => {
                        const [engine, ...modelParts] = e.target.value.split(':');
                        const model = modelParts.join(':');
                        const selected = MODEL_OPTIONS.find(opt => opt.engine === engine && opt.model === model);
                        if (selected) handleModelSelect(selected);
                      }}
                    >
                      {MODEL_OPTIONS.map(opt => (
                        <option key={`${opt.engine}:${opt.model}`} value={`${opt.engine}:${opt.model}`}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Strategy & Domain */}
                <div className="at-form-row">
                  <div className="at-form-grp">
                    <label className="at-lbl">Attack Strategy</label>
                    <select className="at-sel" value={config.attackStrategy} onChange={e => update('attackStrategy', e.target.value as AttackStrategy)}>
                      {ATTACK_STRATEGIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="at-form-grp">
                    <label className="at-lbl">Domain</label>
                    <select className="at-sel" value={config.domain} onChange={e => update('domain', e.target.value as AttackDomain)}>
                      {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Model URL */}
                <div className="at-form-row">
                  <div className="at-form-grp full">
                    <label className="at-lbl">Model URL</label>
                    <input className="at-inp" placeholder="http://localhost:11434/api/generate" value={config.modelUrl} onChange={e => update('modelUrl', e.target.value)} />
                  </div>
                </div>

                {/* API Key */}
                <div className="at-form-row">
                  <div className="at-form-grp full">
                    <label className="at-lbl">API Key (Optional)</label>
                    <input className="at-inp" type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                  </div>
                </div>

                {/* Test Connection Button */}
                <div style={{ marginBottom: 16 }}>
                  <button
                    className={`at-btn-test ${connectionStatus === 'connected' ? 'connected' : connectionStatus === 'failed' ? 'failed' : ''}`}
                    onClick={handleTestConnection}
                    disabled={connectionStatus === 'testing' || !config.modelUrl}
                  >
                    {connectionStatus === 'testing' && (
                      <svg className="at-spinner" width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3" strokeDasharray="9 5" strokeLinecap="round"/>
                      </svg>
                    )}
                    {connectionStatus === 'connected' ? '✓ Connection verified'
                      : connectionStatus === 'failed'  ? '✕ Retry connection'
                      : connectionStatus === 'testing' ? 'Testing…'
                      : 'Test Connection'}
                  </button>
                </div>

                {/* Iterations & Temperature */}
                <div className="at-form-row" style={{ marginBottom: 0 }}>
                  <div className="at-form-grp">
                    <label className="at-lbl">Iterations</label>
                    <input
                      className="at-inp"
                      type="number"
                      min={1}
                      max={1000}
                      value={config.iterations}
                      onChange={e => update('iterations', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="at-form-grp">
                    <div className="at-slider-wrap">
                      <div className="at-slider-hd">
                        <label className="at-lbl">Temperature</label>
                        <span className="at-slider-val">{(config.parameters?.temperature ?? 0.7).toFixed(2)}</span>
                      </div>
                      <input
                        type="range"
                        className="at-range"
                        min={0} max={2} step={0.01}
                        value={config.parameters?.temperature ?? 0.7}
                        onChange={e => updateParam('temperature', parseFloat(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COL — Stats card */}
          <div className="at-col">
            <div className="at-card">
              <div className="at-card-hd">
                <div>
                  <div className="at-card-title">Attack Statistics</div>
                  <div className="at-card-sub">Live progress for this run</div>
                </div>
              </div>
              <div className="at-card-bd" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {attackStats ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                      {[
                        { label: 'Total',     val: attackStats.totalPrompts    },
                        { label: 'Generated', val: attackStats.attacksGenerated },
                        { label: 'Pending',   val: attackStats.pendingAttacks  },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '12px 14px' }}>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color: '#1A1A1A' }}>{val}</div>
                          <div style={{ fontSize: 11, color: '#BBB', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                    {attackStats.totalPrompts > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 11, color: '#999' }}>
                          <span>Progress</span>
                          <span style={{ fontFamily: "'DM Mono', monospace" }}>
                            {Math.round((attackStats.attacksGenerated / attackStats.totalPrompts) * 100)}%
                          </span>
                        </div>
                        <div style={{ height: 4, background: '#E8E6E0', borderRadius: 2 }}>
                          <div style={{
                            height: '100%',
                            width: `${(attackStats.attacksGenerated / attackStats.totalPrompts) * 100}%`,
                            background: '#1A1A1A',
                            borderRadius: 2,
                            transition: 'width .4s ease',
                          }} />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '24px 0' }}>
                    {isAttacking ? 'Waiting for first stat update…' : 'Start an attack to see live statistics'}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FULL-WIDTH — Prompt table (No filter buttons, only "All" view) */}
          <div className="at-card at-full">
            <div className="at-card-hd">
              <div>
                <div className="at-card-title">Generated Attack Prompts</div>
                <div className="at-card-sub">
                  {isAttacking ? 'Attack running…' : `${attackPrompts.length} prompt${attackPrompts.length !== 1 ? 's' : ''} generated`}
                </div>
              </div>
            </div>

            {isAttacking && attackPrompts.length === 0 ? (
              <div className="at-tbl-empty">
                <svg className="at-spinner" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ margin: '0 auto 10px', display: 'block' }}>
                  <circle cx="10" cy="10" r="8" stroke="#E8E6E0" strokeWidth="2"/>
                  <path d="M10 2a8 8 0 0 1 8 8" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Generating prompts…
              </div>
            ) : attackPrompts.length === 0 ? (
              <div className="at-tbl-empty">
                No prompts yet — configure your attack and press Start Attack.
              </div>
            ) : (
              <>
                <table className="at-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}></th>
                      <th>Status</th>
                      <th>Content</th>
                      <th>Prompt ID</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attackPrompts.map((p: AttackPrompt, idx: number) => {
                      const sc = STATUS_CONFIG[p.status] || {
                        label: p.status,
                        bg: '#EFF6FF', // Default background
                        color: '#1D4ED8', // Default color
                        dot: '#3B82F6',   // Default dot color
                      };
                      const isExp = expandedId === p.promptId;
                      return (
                        <tr key={p.promptId} className={`data ${isExp ? 'expanded' : ''}`} onClick={() => setExpandedId(isExp ? null : p.promptId)}>
                          <td className="at-idx">{String(idx + 1).padStart(2, '0')}</td>
                          <td>
                            <span className="at-st-badge" style={{ background: sc.bg, color: sc.color }}>
                              <span className="at-st-dot" style={{ background: sc.dot }} />{sc.label}
                            </span>
                          </td>
                          <td><div className="at-prompt-txt">{p.content}</div></td>
                          <td><span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: '#999' }}>{p.promptId}</span></td>
                          <td><span className="at-ts">{new Date(p.timestamp).toLocaleTimeString()}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="at-tbl-summary">
                  {(['generated', 'sent', 'breached', 'blocked', 'failed'] as AttackStatus[]).map(s => {
                    const sc = STATUS_CONFIG[s];
                    const count = attackPrompts.filter(p => p.status === s).length;
                    if (count === 0) return null;
                    return (
                      <div key={s} className="at-sum-item">
                        <span className="at-sum-dot" style={{ background: sc.dot }} />
                        <span className="at-sum-count">{count}</span>
                        <span>{sc.label}</span>
                      </div>
                    );
                  })}
                  <div className="at-stats-row">
                    <span>Total: <span className="at-stats-val">{attackPrompts.length}</span></span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttackTestingPage;