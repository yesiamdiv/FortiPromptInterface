// pages/EvaluationPage.tsx
import React, { useState } from 'react';
import { BarChart2, ChevronDown, ChevronRight, Zap, Shield, AlertTriangle } from 'lucide-react';
import { EvalResult, EvalVerdict } from '../types';
import { useAppStore } from '../store/appStore';

interface EvaluationPageProps { embedded?: boolean; }

const VERDICT_CFG: Record<EvalVerdict, { label: string; icon: React.ReactNode; bg: string; color: string; border: string; dot: string }> = {
  breach:   { label: 'Breach',   icon: <Zap size={10}/>,           bg: '#FEF2F2', color: '#DC2626', border: '#FCA5A5', dot: '#EF4444' },
  defended: { label: 'Defended', icon: <Shield size={10}/>,        bg: '#F0FDF4', color: '#15803D', border: '#86EFAC', dot: '#22C55E' },
  partial:  { label: 'Partial',  icon: <AlertTriangle size={10}/>, bg: '#FFFBEB', color: '#B45309', border: '#FCD34D', dot: '#F59E0B' },
};

const ScoreBar: React.FC<{ score: number; verdict: EvalVerdict }> = ({ score, verdict }) => {
  const cfg   = VERDICT_CFG[verdict];
  const width = Math.round(score * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ flex: 1, height: 3, background: '#F0EDE6', borderRadius: 2 }}>
        <div style={{ width: `${width}%`, height: '100%', background: cfg.dot, borderRadius: 2, transition: 'width .3s' }}/>
      </div>
      <span style={{ fontSize: 10, fontFamily: 'DM Mono,monospace', color: cfg.color, minWidth: 28, textAlign: 'right' as const }}>
        {width}%
      </span>
    </div>
  );
};

const EvaluationPage: React.FC<EvaluationPageProps> = () => {
  const evalResults      = useAppStore(s => s.evalResults);
  const evalStats        = useAppStore(s => s.evalStats);
  const isAttacking      = useAppStore(s => s.isAttacking);
  const clearEvalResults = useAppStore(s => s.clearEvalResults);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Always derive stats from both the server-sent stats and the local store items.
  // Server stats are authoritative when present; fall back to counting store items.
  // This ensures numbers are never stale whether live or after reload.
  const localBreaches = evalResults.filter(r => r.verdict === 'breach').length;
  const localDefended = evalResults.filter(r => r.verdict === 'defended').length;
  const localPartial  = evalResults.filter(r => r.verdict === 'partial').length;
  const localTotal    = evalResults.length;
  const localAvg      = localTotal > 0
    ? evalResults.reduce((a, r) => a + r.score, 0) / localTotal
    : null;

  const total      = evalStats?.total    ?? localTotal;
  const breaches   = evalStats?.breaches ?? localBreaches;
  const defended   = evalStats?.defended ?? localDefended;
  const partial    = evalStats?.partial  ?? localPartial;
  const avgScore   = evalStats?.averageScore ?? localAvg;
  const breachRate = total > 0 ? Math.round((breaches / total) * 100) : null;
  const breachRateColor = breachRate == null ? '#CCC' : breachRate <= 20 ? '#22C55E' : breachRate <= 50 ? '#F59E0B' : '#EF4444';

  const displayed = [...evalResults].reverse();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes ev-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes ev-spin  { to{transform:rotate(360deg)} }
        .ev-spin  { animation: ev-spin .8s linear infinite; }
        .ev-row:hover { background: #F7F6F3 !important; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-.3px', display: 'flex', alignItems: 'center', gap: 8 }}>
            Evaluation Results
            {isAttacking && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 500, color: '#6366F1', background: '#EEF2FF', padding: '2px 8px', borderRadius: 12 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#6366F1', display: 'inline-block', animation: 'ev-pulse 1.5s infinite' }}/>
                Live
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
            {evalResults.length > 0
              ? `${evalResults.length} cycles evaluated — click any row to see prompt & response`
              : 'Evaluation results appear here after each attack-defense cycle'}
          </div>
        </div>
        {evalResults.length > 0 && !isAttacking && (
          <button onClick={clearEvalResults} style={{ fontSize: 11, color: '#AAA', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', marginTop: 2 }}>
            Clear
          </button>
        )}
      </div>

      {/* ── Stat chips ── */}
      <div style={{ padding: '16px 24px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Total',    val: String(total),    color: '#1A1A1A' },
            { label: 'Breaches', val: String(breaches), color: '#DC2626' },
            { label: 'Defended', val: String(defended), color: '#15803D' },
            { label: 'Partial',  val: String(partial),  color: '#B45309' },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '8px 14px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 8 }}>
              <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 500, color: total > 0 ? color : '#DDD' }}>
                {total > 0 ? val : '—'}
              </span>
              <span style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</span>
            </div>
          ))}

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '8px 14px', background: '#fff', border: `1px solid ${breachRate != null ? breachRateColor + '50' : '#E8E6E0'}`, borderRadius: 8 }}>
            <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 500, color: breachRateColor }}>
              {breachRate != null ? `${breachRate}%` : '—'}
            </span>
            <span style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.3px' }}>Breach Rate</span>
          </div>

          {avgScore != null && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, padding: '8px 14px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 8 }}>
              <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 18, fontWeight: 500, color: '#555' }}>
                {Math.round(avgScore * 100)}%
              </span>
              <span style={{ fontSize: 10, color: '#AAA', textTransform: 'uppercase', letterSpacing: '.3px' }}>Avg Score</span>
            </div>
          )}
        </div>

        {total > 0 && (
          <div style={{ marginTop: 10, height: 4, background: '#F0FDF4', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ width: `${(breaches / total) * 100}%`, background: '#EF4444', transition: 'width .4s' }}/>
              <div style={{ width: `${(partial  / total) * 100}%`, background: '#F59E0B', transition: 'width .4s' }}/>
              <div style={{ flex: 1, background: '#22C55E' }}/>
            </div>
          </div>
        )}
      </div>

      {/* ── Results list (scrollable) ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', margin: '16px 24px 20px', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, minHeight: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '11px 16px', borderBottom: '1px solid #F0EDE6', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Cycle Results</span>
          <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#BBB' }}>
            {isAttacking
              ? <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <svg className="ev-spin" width="11" height="11" viewBox="0 0 11 11" fill="none"><circle cx="5.5" cy="5.5" r="4" stroke="#E8E6E0" strokeWidth="1.5"/><path d="M5.5 1.5a4 4 0 0 1 4 4" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  evaluating
                </span>
              : `${evalResults.length} results`}
          </span>
        </div>

        {displayed.length === 0 ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#CCC' }}>
            {isAttacking ? (
              <>
                <svg className="ev-spin" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="9" stroke="#E8E6E0" strokeWidth="2"/>
                  <path d="M12 3a9 9 0 0 1 9 9" stroke="#6366F1" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span style={{ fontSize: 13 }}>Evaluating cycles…</span>
              </>
            ) : (
              <>
                <BarChart2 size={32} style={{ opacity: .25 }}/>
                <span style={{ fontSize: 13 }}>No evaluations yet</span>
                <span style={{ fontSize: 11, color: '#BBB', textAlign: 'center', maxWidth: 220, lineHeight: 1.5 }}>
                  Results appear here after the evaluation node processes each attack-defense cycle
                </span>
              </>
            )}
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {displayed.map((r: EvalResult, i: number) => {
              const cfg   = VERDICT_CFG[r.verdict] ?? VERDICT_CFG.partial;
              const isExp = expandedId === r.evalId;
              const hasContent = !!(r.attackContent || r.defenseContent);
              return (
                <div key={r.evalId} className="ev-row" style={{ borderBottom: '1px solid #F9F8F6', cursor: hasContent ? 'pointer' : 'default', transition: 'background .1s' }}>
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px' }}
                    onClick={() => hasContent && setExpandedId(isExp ? null : r.evalId)}
                  >
                    <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', flexShrink: 0, minWidth: 20 }}>
                      {String(displayed.length - i).padStart(2, '0')}
                    </span>

                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, flexShrink: 0 }}>
                      {cfg.icon}{cfg.label}
                    </span>

                    <div style={{ flex: 1 }}>
                      <ScoreBar score={r.score} verdict={r.verdict} />
                    </div>

                    <div style={{ fontSize: 11, color: '#888', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      {r.reasoning}
                    </div>

                    <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', flexShrink: 0 }}>
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </span>

                    {hasContent && (
                      <span style={{ color: '#CCC', flexShrink: 0, display: 'flex' }}>
                        {isExp ? <ChevronDown size={13}/> : <ChevronRight size={13}/>}
                      </span>
                    )}
                  </div>

                  {isExp && (
                    <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {r.reasoning && (
                        <div style={{ fontSize: 12, color: '#555', lineHeight: 1.6, padding: '10px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: cfg.color, marginBottom: 5, textTransform: 'uppercase', letterSpacing: '.3px' }}>
                            Evaluator Reasoning
                          </div>
                          {r.reasoning}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: r.attackContent && r.defenseContent ? '1fr 1fr' : '1fr', gap: 10 }}>
                        {r.attackContent && (
                          <div style={{ padding: '10px 12px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#DC2626', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '.3px' }}>
                              <Zap size={9}/> Attack Prompt
                            </div>
                            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#555', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {r.attackContent}
                            </div>
                          </div>
                        )}

                        {r.defenseContent && (
                          <div style={{ padding: '10px 12px', background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8 }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: '#15803D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4, textTransform: 'uppercase', letterSpacing: '.3px' }}>
                              <Shield size={9}/> Defense Response
                              {r.was_blocked && <span style={{ fontWeight: 400, color: '#888', textTransform: 'none' as const }}>· Blocked</span>}
                            </div>
                            <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#555', lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                              {r.defenseContent}
                            </div>
                          </div>
                        )}
                      </div>

                      {r.attack_type && (
                        <div style={{ fontSize: 11, color: '#888' }}>
                          Detected attack type: <span style={{ fontWeight: 500, color: '#555' }}>{r.attack_type}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EvaluationPage;
