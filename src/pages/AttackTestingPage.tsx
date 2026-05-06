import React, { useState, useEffect } from 'react';
import { AttackPrompt, AttackStatus, UpdateRunRequest } from '../types';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi, startAutomaticRun, stopRun, getStrategies } from '../services/api';
import { websocketService } from '../services/websocket';

interface AttackTestingPageProps {
  onBack: () => void;
  /** When true, rendered inside RunShell — no own nav or left panel */
  embedded?: boolean;
}

const STATUS_CFG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
  generated: { label: 'Generated', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  sent:      { label: 'Sent',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  failed:    { label: 'Failed',    bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  breached:  { label: 'Breached',  bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
  blocked:   { label: 'Blocked',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
};

const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ onBack, embedded = false }) => {
  const activeRunId   = useAppStore(s => s.activeRunId);
  const activeRun     = useAppStore(s => s.runs.find(r => r.runid === s.activeRunId));
  const attackPrompts = useAppStore(s => s.attackPrompts);
  const attackStats   = useAppStore(s => s.attackStats);
  const isAttacking   = useAppStore(s => s.isAttacking);
  const attackError   = useAppStore(s => s.attackError);
  const runProgress   = useAppStore(s => s.runProgress);

  const clearAttackPrompts = useAppStore(s => s.clearAttackPrompts);
  const setIsAttacking     = useAppStore(s => s.setIsAttacking);
  const setAttackError     = useAppStore(s => s.setAttackError);
  const updateRun          = useAppStore(s => s.updateRun);

  const [runName,        setRunName]        = useState(activeRun?.name ?? '');
  const [runDesc,        setRunDesc]        = useState(activeRun?.description ?? '');
  const [strategyName,   setStrategyName]   = useState('');
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({});
  const [strategies,     setStrategies]     = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [expandedId,     setExpandedId]     = useState<string | null>(null);

  useEffect(() => {
    if (activeRun) {
      setRunName(activeRun.name);
      setRunDesc(activeRun.description ?? '');
    }
  }, [activeRun?.runid]);

  useEffect(() => {
    if (!activeRunId) return;
    const init = async () => {
      setLoading(true);
      try {
        const strats = await getStrategies();
        setStrategies(strats);
        if (strats.length > 0) {
          const first = strats[0];
          setStrategyName(first.strategy_name);
          seedDefaults(first.schema_definition);
        }
      } catch (e: any) { setAttackError(e.message); }
      finally { setLoading(false); }
    };
    init();
    if (!embedded) {
      websocketService.joinRun(activeRunId);
      return () => { websocketService.leaveRun(activeRunId); };
    }
  }, [activeRunId]);

  const seedDefaults = (schema: Record<string, any>) => {
    const props = schema?.properties ?? {};
    const defs: Record<string, any> = {};
    for (const [k, def] of Object.entries(props) as [string, any][]) {
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

  const handleStart = async () => {
    if (!activeRunId) return;
    setAttackError(null);
    clearAttackPrompts();
    setIsAttacking(true);
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });
    try {
      const payload: UpdateRunRequest = { name: runName, description: runDesc, strategy_params: strategyParams };
      await updateRunApi(activeRunId, payload);
      await startAutomaticRun(activeRunId, { runtime_config: {} });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Attack failed';
      setAttackError(msg);
      setIsAttacking(false);
      updateRun(activeRunId, { status: 'failed', updatedAt: new Date().toISOString() });
    }
  };

  const handleStop = async () => {
    if (!activeRunId) return;
    try { await stopRun(activeRunId); } catch { /* best-effort */ }
    setIsAttacking(false);
    updateRun(activeRunId, { status: 'paused', updatedAt: new Date().toISOString() });
  };

  const currentSchema = strategies.find(s => s.strategy_name === strategyName)?.schema_definition;

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: embedded ? 20 : 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes at-spin{to{transform:rotate(360deg)}}
        @keyframes at-pulse{0%,100%{opacity:1}50%{opacity:.3}}
        .at-spin{animation:at-spin .8s linear infinite}
      `}</style>

      {attackError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          ⚠ {attackError}
        </div>
      )}

      {/* Action bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px' }}>Attack Testing</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Configure strategy and run adversarial attacks</div>
        </div>
        <button
          onClick={isAttacking ? handleStop : handleStart}
          disabled={!activeRunId || loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isAttacking ? '#EF4444' : '#1A1A1A', color: '#fff',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            opacity: (!activeRunId || loading) ? .45 : 1,
            transition: 'all .15s',
          }}
        >
          {isAttacking ? 'Stop Attack' : 'Start Attack'}
        </button>
      </div>

      {/* Strategy config card */}
      <div style={CARD}>
        <div style={CARD_HD}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Strategy Configuration</div>
          <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>Runtime overrides applied on start</div>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '20px 0' }}>
              <svg className="at-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#E8E6E0" strokeWidth="2"/><path d="M8 2a6 6 0 0 1 6 6" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 13, color: '#888' }}>Loading strategies…</span>
            </div>
          ) : (
            <>
              <div>
                <label style={LBL}>Attack Strategy</label>
                <select style={SEL} value={strategyName} onChange={e => handleStrategyChange(e.target.value)}>
                  {strategies.map(s => <option key={s.strategy_name} value={s.strategy_name}>{s.strategy_name}</option>)}
                </select>
              </div>

              {currentSchema && Object.keys(currentSchema.properties ?? {}).length > 0 && (
                <div>
                  <label style={LBL}>Strategy Parameters</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
                    {Object.entries(currentSchema.properties ?? {}).map(([key, def]: [string, any]) => {
                      const val = strategyParams[key] ?? def.default ?? '';
                      if (def.enum) return (
                        <div key={key}>
                          <label style={{ ...LBL, fontSize: 10 }}>{def.title ?? key}</label>
                          <select style={SEL} value={val} onChange={e => setStrategyParams(p => ({ ...p, [key]: e.target.value }))}>
                            {def.enum.map((v: string) => <option key={v}>{v}</option>)}
                          </select>
                        </div>
                      );
                      if (def.type === 'integer' || def.type === 'number') return (
                        <div key={key}>
                          <label style={{ ...LBL, fontSize: 10 }}>{def.title ?? key}</label>
                          <input style={INP} type="number" min={def.minimum} max={def.maximum} value={val}
                            onChange={e => setStrategyParams(p => ({ ...p, [key]: def.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value) }))} />
                        </div>
                      );
                      return (
                        <div key={key}>
                          <label style={{ ...LBL, fontSize: 10 }}>{def.title ?? key}</label>
                          <input style={INP} type="text" placeholder={def.examples?.[0] ?? ''} value={val}
                            onChange={e => setStrategyParams(p => ({ ...p, [key]: e.target.value }))} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Stats card */}
      <div style={CARD}>
        <div style={CARD_HD}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Statistics</div>
          <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>
            {isAttacking ? 'Live' : `${attackPrompts.length} prompts`}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {attackStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Total',     val: attackStats.totalPrompts },
                { label: 'Generated', val: attackStats.attacksGenerated },
                { label: 'Pending',   val: attackStats.pendingAttacks },
              ].map(({ label, val }) => (
                <div key={label} style={{ background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 22, fontWeight: 500 }}>{val}</div>
                  <div style={{ fontSize: 10, color: '#BBB', marginTop: 2, textTransform: 'uppercase' }}>{label}</div>
                </div>
              ))}
            </div>
          ) : runProgress ? (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{runProgress.message}</div>
              <div style={{ height: 4, background: '#E8E6E0', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${runProgress.progress_percent}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width .4s' }} />
              </div>
              <div style={{ fontSize: 11, color: '#BBB', marginTop: 4, fontFamily: 'DM Mono,monospace' }}>
                {runProgress.current} / {runProgress.total}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '16px 0' }}>
              {isAttacking ? 'Waiting for first result…' : 'Start an attack to see live stats'}
            </div>
          )}
        </div>
      </div>

      {/* Prompt table */}
      <div style={CARD}>
        <div style={CARD_HD}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Generated Prompts</div>
          <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>{attackPrompts.length} total</div>
        </div>
        {attackPrompts.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#CCC', fontSize: 13 }}>
            {isAttacking
              ? <><svg className="at-spin" width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ margin: '0 auto 8px', display: 'block' }}><circle cx="9" cy="9" r="7" stroke="#E8E6E0" strokeWidth="2"/><path d="M9 2a7 7 0 0 1 7 7" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>Generating…</>
              : 'No prompts yet — start an attack'}
          </div>
        ) : (
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#FAFAF9' }}>
                  {['#', 'Status', 'Content', 'Time'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '8px 16px', fontSize: 10, fontWeight: 500, color: '#BBB', textTransform: 'uppercase', borderBottom: '1px solid #F0EDE6' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {attackPrompts.map((p: AttackPrompt, idx: number) => {
                  const sc    = STATUS_CFG[p.status] ?? { label: p.status, bg: '#F7F6F3', color: '#888', dot: '#CCC' };
                  const isExp = expandedId === p.promptId;
                  return (
                    <tr key={p.promptId} style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExp ? null : p.promptId)}>
                      <td style={{ padding: '10px 16px', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#DDD', borderBottom: '1px solid #F9F8F6' }}>
                        {String(idx + 1).padStart(2, '0')}
                      </td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid #F9F8F6' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: sc.bg, color: sc.color }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }} />
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid #F9F8F6', fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#666', maxWidth: 400, overflow: 'hidden', textOverflow: isExp ? 'initial' : 'ellipsis', whiteSpace: isExp ? 'normal' : 'nowrap' }}>
                        {p.content}
                      </td>
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid #F9F8F6', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', whiteSpace: 'nowrap' }}>
                        {new Date(p.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  // Standalone mode (legacy — shouldn't normally be used now)
  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', height: 52, background: '#fff', borderBottom: '1px solid #E8E6E0' }}>
        <button onClick={onBack} style={{ fontSize: 13, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>← Back</button>
        <span style={{ fontSize: 14, fontWeight: 600 }}>Attack Testing</span>
      </nav>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>{content}</div>
    </div>
  );
};

// ─── Shared micro styles ───────────────────────────────────────────────────────

const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' };
const CARD_HD: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid #F0EDE6' };
const LBL: React.CSSProperties = { fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: '.3px', textTransform: 'uppercase', display: 'block', marginBottom: 5 };
const SEL: React.CSSProperties = { height: 34, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 7, padding: '0 28px 0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer' };
const INP: React.CSSProperties = { height: 34, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%' };

export default AttackTestingPage;