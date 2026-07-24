// pages/RunShell.tsx
// Routes: /runs/:runId/:tab  (tab = attack | defense | evaluation | manual)
// Layout and navigation only — data fetching lives in useRunHydration,
// param debouncing lives in useRunParamSync.

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Shield, MessageSquare, ArrowLeft, Play, Pause, BarChart2, Lock } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi, startAutomaticRun, stopRun, fetchRun, fetchRunAttacks, fetchRunDefences, fetchRunEvaluations } from '../services/api';
import { websocketService } from '../services/websocket';
import { UpdateRunRequest } from '../types';
import RunConfigPanel from '../components/RunConfigPanel';
import AttackTestingPage from './AttackTestingPage';
import DefenseTestingPage from './DefenseTestingPage';
import EvaluationPage from './EvaluationPage';
import ManualAttackPage from './ManualAttackPage';
import { useRunHydration, useRunParamSync } from '../hooks';
import { styles as S, NAV_H } from './RunShell.styles';

export type RunTab = 'attack' | 'defense' | 'evaluation' | 'manual';
const VALID_TABS: RunTab[] = ['attack', 'defense', 'evaluation', 'manual'];

function getAvailableTabs(run: any): RunTab[] {
  if (!run) return ['attack'];
  if (run.config?.graph_type === 'manual') return ['manual'];
  return ['attack', 'defense', 'evaluation'];
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
  stopped:   { bg: '#FEF9C3', color: '#92400E' },
};

const RunShell: React.FC = () => {
  const { runId, tab } = useParams<{ runId: string; tab?: string }>();
  const navigate = useNavigate();

  const runs           = useAppStore(s => s.runs);
  const isRunLocked    = useAppStore(s => s.isRunLocked);
  const isAttacking    = useAppStore(s => s.isAttacking);
  const setActiveRun   = useAppStore(s => s.setActiveRun);
  const updateRunStore = useAppStore(s => s.updateRun);
  const setIsAttacking = useAppStore(s => s.setIsAttacking);
  const setIsRunLocked = useAppStore(s => s.setIsRunLocked);
  const setAttackError = useAppStore(s => s.setAttackError);
  const clearAttackPrompts    = useAppStore(s => s.clearAttackPrompts);
  const clearDefenseResponses = useAppStore(s => s.clearDefenseResponses);
  const clearEvalResults      = useAppStore(s => s.clearEvalResults);
  const addAttackPrompt    = useAppStore(s => s.addAttackPrompt);
  const addDefenseResponse = useAppStore(s => s.addDefenseResponse);
  const addEvalResult      = useAppStore(s => s.addEvalResult);

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Hydrate run data when runId changes
  const hydratedForRef = useRunHydration(runId);

  // Debounced param sync with flush-on-start capability
  const { handleParamsChange, flushPending, saving } = useRunParamSync(runId, isRunLocked);

  const run           = runs.find(r => r.runid === runId);
  const availableTabs = getAvailableTabs(run);
  const isManual      = run?.config?.graph_type === 'manual';

  // Resolve active tab — fall back to first available if URL tab is invalid
  const activeTab: RunTab = (() => {
    if (tab && VALID_TABS.includes(tab as RunTab) && availableTabs.includes(tab as RunTab))
      return tab as RunTab;
    return availableTabs[0];
  })();

  // Redirect if URL tab is not valid for this run type
  useEffect(() => {
    if (runId && activeTab && tab !== activeTab) {
      navigate(`/runs/${runId}/${activeTab}`, { replace: true });
    }
  }, [runId, activeTab, tab, navigate]);

  const handleTabChange = (t: RunTab) => navigate(`/runs/${runId}/${t}`);
  const handleBack      = () => {
    // Reset so navigating back and returning to same run re-hydrates
    hydratedForRef.current = null;
    setActiveRun(null);
    navigate('/dashboard');
  };

  // ── Start Run (automatic only) ──────────────────────────────────────────────
  const handleStartRun = async () => {
    if (!runId || isManual) return;
    setStartError(null);
    setStarting(true);

    try {
      // Ensure we're in the WS room before starting (defensive re-join)
      websocketService.joinRun(runId);

      // Flush any buffered param updates before starting
      await flushPending();

      // Clear stale results from any previous run
      clearAttackPrompts();
      clearDefenseResponses();
      clearEvalResults();

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
    updateRunStore(runId, { status: 'stopped', updatedAt: new Date().toISOString() });
  };

  const statusStyle = STATUS_STYLES[run?.status ?? 'idle'] ?? STATUS_STYLES.idle;
  const isRunning   = run?.status === 'running';

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%}
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
          {saving && (
            <span style={S.savingChip}>
              <svg style={{ animation: 'rsh-spin .6s linear infinite' }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="3.5" stroke="#888" strokeWidth="1.2" strokeDasharray="7 3" />
              </svg>
              Saving…
            </span>
          )}

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
        {/* Left panel — fixed width, scrolls independently */}
        <aside style={S.panel}>
          <RunConfigPanel onParamsChange={handleParamsChange} locked={isRunLocked} />
        </aside>

        {/* Tab content — fills remaining space, children scroll internally */}
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

export default RunShell;
