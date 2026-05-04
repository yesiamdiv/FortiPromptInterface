import React, { useState, useEffect } from 'react';
import { AttackPrompt, AttackStatus, UpdateRunRequest } from '../types';
import { useAppStore } from '../store/appStore';
import {
  updateRun as updateRunApi, // Aliased to prevent collision with Zustand store
  startAutomaticRun, 
  stopRun,
  getStrategies, 
} from '../services/api';
import { websocketService } from '../services/websocket';

interface AttackTestingPageProps { onBack: () => void; }

const STATUS_CFG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
  generated: { label: 'Generated', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  sent:      { label: 'Sent',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  failed:    { label: 'Failed',    bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  breached:  { label: 'Breached',  bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
  blocked:   { label: 'Blocked',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
};

const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ onBack }) => {
  // ── STORE VARIABLES ────────────────────────────────────────────────────────
  const activeRunId      = useAppStore(s => s.activeRunId);
  const activeRun        = useAppStore(s => s.runs.find(r => r.runid === s.activeRunId));
  const attackPrompts    = useAppStore(s => s.attackPrompts); 
  const attackStats      = useAppStore(s => s.attackStats);
  const isAttacking      = useAppStore(s => s.isAttacking);
  const attackError      = useAppStore(s => s.attackError);
  const runProgress      = useAppStore(s => s.runProgress);

  const clearAttackPrompts  = useAppStore(s => s.clearAttackPrompts); 
  const setIsAttacking      = useAppStore(s => s.setIsAttacking);
  const setAttackError      = useAppStore(s => s.setAttackError);
  const updateRun           = useAppStore(s => s.updateRun); // Zustand store updater

  // ── LOCAL STATE ──────────────────────────────────────────────────────────
  // Form fields
  const [runName, setRunName]               = useState(activeRun?.name || '');
  const [runDesc, setRunDesc]               = useState(activeRun?.description || '');
  const [strategyName, setStrategyName]     = useState('jailbreak');
  const [strategyParams, setStrategyParams] = useState<Record<string,any>>({});
  
  // Discovery & UI state
  const [strategies, setStrategies] = useState<any[]>([]);
  const [loading, setLoading]       = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Sync local state if activeRun changes (e.g., from an external update)
  useEffect(() => {
    if (activeRun) {
      setRunName(activeRun.name);
      setRunDesc(activeRun.description || '');
    }
  }, [activeRun]);

  // ── Fetch discovery data on mount ──────────────────────────────────────────
  useEffect(() => {
    if (!activeRunId) return;
    const init = async () => {
      setLoading(true);
      try {
        // We only need strategies now, as providers/nodes are removed from this UI
        const strats = await getStrategies();
        setStrategies(strats);

        // Seed defaults from first strategy if none is selected
        if (strats.length > 0) {
          setStrategyName(strats[0].strategy_name);
          seedDefaults(strats[0].schema_definition);
        }
      } catch (e: any) {
        setAttackError(e.message);
      } finally {
        setLoading(false);
      }
    };
    init();
    
    websocketService.joinRun(activeRunId);
    return () => { websocketService.leaveRun(activeRunId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRunId]);

  const seedDefaults = (schema: Record<string,any>) => {
    const props = schema?.properties ?? {};
    const defs: Record<string,any> = {};
    for (const [k, def] of Object.entries(props) as [string,any][]) {
      if (def.default !== undefined) defs[k] = def.default;
      else if (def.enum?.length) defs[k] = def.enum[0];
    }
    setStrategyParams(defs);
  };

  const handleStrategyChange = (name: string) => {
    setStrategyName(name);
    const s = strategies.find(s => s.strategy_name === name);
    if (s) seedDefaults(s.schema_definition);
  };

  // ── Start ───────────────────────────────────────────────────────────────────
  const handleStart = async () => {
    if (!activeRunId) return;
    setAttackError(null);
    clearAttackPrompts();
    setIsAttacking(true);
    
    // Update local UI state immediately to show it's running
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });

    try {
      // 1. Build the payload explicitly for the updated backend PATCH route
      const updatePayload: UpdateRunRequest = {
        name: runName,
        description: runDesc,
        strategy_params: strategyParams
      };

      // 2. Sync the configuration with the database
      await updateRunApi(activeRunId, updatePayload); 

      // 3. Trigger the run execution
      await startAutomaticRun(activeRunId, { runtime_config: {} });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Attack failed';
      setAttackError(msg);
      setIsAttacking(false);
      updateRun(activeRunId, { status: 'failed', updatedAt: new Date().toISOString() });
    }
  };

  // ── Stop ────────────────────────────────────────────────────────────────────
  const handleStop = async () => {
    if (!activeRunId) return;
    try { await stopRun(activeRunId); } catch { /* best-effort */ }
    setIsAttacking(false);
    updateRun(activeRunId, { status: 'paused', updatedAt: new Date().toISOString() });
  };

  const currentSchema = strategies.find(s => s.strategy_name === strategyName)?.schema_definition;

  return (
    <div className="at-root">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        .at-root{font-family:'DM Sans',sans-serif;background:#F7F6F3;color:#1A1A1A;min-height:100vh;display:flex;flex-direction:column}
        .at-nav{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:56px;background:#fff;border-bottom:1px solid #E8E6E0;position:sticky;top:0;z-index:100}
        .at-nav-l{display:flex;align-items:center;gap:16px}
        .at-back{display:flex;align-items:center;gap:6px;font-size:13px;color:#888;cursor:pointer;border:none;background:none;font-family:inherit}
        .at-back:hover{color:#1A1A1A}
        .at-sep{width:1px;height:18px;background:#E8E6E0}
        .at-logo{font-size:14px;font-weight:600;letter-spacing:-.3px}
        .at-run-badge{display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px}
        .at-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:at-pulse 2s infinite}
        @keyframes at-pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .at-main{display:grid;grid-template-columns:360px 1fr;gap:20px;max-width:1400px;width:100%;margin:0 auto;padding:24px;align-items:start}
        .at-col{display:flex;flex-direction:column;gap:16px}
        .at-card{background:#fff;border:1px solid #E8E6E0;border-radius:10px;overflow:hidden}
        .at-card-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #F0EDE6}
        .at-card-title{font-size:13px;font-weight:600}
        .at-card-sub{font-size:11px;color:#BBB;margin-top:1px}
        .at-card-bd{padding:20px}
        .at-lbl{font-size:11px;font-weight:500;color:#999;letter-spacing:.3px;text-transform:uppercase;display:block;margin-bottom:5px}
        .at-sel,.at-inp{height:36px;background:#F7F6F3;border:1px solid #E8E6E0;border-radius:7px;padding:0 12px;font-size:13px;font-family:inherit;color:#1A1A1A;outline:none;transition:border-color .15s;width:100%}
        .at-sel{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
        .at-sel:focus,.at-inp:focus{border-color:#1A1A1A;background:#fff}
        .at-field{margin-bottom:12px}
        .at-field:last-child{margin-bottom:0}
        .at-btn-start{height:36px;padding:0 20px;border-radius:7px;border:none;background:#1A1A1A;font-family:inherit;font-size:13px;font-weight:500;color:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;white-space:nowrap}
        .at-btn-start:hover:not(:disabled){background:#333}.at-btn-start:disabled{opacity:.45;cursor:not-allowed}
        .at-btn-start.stop{background:#EF4444}.at-btn-start.stop:hover{background:#DC2626}
        .at-err{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:7px;font-size:12px;color:#DC2626;margin-bottom:12px}
        .at-full{grid-column:1/-1}
        .at-table{width:100%;border-collapse:collapse;font-size:13px}
        .at-table th{text-align:left;padding:10px 16px;font-size:11px;font-weight:500;color:#BBB;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid #F0EDE6;background:#FAFAF9;white-space:nowrap}
        .at-table td{padding:12px 16px;border-bottom:1px solid #F9F8F6;vertical-align:middle}
        .at-table tr.data:hover td{background:#FAFAF9}.at-table tr:last-child td{border-bottom:none}.at-table tr.data{cursor:pointer}
        .at-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500}
        .at-dot-sm{width:5px;height:5px;border-radius:50%}
        .at-mono{font-family:'DM Mono',monospace;font-size:11px;color:#666;max-width:500px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        tr.expanded .at-mono{white-space:normal}
        .at-ts{font-family:'DM Mono',monospace;font-size:11px;color:#CCC}
        .at-empty{text-align:center;padding:48px 20px;color:#CCC;font-size:13px}
        .at-summary{display:flex;gap:16px;padding:12px 16px;border-top:1px solid #F0EDE6;background:#FAFAF9;align-items:center;flex-wrap:wrap}
        .at-sum-item{display:flex;align-items:center;gap:6px;font-size:12px;color:#999}
        .at-sum-cnt{font-family:'DM Mono',monospace;font-weight:500;color:#1A1A1A}
        .at-no-run{display:flex;align-items:center;justify-content:center;padding:80px 24px;color:#CCC;font-size:14px;grid-column:1/-1}
        .at-prog-bar{height:4px;background:#E8E6E0;border-radius:2px;margin-top:10px}
        .at-prog-fill{height:100%;background:#1A1A1A;border-radius:2px;transition:width .4s ease}
        .at-stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
        .at-stat-cell{background:#F7F6F3;border:1px solid #E8E6E0;border-radius:8px;padding:12px 14px}
        .at-stat-val{font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#1A1A1A}
        .at-stat-lbl{font-size:10px;color:#BBB;margin-top:2px;text-transform:uppercase;letter-spacing:.3px}
        @keyframes spin{to{transform:rotate(360deg)}}
        .at-spin{animation:spin .8s linear infinite}
        .at-schema-sep{height:1px;background:#F0EDE6;margin:16px 0}
      `}</style>

      {/* Nav */}
      <nav className="at-nav">
        <div className="at-nav-l">
          <button className="at-back" onClick={onBack}>← Runs</button>
          <div className="at-sep"/>
          <span className="at-logo">FortiPrompt</span>
          {activeRunId && (
            <div className="at-run-badge">
              <span className="at-dot"/>
              {activeRunId.slice(-8)}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className={`at-btn-start ${isAttacking ? 'stop' : ''}`}
            onClick={isAttacking ? handleStop : handleStart}
            disabled={!activeRunId || loading}
          >
            {isAttacking ? 'Stop' : 'Start Attack'}
          </button>
        </div>
      </nav>

      {!activeRunId ? (
        <div className="at-no-run">No active run — go back and open a run first.</div>
      ) : (
        <div className="at-main">
          {/* LEFT — Config */}
          <div className="at-col">
            <div className="at-card">
              <div className="at-card-hd">
                <div>
                  <div className="at-card-title">Run Configuration</div>
                  <div className="at-card-sub">Name, Description, and Dependencies</div>
                </div>
              </div>
              <div className="at-card-bd">
                {attackError && (
                  <div className="at-err">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5V7M7 9.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    {attackError}
                  </div>
                )}

                {loading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 8 }}>
                    <svg className="at-spin" width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="7" stroke="#E8E6E0" strokeWidth="2"/><path d="M9 2a7 7 0 0 1 7 7" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>
                    <span style={{ fontSize: 13, color: '#888' }}>Loading configuration…</span>
                  </div>
                ) : (
                  <>
                    {/* Thing 1: Run Name */}
                    <div className="at-field">
                      <label className="at-lbl">Run Name</label>
                      <input 
                        className="at-inp" 
                        value={runName} 
                        onChange={e => setRunName(e.target.value)} 
                        placeholder="Name of your run" 
                      />
                    </div>

                    {/* Thing 2: Description */}
                    <div className="at-field">
                      <label className="at-lbl">Description</label>
                      <input 
                        className="at-inp" 
                        value={runDesc} 
                        onChange={e => setRunDesc(e.target.value)} 
                        placeholder="Optional description" 
                      />
                    </div>

                    <div className="at-schema-sep"/>

                    {/* Strategy Selection */}
                    <div className="at-field">
                      <label className="at-lbl">Attack Strategy</label>
                      <select className="at-sel" value={strategyName} onChange={e => handleStrategyChange(e.target.value)}>
                        {strategies.map(s => <option key={s.strategy_name} value={s.strategy_name}>{s.strategy_name}</option>)}
                      </select>
                    </div>

                    {/* Thing 3: Dynamic Strategy Dependencies */}
                    {currentSchema && Object.keys(currentSchema.properties ?? {}).length > 0 && (
                      <div className="at-field">
                        <label className="at-lbl">Strategy Dependencies</label>
                        {Object.entries(currentSchema.properties ?? {}).map(([key, def]: [string, any]) => {
                          const val = strategyParams[key] ?? def.default ?? '';
                          if (def.enum) return (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <label className="at-lbl" style={{ fontSize: 10 }}>{def.title ?? key}</label>
                              <select className="at-sel" value={val} onChange={e => setStrategyParams(p => ({...p, [key]: e.target.value}))}>
                                {def.enum.map((v: string) => <option key={v}>{v}</option>)}
                              </select>
                            </div>
                          );
                          if (def.type === 'integer' || def.type === 'number') return (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <label className="at-lbl" style={{ fontSize: 10 }}>{def.title ?? key}</label>
                              <input className="at-inp" type="number" min={def.minimum} max={def.maximum} value={val}
                                onChange={e => setStrategyParams(p => ({...p, [key]: def.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)}))} />
                            </div>
                          );
                          return (
                            <div key={key} style={{ marginBottom: 10 }}>
                              <label className="at-lbl" style={{ fontSize: 10 }}>{def.title ?? key}</label>
                              <input className="at-inp" type="text" placeholder={def.examples?.[0] ?? ''} value={val}
                                onChange={e => setStrategyParams(p => ({...p, [key]: e.target.value}))} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT — Stats */}
          <div className="at-col">
            <div className="at-card">
              <div className="at-card-hd">
                <div>
                  <div className="at-card-title">Run Statistics</div>
                  <div className="at-card-sub">Live progress</div>
                </div>
              </div>
              <div className="at-card-bd">
                {attackStats ? (
                  <>
                    <div className="at-stat-grid">
                      {[
                        { label: 'Total',     val: attackStats.totalPrompts },
                        { label: 'Generated', val: attackStats.attacksGenerated },
                        { label: 'Pending',   val: attackStats.pendingAttacks },
                      ].map(({ label, val }) => (
                        <div key={label} className="at-stat-cell">
                          <div className="at-stat-val">{val}</div>
                          <div className="at-stat-lbl">{label}</div>
                        </div>
                      ))}
                    </div>
                    {attackStats.totalPrompts > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 4 }}>
                          <span>Progress</span>
                          <span style={{ fontFamily: 'DM Mono,monospace' }}>
                            {Math.round((attackStats.attacksGenerated / attackStats.totalPrompts) * 100)}%
                          </span>
                        </div>
                        <div className="at-prog-bar">
                          <div className="at-prog-fill" style={{ width: `${(attackStats.attacksGenerated / attackStats.totalPrompts) * 100}%` }}/>
                        </div>
                      </div>
                    )}
                  </>
                ) : runProgress ? (
                  <div>
                    <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{runProgress.message}</div>
                    <div className="at-prog-bar">
                      <div className="at-prog-fill" style={{ width: `${runProgress.progress_percent}%` }}/>
                    </div>
                    <div style={{ fontSize: 11, color: '#BBB', marginTop: 6, fontFamily: 'DM Mono,monospace' }}>
                      {runProgress.current} / {runProgress.total}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '24px 0' }}>
                    {isAttacking ? 'Waiting for first stat update…' : 'Start an attack to see live statistics'}
                  </div>
                )}
              </div>
            </div>

            {/* Prompt table */}
            <div className="at-card">
              <div className="at-card-hd">
                <div>
                  <div className="at-card-title">Generated Prompts</div>
                  <div className="at-card-sub">
                    {isAttacking ? 'Streaming…' : `${attackPrompts.length} prompts`}
                  </div>
                </div>
              </div>

              {attackPrompts.length === 0 ? (
                <div className="at-empty">
                  {isAttacking
                    ? <><svg className="at-spin" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}><circle cx="9" cy="9" r="7" stroke="#E8E6E0" strokeWidth="2"/><path d="M9 2a7 7 0 0 1 7 7" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>Generating…</>
                    : 'No prompts yet — start an attack'}
                </div>
              ) : (
                <>
                  <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    <table className="at-table">
                      <thead>
                        <tr>
                          <th style={{ width: 36 }}>#</th>
                          <th>Status</th>
                          <th>Content</th>
                          <th>Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attackPrompts.map((p: AttackPrompt, idx: number) => {
                          const sc = STATUS_CFG[p.status] ?? { label: p.status, bg: '#F7F6F3', color: '#888', dot: '#CCC' };
                          const isExp = expandedId === p.promptId;
                          return (
                            <tr key={p.promptId} className={`data ${isExp ? 'expanded' : ''}`} onClick={() => setExpandedId(isExp ? null : p.promptId)}>
                              <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#DDD' }}>{String(idx+1).padStart(2,'0')}</td>
                              <td>
                                <span className="at-badge" style={{ background: sc.bg, color: sc.color }}>
                                  <span className="at-dot-sm" style={{ background: sc.dot }}/>{sc.label}
                                </span>
                              </td>
                              <td><div className="at-mono">{p.content}</div></td>
                              <td><span className="at-ts">{new Date(p.timestamp).toLocaleTimeString()}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="at-summary">
                    {(['generated','sent','breached','blocked','failed'] as AttackStatus[]).map(s => {
                      const sc    = STATUS_CFG[s];
                      const count = attackPrompts.filter(p => p.status === s).length;
                      if (!count) return null;
                      return (
                        <div key={s} className="at-sum-item">
                          <span className="at-dot-sm" style={{ background: sc.dot }}/>
                          <span className="at-sum-cnt">{count}</span>
                          <span>{sc.label}</span>
                        </div>
                      );
                    })}
                    <div style={{ marginLeft: 'auto', fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#999' }}>
                      Total: <strong style={{ color: '#1A1A1A' }}>{attackPrompts.length}</strong>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttackTestingPage;












// import React, { useState, useEffect } from 'react';
// import { AttackPrompt, AttackStatus, UpdateRunRequest } from '../types';
// import { useAppStore } from '../store/appStore';
// import {
//   testConnection, patchRunConfig, startAutomaticRun, stopRun,
//   getStrategies, getProviders, getNodes,
// } from '../services/api';
// import { websocketService } from '../services/websocket';
// import { GraphConfig, StrategySchema, Provider, NodeSchema } from '../types';

// interface AttackTestingPageProps { onBack: () => void; }

// const STATUS_CFG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
//   generated: { label: 'Generated', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
//   sent:      { label: 'Sent',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
//   failed:    { label: 'Failed',    bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
//   breached:  { label: 'Breached',  bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
//   blocked:   { label: 'Blocked',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
// };

// const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ onBack }) => {
//   const activeRunId = useAppStore(s => s.activeRunId);
//   const activeRun = useAppStore(s => s.runs.find(r => r.runid === activeRunId)); // Get active run details[cite: 6]  const attackPrompts    = useAppStore(s => s.attackPrompts);
//   const attackStats      = useAppStore(s => s.attackStats);
//   const isAttacking      = useAppStore(s => s.isAttacking);
//   const attackError      = useAppStore(s => s.attackError);
//   const connectionStatus = useAppStore(s => s.connectionStatus);
//   const runProgress      = useAppStore(s => s.runProgress);

//   const clearAttackPrompts  = useAppStore(s => s.clearAttackPrompts);
//   const setIsAttacking      = useAppStore(s => s.setIsAttacking);
//   const setAttackError      = useAppStore(s => s.setAttackError);
//   const setConnectionStatus = useAppStore(s => s.setConnectionStatus);
//   const updateRun           = useAppStore(s => s.updateRun);

//   // Discovery state
//   const [strategies,  setStrategies]  = useState<StrategySchema[]>([]);
//   const [providers,   setProviders]   = useState<Provider[]>([]);
//   const [attackNodes, setAttackNodes] = useState<NodeSchema[]>([]);
//   const [loading,     setLoading]     = useState(true);

//   // Config form state (maps to GraphConfig)
//   // const [strategyName,   setStrategyName]   = useState('jailbreak');
//   // const [strategyParams, setStrategyParams] = useState<Record<string,any>>({});
//   const [modelUrl,       setModelUrl]       = useState('http://localhost:11434/api/generate');
//   const [apiKey,         setApiKey]         = useState('');

//   const [expandedId, setExpandedId] = useState<string | null>(null);

//   // Local state for the three editable fields[cite: 6]
//   const [runName, setRunName] = useState(activeRun?.name || '');
//   const [runDesc, setRunDesc] = useState(activeRun?.description || '');
//   const [strategyName, setStrategyName] = useState('jailbreak');
//   const [strategyParams, setStrategyParams] = useState<Record<string,any>>({});

//   // ── Fetch discovery data on mount ──────────────────────────────────────────
//   useEffect(() => {
//     if (!activeRunId) return;
//     const init = async () => {
//       setLoading(true);
//       try {
//         const [strats, provs, nodes] = await Promise.all([
//           getStrategies(),
//           getProviders(),
//           getNodes('attack'),
//         ]);
//         setStrategies(strats);
//         setProviders(provs);
//         setAttackNodes(nodes);

//         // Seed defaults from first strategy
//         if (strats.length > 0) {
//           const first = strats[0];
//           setStrategyName(first.strategy_name);
//           seedDefaults(first.schema_definition);
//         }
//       } catch (e: any) {
//         setAttackError(e.message);
//       } finally {
//         setLoading(false);
//       }
//     };
//     init();
//     websocketService.joinRun(activeRunId);
//     return () => { websocketService.leaveRun(activeRunId); };
//   }, [activeRunId]);


//   useEffect(() => {
//     if (activeRun) {
//       setRunName(activeRun.name);
//       setRunDesc(activeRun.description || '');
//     }
//   }, [activeRun]);
  
//   const seedDefaults = (schema: Record<string,any>) => {
//     const props = schema?.properties ?? {};
//     const defs: Record<string,any> = {};
//     for (const [k, def] of Object.entries(props) as [string,any][]) {
//       if (def.default !== undefined) defs[k] = def.default;
//       else if (def.enum?.length) defs[k] = def.enum[0];
//     }
//     setStrategyParams(defs);
//   };

//   const handleStrategyChange = (name: string) => {
//     setStrategyName(name);
//     const s = strategies.find(s => s.strategy_name === name);
//     if (s) seedDefaults(s.schema_definition);
//   };

//   // ── Test connection ─────────────────────────────────────────────────────────
//   const handleTestConnection = async () => {
//     if (!modelUrl) return;
//     setConnectionStatus('testing');
//     const ok = await testConnection(modelUrl);
//     setConnectionStatus(ok ? 'connected' : 'failed');
//   };

//   // ── Start ───────────────────────────────────────────────────────────────────
//   const handleStart = async () => {
//     if (!activeRunId) return;
//     setAttackError(null);
//     clearAttackPrompts();
//     setIsAttacking(true);
//     updateRunStore(activeRunId, { status: 'running', updatedAt: new Date().toISOString() }); // Optimistic UI update[cite: 6]

//     try {
//       // Step A: Update the database with the 3 exact things the API demands[cite: 6]
//       const updatePayload: UpdateRunRequest = {
//         name: runName,
//         description: runDesc,
//         strategy_params: strategyParams // Dynamic dependencies built from UI[cite: 6]
//       };
//       await updateRun(activeRunId, updatePayload); 

//       // Step B: Start the run[cite: 6]
//       await startAutomaticRun(activeRunId, { runtime_config: {} });
//     } catch (err) {
//       const msg = err instanceof Error ? err.message : 'Attack failed';
//       setAttackError(msg);
//       setIsAttacking(false);
//       updateRunStore(activeRunId, { status: 'failed', updatedAt: new Date().toISOString() });
//     }
//   };

//   // ── Stop ────────────────────────────────────────────────────────────────────
//   const handleStop = async () => {
//     if (!activeRunId) return;
//     try { await stopRun(activeRunId); } catch { /* best-effort */ }
//     setIsAttacking(false);
//     updateRun(activeRunId, { status: 'paused', updatedAt: new Date().toISOString() });
//   };

//   const currentSchema = strategies.find(s => s.strategy_name === strategyName)?.schema_definition;

//   return (
//     <div className="at-root">
//       <style>{`
//         @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
//         *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
//         .at-root{font-family:'DM Sans',sans-serif;background:#F7F6F3;color:#1A1A1A;min-height:100vh;display:flex;flex-direction:column}
//         .at-nav{display:flex;align-items:center;justify-content:space-between;padding:0 32px;height:56px;background:#fff;border-bottom:1px solid #E8E6E0;position:sticky;top:0;z-index:100}
//         .at-nav-l{display:flex;align-items:center;gap:16px}
//         .at-back{display:flex;align-items:center;gap:6px;font-size:13px;color:#888;cursor:pointer;border:none;background:none;font-family:inherit}
//         .at-back:hover{color:#1A1A1A}
//         .at-sep{width:1px;height:18px;background:#E8E6E0}
//         .at-logo{font-size:14px;font-weight:600;letter-spacing:-.3px}
//         .at-run-badge{display:flex;align-items:center;gap:6px;font-family:'DM Mono',monospace;font-size:10px;color:#999;text-transform:uppercase;letter-spacing:.5px}
//         .at-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:at-pulse 2s infinite}
//         @keyframes at-pulse{0%,100%{opacity:1}50%{opacity:.3}}
//         .at-main{display:grid;grid-template-columns:360px 1fr;gap:20px;max-width:1400px;width:100%;margin:0 auto;padding:24px;align-items:start}
//         .at-col{display:flex;flex-direction:column;gap:16px}
//         .at-card{background:#fff;border:1px solid #E8E6E0;border-radius:10px;overflow:hidden}
//         .at-card-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #F0EDE6}
//         .at-card-title{font-size:13px;font-weight:600}
//         .at-card-sub{font-size:11px;color:#BBB;margin-top:1px}
//         .at-card-bd{padding:20px}
//         .at-lbl{font-size:11px;font-weight:500;color:#999;letter-spacing:.3px;text-transform:uppercase;display:block;margin-bottom:5px}
//         .at-sel,.at-inp{height:36px;background:#F7F6F3;border:1px solid #E8E6E0;border-radius:7px;padding:0 12px;font-size:13px;font-family:inherit;color:#1A1A1A;outline:none;transition:border-color .15s;width:100%}
//         .at-sel{appearance:none;cursor:pointer;background-image:url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 12px center;padding-right:32px}
//         .at-sel:focus,.at-inp:focus{border-color:#1A1A1A;background:#fff}
//         .at-field{margin-bottom:12px}
//         .at-field:last-child{margin-bottom:0}
//         .at-btn-test{width:100%;height:36px;border-radius:7px;border:1px solid #E8E6E0;background:#fff;font-family:inherit;font-size:13px;font-weight:500;color:#1A1A1A;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;gap:7px}
//         .at-btn-test:hover{background:#F7F6F3}.at-btn-test:disabled{opacity:.5;cursor:not-allowed}
//         .at-btn-test.ok{border-color:#22C55E;color:#15803D;background:#F0FDF4}
//         .at-btn-test.fail{border-color:#EF4444;color:#DC2626;background:#FEF2F2}
//         .at-btn-start{height:36px;padding:0 20px;border-radius:7px;border:none;background:#1A1A1A;font-family:inherit;font-size:13px;font-weight:500;color:#fff;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:6px;white-space:nowrap}
//         .at-btn-start:hover:not(:disabled){background:#333}.at-btn-start:disabled{opacity:.45;cursor:not-allowed}
//         .at-btn-start.stop{background:#EF4444}.at-btn-start.stop:hover{background:#DC2626}
//         .at-conn-ok{font-size:11px;color:#15803D;background:#F0FDF4;padding:3px 8px;border-radius:20px;font-weight:500}
//         .at-conn-fail{font-size:11px;color:#DC2626;background:#FEF2F2;padding:3px 8px;border-radius:20px;font-weight:500}
//         .at-err{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:7px;font-size:12px;color:#DC2626;margin-bottom:12px}
//         .at-full{grid-column:1/-1}
//         .at-table{width:100%;border-collapse:collapse;font-size:13px}
//         .at-table th{text-align:left;padding:10px 16px;font-size:11px;font-weight:500;color:#BBB;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid #F0EDE6;background:#FAFAF9;white-space:nowrap}
//         .at-table td{padding:12px 16px;border-bottom:1px solid #F9F8F6;vertical-align:middle}
//         .at-table tr.data:hover td{background:#FAFAF9}.at-table tr:last-child td{border-bottom:none}.at-table tr.data{cursor:pointer}
//         .at-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500}
//         .at-dot-sm{width:5px;height:5px;border-radius:50%}
//         .at-mono{font-family:'DM Mono',monospace;font-size:11px;color:#666;max-width:500px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
//         tr.expanded .at-mono{white-space:normal}
//         .at-ts{font-family:'DM Mono',monospace;font-size:11px;color:#CCC}
//         .at-empty{text-align:center;padding:48px 20px;color:#CCC;font-size:13px}
//         .at-summary{display:flex;gap:16px;padding:12px 16px;border-top:1px solid #F0EDE6;background:#FAFAF9;align-items:center;flex-wrap:wrap}
//         .at-sum-item{display:flex;align-items:center;gap:6px;font-size:12px;color:#999}
//         .at-sum-cnt{font-family:'DM Mono',monospace;font-weight:500;color:#1A1A1A}
//         .at-no-run{display:flex;align-items:center;justify-content:center;padding:80px 24px;color:#CCC;font-size:14px;grid-column:1/-1}
//         .at-prog-bar{height:4px;background:#E8E6E0;border-radius:2px;margin-top:10px}
//         .at-prog-fill{height:100%;background:#1A1A1A;border-radius:2px;transition:width .4s ease}
//         .at-stat-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:16px}
//         .at-stat-cell{background:#F7F6F3;border:1px solid #E8E6E0;border-radius:8px;padding:12px 14px}
//         .at-stat-val{font-family:'DM Mono',monospace;font-size:22px;font-weight:500;color:#1A1A1A}
//         .at-stat-lbl{font-size:10px;color:#BBB;margin-top:2px;text-transform:uppercase;letter-spacing:.3px}
//         @keyframes spin{to{transform:rotate(360deg)}}
//         .at-spin{animation:spin .8s linear infinite}
//         .at-schema-sep{height:1px;background:#F0EDE6;margin:12px 0}
//       `}</style>

//       {/* Nav */}
//       <nav className="at-nav">
//         <div className="at-nav-l">
//           <button className="at-back" onClick={onBack}>← Runs</button>
//           <div className="at-sep"/>
//           <span className="at-logo">FortiPrompt</span>
//           {activeRunId && (
//             <div className="at-run-badge">
//               <span className="at-dot"/>
//               {activeRunId.slice(-8)}
//             </div>
//           )}
//         </div>
//         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           {connectionStatus === 'connected' && <span className="at-conn-ok">● Connected</span>}
//           {connectionStatus === 'failed'    && <span className="at-conn-fail">✕ Failed</span>}
//           <button
//             className={`at-btn-start ${isAttacking ? 'stop' : ''}`}
//             onClick={isAttacking ? handleStop : handleStart}
//             disabled={!activeRunId || loading}
//           >
//             {isAttacking ? 'Stop' : 'Start Attack'}
//           </button>
//         </div>
//       </nav>

//       {!activeRunId ? (
//         <div className="at-no-run">No active run — go back and open a run first.</div>
//       ) : (
//         <div className="at-main">
//           {/* LEFT — Config */}
//           <div className="at-col">
//             <div className="at-card">
//               <div className="at-card-hd">
//                 <div className="at-card-title">Run Configuration</div>
//                 <div className="at-card-sub">Name, Description, and Strategy Dependencies</div>
//               </div>
//               <div className="at-card-bd">
                
//                 {/* Thing 1 & 2: Name and Description */}
//                 <div className="at-field">
//                   <label className="at-lbl">Run Name</label>
//                   <input className="at-inp" value={runName} onChange={e => setRunName(e.target.value)} />
//                 </div>
//                 <div className="at-field">
//                   <label className="at-lbl">Description</label>
//                   <input className="at-inp" value={runDesc} onChange={e => setRunDesc(e.target.value)} />
//                 </div>
                
//                 <div className="at-schema-sep"/>

//                 {/* Strategy Selection */}
//                 <div className="at-field">
//                   <label className="at-lbl">Attack Strategy</label>
//                   <select className="at-sel" value={strategyName} onChange={e => handleStrategyChange(e.target.value)}>
//                     {strategies.map(s => <option key={s.strategy_name} value={s.strategy_name}>{s.strategy_name}</option>)}
//                   </select>
//                 </div>

//                 {/* Thing 3: Dynamic Strategy Dependencies */}
//                 {currentSchema && Object.keys(currentSchema.properties ?? {}).length > 0 && (
//                   <div className="at-field">
//                     <label className="at-lbl">Strategy Parameters</label>
//                     {Object.entries(currentSchema.properties ?? {}).map(([key, def]: [string, any]) => {
//                       const val = strategyParams[key] ?? def.default ?? '';
                      
//                       // Render Enum (Select)
//                       if (def.enum) return (
//                         <div key={key} style={{ marginBottom: 10 }}>
//                           <label className="at-lbl" style={{ fontSize: 10 }}>{def.title ?? key}</label>
//                           <select className="at-sel" value={val} onChange={e => setStrategyParams(p => ({...p, [key]: e.target.value}))}>
//                             {def.enum.map((v: string) => <option key={v}>{v}</option>)}
//                           </select>
//                         </div>
//                       );
                      
//                       // Render Numbers
//                       if (def.type === 'integer' || def.type === 'number') return (
//                         <div key={key} style={{ marginBottom: 10 }}>
//                           <label className="at-lbl" style={{ fontSize: 10 }}>{def.title ?? key}</label>
//                           <input className="at-inp" type="number" min={def.minimum} max={def.maximum} value={val}
//                             onChange={e => setStrategyParams(p => ({...p, [key]: def.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value)}))} />
//                         </div>
//                       );
                      
//                       // Render Text
//                       return (
//                         <div key={key} style={{ marginBottom: 10 }}>
//                           <label className="at-lbl" style={{ fontSize: 10 }}>{def.title ?? key}</label>
//                           <input className="at-inp" type="text" placeholder={def.examples?.[0] ?? ''} value={val}
//                             onChange={e => setStrategyParams(p => ({...p, [key]: e.target.value}))} />
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}
//                 {/* Note: Hardcoded Model URL, Provider, and API Key fields have been removed to meet your layout requirements */}
//               </div>
//             </div>
//           </div>

//           {/* RIGHT — Stats */}
//           <div className="at-col">
//             <div className="at-card">
//               <div className="at-card-hd">
//                 <div>
//                   <div className="at-card-title">Run Statistics</div>
//                   <div className="at-card-sub">Live progress</div>
//                 </div>
//               </div>
//               <div className="at-card-bd">
//                 {attackStats ? (
//                   <>
//                     <div className="at-stat-grid">
//                       {[
//                         { label: 'Total',     val: attackStats.totalPrompts },
//                         { label: 'Generated', val: attackStats.attacksGenerated },
//                         { label: 'Pending',   val: attackStats.pendingAttacks },
//                       ].map(({ label, val }) => (
//                         <div key={label} className="at-stat-cell">
//                           <div className="at-stat-val">{val}</div>
//                           <div className="at-stat-lbl">{label}</div>
//                         </div>
//                       ))}
//                     </div>
//                     {attackStats.totalPrompts > 0 && (
//                       <div>
//                         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 4 }}>
//                           <span>Progress</span>
//                           <span style={{ fontFamily: 'DM Mono,monospace' }}>
//                             {Math.round((attackStats.attacksGenerated / attackStats.totalPrompts) * 100)}%
//                           </span>
//                         </div>
//                         <div className="at-prog-bar">
//                           <div className="at-prog-fill" style={{ width: `${(attackStats.attacksGenerated / attackStats.totalPrompts) * 100}%` }}/>
//                         </div>
//                       </div>
//                     )}
//                   </>
//                 ) : runProgress ? (
//                   <div>
//                     <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>{runProgress.message}</div>
//                     <div className="at-prog-bar">
//                       <div className="at-prog-fill" style={{ width: `${runProgress.progress_percent}%` }}/>
//                     </div>
//                     <div style={{ fontSize: 11, color: '#BBB', marginTop: 6, fontFamily: 'DM Mono,monospace' }}>
//                       {runProgress.current} / {runProgress.total}
//                     </div>
//                   </div>
//                 ) : (
//                   <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '24px 0' }}>
//                     {isAttacking ? 'Waiting for first stat update…' : 'Start an attack to see live statistics'}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Prompt table */}
//             <div className="at-card">
//               <div className="at-card-hd">
//                 <div>
//                   <div className="at-card-title">Generated Prompts</div>
//                   <div className="at-card-sub">
//                     {isAttacking ? 'Streaming…' : `${attackPrompts.length} prompts`}
//                   </div>
//                 </div>
//               </div>

//               {attackPrompts.length === 0 ? (
//                 <div className="at-empty">
//                   {isAttacking
//                     ? <><svg className="at-spin" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}><circle cx="9" cy="9" r="7" stroke="#E8E6E0" strokeWidth="2"/><path d="M9 2a7 7 0 0 1 7 7" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>Generating…</>
//                     : 'No prompts yet — start an attack'}
//                 </div>
//               ) : (
//                 <>
//                   <div style={{ maxHeight: 420, overflowY: 'auto' }}>
//                     <table className="at-table">
//                       <thead>
//                         <tr>
//                           <th style={{ width: 36 }}>#</th>
//                           <th>Status</th>
//                           <th>Content</th>
//                           <th>Time</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {attackPrompts.map((p: AttackPrompt, idx: number) => {
//                           const sc = STATUS_CFG[p.status] ?? { label: p.status, bg: '#F7F6F3', color: '#888', dot: '#CCC' };
//                           const isExp = expandedId === p.promptId;
//                           return (
//                             <tr key={p.promptId} className={`data ${isExp ? 'expanded' : ''}`} onClick={() => setExpandedId(isExp ? null : p.promptId)}>
//                               <td style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#DDD' }}>{String(idx+1).padStart(2,'0')}</td>
//                               <td>
//                                 <span className="at-badge" style={{ background: sc.bg, color: sc.color }}>
//                                   <span className="at-dot-sm" style={{ background: sc.dot }}/>{sc.label}
//                                 </span>
//                               </td>
//                               <td><div className="at-mono">{p.content}</div></td>
//                               <td><span className="at-ts">{new Date(p.timestamp).toLocaleTimeString()}</span></td>
//                             </tr>
//                           );
//                         })}
//                       </tbody>
//                     </table>
//                   </div>
//                   <div className="at-summary">
//                     {(['generated','sent','breached','blocked','failed'] as AttackStatus[]).map(s => {
//                       const sc    = STATUS_CFG[s];
//                       const count = attackPrompts.filter(p => p.status === s).length;
//                       if (!count) return null;
//                       return (
//                         <div key={s} className="at-sum-item">
//                           <span className="at-dot-sm" style={{ background: sc.dot }}/>
//                           <span className="at-sum-cnt">{count}</span>
//                           <span>{sc.label}</span>
//                         </div>
//                       );
//                     })}
//                     <div style={{ marginLeft: 'auto', fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#999' }}>
//                       Total: <strong style={{ color: '#1A1A1A' }}>{attackPrompts.length}</strong>
//                     </div>
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AttackTestingPage;
