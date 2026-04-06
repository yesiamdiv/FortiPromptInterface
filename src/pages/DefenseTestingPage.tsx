import React, { useState } from 'react';
import { DefenseConfig, DefenseFilter, DefenseStats } from '../types';
import { useAppStore } from '../store/appStore';
import { updateDefenseConfig, fetchDefenseStats } from '../services/api';

interface DefenseTestingPageProps {
  onBack: () => void;
}

const SCORE_COLOR = (s: number) => s >= 85 ? '#22C55E' : s >= 65 ? '#F59E0B' : '#EF4444';

// Available filters exposed via the API
const AVAILABLE_FILTERS: { name: string; description: string }[] = [
  { name: 'regex_filter',    description: 'Blocks prompts matching known attack patterns' },
  { name: 'semantic_filter', description: 'Uses embeddings to detect adversarial intent'  },
  { name: 'keyword_blocker', description: 'Keyword-based blocklist for common jailbreaks' },
  { name: 'llm_judge',       description: 'Uses an LLM to classify and block unsafe input' },
];

const MODEL_OPTIONS = [
  'gpt-4o-mini',
  'gpt-4o',
  'claude-3-5-sonnet-20241022',
  'claude-3-haiku-20240307',
  'gemini-1.5-flash',
];

const DEFAULT_CONFIG: DefenseConfig = {
  filters: AVAILABLE_FILTERS.map(f => ({ name: f.name, enabled: f.name === 'regex_filter' })),
  model: 'gpt-4o-mini',
};

const DefenseTestingPage: React.FC<DefenseTestingPageProps> = ({ onBack }) => {
  const [activeTab, setActiveTab]     = useState<'attack' | 'defense'>('defense');
  const [formConfig, setFormConfig]   = useState<DefenseConfig>(DEFAULT_CONFIG);
  const [apiKey, setApiKey]           = useState('');

  // Global store — read
  const activeRunId  = useAppStore(s => s.activeRunId);
  const defenseStats = useAppStore(s => s.defenseStats);
  const defenseResponses = useAppStore(s => s.defenseResponses);
  const isEvaluating = useAppStore(s => s.isEvaluating);
  const defenseError = useAppStore(s => s.defenseError);

  // Global store — write
  const setDefenseConfig = useAppStore(s => s.setDefenseConfig);
  const setDefenseStats  = useAppStore(s => s.setDefenseStats);
  const setIsEvaluating  = useAppStore(s => s.setIsEvaluating);
  const setDefenseError  = useAppStore(s => s.setDefenseError);
  const updateRun        = useAppStore(s => s.updateRun);

  // ── Save config + trigger evaluation ────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!activeRunId) return;
    setDefenseError(null);
    setDefenseConfig(formConfig);
    setIsEvaluating(true);
    updateRun(activeRunId, { status: 'running', updatedAt: new Date().toISOString() });

    try {
      await updateDefenseConfig(activeRunId, formConfig, apiKey || undefined);
      // Stats will stream in via WebSocket; also fetch current snapshot
      const stats = await fetchDefenseStats(activeRunId);
      setDefenseStats(stats);
      updateRun(activeRunId, { status: 'completed', updatedAt: new Date().toISOString() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      setDefenseError(msg);
      updateRun(activeRunId, { status: 'failed', updatedAt: new Date().toISOString() });
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleFilter = (name: string) => {
    setFormConfig(prev => ({
      ...prev,
      filters: prev.filters.map((f: DefenseFilter) =>
        f.name === name ? { ...f, enabled: !f.enabled } : f
      ),
    }));
  };

  const isFilterEnabled = (name: string) =>
    formConfig.filters.some((f: DefenseFilter) => f.name === name && f.enabled);

  // Derived stats — typed against DefenseStats
  const score        = defenseStats?.overallDefenseScore ?? 0;
  const blocked      = defenseStats?.blockedCount ?? 0;
  const passed       = defenseStats?.passedCount ?? 0;
  const total        = defenseStats?.totalResponses ?? 0;
  const filterPerf   = defenseStats?.filterPerformance ?? {};

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', minHeight: '100vh', color: '#1A1A1A' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin { to { transform: rotate(360deg); } }
        .df-spinner { animation: spin .8s linear infinite; }
        .df-range { -webkit-appearance:none; appearance:none; width:100%; height:4px; border-radius:2px; background:#E8E6E0; outline:none; cursor:pointer; }
        .df-range::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#1A1A1A; border:2.5px solid #fff; box-shadow:0 1px 4px rgba(0,0,0,.2); cursor:pointer; }
        .df-tab { padding:5px 14px; font-size:13px; font-weight:500; border-radius:6px; cursor:pointer; border:none; font-family:inherit; transition:all .15s; }
        .df-btn-run { width:100%; height:38px; border-radius:7px; border:none; background:#1A1A1A; font-family:inherit; font-size:13px; font-weight:500; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:7px; transition:background .15s; }
        .df-btn-run:hover:not(:disabled) { background:#333; }
        .df-btn-run:disabled { opacity:.5; cursor:not-allowed; }
        .df-error-bar { display:flex; align-items:center; gap:8px; padding:10px 14px; background:#FEF2F2; border:1px solid #FCA5A5; border-radius:7px; font-size:12px; color:#DC2626; margin-bottom:14px; }
        .df-filter-row { display:flex; align-items:flex-start; gap:12px; padding:12px; border:1px solid #E8E6E0; border-radius:8px; background:#F7F6F3; transition:border-color .15s; }
        .df-filter-row:hover { border-color:#ccc; }
        .df-toggle { position:relative; width:34px; height:18px; flex-shrink:0; margin-top:1px; }
        .df-toggle input { opacity:0; width:0; height:0; }
        .df-toggle-slider { position:absolute; inset:0; border-radius:9px; background:#E8E6E0; cursor:pointer; transition:background .2s; }
        .df-toggle input:checked + .df-toggle-slider { background:#1A1A1A; }
        .df-toggle-slider::before { content:''; position:absolute; width:12px; height:12px; border-radius:50%; background:#fff; left:3px; top:3px; transition:transform .2s; }
        .df-toggle input:checked + .df-toggle-slider::before { transform:translateX(16px); }
        .df-resp-row { padding:12px 16px; border-bottom:1px solid #F9F8F6; display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; font-size:12px; }
        .df-resp-row:last-child { border-bottom:none; }
        .df-eval-badge { display:inline-flex; align-items:center; gap:4px; padding:3px 8px; border-radius:20px; font-size:11px; font-weight:500; }
        .df-eval-blocked      { background:#F0FDF4; color:#15803D; }
        .df-eval-passed       { background:#FEF2F2; color:#DC2626; }
        .df-eval-failed_filter { background:#FFFBEB; color:#B45309; }
        .df-no-run { display:flex; align-items:center; justify-content:center; padding:80px 24px; color:#CCC; font-size:14px; grid-column:1/-1; }
      `}</style>

      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', height: 56, background: '#fff', borderBottom: '1px solid #E8E6E0', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Runs
          </button>
          <div style={{ width: 1, height: 18, background: '#E8E6E0' }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>FortiPrompt</span>
          {activeRunId && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#999', textTransform: 'uppercase', letterSpacing: .5 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', display: 'inline-block' }} />
              Run: {activeRunId.slice(-8)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2, background: '#F0EDE6', padding: 3, borderRadius: 8 }}>
          <button className="df-tab" onClick={() => setActiveTab('attack')}
            style={{ background: activeTab === 'attack' ? '#fff' : 'transparent', color: activeTab === 'attack' ? '#1A1A1A' : '#888', boxShadow: activeTab === 'attack' ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
            Attack Testing
          </button>
          <button className="df-tab" onClick={() => setActiveTab('defense')}
            style={{ background: activeTab === 'defense' ? '#fff' : 'transparent', color: activeTab === 'defense' ? '#1A1A1A' : '#888', boxShadow: activeTab === 'defense' ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
            Defense Testing
          </button>
        </div>
      </nav>

      {!activeRunId ? (
        <div className="df-no-run">
          No active run selected — go back to the dashboard and open a run first.
        </div>
      ) : (
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

          {/* LEFT — Defense Config */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Model + API Key */}
            <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EDE6' }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Defender Model</div>
                <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>Model used to evaluate and respond</div>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: .3, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Model</label>
                  <select
                    style={{ height: 36, width: '100%', background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 7, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', appearance: 'none', backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
                    value={formConfig.model}
                    onChange={e => setFormConfig(prev => ({ ...prev, model: e.target.value }))}
                  >
                    {MODEL_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 500, color: '#999', letterSpacing: .3, textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>API Key (Optional)</label>
                  <input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    style={{ height: 36, width: '100%', background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 7, padding: '0 12px', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Defense Filters</div>
                  <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>Enable filters to protect against attacks</div>
                </div>
                <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#999', background: '#F0EDE6', padding: '3px 8px', borderRadius: 20 }}>
                  {formConfig.filters.filter((f: DefenseFilter) => f.enabled).length} active
                </span>
              </div>
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {AVAILABLE_FILTERS.map(f => (
                  <div key={f.name} className="df-filter-row">
                    <label className="df-toggle">
                      <input
                        type="checkbox"
                        checked={isFilterEnabled(f.name)}
                        onChange={() => toggleFilter(f.name)}
                      />
                      <span className="df-toggle-slider" />
                    </label>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{f.name}</div>
                      <div style={{ fontSize: 11, color: '#999', lineHeight: 1.4 }}>{f.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Error + Run button */}
              <div style={{ padding: '0 20px 20px' }}>
                {defenseError && (
                  <div className="df-error-bar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5V7M7 9.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                    {defenseError}
                  </div>
                )}
                <button
                  className="df-btn-run"
                  onClick={handleEvaluate}
                  disabled={isEvaluating || formConfig.filters.every((f: DefenseFilter) => !f.enabled)}
                  title={formConfig.filters.every((f: DefenseFilter) => !f.enabled) ? 'Enable at least one filter' : undefined}
                >
                  {isEvaluating ? (
                    <>
                      <svg className="df-spinner" width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.3" strokeDasharray="9 5" strokeLinecap="round"/>
                      </svg>
                      Saving &amp; Evaluating…
                    </>
                  ) : (
                    <>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="white"/></svg>
                      Save &amp; Run Defense Evaluation
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT — Scores + Responses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Defense Score */}
            <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EDE6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Defense Score</div>
                  <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>Overall robustness of your configuration</div>
                </div>
                {defenseStats && (
                  <span style={{ fontSize: 11, color: '#15803D', background: '#F0FDF4', padding: '3px 8px', borderRadius: 20, fontWeight: 500 }}>
                    Last run: just now
                  </span>
                )}
              </div>
              <div style={{ padding: 20 }}>
                {/* Big score */}
                <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
                  {isEvaluating ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <svg className="df-spinner" width="28" height="28" viewBox="0 0 28 28" fill="none">
                        <circle cx="14" cy="14" r="11" stroke="#E8E6E0" strokeWidth="2.5"/>
                        <path d="M14 3a11 11 0 0 1 11 11" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: 12, color: '#BBB' }}>Evaluating…</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 52, fontWeight: 500, color: defenseStats ? SCORE_COLOR(score) : '#DDD', letterSpacing: -2 }}>
                        {defenseStats ? score : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: '#BBB', marginTop: 3 }}>Overall Defense Score (0–100)</div>
                    </>
                  )}
                </div>

                {/* Count stats */}
                {defenseStats && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
                    {[
                      { label: 'Total',   val: total,   color: '#1A1A1A' },
                      { label: 'Blocked', val: blocked,  color: '#15803D' },
                      { label: 'Passed',  val: passed,   color: '#DC2626' },
                    ].map(({ label, val, color }) => (
                      <div key={label} style={{ background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '10px 12px', textAlign: 'center' }}>
                        <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 20, fontWeight: 500, color }}>{val}</div>
                        <div style={{ fontSize: 10, color: '#BBB', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.3px' }}>{label}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Filter performance */}
                {defenseStats && Object.keys(filterPerf).length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.3px' }}>Filter Performance</div>
                    {Object.entries(filterPerf).map(([name, perf]) => (
                      <div key={name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12, color: '#555' }}>
                          <span>{name}</span>
                          <span style={{ fontFamily: 'DM Mono,monospace' }}>
                            {perf.blocked} blocked · {perf.falsePositives} FP
                          </span>
                        </div>
                        <div style={{ height: 3, background: '#F0EDE6', borderRadius: 2 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, perf.blocked)}%`, background: SCORE_COLOR(perf.blocked), borderRadius: 2, transition: 'width .5s ease' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!defenseStats && !isEvaluating && (
                  <p style={{ textAlign: 'center', fontSize: 12, color: '#CCC', marginTop: 8 }}>
                    Save your configuration and run an evaluation to see scores
                  </p>
                )}
              </div>
            </div>

            {/* Defense Responses feed */}
            {defenseResponses.length > 0 && (
              <div style={{ background: '#fff', border: '1px solid #E8E6E0', borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', borderBottom: '1px solid #F0EDE6' }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Response Feed</div>
                  <div style={{ fontSize: 11, color: '#BBB', marginTop: 1 }}>Live defense responses</div>
                </div>
                <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                  {defenseResponses.slice().reverse().map((r, i) => (
                    <div key={`${r.promptId}-${i}`} className="df-resp-row">
                      <div style={{ fontFamily: 'DM Mono,monospace', fontSize: 11, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.defenseResponse}
                      </div>
                      <span className={`df-eval-badge df-eval-${r.evaluation}`}>
                        {r.evaluation === 'blocked' ? '● Blocked' : r.evaluation === 'passed' ? '✕ Passed' : '◈ Filter'}
                      </span>
                      <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, color: '#CCC', whiteSpace: 'nowrap' }}>
                        {new Date(r.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DefenseTestingPage;