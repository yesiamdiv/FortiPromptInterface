// pages/AttackTestingPage.tsx
// Execution dashboard only — no config, no start button (RunShell handles start).
// Two sections: 1) stat chips  2) indexed prompt list with expand-on-click.

import React, { useState, useEffect } from 'react';
import { AttackPrompt, AttackStatus } from '../types';
import { useAppStore } from '../store/appStore';
import { fetchRunStats } from '../services/api';
import StatsPanel from '../components/stats/StatsPanel';

interface AttackTestingPageProps { embedded?: boolean; }

const STATUS_CFG: Record<AttackStatus, { label: string; bg: string; color: string; dot: string }> = {
  generated: { label: 'Generated', bg: '#EFF6FF', color: '#1D4ED8', dot: '#3B82F6' },
  sent:      { label: 'Sent',      bg: '#FFFBEB', color: '#B45309', dot: '#F59E0B' },
  failed:    { label: 'Failed',    bg: '#FEF2F2', color: '#DC2626', dot: '#EF4444' },
  breached:  { label: 'Breached',  bg: '#FEF2F2', color: '#991B1B', dot: '#DC2626' },
  blocked:   { label: 'Blocked',   bg: '#F0FDF4', color: '#15803D', dot: '#22C55E' },
};

const AttackTestingPage: React.FC<AttackTestingPageProps> = ({ embedded = false }) => {
  const attackPrompts      = useAppStore(s => s.attackPrompts);
  const isAttacking        = useAppStore(s => s.isAttacking);
  const attackError        = useAppStore(s => s.attackError);
  const runProgress        = useAppStore(s => s.runProgress);
  const clearAttackPrompts = useAppStore(s => s.clearAttackPrompts);
  const setAttackError     = useAppStore(s => s.setAttackError);
  const activeRunId        = useAppStore(s => s.activeRunId);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const allPrompts  = Object.values(attackPrompts).flat();
  const sessionKeys = Object.keys(attackPrompts);

  const total   = allPrompts.length;
  const breached = allPrompts.filter(p => p.status === 'breached').length;
  const blocked  = allPrompts.filter(p => p.status === 'blocked').length;
  const pending  = allPrompts.filter(p => p.status === 'generated' || p.status === 'sent').length;

  const statItems = total > 0
    ? [
        { label: 'Total',    val: total,    color: '#1A1A1A' },
        { label: 'Pending',  val: pending,  color: '#B45309' },
        { label: 'Breached', val: breached, color: '#DC2626' },
        { label: 'Blocked',  val: blocked,  color: '#15803D' },
      ]
    : null;

  useEffect(() => {
    if (!isAttacking && activeRunId && allPrompts.length > 0) {
      setStatsLoading(true);
      fetchRunStats(activeRunId).then(s => {
        setStats(s);
      }).finally(() => setStatsLoading(false));
    } else if (isAttacking) {
      setStats(null);
    }
  }, [isAttacking, activeRunId]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif" }}>
      <style>{`
        @keyframes at-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
        @keyframes at-spin  { to{transform:rotate(360deg)} }
        .at-spin { animation: at-spin .8s linear infinite; }
        .at-row:hover { background: #F7F6F3 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Attack Testing
            {isAttacking && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 500, color: '#1D4ED8', background: '#EFF6FF', padding: '2px 8px', borderRadius: 12 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#3B82F6', display: 'inline-block', animation: 'at-pulse 1.5s infinite' }}/>
                Live
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            {isAttacking
              ? 'Prompts are being generated and sent…'
              : allPrompts.length > 0
              ? `${allPrompts.length} prompts across ${sessionKeys.length} session(s) — run complete`
              : 'Configure the left panel then click Start Run'}
          </div>
        </div>
        {allPrompts.length > 0 && !isAttacking && (
          <button onClick={() => clearAttackPrompts()} style={{ fontSize: 11, color: '#AAA', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginTop: 2 }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {attackError && (
        <div style={{ margin: '12px 24px 0', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 13px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626' }}>
          ⚠ {attackError}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14 }} onClick={() => setAttackError(null)}>✕</button>
        </div>
      )}

      {/* ── Progress bar ── */}
      <div style={{ padding: '16px 24px 0' }}>
        {statItems ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {statItems.map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '8px 14px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 8 }}>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 500, color }}>{val}</span>
                <span style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</span>
              </div>
            ))}
            {isAttacking && runProgress && runProgress.total > 0 && (
              <div style={{ flex: '1 1 100%', marginTop: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#BBB', marginBottom: 4 }}>
                  <span>Progress</span>
                  <span style={{ fontFamily: 'DM Mono,monospace' }}>
                    {Math.round(runProgress.progress_percent)}%
                  </span>
                </div>
                <div style={{ height: 3, background: '#E8E6E0', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${runProgress.progress_percent}%`, background: '#3B82F6', borderRadius: 2, transition: 'width .4s' }}/>
                </div>
              </div>
            )}
          </div>
        ) : runProgress ? (
          <div style={{ padding: '10px 14px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 6 }}>{runProgress.message}</div>
            <div style={{ height: 3, background: '#E8E6E0', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${runProgress.progress_percent}%`, background: '#3B82F6', borderRadius: 2, transition: 'width .4s' }}/>
            </div>
            <div style={{ fontSize: 10, color: '#BBB', marginTop: 4, fontFamily: 'DM Mono,monospace' }}>
              {runProgress.current} / {runProgress.total}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            {['Total', 'Pending', 'Breached', 'Blocked'].map(l => (
              <div key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '8px 14px', background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8 }}>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 500, color: '#DDD' }}>—</span>
                <span style={{ fontSize: 10, color: '#CCC', textTransform: 'uppercase', letterSpacing: '.3px' }}>{l}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Stats ── */}
      {stats && !isAttacking && (
        <StatsPanel
          chips={[
            { label: 'Total', value: stats.total_attacks, color: '#555' },
          ]}
          loading={false}
        />
      )}

      {/* ── Section 2: Prompt list ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '16px 24px 20px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, minHeight: 0 }}>
        {/* List header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F0EDE6', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Generated Prompts</span>
          <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#BBB' }}>
            {isAttacking
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg className="at-spin" width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#E8E6E0" strokeWidth="1.5"/><path d="M5.5 1.5a4 4 0 0 1 4 4" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  streaming
                </span>
              : `${allPrompts.length} total`}
          </span>
        </div>

        {allPrompts.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#CCC' }}>
            {isAttacking ? (
              <>
                <svg className="at-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#E8E6E0" strokeWidth="2"/>
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 13 }}>Waiting for first prompt…</span>
              </>
            ) : (
              <span style={{ fontSize: 13 }}>No prompts yet — start the run</span>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessionKeys.map(sessionId => {
              const prompts = attackPrompts[sessionId];
              let globalIdx = 0;
              return (
                <div key={sessionId}>
                  <div style={{ padding: '10px 16px', background: '#F7F6F3', borderBottom: '1px solid #E8E6E0', fontSize: 11, fontWeight: 600, color: '#666', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#999' }}>Session</span>
                    {sessionId}
                    <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#AAA' }}>{prompts.length} turns</span>
                  </div>
                  {prompts.map((p: AttackPrompt) => {
                    globalIdx++;
                    const sc    = STATUS_CFG[p.status] ?? { label: p.status, bg: '#F7F6F3', color: '#888', dot: '#CCC' };
                    const isExp = expandedId === p.promptId;
                    return (
                      <div
                        key={p.promptId}
                        className="at-row"
                        style={{ display: 'grid', gridTemplateColumns: '40px auto 1fr auto', gap: 0, borderBottom: '1px solid #F9F8F6', cursor: 'pointer', alignItems: isExp ? 'flex-start' : 'center', transition: 'background .1s' }}
                        onClick={() => setExpandedId(isExp ? null : p.promptId)}
                      >
                        <div style={{ padding: '12px 0 12px 16px', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', userSelect: 'none' }}>
                          {String(globalIdx).padStart(2, '0')}
                        </div>
                        <div style={{ padding: '12px 12px 12px 8px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 500, background: sc.bg, color: sc.color, whiteSpace: 'nowrap' }}>
                            <span style={{ width: 4, height: 4, borderRadius: '50%', background: sc.dot, display: 'inline-block', flexShrink: 0 }}/>
                            {sc.label}
                          </span>
                        </div>
                        <div style={{ padding: '12px 8px', fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#555', overflow: 'hidden', textOverflow: isExp ? 'initial' : 'ellipsis', whiteSpace: isExp ? 'pre-wrap' : 'nowrap', wordBreak: 'break-word', lineHeight: 1.55 }}>
                          {p.content}
                        </div>
                        <div style={{ padding: '12px 16px 12px 8px', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {new Date(p.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Status breakdown footer */}
        {allPrompts.length > 0 && (
          <div style={{ display: 'flex', gap: 12, padding: '8px 16px', borderTop: '1px solid #F0EDE6', background: '#FAFAF9', flexWrap: 'wrap', flexShrink: 0 }}>
            {(['generated', 'sent', 'breached', 'blocked', 'failed'] as AttackStatus[]).map(s => {
              const count = allPrompts.filter(p => p.status === s).length;
              if (!count) return null;
              const sc = STATUS_CFG[s];
              return (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, display: 'inline-block' }}/>
                  <span style={{ fontFamily: 'DM Mono,monospace', fontWeight: 500, color: '#555' }}>{count}</span>
                  <span style={{ color: '#AAA' }}>{sc.label}</span>
                </div>
              );
            })}
            <div style={{ marginLeft: 'auto', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#BBB' }}>
              {allPrompts.length} total
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttackTestingPage;