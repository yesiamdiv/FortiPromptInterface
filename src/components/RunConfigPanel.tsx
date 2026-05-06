// components/RunConfigPanel.tsx
// ─── Shared left-panel component shown on Attack, Defense, Manual pages ────────
//
// Displays (in order):
//   1. Run name + description (read-only)
//   2. Graph type badge
//   3. Attack node — name, description, dynamic params (editable)
//   4. Defense node — name, description, dynamic params (editable)
//   5. Evaluation node — name, description, dynamic params (editable)
//   6. Strategy — name, description, dynamic params (editable)
//
// Node names/types are read-only (set at creation).
// Params are editable and saved via onParamsChange → caller calls updateRun PATCH.
//
// Discovery data is loaded once and cached in appStore.runDiscovery.

import React, { useEffect, useState } from 'react';
import { Settings, ChevronDown, ChevronRight, Loader, Zap, Shield, BarChart2, SlidersHorizontal } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { getNodes, getStrategies } from '../services/api';
import { NodeSchema, StrategySchema, UpdateRunRequest } from '../types';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface RunConfigPanelProps {
  /** Called whenever any editable param changes. Parent should debounce + call updateRun. */
  onParamsChange?: (update: UpdateRunRequest) => void;
}

// ─── Schema field renderer ─────────────────────────────────────────────────────

const SchemaFields: React.FC<{
  schema: Record<string, any>;
  values: Record<string, any>;
  onChange: (key: string, val: any) => void;
}> = ({ schema, values, onChange }) => {
  const props    = schema?.properties ?? {};
  const required = schema?.required   ?? [];
  const entries  = Object.entries(props) as [string, any][];
  if (entries.length === 0) return <div style={S.noParams}>No configurable parameters</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([key, def]) => {
        const val    = values[key] ?? def.default ?? '';
        const label  = def.title ?? key.replace(/_/g, ' ');
        const isReq  = required.includes(key);

        if (def.type === 'boolean') return (
          <div key={key} style={S.fieldRow}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
              <label style={S.toggleWrap}>
                <input type="checkbox" style={{ display: 'none' }} checked={!!val} onChange={e => onChange(key, e.target.checked)} />
                <span style={{ ...S.toggleSlider, background: val ? '#1A1A1A' : '#E8E6E0' }}>
                  <span style={{ ...S.toggleDot, transform: val ? 'translateX(16px)' : 'none' }} />
                </span>
              </label>
            </div>
            {def.description && <div style={S.hint}>{def.description}</div>}
          </div>
        );

        if (def.enum) return (
          <div key={key} style={S.fieldRow}>
            <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
            <select style={S.sel} value={val} onChange={e => onChange(key, e.target.value)}>
              {def.enum.map((v: string) => <option key={v} value={v}>{v}</option>)}
            </select>
            {def.description && <div style={S.hint}>{def.description}</div>}
          </div>
        );

        if (def.type === 'integer' || def.type === 'number') return (
          <div key={key} style={S.fieldRow}>
            <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
            <input style={S.inp} type="number" min={def.minimum} max={def.maximum} value={val}
              onChange={e => onChange(key, def.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))} />
            {def.description && <div style={S.hint}>{def.description}</div>}
          </div>
        );

        return (
          <div key={key} style={S.fieldRow}>
            <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
            <input style={S.inp} type="text" value={val}
              placeholder={def.examples?.[0] ?? def.default ?? ''}
              onChange={e => onChange(key, e.target.value)} />
            {def.description && <div style={S.hint}>{def.description}</div>}
          </div>
        );
      })}
    </div>
  );
};

// ─── Collapsible section ───────────────────────────────────────────────────────

const Section: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badgeColor?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ icon, title, subtitle, badgeColor, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={S.section}>
      <button style={S.sectionBtn} onClick={() => setOpen(o => !o)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ color: badgeColor ?? '#888', display: 'flex' }}>{icon}</span>
          <div style={{ textAlign: 'left' }}>
            <div style={S.sectionTitle}>{title}</div>
            {subtitle && <div style={S.sectionSub}>{subtitle}</div>}
          </div>
        </div>
        {open ? <ChevronDown size={13} style={{ color: '#BBB', flexShrink: 0 }} />
               : <ChevronRight size={13} style={{ color: '#BBB', flexShrink: 0 }} />}
      </button>
      {open && <div style={S.sectionBody}>{children}</div>}
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const RunConfigPanel: React.FC<RunConfigPanelProps> = ({ onParamsChange }) => {
  const activeRunId    = useAppStore(s => s.activeRunId);
  const runs           = useAppStore(s => s.runs);
  const runDiscovery   = useAppStore(s => s.runDiscovery);
  const setRunDiscovery = useAppStore(s => s.setRunDiscovery);

  const run = runs.find(r => r.runid === activeRunId);

  // Editable param state (one object per node type + strategy)
  const [attackParams,   setAttackParams]   = useState<Record<string, any>>({});
  const [defenseParams,  setDefenseParams]  = useState<Record<string, any>>({});
  const [evalParams,     setEvalParams]     = useState<Record<string, any>>({});
  const [strategyParams, setStrategyParams] = useState<Record<string, any>>({});

  // ── Load discovery data once per run ──────────────────────────────────────
  useEffect(() => {
    if (!activeRunId || runDiscovery.loadedForRunId === activeRunId) return;

    const load = async () => {
      setRunDiscovery({ loading: true });
      try {
        const [attackNodes, defenseNodes, evalNodes, strategies] = await Promise.all([
          getNodes('attack'),
          getNodes('defense'),
          getNodes('evaluation'),
          getStrategies(),
        ]);
        setRunDiscovery({
          attackNodes,
          defenseNodes,
          evalNodes,
          strategies,
          loadedForRunId: activeRunId,
          loading: false,
        });
      } catch (e) {
        setRunDiscovery({ loading: false });
      }
    };
    load();
  }, [activeRunId]);

  // ── Seed defaults from schemas when data arrives ──────────────────────────
  useEffect(() => {
    if (!run || runDiscovery.loading) return;

    const seedFromSchema = (schema: Record<string, any>) => {
      const props = schema?.properties ?? {};
      const defs: Record<string, any> = {};
      for (const [k, def] of Object.entries(props) as [string, any][]) {
        if (def.default !== undefined) defs[k] = def.default;
        else if (def.enum?.length) defs[k] = def.enum[0];
      }
      return defs;
    };

    const cfg = run.config;
    const attackNodeName = cfg?.attack_node_config?.node_type;
    const defenseNodeName = cfg?.defense_node_config?.node_type;
    const evalNodeName = cfg?.evaluation_node_config?.node_type;
    const stratName = cfg?.strategy_config?.strategy_name;

    const attackSchema = runDiscovery.attackNodes.find(n => n.node_name === attackNodeName)?.schema_definition ?? {};
    const defenseSchema = runDiscovery.defenseNodes.find(n => n.node_name === defenseNodeName)?.schema_definition ?? {};
    const evalSchema = runDiscovery.evalNodes.find(n => n.node_name === evalNodeName)?.schema_definition ?? {};
    const stratSchema = runDiscovery.strategies.find(s => s.strategy_name === stratName)?.schema_definition ?? {};

    // Merge seeded defaults with any existing values from run.config
    setAttackParams({ ...seedFromSchema(attackSchema), ...(cfg?.attack_node_config ?? {}) });
    setDefenseParams({ ...seedFromSchema(defenseSchema), ...(cfg?.defense_node_config ?? {}) });
    setEvalParams({ ...seedFromSchema(evalSchema), ...(cfg?.evaluation_node_config ?? {}) });
    setStrategyParams({ ...seedFromSchema(stratSchema), ...(cfg?.strategy_config?.strategy_params ?? {}) });
  }, [run?.runid, runDiscovery.loadedForRunId]);

  // ── Emit changes upstream ──────────────────────────────────────────────────
  const handleAttackChange = (key: string, val: any) => {
    const next = { ...attackParams, [key]: val };
    setAttackParams(next);
    onParamsChange?.({ attack_node_params: next });
  };
  const handleDefenseChange = (key: string, val: any) => {
    const next = { ...defenseParams, [key]: val };
    setDefenseParams(next);
    onParamsChange?.({ defense_node_params: next });
  };
  const handleEvalChange = (key: string, val: any) => {
    const next = { ...evalParams, [key]: val };
    setEvalParams(next);
    onParamsChange?.({ evaluation_node_params: next });
  };
  const handleStrategyChange = (key: string, val: any) => {
    const next = { ...strategyParams, [key]: val };
    setStrategyParams(next);
    onParamsChange?.({ strategy_params: next });
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (!run) return (
    <div style={S.empty}>No active run</div>
  );

  const cfg = run.config;
  const isManual = cfg?.graph_type === 'manual';

  const attackNodeName  = cfg?.attack_node_config?.node_type ?? '—';
  const defenseNodeName = cfg?.defense_node_config?.node_type ?? '—';
  const evalNodeName    = cfg?.evaluation_node_config?.node_type ?? '—';
  const stratName       = cfg?.strategy_config?.strategy_name ?? '—';

  const attackSchema  = runDiscovery.attackNodes.find(n => n.node_name === attackNodeName)?.schema_definition  ?? {};
  const defenseSchema = runDiscovery.defenseNodes.find(n => n.node_name === defenseNodeName)?.schema_definition ?? {};
  const evalSchema    = runDiscovery.evalNodes.find(n => n.node_name === evalNodeName)?.schema_definition    ?? {};
  const stratSchema   = runDiscovery.strategies.find(s => s.strategy_name === stratName)?.schema_definition  ?? {};

  const attackNodeDesc  = runDiscovery.attackNodes.find(n => n.node_name === attackNodeName)?.description;
  const defenseNodeDesc = runDiscovery.defenseNodes.find(n => n.node_name === defenseNodeName)?.description;
  const evalNodeDesc    = runDiscovery.evalNodes.find(n => n.node_name === evalNodeName)?.description;
  const stratDesc       = runDiscovery.strategies.find(s => s.strategy_name === stratName)?.description;

  return (
    <div style={S.root}>
      {/* ── Run info ── */}
      <div style={S.runInfo}>
        <div style={S.runName}>{run.name}</div>
        {run.description && <div style={S.runDesc}>{run.description}</div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <span style={{ ...S.pill, background: isManual ? '#EEF2FF' : '#F0FDF4', color: isManual ? '#4F46E5' : '#15803D' }}>
            {isManual ? '⚔ Manual' : '🤖 Automatic'}
          </span>
          <span style={{ ...S.pill, background: '#F0EDE6', color: '#666' }}>
            {run.status}
          </span>
        </div>
        <div style={S.runMeta}>
          <span>Run ID: <code style={{ fontSize: 9 }}>{run.runid.slice(-10)}</code></span>
        </div>
      </div>

      {runDiscovery.loading ? (
        <div style={S.loadingBox}>
          <Loader size={16} style={{ animation: 'rcp-spin .7s linear infinite', color: '#BBB' }} />
          <span style={{ fontSize: 12, color: '#BBB' }}>Loading node schemas…</span>
        </div>
      ) : (
        <>
          {/* ── Attack Node ── */}
          {!isManual && (
            <Section
              icon={<Zap size={13} />}
              title="Attack Node"
              subtitle={attackNodeName}
              badgeColor="#EF4444"
            >
              {attackNodeDesc && <div style={S.nodeDesc}>{attackNodeDesc}</div>}
              <div style={S.readOnlyRow}>
                <span style={S.roKey}>Node Type</span>
                <span style={S.roVal}>{attackNodeName}</span>
              </div>
              <div style={S.divider} />
              <SchemaFields
                schema={attackSchema}
                values={attackParams}
                onChange={handleAttackChange}
              />
            </Section>
          )}

          {/* ── Defense Node ── */}
          {!isManual && (
            <Section
              icon={<Shield size={13} />}
              title="Defense Node"
              subtitle={defenseNodeName}
              badgeColor="#22C55E"
            >
              {defenseNodeDesc && <div style={S.nodeDesc}>{defenseNodeDesc}</div>}
              <div style={S.readOnlyRow}>
                <span style={S.roKey}>Node Type</span>
                <span style={S.roVal}>{defenseNodeName}</span>
              </div>
              <div style={S.divider} />
              <SchemaFields
                schema={defenseSchema}
                values={defenseParams}
                onChange={handleDefenseChange}
              />
            </Section>
          )}

          {/* ── Evaluation Node ── */}
          <Section
            icon={<BarChart2 size={13} />}
            title="Evaluation Node"
            subtitle={evalNodeName}
            badgeColor="#6366F1"
            defaultOpen={isManual}
          >
            {evalNodeDesc && <div style={S.nodeDesc}>{evalNodeDesc}</div>}
            <div style={S.readOnlyRow}>
              <span style={S.roKey}>Node Type</span>
              <span style={S.roVal}>{evalNodeName}</span>
            </div>
            <div style={S.divider} />
            <SchemaFields
              schema={evalSchema}
              values={evalParams}
              onChange={handleEvalChange}
            />
          </Section>

          {/* ── Strategy ── */}
          <Section
            icon={<SlidersHorizontal size={13} />}
            title="Strategy"
            subtitle={stratName}
            badgeColor="#0369A1"
            defaultOpen={false}
          >
            {stratDesc && <div style={S.nodeDesc}>{stratDesc}</div>}
            <div style={S.readOnlyRow}>
              <span style={S.roKey}>Strategy Name</span>
              <span style={S.roVal}>{stratName}</span>
            </div>
            <div style={S.divider} />
            <SchemaFields
              schema={stratSchema}
              values={strategyParams}
              onChange={handleStrategyChange}
            />
          </Section>
        </>
      )}

      <style>{`
        @keyframes rcp-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root:        { display: 'flex', flexDirection: 'column', gap: 0, overflowY: 'auto', height: '100%', background: '#fff' },
  empty:       { padding: 24, fontSize: 13, color: '#BBB', textAlign: 'center' },
  loadingBox:  { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px 20px', flexDirection: 'column' },

  runInfo:     { padding: '20px 20px 16px', borderBottom: '1px solid #F0EDE6' },
  runName:     { fontSize: 14, fontWeight: 600, letterSpacing: '-.3px', color: '#1A1A1A', marginBottom: 3 },
  runDesc:     { fontSize: 12, color: '#888', lineHeight: 1.5, marginBottom: 2 },
  runMeta:     { fontSize: 10, color: '#CCC', marginTop: 6, fontFamily: "'DM Mono', monospace" },
  pill:        { fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 12, display: 'inline-block' },

  section:     { borderBottom: '1px solid #F0EDE6' },
  sectionBtn:  { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', gap: 8 },
  sectionTitle:{ fontSize: 12, fontWeight: 600, color: '#1A1A1A', letterSpacing: '-.2px' },
  sectionSub:  { fontSize: 10, color: '#AAA', marginTop: 1, fontFamily: "'DM Mono', monospace" },
  sectionBody: { padding: '0 20px 16px' },

  nodeDesc:    { fontSize: 11, color: '#888', lineHeight: 1.5, marginBottom: 12, padding: '8px 10px', background: '#F7F6F3', borderRadius: 6 },
  readOnlyRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', marginBottom: 2 },
  roKey:       { fontSize: 10, color: '#BBB', textTransform: 'uppercase' as const, letterSpacing: '.3px', fontWeight: 500 },
  roVal:       { fontSize: 11, color: '#555', fontFamily: "'DM Mono', monospace", fontWeight: 500 },
  divider:     { height: 1, background: '#F0EDE6', margin: '10px 0' },
  noParams:    { fontSize: 11, color: '#CCC', textAlign: 'center' as const, padding: '8px 0' },

  fieldRow:    { display: 'flex', flexDirection: 'column', gap: 4 },
  fieldLbl:    { fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase' as const, letterSpacing: '.4px' },
  inp:         { height: 32, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 6, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%', boxSizing: 'border-box' as const },
  sel:         { height: 32, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 6, padding: '0 28px 0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%', appearance: 'none' as const, backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23999' stroke-width='1.3' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', cursor: 'pointer', boxSizing: 'border-box' as const },
  hint:        { fontSize: 10, color: '#CCC', lineHeight: 1.4 },
  toggleWrap:  { display: 'flex', alignItems: 'center', cursor: 'pointer' },
  toggleSlider:{ position: 'relative' as const, width: 30, height: 16, borderRadius: 8, transition: 'background .2s', display: 'inline-block', flexShrink: 0 },
  toggleDot:   { position: 'absolute' as const, width: 10, height: 10, borderRadius: '50%', background: '#fff', left: 3, top: 3, transition: 'transform .2s' },
};

export default RunConfigPanel;