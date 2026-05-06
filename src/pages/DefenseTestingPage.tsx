import React, { useEffect } from 'react';
import { DefenseResponse } from '../types';
import { useAppStore } from '../store/appStore';
import { startAutomaticRun, stopRun } from '../services/api';
import { websocketService } from '../services/websocket';

interface DefenseTestingPageProps {
  onBack: () => void;
  embedded?: boolean;
}

const SCORE_COLOR = (s: number) => s >= 85 ? '#22C55E' : s >= 65 ? '#F59E0B' : '#EF4444';

const DefenseTestingPage: React.FC<DefenseTestingPageProps> = ({ onBack, embedded = false }) => {
  const activeRunId      = useAppStore(s => s.activeRunId);
  const defenseStats     = useAppStore(s => s.defenseStats);
  const defenseResponses = useAppStore(s => s.defenseResponses);
  const isEvaluating     = useAppStore(s => s.isEvaluating);
  const defenseError     = useAppStore(s => s.defenseError);
  const runProgress      = useAppStore(s => s.runProgress);

  const setIsEvaluating       = useAppStore(s => s.setIsEvaluating);
  const setDefenseError        = useAppStore(s => s.setDefenseError);
  const updateRun              = useAppStore(s => s.updateRun);
  const clearDefenseResponses  = useAppStore(s => s.clearDefenseResponses);

  useEffect(() => {
    if (!activeRunId || embedded) return;
    websocketService.joinRun(activeRunId);
    return () => { websocketService.leaveRun(activeRunId); };
  }, [activeRunId, embedded]);

  // ── Evaluate ──────────────────────────────────────────────────────────────────
  // Defense node params are already synced by RunConfigPanel (debounced PATCH).
  // This only triggers execution.
  const handleEvaluate = async () => {
    if (!activeRunId) return;
    setDefenseError(null);
    clearDefenseResponses();
    setIsEvaluating(true);
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });
    try {
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
  const blocked = defenseStats?.blockedCount        ?? 0;
  const passed  = defenseStats?.passedCount         ?? 0;
  const total   = defenseStats?.totalResponses      ?? 0;
  const filterPerf = defenseStats?.filterPerformance ?? {};

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <style>{`
        @keyframes df-spin { to { transform: rotate(360deg); } }
        .df-spin { animation: df-spin .8s linear infinite; }
        .df-resp-row:hover { background: #FAFAF9 !important; }
      `}</style>

      {/* Error */}
      {defenseError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          ⚠ {defenseError}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14 }} onClick={() => setDefenseError(null)}>✕</button>
        </div>
      )}

      {/* Header + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px' }}>Defense Testing</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {isEvaluating
              ? 'Evaluation running — results streaming below'
              : 'Filter params saved in left panel. Click Run to evaluate.'}
          </div>
        </div>
        <button
          onClick={isEvaluating ? handleStop : handleEvaluate}
          disabled={!activeRunId}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isEvaluating ? '#EF4444' : '#1A1A1A', color: '#fff',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            opacity: !activeRunId ? .45 : 1, transition: 'background .15s', flexShrink: 0,
          }}
        >
          {isEvaluating ? (
            <><span style={{ width: 8, height: 8, background: '#fff', borderRadius: 2, display: 'inline-block' }}/> Stop</>
          ) : (
            <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="white"/></svg> Run Defense Eval</>
          )}
        </button>
      </div>

      {/* ── Score card ── */}
      <div style={CARD}>
        <div style={CARD_HD}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Defense Score</div>
          <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>
            {isEvaluating ? 'Evaluating…' : defenseStats ? 'Last run complete' : 'Awaiting evaluation'}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {isEvaluating ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '16px 0' }}>
              <svg className="df-spin" width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="11" stroke="#E8E6E0" strokeWidth="2.5"/>
                <path d="M14 3a11 11 0 0 1 11 11" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              {runProgress && (
                <div style={{ textAlign: 'center', fontSize: 12, color: '#888' }}>
                  <div style={{ marginBottom: 8 }}>{runProgress.message}</div>
                  <div style={{ width: 220, height: 3, background: '#E8E6E0', borderRadius: 2, margin: '0 auto' }}>
                    <div style={{ height: '100%', width: `${runProgress.progress_percent}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width .4s' }}/>
                  </div>
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#BBB', marginTop: 5 }}>
                    {runProgress.current} / {runProgress.total}
                  </div>
                </div>
              )}
            </div>
          ) : defenseStats ? (
            <>
              {/* Big score */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 56, fontWeight: 500, color: SCORE_COLOR(score), letterSpacing: -2, lineHeight: 1 }}>
                  {score}
                </div>
                <div style={{ fontSize: 11, color: '#BBB', marginTop: 6 }}>Overall Defense Score (0–100)</div>
              </div>

              {/* Count grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Total',   val: total,   color: '#1A1A1A' },
                  { label: 'Blocked', val: blocked, color: '#15803D' },
                  { label: 'Passed',  val: passed,  color: '#DC2626' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 20, fontWeight: 500, color }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#BBB', marginTop: 1, textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Filter performance breakdown */}
              {Object.keys(filterPerf).length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 500, color: '#BBB', textTransform: 'uppercase', letterSpacing: '.3px' }}>
                    Filter Performance
                  </div>
                  {Object.entries(filterPerf).map(([name, perf]) => (
                    <div key={name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                        <span style={{ fontWeight: 500, color: '#555' }}>{name}</span>
                        <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#888' }}>
                          {perf.blocked} blocked · {perf.falsePositives} FP
                        </span>
                      </div>
                      <div style={{ height: 3, background: '#F0EDE6', borderRadius: 2 }}>
                        <div style={{ height: '100%', width: `${Math.min(100, perf.blocked)}%`, background: SCORE_COLOR(perf.blocked), borderRadius: 2, transition: 'width .4s' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '24px 0' }}>
              Configure defense filters in the left panel, then run evaluation
            </div>
          )}
        </div>
      </div>

      {/* ── Live response feed ── */}
      {defenseResponses.length > 0 && (
        <div style={CARD}>
          <div style={{ ...CARD_HD, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Live Response Feed</div>
              <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>{defenseResponses.length} responses</div>
            </div>
            <button onClick={clearDefenseResponses} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear
            </button>
          </div>
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {defenseResponses.slice().reverse().map((r: DefenseResponse, i: number) => {
              const evalStyle = r.evaluation === 'blocked'
                ? { bg: '#F0FDF4', color: '#15803D', label: '● Blocked' }
                : r.evaluation === 'passed'
                ? { bg: '#FEF2F2', color: '#DC2626', label: '✕ Passed' }
                : { bg: '#FFFBEB', color: '#B45309', label: '◈ Filter' };
              return (
                <div key={`${r.promptId}-${i}`} className="df-resp-row" style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F9F8F6', alignItems: 'center', fontSize: 12 }}>
                  <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {r.defenseResponse}
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: evalStyle.bg, color: evalStyle.color, whiteSpace: 'nowrap' }}>
                    {evalStyle.label}
                  </span>
                  <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', whiteSpace: 'nowrap' }}>
                    {new Date(r.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', minHeight: '100vh' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', height: 52, background: '#fff', borderBottom: '1px solid #E8E6E0', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ fontSize: 13, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>← Back</button>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.3px' }}>Defense Testing</span>
      </nav>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>{body}</div>
    </div>
  );
};

const CARD: React.CSSProperties    = { background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' };
const CARD_HD: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid #F0EDE6' };

export default DefenseTestingPage;