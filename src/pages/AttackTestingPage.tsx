import React, { useState } from 'react';
import {
  AttackConfig,
  AttackType,
  BackendType,
  ModelSelection,
  AttackPrompt,
  AttackStatus,
} from '../types';
import { useAppStore } from '../store/appStore';
import { testConnection, startAttack, stopAttack } from '../services/api';
import { generateRunId, nowISO } from '../utils/run';

interface AttackTestingPageProps {
  onBack: () => void;
}

const STATUS_CONFIG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
  success: { label: 'Success', bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  partial:  { label: 'Partial',  bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  blocked:  { label: 'Blocked',  bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
  running:  { label: 'Running',  bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
};

const DEFAULT_CONFIG: AttackConfig = {
  backendType: 'Google Colab',
  connectionUrl: '',
  apiKey: '',
  modelSelection: 'GPT-4o-mini',
  attackType: 'Direct Injection',
  targetUrl: 'https://api.target.com/chat',
  attackRate: 1.0,
  maxIterations: 100,
  successThreshold: 0.70,
  initialAttackPrompt: '',
  attackScenario: '',
  targetInformation: '',
};

const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ onBack }) => {
  // Local UI state
  const [config, setConfig] = useState<AttackConfig>(DEFAULT_CONFIG);
  const [activeTab, setActiveTab] = useState<'attack' | 'defense'>('attack');
  const [filter, setFilter] = useState<'all' | AttackStatus>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Global store — read
  const activeRunId      = useAppStore(s => s.activeRunId);
  const attackPrompts    = useAppStore(s => s.attackPrompts);
  const isAttacking      = useAppStore(s => s.isAttacking);
  const attackError      = useAppStore(s => s.attackError);
  const connectionStatus = useAppStore(s => s.connectionStatus);

  // Global store — write
  const setAttackConfig     = useAppStore(s => s.setAttackConfig);
  const setAttackPrompts    = useAppStore(s => s.setAttackPrompts);
  const clearAttackPrompts  = useAppStore(s => s.clearAttackPrompts);
  const setIsAttacking      = useAppStore(s => s.setIsAttacking);
  const setAttackError      = useAppStore(s => s.setAttackError);
  const setConnectionStatus = useAppStore(s => s.setConnectionStatus);
  const addRun              = useAppStore(s => s.addRun);
  const setActiveRun        = useAppStore(s => s.setActiveRun);
  const updateRun           = useAppStore(s => s.updateRun);

  // Derived
  const filtered  = filter === 'all' ? attackPrompts : attackPrompts.filter(p => p.status === filter);
  const avgScore  = attackPrompts.length > 0
    ? (attackPrompts.reduce((a, p) => a + p.score, 0) / attackPrompts.length).toFixed(2)
    : '—';

  const update = (key: keyof AttackConfig, val: unknown) =>
    setConfig(prev => ({ ...prev, [key]: val }));

  // ── Test connection ────────────────────────────────────────────────────────
  const handleTestConnection = async () => {
    if (!config.connectionUrl) return;
    setConnectionStatus('testing');
    const ok = await testConnection(config.connectionUrl, config.apiKey || undefined);
    setConnectionStatus(ok ? 'connected' : 'failed');
  };

  // ── Start attack ──────────────────────────────────────────────────────────
  const handleStart = async () => {
    setAttackError(null);
    clearAttackPrompts();

    let runId = activeRunId;
    if (!runId) {
      runId = generateRunId();
      addRun({
        id: runId,
        name: `Attack – ${new Date().toLocaleTimeString()}`,
        status: 'running',
        components: ['attack-testing'],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      });
      setActiveRun(runId);
    } else {
      updateRun(runId, { status: 'running', updatedAt: nowISO() });
    }

    setAttackConfig(config);
    setIsAttacking(true);

    try {
      const prompts = await startAttack(runId, config);
      setAttackPrompts(prompts);
      updateRun(runId, { status: 'completed', updatedAt: nowISO(), prompts });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Attack failed';
      setAttackError(msg);
      updateRun(runId, { status: 'failed', updatedAt: nowISO() });
    } finally {
      setIsAttacking(false);
    }
  };

  // ── Stop attack ───────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!activeRunId) return;
    try { await stopAttack(activeRunId); } catch { /* best-effort */ }
    setIsAttacking(false);
    updateRun(activeRunId, { status: 'completed', updatedAt: nowISO() });
  };

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
        .at-ta{width:100%;background:#F7F6F3;border:1px solid #E8E6E0;border-radius:7px;padding:10px 12px;font-size:13px;font-family:inherit;color:#1A1A1A;outline:none;resize:vertical;min-height:82px;line-height:1.55;transition:border-color .15s}
        .at-ta:focus{border-color:#1A1A1A;background:#fff}
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
        .at-tbl-filters{display:flex;gap:8px;align-items:center}
        .at-f-btn{height:28px;padding:0 12px;border-radius:20px;border:1px solid #E8E6E0;background:transparent;font-family:inherit;font-size:12px;color:#888;cursor:pointer;transition:all .15s}
        .at-f-btn:hover{border-color:#999;color:#444}
        .at-f-btn.on{background:#1A1A1A;color:#fff;border-color:#1A1A1A}
        .at-table{width:100%;border-collapse:collapse;font-size:13px}
        .at-table th{text-align:left;padding:10px 16px;font-size:11px;font-weight:500;color:#BBB;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid #F0EDE6;background:#FAFAF9;white-space:nowrap}
        .at-table td{padding:12px 16px;border-bottom:1px solid #F9F8F6;vertical-align:middle}
        .at-table tr.data:hover td{background:#FAFAF9}
        .at-table tr:last-child td{border-bottom:none}
        .at-table tr.data{cursor:pointer}
        .at-st-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;white-space:nowrap}
        .at-st-dot{width:5px;height:5px;border-radius:50%}
        .at-prompt-txt{font-family:'DM Mono',monospace;font-size:11px;color:#666;max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:1.5}
        tr.expanded .at-prompt-txt{white-space:normal}
        .at-type-tag{display:inline-block;padding:2px 8px;background:#F0EDE6;border-radius:4px;font-size:11px;color:#666;white-space:nowrap}
        .at-cat{font-size:11px;color:#999}
        .at-score-bar{display:flex;align-items:center;gap:8px}
        .at-score-track{width:56px;height:4px;background:#E8E6E0;border-radius:2px}
        .at-score-fill{height:100%;border-radius:2px}
        .at-score-num{font-family:'DM Mono',monospace;font-size:12px;color:#666}
        .at-ts{font-family:'DM Mono',monospace;font-size:11px;color:#CCC}
        .at-idx{font-family:'DM Mono',monospace;font-size:11px;color:#DDD}
        .at-tbl-empty{text-align:center;padding:48px 20px;color:#CCC;font-size:13px}
        .at-tbl-summary{display:flex;gap:16px;padding:12px 16px;border-top:1px solid #F0EDE6;background:#FAFAF9;align-items:center;flex-wrap:wrap}
        .at-sum-item{display:flex;align-items:center;gap:6px;font-size:12px;color:#999}
        .at-sum-dot{width:6px;height:6px;border-radius:50%}
        .at-sum-count{font-family:'DM Mono',monospace;font-weight:500;color:#1A1A1A}
        .at-avg{margin-left:auto;font-family:'DM Mono',monospace;font-size:12px;color:#CCC}
        @keyframes spin{to{transform:rotate(360deg)}}
        .at-spinner{animation:spin .8s linear infinite}
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
          <div className="at-run-badge">
            <span className="at-run-dot" />
            {activeRunId ? `Run: ${activeRunId.slice(-6)}` : 'RAG Jailbreak Testing'}
          </div>
        </div>
        <div className="at-tab-group">
          <button className={`at-tab ${activeTab === 'attack' ? 'active' : ''}`} onClick={() => setActiveTab('attack')}>Attack Testing</button>
          <button className={`at-tab ${activeTab === 'defense' ? 'active' : ''}`} onClick={() => setActiveTab('defense')}>Defense Testing</button>
        </div>
      </nav>

      <div className="at-main">
        {/* LEFT */}
        <div className="at-col">
          {/* Backend */}
          <div className="at-card">
            <div className="at-card-hd">
              <div>
                <div className="at-card-title">Attacker Backend</div>
                <div className="at-card-sub">Connect to your LLM backend</div>
              </div>
              {connectionStatus === 'connected' && <span className="at-conn-ok">● Connected</span>}
              {connectionStatus === 'failed'    && <span className="at-conn-fail">✕ Failed</span>}
            </div>
            <div className="at-card-bd">
              <div className="at-form-row">
                <div className="at-form-grp">
                  <label className="at-lbl">Backend Type</label>
                  <select className="at-sel" value={config.backendType} onChange={e => update('backendType', e.target.value as BackendType)}>
                    {(['Google Colab','OpenAI','Anthropic','Custom API'] as BackendType[]).map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
                <div className="at-form-grp">
                  <label className="at-lbl">Model</label>
                  <select className="at-sel" value={config.modelSelection} onChange={e => update('modelSelection', e.target.value as ModelSelection)}>
                    {(['GPT-4o-mini','GPT-4o','claude-3-5-sonnet','claude-3-haiku','gemini-1.5-flash'] as ModelSelection[]).map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="at-form-row">
                <div className="at-form-grp full">
                  <label className="at-lbl">Connection URL</label>
                  <input className="at-inp" placeholder="https://your-backend.com/api" value={config.connectionUrl} onChange={e => update('connectionUrl', e.target.value)} />
                </div>
              </div>
              <div className="at-form-row" style={{ marginBottom: 16 }}>
                <div className="at-form-grp full">
                  <label className="at-lbl">API Key (Optional)</label>
                  <input className="at-inp" type="password" placeholder="sk-..." value={config.apiKey} onChange={e => update('apiKey', e.target.value)} />
                </div>
              </div>
              <button
                className={`at-btn-test ${connectionStatus === 'connected' ? 'connected' : connectionStatus === 'failed' ? 'failed' : ''}`}
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing' || !config.connectionUrl}
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
          </div>

          {/* Attack Config */}
          <div className="at-card">
            <div className="at-card-hd">
              <div>
                <div className="at-card-title">Attack Configuration</div>
                <div className="at-card-sub">Define attack parameters</div>
              </div>
              <button
                className={`at-btn-start ${isAttacking ? 'stop' : ''}`}
                onClick={isAttacking ? handleStop : handleStart}
                disabled={!isAttacking && connectionStatus !== 'connected'}
                title={!isAttacking && connectionStatus !== 'connected' ? 'Connect to a backend first' : undefined}
              >
                {isAttacking ? (
                  <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1.5" y="1.5" width="2.5" height="7" fill="white" rx=".5"/><rect x="6" y="1.5" width="2.5" height="7" fill="white" rx=".5"/></svg>Stop</>
                ) : (
                  <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="white"/></svg>Start Attack</>
                )}
              </button>
            </div>
            <div className="at-card-bd">
              {attackError && (
                <div className="at-error-bar">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5V7M7 9.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  {attackError}
                </div>
              )}
              <div className="at-form-row">
                <div className="at-form-grp">
                  <label className="at-lbl">Attack Type</label>
                  <select className="at-sel" value={config.attackType} onChange={e => update('attackType', e.target.value as AttackType)}>
                    {(['Direct Injection','Indirect Injection','Prompt Leaking','Jailbreak','Chain Attack','Role Play Exploit'] as AttackType[]).map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div className="at-form-grp">
                  <label className="at-lbl">Target URL / API</label>
                  <input className="at-inp" placeholder="https://api.target.com/chat" value={config.targetUrl} onChange={e => update('targetUrl', e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div className="at-slider-wrap">
                  <div className="at-slider-hd">
                    <label className="at-lbl">Attack Rate (req/s)</label>
                    <span className="at-slider-val">{config.attackRate.toFixed(1)}</span>
                  </div>
                  <input type="range" className="at-range" min={0.1} max={10} step={0.1} value={config.attackRate} onChange={e => update('attackRate', parseFloat(e.target.value))} />
                </div>
              </div>
              <div className="at-form-row" style={{ marginBottom: 0 }}>
                <div className="at-form-grp">
                  <label className="at-lbl">Max Iterations</label>
                  <input className="at-inp" type="number" value={config.maxIterations} onChange={e => update('maxIterations', parseInt(e.target.value))} />
                </div>
                <div className="at-form-grp">
                  <div className="at-slider-wrap">
                    <div className="at-slider-hd">
                      <label className="at-lbl">Success Threshold</label>
                      <span className="at-slider-val">{config.successThreshold.toFixed(2)}</span>
                    </div>
                    <input type="range" className="at-range" min={0} max={1} step={0.01} value={config.successThreshold} onChange={e => update('successThreshold', parseFloat(e.target.value))} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="at-col">
          <div className="at-card">
            <div className="at-card-hd">
              <div>
                <div className="at-card-title">Prompt &amp; Scenario</div>
                <div className="at-card-sub">Define what to test and extract</div>
              </div>
            </div>
            <div className="at-card-bd" style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div className="at-form-grp">
                <label className="at-lbl">Initial Attack Prompt</label>
                <textarea className="at-ta" rows={4} placeholder="Enter your initial attack prompt..." value={config.initialAttackPrompt} onChange={e => update('initialAttackPrompt', e.target.value)} />
              </div>
              <div className="at-form-grp">
                <label className="at-lbl">Attack Scenario</label>
                <textarea className="at-ta" rows={3} placeholder="Describe the attack scenario and context..." value={config.attackScenario} onChange={e => update('attackScenario', e.target.value)} />
              </div>
              <div className="at-form-grp">
                <label className="at-lbl">Target Information</label>
                <textarea className="at-ta" rows={3} placeholder="What are you trying to extract or exploit?" value={config.targetInformation} onChange={e => update('targetInformation', e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* TABLE full width */}
        <div className="at-card at-full">
          <div className="at-card-hd">
            <div>
              <div className="at-card-title">Generated Attack Prompts</div>
              <div className="at-card-sub">
                {isAttacking ? 'Attack running…'
                  : `${filtered.length} prompt${filtered.length !== 1 ? 's' : ''} ${filter === 'all' ? 'generated' : `(${filter})`}`}
              </div>
            </div>
            <div className="at-tbl-filters">
              {(['all','success','partial','blocked'] as const).map(f => (
                <button key={f} className={`at-f-btn ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {isAttacking && attackPrompts.length === 0 ? (
            <div className="at-tbl-empty">
              <svg className="at-spinner" width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ margin:'0 auto 10px', display:'block' }}>
                <circle cx="10" cy="10" r="8" stroke="#E8E6E0" strokeWidth="2"/>
                <path d="M10 2a8 8 0 0 1 8 8" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              Generating prompts…
            </div>
          ) : filtered.length === 0 ? (
            <div className="at-tbl-empty">
              No prompts yet — configure your attack and press Start Attack.
            </div>
          ) : (
            <>
              <table className="at-table">
                <thead>
                  <tr>
                    <th style={{ width:36 }}></th>
                    <th>Status</th><th>Prompt</th><th>Attack Type</th>
                    <th>Category</th><th>Score</th><th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, idx) => {
                    const sc = STATUS_CONFIG[p.status];
                    const isExp = expandedId === p.id;
                    const scoreColor = p.score >= 0.7 ? '#EF4444' : p.score >= 0.4 ? '#F59E0B' : '#22C55E';
                    return (
                      <tr key={p.id} className={`data ${isExp ? 'expanded' : ''}`} onClick={() => setExpandedId(isExp ? null : p.id)}>
                        <td className="at-idx">{String(idx + 1).padStart(2, '0')}</td>
                        <td>
                          <span className="at-st-badge" style={{ background:sc.bg, color:sc.color }}>
                            <span className="at-st-dot" style={{ background:sc.dot }} />{sc.label}
                          </span>
                        </td>
                        <td><div className="at-prompt-txt">{p.prompt}</div></td>
                        <td><span className="at-type-tag">{p.attackType}</span></td>
                        <td><span className="at-cat">{p.category}</span></td>
                        <td>
                          <div className="at-score-bar">
                            <div className="at-score-track">
                              <div className="at-score-fill" style={{ width:`${p.score*100}%`, background:scoreColor }} />
                            </div>
                            <span className="at-score-num">{p.score.toFixed(2)}</span>
                          </div>
                        </td>
                        <td><span className="at-ts">{p.timestamp}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="at-tbl-summary">
                {(['success','partial','blocked'] as AttackStatus[]).map(s => {
                  const sc = STATUS_CONFIG[s];
                  const count = attackPrompts.filter(p => p.status === s).length;
                  return (
                    <div key={s} className="at-sum-item">
                      <span className="at-sum-dot" style={{ background:sc.dot }} />
                      <span className="at-sum-count">{count}</span>
                      <span>{sc.label}</span>
                    </div>
                  );
                })}
                <span className="at-avg">avg score: {avgScore}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttackTestingPage;