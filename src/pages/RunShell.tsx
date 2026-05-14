// pages/RunShell.tsx
// Routes: /runs/:runId/:tab  (tab = attack | defense | evaluation | manual)
// Seeds activeRunId from URL on mount.
// PATCH config → startAutomaticRun is triggered from here for automatic runs.
// Manual runs: sending a message in the chat IS the start trigger.

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Shield, MessageSquare, ArrowLeft, Play, Pause, BarChart2, Lock } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi, fetchRun, startAutomaticRun, stopRun, fetchRunAttacks, fetchRunDefences, fetchRunEvaluations, fetchRunStats } from '../services/api';
import { UpdateRunRequest } from '../types';
import RunConfigPanel from '../components/RunConfigPanel';
import AttackTestingPage from './AttackTestingPage';
import DefenseTestingPage from './DefenseTestingPage';
import EvaluationPage from './EvaluationPage';
import ManualAttackPage from './ManualAttackPage';
import { websocketService } from '../services/websocket';

export type RunTab = 'attack' | 'defense' | 'evaluation' | 'manual';
const VALID_TABS: RunTab[] = ['attack', 'defense', 'evaluation', 'manual'];

function getAvailableTabs(run: any): RunTab[] {
  if (!run) return ['attack'];
  if (run.config?.graph_type === 'manual') return ['manual'];
  const tabs: RunTab[] = ['attack', 'defense', 'evaluation'];
  return tabs;
}

const TAB_META: Record<RunTab, { label: string; icon: React.ReactNode; activeColor: string }> = {
  attack:     { label: 'Attack',     icon: <Zap size={13} />,           activeColor: '#EF4444' },
  defense:    { label: 'Defense',    icon: <Shield size={13} />,        activeColor: '#22C55E' },
  evaluation: { label: 'Evaluation', icon: <BarChart2 size={13} />,     activeColor: '#6366F1' },
  manual:     { label: 'Manual',     icon: <MessageSquare size={13} />, activeColor: '#8B5CF6' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  idle:      { bg: '#F0EDE6', color: '#888'    },
  running:   { bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { bg: '#F0FDF4', color: '#15803D' },
  failed:    { bg: '#FEF2F2', color: '#DC2626' },
  paused:    { bg: '#FEF9C3', color: '#92400E' },
};

const RunShell: React.FC = () => {
  const { runId, tab } = useParams<{ runId: string; tab?: string }>();
  const navigate = useNavigate();

  const runs           = useAppStore(s => s.runs);
  const activeRunId    = useAppStore(s => s.activeRunId);
  const isRunLocked    = useAppStore(s => s.isRunLocked);
  const isAttacking    = useAppStore(s => s.isAttacking);
  const setActiveRun   = useAppStore(s => s.setActiveRun);
  const resetRunState  = useAppStore(s => s.resetRunState);
  const updateRunStore = useAppStore(s => s.updateRun);
  const addRun         = useAppStore(s => s.addRun);
  const setIsAttacking = useAppStore(s => s.setIsAttacking);
  const setIsRunLocked = useAppStore(s => s.setIsRunLocked);
  const setAttackError = useAppStore(s => s.setAttackError);
  const clearAttackPrompts    = useAppStore(s => s.clearAttackPrompts);
  const clearDefenseResponses = useAppStore(s => s.clearDefenseResponses);
  const clearEvalResults      = useAppStore(s => s.clearEvalResults);
  const addAttackPrompt    = useAppStore(s => s.addAttackPrompt);
  const addDefenseResponse = useAppStore(s => s.addDefenseResponse);
  const addEvalResult      = useAppStore(s => s.addEvalResult);
  const setEvalStats       = useAppStore(s => s.setEvalStats);
  const setDefenseStats    = useAppStore(s => s.setDefenseStats);

  const [saving,  setSaving]  = useState(false);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Pending param updates from RunConfigPanel (debounced)
  const [pendingUpdate, setPendingUpdate] = useState<UpdateRunRequest | null>(null);

  // ── Seed activeRunId from URL, fetch run + hydrate all data ─────────────────
  useEffect(() => {
    if (!runId) return;

    if (activeRunId !== runId) {
      resetRunState();
      setActiveRun(runId);
    }

    // Always fetch fresh run metadata
    const runFetch = fetchRun(runId)
      .then(r => { addRun(r); return r; })
      .catch(() => null);

    // Hydrate attack/defence/evaluation data so pages aren't blank on open.
    // This covers: completed runs, failed runs, runs that were running before
    // page reload, and any run the user navigates to directly via URL.
    // We clear first so stale data from a previous run doesn't bleed in.
    clearAttackPrompts();
    clearDefenseResponses();
    clearEvalResults();

    const hydrateData = async () => {
      const run = await runFetch;
      if (!run) return;

      // For manual runs: ManualAttackPage handles its own session hydration.
      // For automatic (and completed/failed manual): hydrate attack/defence/eval.
      const isManualRun = run.config?.graph_type === 'manual';

      // Lock config panel if the run is actively running
      if (run.status === 'running') {
        setIsRunLocked(true);
        setIsAttacking(true);
      }

      if (!isManualRun) {
        // Fetch all three data types in parallel; each is a no-op on empty runs
        const [attacks, defences, evaluations, stats] = await Promise.allSettled([
          fetchRunAttacks(runId),
          fetchRunDefences(runId),
          fetchRunEvaluations(runId),
          fetchRunStats(runId),
        ]);

        // Populate attack prompts
        if (attacks.status === 'fulfilled') {
          for (const a of attacks.value) {
            addAttackPrompt({
              promptId:  a.turn_id,
              content:   a.prompt,
              status:    'generated',
              timestamp: a.timestamp ?? new Date().toISOString(),
              metadata:  a.metadata ?? {},
            });
          }
        }

        // Populate defense responses
        if (defences.status === 'fulfilled') {
          for (const d of defences.value) {
            addDefenseResponse({
              promptId:        d.turn_id,
              defenseResponse: d.response,
              evaluation:      d.was_blocked ? 'blocked' : 'passed',
              was_blocked:     d.was_blocked ?? false,
              blocked_by:      d.metadata?.blocked_by,
              attack_type:     d.metadata?.attack_type,
              timestamp:       d.timestamp ?? new Date().toISOString(),
            });
          }
        }

        // Populate eval results — cross-join with attacks/defences for context
        if (evaluations.status === 'fulfilled') {
          const attackMap  = attacks.status  === 'fulfilled' ? Object.fromEntries(attacks.value.map((a: any)  => [a.turn_id, a]))  : {};
          const defenceMap = defences.status === 'fulfilled' ? Object.fromEntries(defences.value.map((d: any) => [d.turn_id, d])) : {};

          for (const e of evaluations.value) {
            const matchedAttack  = attackMap[e.turn_id];
            const matchedDefence = defenceMap[e.turn_id];
            addEvalResult({
              evalId:        e.turn_id,
              promptId:      e.turn_id,
              verdict:       e.success ? 'breach' : 'defended',
              score:         e.score ?? 0,
              reasoning:     e.feedback ?? '',
              timestamp:     e.timestamp ?? new Date().toISOString(),
              attackContent:  matchedAttack?.prompt,
              defenseContent: matchedDefence?.response,
              was_blocked:    matchedDefence?.was_blocked,
              attack_type:    matchedDefence?.metadata?.attack_type,
            });
          }
        }

        // Populate eval stats from the /stats endpoint
        if (stats.status === 'fulfilled') {
          const s = stats.value;
          const total = s.total_evaluations ?? 0;
          setEvalStats({
            total,
            breaches:     total ? Math.round(s.success_rate  * total) : 0,
            defended:     total ? Math.round((1 - s.success_rate - (s.blocked_rate ?? 0)) * total) : 0,
            partial:      0,
            averageScore: s.average_score ?? 0,
            breachRate:   s.success_rate  ?? 0,
          });
          setDefenseStats({
            totalResponses:      s.total_defences ?? 0,
            blockedCount:        total ? Math.round((s.blocked_rate ?? 0) * total) : 0,
            passedCount:         total ? total - Math.round((s.blocked_rate ?? 0) * total) : 0,
            overallDefenseScore: s.blocked_rate != null ? Math.round(s.blocked_rate * 100) : 0,
          });
        }
      }
    };

    hydrateData();

    // Join the WS run room for live events
    websocketService.joinRun(runId);
    return () => { websocketService.leaveRun(runId); };
  }, [runId]);

  const run           = runs.find(r => r.runid === runId);
  const availableTabs = getAvailableTabs(run);
  const isManual      = run?.config?.graph_type === 'manual';

  // Resolve active tab
  const activeTab: RunTab = (() => {
    if (tab && VALID_TABS.includes(tab as RunTab) && availableTabs.includes(tab as RunTab))
      return tab as RunTab;
    return availableTabs[0];
  })();

  // Redirect if URL tab is invalid
  useEffect(() => {
    if (runId && activeTab && tab !== activeTab) {
      navigate(`/runs/${runId}/${activeTab}`, { replace: true });
    }
  }, [runId, activeTab, tab]);

  const handleTabChange = (t: RunTab) => navigate(`/runs/${runId}/${t}`);
  const handleBack      = () => { setActiveRun(null); navigate('/dashboard'); };

  // ── Debounced PATCH for RunConfigPanel changes ────────────────────────────────
  useEffect(() => {
    if (!pendingUpdate || !runId || isRunLocked) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const updated = await updateRunApi(runId, pendingUpdate);
        updateRunStore(runId, updated);
        setPendingUpdate(null);
      } catch { /* non-fatal */ }
      finally { setSaving(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [pendingUpdate, runId, isRunLocked]);

  const handleParamsChange = useCallback((update: UpdateRunRequest) => {
    if (isRunLocked) return; // ignore changes while running
    setPendingUpdate(prev => ({ ...prev, ...update }));
  }, [isRunLocked]);

  // ── Start Run (automatic only) ────────────────────────────────────────────────
  // 1. Flush any pending params via PATCH first
  // 2. Clear previous results
  // 3. POST /start
  const handleStartRun = async () => {
    if (!runId || isManual) return;
    setStartError(null);
    setStarting(true);

    try {
      // Step 1: flush pending params if any
      if (pendingUpdate) {
        setSaving(true);
        const updated = await updateRunApi(runId, pendingUpdate);
        updateRunStore(runId, updated);
        setPendingUpdate(null);
        setSaving(false);
      }

      // Step 2: clear stale results
      clearAttackPrompts();
      clearDefenseResponses();
      clearEvalResults();

      // Step 3: lock config and start
      setIsRunLocked(true);
      setIsAttacking(true);
      updateRunStore(runId, { status: 'running', updatedAt: new Date().toISOString() });
      await startAutomaticRun(runId, { runtime_config: {} });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start run';
      setStartError(msg);
      setIsAttacking(false);
      setIsRunLocked(false);
      updateRunStore(runId, { status: 'failed', updatedAt: new Date().toISOString() });
    } finally {
      setStarting(false);
    }
  };

  const handleStopRun = async () => {
    if (!runId) return;
    try { await stopRun(runId); } catch { /* best-effort */ }
    setIsAttacking(false);
    setIsRunLocked(false);
    updateRunStore(runId, { status: 'paused', updatedAt: new Date().toISOString() });
  };

  const statusStyle = STATUS_STYLES[run?.status ?? 'idle'];
  const isRunning   = run?.status === 'running';

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes rsh-spin{to{transform:rotate(360deg)}}
        .rsh-tab:hover{opacity:.8}
        .rsh-start:hover:not(:disabled){opacity:.85}
      `}</style>

      {/* ── Top Nav ── */}
      <nav style={S.nav}>
        <div style={S.navL}>
          <button style={S.backBtn} onClick={handleBack}>
            <ArrowLeft size={13} /> Runs
          </button>
          <div style={S.navSep} />
          <span style={S.navLogo}>FortiPrompt</span>
          {run && (
            <>
              <span style={S.navRunName}>{run.name}</span>
              <span style={{ ...S.statusPill, background: statusStyle.bg, color: statusStyle.color }}>
                {isRunning ? <Play size={8} /> : <Pause size={8} />}
                {run.status}
              </span>
              {isRunLocked && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#888' }}>
                  <Lock size={10} /> Config locked
                </span>
              )}
            </>
          )}
        </div>

        <div style={S.navR}>
          {/* Saving indicator */}
          {saving && (
            <span style={S.savingChip}>
              <svg style={{ animation: 'rsh-spin .6s linear infinite' }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="3.5" stroke="#888" strokeWidth="1.2" strokeDasharray="7 3" />
              </svg>
              Saving…
            </span>
          )}

          {/* Start / Stop button (automatic runs only) */}
          {!isManual && (
            <>
              {startError && (
                <span style={{ fontSize: 11, color: '#DC2626', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  ⚠ {startError}
                </span>
              )}
              {isRunning ? (
                <button
                  className="rsh-start"
                  style={{ ...S.runBtn, background: '#EF4444' }}
                  onClick={handleStopRun}
                >
                  <span style={{ width: 8, height: 8, background: '#fff', borderRadius: 2, display: 'inline-block', flexShrink: 0 }}/>
                  Stop Run
                </button>
              ) : (
                <button
                  className="rsh-start"
                  style={{ ...S.runBtn, background: '#1A1A1A', opacity: (starting || !runId) ? .5 : 1 }}
                  onClick={handleStartRun}
                  disabled={starting || !runId}
                >
                  {starting ? (
                    <svg style={{ animation: 'rsh-spin .7s linear infinite' }} width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <circle cx="6" cy="6" r="4.5" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
                      <path d="M6 1.5a4.5 4.5 0 0 1 4.5 4.5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 1.5L8.5 5L2 8.5V1.5Z" fill="white"/></svg>
                  )}
                  {starting ? 'Starting…' : 'Start Run'}
                </button>
              )}
            </>
          )}

          {/* Tab bar */}
          <div style={S.tabBar}>
            {availableTabs.map(t => {
              const meta     = TAB_META[t];
              const isActive = activeTab === t;
              return (
                <button
                  key={t}
                  className="rsh-tab"
                  style={{
                    ...S.tabBtn,
                    color:        isActive ? meta.activeColor : '#888',
                    borderBottom: `2px solid ${isActive ? meta.activeColor : 'transparent'}`,
                  }}
                  onClick={() => handleTabChange(t)}
                >
                  <span style={{ color: isActive ? meta.activeColor : '#CCC', display: 'flex' }}>
                    {meta.icon}
                  </span>
                  {meta.label}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={S.body}>
        {/* Left panel — shared RunConfigPanel, locked while running */}
        <aside style={S.panel}>
          <RunConfigPanel onParamsChange={handleParamsChange} locked={isRunLocked} />
        </aside>

        {/* Tab content */}
        <main style={S.content}>
          {activeTab === 'attack'     && <AttackTestingPage  embedded />}
          {activeTab === 'defense'    && <DefenseTestingPage embedded />}
          {activeTab === 'evaluation' && <EvaluationPage     embedded />}
          {activeTab === 'manual'     && <ManualAttackPage   embedded />}
        </main>
      </div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  root:       { fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', color: '#1A1A1A', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  nav:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, background: '#fff', borderBottom: '1px solid #E8E6E0', position: 'sticky', top: 0, zIndex: 200, flexShrink: 0 },
  navL:       { display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' },
  navR:       { display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 },
  backBtn:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', flexShrink: 0 },
  navSep:     { width: 1, height: 14, background: '#E8E6E0', flexShrink: 0 },
  navLogo:    { fontSize: 13, fontWeight: 600, letterSpacing: '-.3px', flexShrink: 0 },
  navRunName: { fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 180 },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 12, flexShrink: 0 },
  savingChip: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' },
  runBtn:     { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', color: '#fff', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', transition: 'opacity .15s', flexShrink: 0 },
  tabBar:     { display: 'flex', gap: 0, borderLeft: '1px solid #F0EDE6', paddingLeft: 10 },
  tabBtn:     { display: 'flex', alignItems: 'center', gap: 5, padding: '0 14px', height: 52, fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', transition: 'all .15s', whiteSpace: 'nowrap' as const },
  body:       { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
  panel:      { width: 280, flexShrink: 0, borderRight: '1px solid #E8E6E0', background: '#fff', overflowY: 'auto' as const, height: 'calc(100vh - 52px)' },
  content:    { flex: 1, overflow: 'auto', minWidth: 0 },
};

export default RunShell;