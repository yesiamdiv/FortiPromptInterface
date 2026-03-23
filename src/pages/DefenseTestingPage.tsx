import React, { useState } from 'react';
import { DefenseBackendConfig } from '../types';
import { useAppStore } from '../store/appStore';
import { startDefenseEvaluation } from '../services/api';
import { generateRunId, nowISO } from '../utils/run';

interface DefenseTestingPageProps {
  onBack: () => void;
}

const SCORE_COLOR = (s: number) => s >= 85 ? '#22C55E' : s >= 65 ? '#F59E0B' : '#EF4444';

const VECTOR_LABELS = [
  { key: 'directInjection',      label: 'Direct Injection'     },
  { key: 'jailbreakResistance',  label: 'Jailbreak Resistance' },
  { key: 'promptLeaking',        label: 'Prompt Leaking'       },
  { key: 'rolePlayExploits',     label: 'Role Play Exploits'   },
  { key: 'indirectInjection',    label: 'Indirect Injection'   },
] as const;

const DefenseTestingPage: React.FC<DefenseTestingPageProps> = ({ onBack }) => {
  // Local form state
  const [activeTab, setActiveTab]   = useState<'attack' | 'defense'>('defense');
  const [formConfig, setFormConfig] = useState<DefenseBackendConfig>({
    systemPrompt: '',
    guardrailLevel: 0.8,
    attackVectors: 'All vectors',
    layers: [],
  });

  // Global store — read
  const activeRunId   = useAppStore(s => s.activeRunId);
  const defenseStats  = useAppStore(s => s.defenseStats);
  const isEvaluating  = useAppStore(s => s.isEvaluating);
  const defenseError  = useAppStore(s => s.defenseError);
  const backendConfig = useAppStore(s => s.backendConfig);

  // Global store — write
  const setDefenseConfig  = useAppStore(s => s.setDefenseConfig);
  const setDefenseStats   = useAppStore(s => s.setDefenseStats);
  const setIsEvaluating   = useAppStore(s => s.setIsEvaluating);
  const setDefenseError   = useAppStore(s => s.setDefenseError);
  const addRun            = useAppStore(s => s.addRun);
  const setActiveRun      = useAppStore(s => s.setActiveRun);
  const updateRun         = useAppStore(s => s.updateRun);

  // Derived: use live stats from store or fall back to placeholder zeros
  const stats = defenseStats ?? {
    overallScore: 0,
    directInjection: 0,
    jailbreakResistance: 0,
    promptLeaking: 0,
    rolePlayExploits: 0,
    indirectInjection: 0,
  };

  // ── Run evaluation ─────────────────────────────────────────────────────────
  const handleEvaluate = async () => {
    if (!formConfig.systemPrompt.trim()) return;
    setDefenseError(null);

    let runId = activeRunId;
    if (!runId) {
      runId = generateRunId();
      addRun({
        id: runId,
        name: `Defense Eval – ${new Date().toLocaleTimeString()}`,
        status: 'running',
        components: ['defense-testing'],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      });
      setActiveRun(runId);
    } else {
      updateRun(runId, { status: 'running', updatedAt: nowISO() });
    }

    setDefenseConfig(formConfig);
    setIsEvaluating(true);

    try {
      const apiKey = backendConfig?.apiKey;
      const result = await startDefenseEvaluation(runId, formConfig, apiKey);
      setDefenseStats(result);
      updateRun(runId, { status: 'completed', updatedAt: nowISO() });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Evaluation failed';
      setDefenseError(msg);
      updateRun(runId, { status: 'failed', updatedAt: nowISO() });
    } finally {
      setIsEvaluating(false);
    }
  };

  const update = (key: keyof DefenseBackendConfig, val: unknown) =>
    setFormConfig(prev => ({ ...prev, [key]: val }));

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily:"'DM Sans',sans-serif", background:'#F7F6F3', minHeight:'100vh', color:'#1A1A1A' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        @keyframes spin{to{transform:rotate(360deg)}}
        .df-spinner{animation:spin .8s linear infinite}
        .df-range{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:#E8E6E0;outline:none;cursor:pointer}
        .df-range::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#1A1A1A;border:2.5px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2);cursor:pointer}
        .df-tab{padding:5px 14px;font-size:13px;font-weight:500;border-radius:6px;cursor:pointer;border:none;font-family:inherit;transition:all .15s}
        .df-btn-run{width:100%;height:36px;border-radius:7px;border:none;background:#1A1A1A;font-family:inherit;font-size:13px;font-weight:500;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:7px;transition:background .15s}
        .df-btn-run:hover:not(:disabled){background:#333}
        .df-btn-run:disabled{opacity:.5;cursor:not-allowed}
        .df-error-bar{display:flex;align-items:center;gap:8px;padding:10px 14px;background:#FEF2F2;border:1px solid #FCA5A5;border-radius:7px;font-size:12px;color:#DC2626;margin-bottom:14px}
        .df-rec{display:flex;gap:14px;padding:14px;border-radius:8px;align-items:flex-start}
      `}</style>

      {/* Nav */}
      <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 32px', height:56, background:'#fff', borderBottom:'1px solid #E8E6E0', position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <button onClick={onBack} style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, color:'#888', cursor:'pointer', border:'none', background:'none', fontFamily:'inherit' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Runs
          </button>
          <div style={{ width:1, height:18, background:'#E8E6E0' }} />
          <span style={{ fontSize:14, fontWeight:600 }}>FortiPrompt</span>
          {activeRunId && (
            <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:'DM Mono,monospace', fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:.5 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', display:'inline-block' }} />
              Run: {activeRunId.slice(-6)}
            </span>
          )}
        </div>
        <div style={{ display:'flex', gap:2, background:'#F0EDE6', padding:3, borderRadius:8 }}>
          <button className="df-tab" onClick={() => setActiveTab('attack')}
            style={{ background: activeTab==='attack' ? '#fff' : 'transparent', color: activeTab==='attack' ? '#1A1A1A' : '#888', boxShadow: activeTab==='attack' ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
            Attack Testing
          </button>
          <button className="df-tab" onClick={() => setActiveTab('defense')}
            style={{ background: activeTab==='defense' ? '#fff' : 'transparent', color: activeTab==='defense' ? '#1A1A1A' : '#888', boxShadow: activeTab==='defense' ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>
            Defense Testing
          </button>
        </div>
      </nav>

      <div style={{ maxWidth:1400, margin:'0 auto', padding:24, display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>

        {/* System Prompt Hardening */}
        <div style={{ background:'#fff', border:'1px solid #E8E6E0', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F0EDE6' }}>
            <div style={{ fontSize:13, fontWeight:600 }}>System Prompt Hardening</div>
            <div style={{ fontSize:11, color:'#BBB', marginTop:1 }}>Test and improve your system prompt defenses</div>
          </div>
          <div style={{ padding:20, display:'flex', flexDirection:'column', gap:14 }}>

            {/* Error */}
            {defenseError && (
              <div className="df-error-bar">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5V7M7 9.5V10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                {defenseError}
              </div>
            )}

            {/* System prompt */}
            <div>
              <label style={{ fontSize:11, fontWeight:500, color:'#999', letterSpacing:.3, textTransform:'uppercase', display:'block', marginBottom:5 }}>System Prompt</label>
              <textarea
                style={{ width:'100%', background:'#F7F6F3', border:'1px solid #E8E6E0', borderRadius:7, padding:'10px 12px', fontSize:13, fontFamily:'DM Mono,monospace', color:'#1A1A1A', outline:'none', resize:'vertical', minHeight:160, lineHeight:1.6, transition:'border-color .15s' }}
                placeholder="Paste your system prompt here to test its robustness..."
                value={formConfig.systemPrompt}
                onChange={e => update('systemPrompt', e.target.value)}
                onFocus={e => (e.target.style.borderColor = '#1A1A1A')}
                onBlur={e  => (e.target.style.borderColor = '#E8E6E0')}
              />
            </div>

            {/* Guardrail slider */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label style={{ fontSize:11, fontWeight:500, color:'#999', letterSpacing:.3, textTransform:'uppercase' }}>Guardrail Strictness</label>
                <span style={{ fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:500 }}>{formConfig.guardrailLevel.toFixed(2)}</span>
              </div>
              <input type="range" className="df-range" min={0} max={1} step={0.01}
                value={formConfig.guardrailLevel}
                onChange={e => update('guardrailLevel', parseFloat(e.target.value))} />
            </div>

            {/* Attack vectors select */}
            <div>
              <label style={{ fontSize:11, fontWeight:500, color:'#999', letterSpacing:.3, textTransform:'uppercase', display:'block', marginBottom:5 }}>Attack Vectors to Test</label>
              <select
                style={{ height:36, width:'100%', background:'#F7F6F3', border:'1px solid #E8E6E0', borderRadius:7, padding:'0 12px', fontSize:13, fontFamily:'inherit', color:'#1A1A1A', outline:'none', appearance:'none',
                  backgroundImage:"url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E\")",
                  backgroundRepeat:'no-repeat', backgroundPosition:'right 12px center', paddingRight:32 }}
                value={formConfig.attackVectors}
                onChange={e => update('attackVectors', e.target.value)}
              >
                <option>All vectors</option>
                <option>Injection only</option>
                <option>Jailbreak only</option>
                <option>Leaking only</option>
              </select>
            </div>

            {/* Run button */}
            <button
              className="df-btn-run"
              onClick={handleEvaluate}
              disabled={isEvaluating || !formConfig.systemPrompt.trim()}
              title={!formConfig.systemPrompt.trim() ? 'Enter a system prompt first' : undefined}
            >
              {isEvaluating ? (
                <>
                  <svg className="df-spinner" width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="4.5" stroke="white" strokeWidth="1.3" strokeDasharray="9 5" strokeLinecap="round"/>
                  </svg>
                  Evaluating…
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="white"/></svg>
                  Run Defense Evaluation
                </>
              )}
            </button>
          </div>
        </div>

        {/* Defense Score */}
        <div style={{ background:'#fff', border:'1px solid #E8E6E0', borderRadius:10, overflow:'hidden' }}>
          <div style={{ padding:'14px 20px', borderBottom:'1px solid #F0EDE6', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div>
              <div style={{ fontSize:13, fontWeight:600 }}>Defense Score</div>
              <div style={{ fontSize:11, color:'#BBB', marginTop:1 }}>Robustness across attack vectors</div>
            </div>
            {defenseStats && (
              <span style={{ fontSize:11, color:'#15803D', background:'#F0FDF4', padding:'3px 8px', borderRadius:20, fontWeight:500 }}>
                Last run: just now
              </span>
            )}
          </div>
          <div style={{ padding:20 }}>
            {/* Overall score */}
            <div style={{ textAlign:'center', padding:'16px 0 28px' }}>
              {isEvaluating ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8 }}>
                  <svg className="df-spinner" width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="11" stroke="#E8E6E0" strokeWidth="2.5"/>
                    <path d="M14 3a11 11 0 0 1 11 11" stroke="#1A1A1A" strokeWidth="2.5" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontSize:12, color:'#BBB' }}>Evaluating…</span>
                </div>
              ) : (
                <>
                  <div style={{ fontFamily:'DM Mono,monospace', fontSize:52, fontWeight:500, color: defenseStats ? SCORE_COLOR(stats.overallScore) : '#DDD', letterSpacing:-2 }}>
                    {defenseStats ? stats.overallScore : '—'}
                  </div>
                  <div style={{ fontSize:12, color:'#BBB', marginTop:3 }}>Overall Defense Score</div>
                </>
              )}
            </div>

            {/* Per-vector bars */}
            <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
              {VECTOR_LABELS.map(({ key, label }) => {
                const score = stats[key];
                const color = defenseStats ? SCORE_COLOR(score) : '#E8E6E0';
                return (
                  <div key={key}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12, color:'#555' }}>{label}</span>
                      <span style={{ fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:500, color: defenseStats ? '#1A1A1A' : '#CCC' }}>
                        {defenseStats ? score : '—'}
                      </span>
                    </div>
                    <div style={{ height:4, background:'#F0EDE6', borderRadius:2 }}>
                      <div style={{ height:'100%', width:`${defenseStats ? score : 0}%`, background:color, borderRadius:2, transition:'width .5s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state hint */}
            {!defenseStats && !isEvaluating && (
              <p style={{ textAlign:'center', fontSize:12, color:'#CCC', marginTop:20 }}>
                Run an evaluation to see your scores
              </p>
            )}
          </div>
        </div>

        {/* Recommendations — only show after evaluation */}
        {defenseStats && (
          <div style={{ background:'#fff', border:'1px solid #E8E6E0', borderRadius:10, overflow:'hidden', gridColumn:'1/-1' }}>
            <div style={{ padding:'14px 20px', borderBottom:'1px solid #F0EDE6' }}>
              <div style={{ fontSize:13, fontWeight:600 }}>Hardening Recommendations</div>
              <div style={{ fontSize:11, color:'#BBB', marginTop:1 }}>Suggested improvements based on evaluation results</div>
            </div>
            <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { sev:'High',   bg:'#FEF2F2', bd:'#FCA5A5', color:'#DC2626', icon:'⚠',
                  title:'Jailbreak vulnerability via role-play',
                  desc:"Your prompt is susceptible to 'DAN'-style role-play jailbreaks. Add explicit instructions prohibiting role-play of unrestricted AI personas." },
                { sev:'Medium', bg:'#FFFBEB', bd:'#FCD34D', color:'#B45309', icon:'◈',
                  title:'Indirect injection via external content',
                  desc:'Instructions embedded in external URLs or documents could hijack model behavior. Consider adding content isolation instructions.' },
                { sev:'Low',    bg:'#F0FDF4', bd:'#86EFAC', color:'#15803D', icon:'○',
                  title:'Minor prompt leaking surface',
                  desc:'Partial system prompt contents are inferrable. Adding explicit confidentiality instructions would strengthen this vector.' },
              ].map(r => (
                <div key={r.sev} className="df-rec" style={{ background:r.bg, border:`1px solid ${r.bd}` }}>
                  <span style={{ fontSize:14, marginTop:1 }}>{r.icon}</span>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600, color:r.color }}>{r.sev}</span>
                      <span style={{ fontSize:13, fontWeight:500 }}>{r.title}</span>
                    </div>
                    <p style={{ fontSize:12, color:'#666', lineHeight:1.55 }}>{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DefenseTestingPage;