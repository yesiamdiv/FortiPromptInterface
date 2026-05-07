import React, { useState, useEffect } from 'react';
import { AttackPrompt, AttackStatus } from '../types';
import { useAppStore } from '../store/appStore';
import { startAutomaticRun, stopRun } from '../services/api';
import { websocketService } from '../services/websocket';

interface AttackTestingPageProps {
  embedded?: boolean;
}

const STATUS_CFG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
  generated: { label: 'Generated', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  sent:      { label: 'Sent',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  failed:    { label: 'Failed',    bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  breached:  { label: 'Breached',  bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
  blocked:   { label: 'Blocked',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
};

const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ embedded = false }) => {
  const activeRunId   = useAppStore(s => s.activeRunId);
  const attackPrompts = useAppStore(s => s.attackPrompts);
  const attackStats   = useAppStore(s => s.attackStats);
  const isAttacking   = useAppStore(s => s.isAttacking);
  const attackError   = useAppStore(s => s.attackError);
  const runProgress   = useAppStore(s => s.runProgress);

  const clearAttackPrompts = useAppStore(s => s.clearAttackPrompts);
  const setIsAttacking     = useAppStore(s => s.setIsAttacking);
  const setAttackError     = useAppStore(s => s.setAttackError);
  const updateRun          = useAppStore(s => s.updateRun);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeRunId || embedded) return;
    websocketService.joinRun(activeRunId);
    return () => { websocketService.leaveRun(activeRunId); };
  }, [activeRunId, embedded]);

  // ── Start ─────────────────────────────────────────────────────────────────────
  // RunConfigPanel (in RunShell) already synced the params via debounced PATCH.
  // This function only triggers execution — no PATCH here.
  const handleStart = async () => {
    if (!activeRunId) return;
    setAttackError(null);
    clearAttackPrompts();
    setIsAttacking(true);
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });
    try {
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

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20 }}>
      <style>{`
        @keyframes at-spin { to { transform: rotate(360deg); } }
        .at-spin { animation: at-spin .8s linear infinite; }
        .at-prompt-row:hover td { background: #FAFAF9 !important; }
      `}</style>

      {/* Error */}
      {attackError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          ⚠ {attackError}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14 }} onClick={() => setAttackError(null)}>✕</button>
        </div>
      )}

      {/* Header + action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px' }}>Attack Testing</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            {isAttacking
              ? 'Run in progress — prompts streaming below'
              : 'Params saved in left panel. Click Start to begin.'}
          </div>
        </div>
        <button
          onClick={isAttacking ? handleStop : handleStart}
          disabled={!activeRunId}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: isAttacking ? '#EF4444' : '#1A1A1A', color: '#fff',
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            opacity: !activeRunId ? .45 : 1, transition: 'background .15s', flexShrink: 0,
          }}
        >
          {isAttacking ? (
            <><span style={{ width: 8, height: 8, background: '#fff', borderRadius: 2, display: 'inline-block' }}/> Stop</>
          ) : (
            <><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="white"/></svg> Start Attack</>
          )}
        </button>
      </div>

      {/* ── Stats card ── */}
      <div style={CARD}>
        <div style={CARD_HD}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Run Statistics</div>
          <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>
            {isAttacking ? 'Live' : attackStats ? 'Last run complete' : 'Awaiting run'}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          {attackStats ? (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Total',     val: attackStats.totalPrompts },
                  { label: 'Generated', val: attackStats.attacksGenerated },
                  { label: 'Pending',   val: attackStats.pendingAttacks },
                ].map(({ label, val }) => (
                  <div key={label} style={{ background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '12px 14px' }}>
                    <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 22, fontWeight: 500, color: '#1A1A1A' }}>{val}</div>
                    <div style={{ fontSize: 10, color: '#BBB', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</div>
                  </div>
                ))}
              </div>
              {attackStats.totalPrompts > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 5 }}>
                    <span>Progress</span>
                    <span style={{ fontFamily: 'DM Mono,monospace' }}>
                      {Math.round((attackStats.attacksGenerated / attackStats.totalPrompts) * 100)}%
                    </span>
                  </div>
                  <div style={{ height: 4, background: '#E8E6E0', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: `${(attackStats.attacksGenerated / attackStats.totalPrompts) * 100}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width .4s' }}/>
                  </div>
                </div>
              )}
            </>
          ) : runProgress ? (
            <div>
              <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{runProgress.message}</div>
              <div style={{ height: 4, background: '#E8E6E0', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${runProgress.progress_percent}%`, background: '#1A1A1A', borderRadius: 2, transition: 'width .4s' }}/>
              </div>
              <div style={{ fontSize: 11, color: '#BBB', marginTop: 5, fontFamily: 'DM Mono,monospace' }}>
                {runProgress.current} / {runProgress.total}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', color: '#CCC', fontSize: 13, padding: '20px 0' }}>
              {isAttacking ? 'Waiting for first result…' : 'Start an attack to see live statistics'}
            </div>
          )}
        </div>
      </div>

      {/* ── Prompt table ── */}
      <div style={CARD}>
        <div style={{ ...CARD_HD, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Generated Prompts</div>
            <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>
              {isAttacking ? 'Streaming live…' : `${attackPrompts.length} total`}
            </div>
          </div>
          {attackPrompts.length > 0 && (
            <button onClick={clearAttackPrompts} style={{ fontSize: 11, color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Clear
            </button>
          )}
        </div>

        {attackPrompts.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#CCC', fontSize: 13 }}>
            {isAttacking ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <svg className="at-spin" width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <circle cx="11" cy="11" r="9" stroke="#E8E6E0" strokeWidth="2"/>
                  <path d="M11 2a9 9 0 0 1 9 9" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                Generating prompts…
              </div>
            ) : (
              'No prompts yet — start an attack'
            )}
          </div>
        ) : (
          <>
            <div style={{ maxHeight: 440, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#FAFAF9' }}>
                    {['#', 'Status', 'Content', 'Time'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '9px 16px', fontSize: 10, fontWeight: 500, color: '#BBB', textTransform: 'uppercase', letterSpacing: '.3px', borderBottom: '1px solid #F0EDE6' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attackPrompts.map((p: AttackPrompt, idx: number) => {
                    const sc    = STATUS_CFG[p.status] ?? { label: p.status, bg: '#F7F6F3', color: '#888', dot: '#CCC' };
                    const isExp = expandedId === p.promptId;
                    return (
                      <tr key={p.promptId} className="at-prompt-row" style={{ cursor: 'pointer' }} onClick={() => setExpandedId(isExp ? null : p.promptId)}>
                        <td style={{ padding: '10px 16px', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#DDD', borderBottom: '1px solid #F9F8F6', verticalAlign: 'middle' }}>
                          {String(idx + 1).padStart(2, '0')}
                        </td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid #F9F8F6', verticalAlign: 'middle' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: sc.bg, color: sc.color }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: sc.dot, display: 'inline-block' }}/>
                            {sc.label}
                          </span>
                        </td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid #F9F8F6', fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#666', maxWidth: 500, overflow: 'hidden', textOverflow: isExp ? 'initial' : 'ellipsis', whiteSpace: isExp ? 'normal' : 'nowrap', verticalAlign: 'middle', wordBreak: 'break-word' }}>
                          {p.content}
                        </td>
                        <td style={{ padding: '10px 16px', borderBottom: '1px solid #F9F8F6', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                          {new Date(p.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div style={{ display: 'flex', gap: 14, padding: '10px 16px', borderTop: '1px solid #F0EDE6', background: '#FAFAF9', alignItems: 'center', flexWrap: 'wrap' }}>
              {(['generated', 'sent', 'breached', 'blocked', 'failed'] as AttackStatus[]).map(s => {
                const sc    = STATUS_CFG[s];
                const count = attackPrompts.filter(p => p.status === s).length;
                if (!count) return null;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }}/>
                    <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 500, color: '#1A1A1A' }}>{count}</span>
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
  );

  // Always embedded via RunShell — standalone not needed
  return body;
};

const CARD: React.CSSProperties    = { background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' };
const CARD_HD: React.CSSProperties = { padding: '12px 20px', borderBottom: '1px solid #F0EDE6' };

export default AttackTestingPage;