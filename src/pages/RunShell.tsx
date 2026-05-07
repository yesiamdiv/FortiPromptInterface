// pages/RunShell.tsx
// Routes: /runs/:runId/:tab  (tab = attack | defense | manual)
// Seeds activeRunId from URL on mount. Tab switching = navigate().

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Zap, Shield, MessageSquare, ArrowLeft, Play, Pause } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi, fetchRun } from '../services/api';
import { UpdateRunRequest } from '../types';
import RunConfigPanel from '../components/RunConfigPanel';
import AttackTestingPage from './AttackTestingPage';
import DefenseTestingPage from './DefenseTestingPage';
import ManualAttackPage from './ManualAttackPage';

export type RunTab = 'attack' | 'defense' | 'manual';

const VALID_TABS: RunTab[] = ['attack', 'defense', 'manual'];

function getAvailableTabs(run: any): RunTab[] {
  if (!run) return ['attack'];
  if (run.config?.graph_type === 'manual') return ['manual'];
  const comps: string[] = run.components ?? [];
  const tabs: RunTab[] = [];
  if (comps.includes('attack')  || run.config?.attack_node_config?.node_type)  tabs.push('attack');
  if (comps.includes('defense') || run.config?.defense_node_config?.node_type) tabs.push('defense');
  if (comps.includes('manual'))                                                  tabs.push('manual');
  return tabs.length ? tabs : ['attack'];
}

const TAB_META: Record<RunTab, { label: string; icon: React.ReactNode; activeColor: string }> = {
  attack:  { label: 'Attack',  icon: <Zap size={13} />,           activeColor: '#EF4444' },
  defense: { label: 'Defense', icon: <Shield size={13} />,        activeColor: '#22C55E' },
  manual:  { label: 'Manual',  icon: <MessageSquare size={13} />, activeColor: '#6366F1' },
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

  const runs        = useAppStore(s => s.runs);
  const activeRunId = useAppStore(s => s.activeRunId);
  const setActiveRun  = useAppStore(s => s.setActiveRun);
  const resetRunState = useAppStore(s => s.resetRunState);
  const updateRunInStore = useAppStore(s => s.updateRun);
  const addRun        = useAppStore(s => s.addRun);

  // Seed activeRunId from URL on mount / runId change
  useEffect(() => {
    if (!runId) return;
    if (activeRunId !== runId) {
      resetRunState();
      setActiveRun(runId);
    }
    // If run isn't in store yet (e.g. direct URL load), fetch it
    const inStore = runs.find(r => r.runid === runId);
    if (!inStore) {
      fetchRun(runId)
        .then(r => addRun(r))
        .catch(() => {/* run not found — stay, show empty state */});
    }
  }, [runId]);

  const run           = runs.find(r => r.runid === runId);
  const availableTabs = getAvailableTabs(run);

  // Resolve active tab from URL param, fall back to first available
  const activeTab: RunTab = (() => {
    if (tab && VALID_TABS.includes(tab as RunTab) && availableTabs.includes(tab as RunTab))
      return tab as RunTab;
    return availableTabs[0];
  })();

  // If URL tab doesn't match resolved tab, redirect
  useEffect(() => {
    if (runId && activeTab && tab !== activeTab) {
      navigate(`/runs/${runId}/${activeTab}`, { replace: true });
    }
  }, [runId, activeTab, tab]);

  const handleTabChange = (t: RunTab) => navigate(`/runs/${runId}/${t}`);
  const handleBack      = () => { setActiveRun(null); navigate('/dashboard'); };

  // Debounced PATCH for RunConfigPanel param changes
  const [pendingUpdate, setPendingUpdate] = useState<UpdateRunRequest | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pendingUpdate || !runId) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const updated = await updateRunApi(runId, pendingUpdate);
        updateRunInStore(runId, updated);
        setPendingUpdate(null);
      } catch { /* non-fatal */ }
      finally { setSaving(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [pendingUpdate, runId]);

  const handleParamsChange = useCallback((update: UpdateRunRequest) => {
    setPendingUpdate(prev => ({ ...prev, ...update }));
  }, []);

  const statusStyle = STATUS_STYLES[run?.status ?? 'idle'];

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes rsh-spin{to{transform:rotate(360deg)}}
        .rsh-tab:hover{background:#F7F6F3 !important}
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
                {run.status === 'running' ? <Play size={8} /> : <Pause size={8} />}
                {run.status}
              </span>
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
                  <span style={{ color: isActive ? meta.activeColor : '#BBB', display: 'flex' }}>
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
        <aside style={S.panel}>
          <RunConfigPanel onParamsChange={handleParamsChange} />
        </aside>
        <main style={S.content}>
          {activeTab === 'attack'  && <AttackTestingPage  embedded />}
          {activeTab === 'defense' && <DefenseTestingPage embedded />}
          {activeTab === 'manual'  && <ManualAttackPage   embedded />}
        </main>
      </div>
    </div>
  );
};

const S: Record<string, React.CSSProperties> = {
  root:       { fontFamily: "'DM Sans',sans-serif", background: '#F7F6F3', color: '#1A1A1A', minHeight: '100vh', display: 'flex', flexDirection: 'column' },
  nav:        { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', height: 52, background: '#fff', borderBottom: '1px solid #E8E6E0', position: 'sticky', top: 0, zIndex: 200, flexShrink: 0 },
  navL:       { display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' },
  navR:       { display: 'flex', alignItems: 'center', gap: 12 },
  backBtn:    { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', flexShrink: 0 },
  navSep:     { width: 1, height: 14, background: '#E8E6E0', flexShrink: 0 },
  navLogo:    { fontSize: 13, fontWeight: 600, letterSpacing: '-.3px', flexShrink: 0 },
  navRunName: { fontSize: 13, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, maxWidth: 200 },
  statusPill: { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 12, flexShrink: 0 },
  savingChip: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#888' },
  tabBar:     { display: 'flex', gap: 0 },
  tabBtn:     { display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px', height: 52, fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', border: 'none', borderBottom: '2px solid transparent', background: 'transparent', transition: 'all .15s', whiteSpace: 'nowrap' as const },
  body:       { display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 },
  panel:      { width: 280, flexShrink: 0, borderRight: '1px solid #E8E6E0', background: '#fff', overflowY: 'auto' as const, height: 'calc(100vh - 52px)' },
  content:    { flex: 1, overflow: 'auto', minWidth: 0 },
};

export default RunShell;