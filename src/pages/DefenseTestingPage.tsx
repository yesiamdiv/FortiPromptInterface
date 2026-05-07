import React, { useState, useEffect } from 'react';
import { DefenseResponse, UpdateRunRequest } from '../types';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi, startAutomaticRun, stopRun, getNodes } from '../services/api';
import { websocketService } from '../services/websocket';

interface DefenseTestingPageProps {
  embedded?: boolean;
}

const SCORE_COLOR = (s: number) => s >= 85 ? '#22C55E' : s >= 65 ? '#F59E0B' : '#EF4444';

const FALLBACK_FILTERS = [
  { name: 'regex_filter',    description: 'Blocks prompts matching known attack patterns' },
  { name: 'semantic_filter', description: 'Uses embeddings to detect adversarial intent' },
  { name: 'keyword_blocker', description: 'Keyword-based blocklist for common jailbreaks' },
  { name: 'llm_judge',       description: 'Uses an LLM to classify and block unsafe input' },
];

const DefenseTestingPage: React.FC<DefenseTestingPageProps> = ({ embedded = false }) => {
  const activeRunId      = useAppStore(s => s.activeRunId);
  const defenseStats     = useAppStore(s => s.defenseStats);
  const defenseResponses = useAppStore(s => s.defenseResponses);
  const isEvaluating     = useAppStore(s => s.isEvaluating);
  const defenseError     = useAppStore(s => s.defenseError);
  const runProgress      = useAppStore(s => s.runProgress);

  const setIsEvaluating  = useAppStore(s => s.setIsEvaluating);
  const setDefenseError  = useAppStore(s => s.setDefenseError);
  const updateRun        = useAppStore(s => s.updateRun);
  const clearDefenseResponses = useAppStore(s => s.clearDefenseResponses);

  const [defenseFilters, setDefenseFilters] = useState<{ name: string; description: string }[]>([]);
  const [enabledFilters, setEnabledFilters] = useState<string[]>(['regex_filter']);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeRunId) return;
    if (!embedded) websocketService.joinRun(activeRunId);
    const load = async () => {
      try {
        const nodes = await getNodes('defense');
        setDefenseFilters(nodes.length > 0
          ? nodes.map(n => ({ name: n.node_name, description: n.description ?? '' }))
          : FALLBACK_FILTERS
        );
      } catch { setDefenseFilters(FALLBACK_FILTERS); }
      finally { setLoading(false); }
    };
    load();
    return () => { if (!embedded) websocketService.leaveRun(activeRunId); };
  }, [activeRunId]);

  const toggleFilter = (name: string) =>
    setEnabledFilters(prev => prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]);

  const handleEvaluate = async () => {
    if (!activeRunId) return;
    setDefenseError(null);
    clearDefenseResponses();
    setIsEvaluating(true);
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });
    try {
      const payload: UpdateRunRequest = {
        defense_node_params: { enabled_filters: enabledFilters },
      };
      await updateRunApi(activeRunId, payload);
      await startAutomaticRun(activeRunId, { runtime_config: {} });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      setDefenseError(msg);
      setIsEvaluating(false);
      updateRun(activeRunId, { status: 'failed', updatedAt: new Date().toISOString() });
    }
  };

  const handleStop = async () => {
    if (!activeRunId) return;
    try { await stopRun(activeRunId); } catch { /* best-effort */ }
    setIsEvaluating(false);
    updateRun(activeRunId, { status: 'paused', updatedAt: new Date().toISOString() });
  };

  const score   = defenseStats?.overallDefenseScore ?? 0;
  const blocked = defenseStats?.blockedCount ?? 0;
  const passed  = defenseStats?.passedCount  ?? 0;
  const total   = defenseStats?.totalResponses ?? 0;

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: embedded ? 20 : 24 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes df-spin{to{transform:rotate(360deg)}}
        .df-spin{animation:df-spin .8s linear infinite}
        .df-filter:hover{border-color:#ccc !important}
      `}</style>

      {defenseError && (
        <div style={{ padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          ⚠ {defenseError}
        </div>
      )}

      {/* Header + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px' }}>Defense Testing</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Evaluate guardrail strength against attack prompts</div>
        </div>
        <button
          onClick={isEvaluating ? handleStop : handleEvaluate}
          disabled={!activeRunId || loading || (!isEvaluating && enabledFilters.length === 0)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px',
            borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isEvaluating ? '#EF4444' : '#1A1A1A', color: '#fff',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            opacity: (!activeRunId || loading) ? .45 : 1,
          }}
        >
          {isEvaluating ? 'Stop' : 'Run Defense Eval'}
        </button>
      </div>

      {/* Score card */}
      <div style={CARD}>
        <div style={CARD_HD}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Defense Score</div>
        </div>
        <div style={{ padding: 20 }}>
          {isEvaluating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '16px 0' }}>
              <svg className="df-spin" width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#E8E6E0" strokeWidth="2.5"/><path d="M12 3a9 9 0 0 1 9 9" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/></svg>
              {runProgress && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
                  <div>{runProgress.message}</div>
                  <div style={{ width: 200, height: 3, background: '#E8E6E0', borderRadius: 2, margin: '8px auto 0' }}>
                    <div style={{ height: '100%', width: `${runProgress.progress_percent}%`, background: '#1A1A1A', borderRadius: 2 }} />
                  </div>
                </div>
              )}
            </div>
          ) : defenseStats ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 52, fontWeight: 500, color: SCORE_COLOR(score), letterSpacing: -2 }}>{score}</div>
                <div style={{ fontSize: 11, color: '#BBB', marginTop: 3 }}>out of 100</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total',   val: total,   color: '#1A1A1A' },
                  { label: 'Blocked', val: blocked, color: '#15803D' },
                  { label: 'Passed',  val: passed,  color: '#DC2626' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 20, fontWeight: 500, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#BBB', marginTop: 1, textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '20px 0' }}>
              Enable filters below and run evaluation to see your score
            </div>
          )}
        </div>
      </div>

      {/* Filter selection */}
      <div style={CARD}>
        <div style={{ ...CARD_HD, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Defense Filters</div>
            <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>
              {loading ? 'Loading…' : `${enabledFilters.length} of ${defenseFilters.length} active`}
            </div>
          </div>
        </div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 0', gap: 8 }}>
              <svg className="df-spin" width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#E8E6E0" strokeWidth="2"/><path d="M8 2a6 6 0 0 1 6 6" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 12, color: '#888' }}>Loading filters…</span>
            </div>
          ) : defenseFilters.map(f => {
            const isOn = enabledFilters.includes(f.name);
            return (
              <div
                key={f.name}
                className="df-filter"
                style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: 12, border: `1px solid ${isOn ? '#1A1A1A' : '#E8E6E0'}`, borderRadius: 8, background: isOn ? '#fff' : '#F7F6F3', cursor: 'pointer', transition: 'all .15s' }}
                onClick={() => toggleFilter(f.name)}
              >
                {/* Toggle */}
                <label style={{ flexShrink: 0, marginTop: 1, cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                  <input type="checkbox" style={{ display: 'none' }} checked={isOn} onChange={() => toggleFilter(f.name)} />
                  <span style={{ display: 'block', width: 30, height: 16, borderRadius: 8, background: isOn ? '#1A1A1A' : '#E8E6E0', position: 'relative', transition: 'background .2s' }}>
                    <span style={{ position: 'absolute', width: 10, height: 10, borderRadius: '50%', background: '#fff', left: 3, top: 3, transform: isOn ? 'translateX(14px)' : 'none', transition: 'transform .2s', display: 'block' }} />
                  </span>
                </label>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 2 }}>{f.name}</div>
                  <div style={{ fontSize: 11, color: '#888', lineHeight: 1.4 }}>{f.description}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response feed */}
      {defenseResponses.length > 0 && (
        <div style={CARD}>
          <div style={{ ...CARD_HD, display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Live Response Feed</div>
            <button onClick={() => clearDefenseResponses()} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {defenseResponses.slice().reverse().map((r: DefenseResponse, i: number) => (
              <div key={`${r.promptId}-${i}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F9F8F6', alignItems: 'center', fontSize: 12 }}>
                <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {r.defenseResponse}
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500,
                  background: r.evaluation === 'blocked' ? '#F0FDF4' : r.evaluation === 'passed' ? '#FEF2F2' : '#FFFBEB',
                  color: r.evaluation === 'blocked' ? '#15803D' : r.evaluation === 'passed' ? '#DC2626' : '#B45309',
                }}>
                  {r.evaluation}
                </span>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC' }}>
                  {new Date(r.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', minHeight: '100vh' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>{body}</div>
    </div>
  );
};

const CARD: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' };
const CARD_HD: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid #F0EDE6' };

export default DefenseTestingPage;