// pages/DefenseTestingPage.tsx
import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { DefenseResponse, DefenseEvaluation } from '../types';
import { useAppStore } from '../store/appStore';
import { fetchRunStats } from '../services/api';
import StatsPanel from '../components/stats/StatsPanel';

interface DefenseTestingPageProps { embedded?: boolean; }

const EVAL_CFG: Record<DefenseEvaluation, { label: string; bg: string; color: string; border: string }> = {
  blocked:      { label: 'Blocked',     bg: '#F0FDF4', color: '#15803D', border: '#86EFAC' },
  passed:       { label: 'Passed',      bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5' },
  failed_filter:{ label: 'Filter Miss', bg: '#FFFBEB', color: '#B45309', border: '#FCD34D' },
};

const DefenseTestingPage: React.FC<DefenseTestingPageProps> = () => {
  const defenseResponses      = useAppStore(s => s.defenseResponses);
  const isEvaluating          = useAppStore(s => s.isEvaluating);
  const defenseError          = useAppStore(s => s.defenseError);
  const clearDefenseResponses = useAppStore(s => s.clearDefenseResponses);
  const setDefenseError       = useAppStore(s => s.setDefenseError);
  const activeRunId           = useAppStore(s => s.activeRunId);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!isEvaluating && activeRunId && defenseResponses.length > 0) {
      setStatsLoading(true);
      fetchRunStats(activeRunId).then(s => {
        setStats(s);
      }).finally(() => setStatsLoading(false));
    } else if (isEvaluating) {
      setStats(null);
    }
  }, [isEvaluating, activeRunId]);

  const total   = defenseResponses.length;
  const blockedCount = defenseResponses.filter(r => r.was_blocked).length;
  const passedCount  = defenseResponses.filter(r => !r.was_blocked).length;

  const displayed = [...defenseResponses].reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes df-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes df-spin  { to{transform:rotate(360deg)} }
        .df-spin { animation: df-spin .8s linear infinite; }
        .df-row:hover { background: #F7F6F3 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Defense Testing
            {isEvaluating && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 500, color: '#15803D', background: '#F0FDF4', padding: '2px 8px', borderRadius: 12 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#22C55E', display: 'inline-block', animation: 'df-pulse 1.5s infinite' }}/>
                Evaluating
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            {isEvaluating
              ? 'Defense node is processing attack prompts…'
              : defenseResponses.length > 0
              ? `${defenseResponses.length} responses received`
              : 'Waiting for run to start'}
          </div>
        </div>
        {defenseResponses.length > 0 && !isEvaluating && (
          <button onClick={clearDefenseResponses} style={{ fontSize: 11, color: '#AAA', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 }}>
            Clear
          </button>
        )}
      </div>

      {defenseError && (
        <div style={{ margin: '12px 24px 0', padding: '9px 13px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#DC2626', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          ⚠ {defenseError}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626' }} onClick={() => setDefenseError(null)}>✕</button>
        </div>
      )}

      {/* ── Stats ── */}
      {stats && !isEvaluating && (
        <StatsPanel
          chips={[
            { label: 'Total', value: stats.total_defences, color: '#555' },
            { label: 'Blocked', value: stats.blocked_defences, color: '#15803D' },
            { label: 'Passed', value: stats.passed_defences, color: '#DC2626' },
          ]}
          loading={false}
        />
      )}

      {/* ── Response feed ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '16px 24px 20px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F0EDE6', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Defense Responses</span>
          <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#BBB' }}>
            {isEvaluating
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg className="df-spin" width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#E8E6E0" strokeWidth="1.5"/><path d="M5.5 1.5a4 4 0 0 1 4 4" stroke="#22C55E" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  streaming
                </span>
              : `${defenseResponses.length} responses`}
          </span>
        </div>

        {displayed.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#CCC' }}>
            {isEvaluating ? (
              <>
                <svg className="df-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#E8E6E0" strokeWidth="2"/>
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 13 }}>Waiting for first response…</span>
              </>
            ) : (
              <>
                <Shield size={32} style={{ opacity: .25 }}/>
                <span style={{ fontSize: 13 }}>No defense responses yet</span>
              </>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {displayed.map((r: DefenseResponse, i: number) => {
              const cfg   = EVAL_CFG[r.evaluation] ?? EVAL_CFG.passed;
              const isExp = expandedId === r.promptId;
              return (
                <div
                  key={r.promptId}
                  className="df-row"
                  style={{ padding: '13px 16px', borderBottom: '1px solid #F9F8F6', cursor: 'pointer', transition: 'background .1s' }}
                  onClick={() => setExpandedId(isExp ? null : r.promptId)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isExp ? 10 : 0 }}>
                    <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', flexShrink: 0, minWidth: 20 }}>
                      {String(displayed.length - i).padStart(2, '0')}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                      {r.was_blocked ? <Shield size={9}/> : <AlertTriangle size={9}/>}
                      {cfg.label}
                    </span>
                    {r.attack_type && (
                      <span style={{ fontSize: 10, color: '#888', background: '#F7F6F3', padding: '2px 7px', borderRadius: 10, border: '1px solid #E8E6E0' }}>
                        {r.attack_type}
                      </span>
                    )}
                    {r.was_blocked && r.blocked_by && (
                      <span style={{ fontSize: 10, color: '#6366F1', background: '#EEF2FF', padding: '2px 7px', borderRadius: 10, border: '1px solid #C7D2FE' }}>
                        via {r.blocked_by}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', flexShrink: 0 }}>
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ marginLeft: 30, fontSize: 12, color: r.was_blocked ? '#888' : '#333', fontFamily: r.was_blocked ? 'inherit' : 'DM Mono,monospace', lineHeight: 1.55, marginTop: 6 }}>
                    {r.was_blocked ? (
                      <span style={{ color: '#888', fontStyle: 'italic' }}>
                        {r.defenseResponse || `Prompt intercepted and blocked${r.blocked_by ? ` by ${r.blocked_by}` : ''}.`}
                      </span>
                    ) : (
                      isExp
                        ? r.defenseResponse
                        : r.defenseResponse.length > 100
                        ? `${r.defenseResponse.slice(0, 100)}…`
                        : r.defenseResponse
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DefenseTestingPage;
