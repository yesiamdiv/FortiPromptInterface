// pages/RunShell.tsx
// ─── In-run navigation shell ──────────────────────────────────────────────────
//
// Wraps Attack, Defense, Manual pages with a persistent top tab bar.
// Uses URL hash (#attack, #defense, #manual) so page refresh restores the tab.
// Renders RunConfigPanel as the shared left panel.

import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Shield, MessageSquare, ArrowLeft, Play, Pause } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi } from '../services/api';
import { UpdateRunRequest } from '../types';
import RunConfigPanel from '../components/RunConfigPanel';
import AttackTestingPage from './AttackTestingPage';
import DefenseTestingPage from './DefenseTestingPage';
import ManualAttackPage from './ManualAttackPage';

export type RunTab = 'attack' | 'defense' | 'manual';

interface RunShellProps {
  onBack: () => void;
}

// Determine which tabs to show based on run.config.graph_type and components
function getAvailableTabs(run: any): RunTab[] {
  if (!run) return [];
  if (run.config?.graph_type === 'manual') return ['manual'];

  const comps: string[] = run.components ?? [];
  const tabs: RunTab[]  = [];
  if (comps.includes('attack')  || run.config?.attack_node_config?.node_type)      tabs.push('attack');
  if (comps.includes('defense') || run.config?.defense_node_config?.node_type)     tabs.push('defense');
  // Always show eval via manual if present
  if (comps.includes('manual'))                                                      tabs.push('manual');
  return tabs.length ? tabs : ['attack']; // fallback
}

function resolveInitialTab(availableTabs: RunTab[]): RunTab {
  const hash = window.location.hash.replace('#', '') as RunTab;
  if (availableTabs.includes(hash)) return hash;
  return availableTabs[0] ?? 'attack';
}

const TAB_META: Record<RunTab, { label: string; icon: React.ReactNode; color: string; activeColor: string }> = {
  attack:  { label: 'Attack',  icon: <Zap size={13}/>,           color: '#888', activeColor: '#EF4444' },
  defense: { label: 'Defense', icon: <Shield size={13}/>,        color: '#888', activeColor: '#22C55E' },
  manual:  { label: 'Manual',  icon: <MessageSquare size={13}/>, color: '#888', activeColor: '#6366F1' },
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  idle:      { bg: '#F0EDE6', color: '#888'    },
  running:   { bg: '#DBEAFE', color: '#1D4ED8' },
  completed: { bg: '#F0FDF4', color: '#15803D' },
  failed:    { bg: '#FEF2F2', color: '#DC2626' },
  paused:    { bg: '#FEF9C3', color: '#92400E' },
};

const RunShell: React.FC<RunShellProps> = ({ onBack }) => {
  const activeRunId = useAppStore(s => s.activeRunId);
  const runs        = useAppStore(s => s.runs);
  const run         = runs.find(r => r.runid === activeRunId);

  const availableTabs  = getAvailableTabs(run);
  const [activeTab, setActiveTab] = useState<RunTab>(() => resolveInitialTab(availableTabs));

  // Pending param updates — debounced PATCH
  const [pendingUpdate, setPendingUpdate] = useState<UpdateRunRequest | null>(null);
  const [saving, setSaving] = useState(false);

  // Sync hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  // If available tabs don't include current tab, snap to first
  useEffect(() => {
    if (!availableTabs.includes(activeTab) && availableTabs.length > 0) {
      setActiveTab(availableTabs[0]);
    }
  }, [availableTabs.join()]);

  // Debounced save of panel params
  useEffect(() => {
    if (!pendingUpdate || !activeRunId) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await updateRunApi(activeRunId, pendingUpdate);
        setPendingUpdate(null);
      } catch { /* non-fatal */ }
      finally { setSaving(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [pendingUpdate, activeRunId]);

  const handleParamsChange = useCallback((update: UpdateRunRequest) => {
    setPendingUpdate(prev => ({ ...prev, ...update }));
  }, []);

  const handleTabChange = (tab: RunTab) => setActiveTab(tab);

  const statusStyle = STATUS_STYLES[run?.status ?? 'idle'];

  return (
    <div style={S.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        @keyframes rsh-spin{to{transform:rotate(360deg)}}
        .rsh-tab:hover{background:#F7F6F3 !important}
        .rsh-tab.active-attack{border-bottom-color:#EF4444 !important;color:#EF4444 !important}
        .rsh-tab.active-defense{border-bottom-color:#22C55E !important;color:#22C55E !important}
        .rsh-tab.active-manual{border-bottom-color:#6366F1 !important;color:#6366F1 !important}
      `}</style>

      {/* ── Top Nav ── */}
      <nav style={S.nav}>
        <div style={S.navL}>
          <button style={S.backBtn} onClick={onBack}>
            <ArrowLeft size={13}/> Runs
          </button>
          <div style={S.navSep}/>
          <span style={S.navLogo}>FortiPrompt</span>
          {run && (
            <>
              <span style={S.navRunName}>{run.name}</span>
              <span style={{ ...S.statusPill, background: statusStyle.bg, color: statusStyle.color }}>
                {run.status === 'running' ? <Play size={8}/> : <Pause size={8}/>}
                {run.status}
              </span>
            </>
          )}
        </div>
        <div style={S.navR}>
          {saving && (
            <span style={S.savingChip}>
              <svg style={{ animation: 'rsh-spin .6s linear infinite' }} width="10" height="10" viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="3.5" stroke="#888" strokeWidth="1.2" strokeDasharray="7 3"/>
              </svg>
              Saving…
            </span>
          )}

          {/* Tab buttons */}
          <div style={S.tabBar}>
            {availableTabs.map(tab => {
              const meta     = TAB_META[tab];
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  className={`rsh-tab${isActive ? ` active-${tab}` : ''}`}
                  style={{
                    ...S.tabBtn,
                    color: isActive ? meta.activeColor : '#888',
                    borderBottom: `2px solid ${isActive ? meta.activeColor : 'transparent'}`,
                  }}
                  onClick={() => handleTabChange(tab)}
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

      {/* ── Body: left panel + page content ── */}
      <div style={S.body}>
        {/* Left panel — shared RunConfigPanel */}
        <aside style={S.panel}>
          <RunConfigPanel onParamsChange={handleParamsChange} />
        </aside>

        {/* Right content — current tab page (no own nav) */}
        <main style={S.content}>
          {activeTab === 'attack'  && <AttackTestingPage  embedded onBack={onBack} />}
          {activeTab === 'defense' && <DefenseTestingPage embedded onBack={onBack} />}
          {activeTab === 'manual'  && <ManualAttackPage   embedded onBack={onBack} />}
        </main>
      </div>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  panel:      { width: 280, flexShrink: 0, borderRight: '1px solid #E8E6E0', background: '#fff', overflowY: 'auto', height: 'calc(100vh - 52px)' },
  content:    { flex: 1, overflow: 'auto', minWidth: 0 },
};

export default RunShell;