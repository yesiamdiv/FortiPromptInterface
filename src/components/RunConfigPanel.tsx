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
  /** When true, all fields are read-only (run is executing). */
  locked?: boolean;
}

// ─── File field widget ────────────────────────────────────────────────────────

const FileField: React.FC<{
  fieldKey:    string;
  def:         Record<string, any>;
  values:      Record<string, any>;
  isReq:       boolean;
  locked:      boolean;
  /** Called ONCE with a patch object containing all affected keys */
  onChangeBatch: (patch: Record<string, any>) => void;
}> = ({ fieldKey, def, values, isReq, locked, onChangeBatch }) => {
  const [dragging, setDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const label    = def.title ?? fieldKey.replace(/_/g, ' ');
  const accept   = def.accept ?? '*';
  const hasFile  = !!values[fieldKey];
  const fileName = values[`${fieldKey}_name`] ?? (hasFile ? 'File uploaded' : null);

  const processFile = (file: File) => {
    if (!file) return;
    setError(null);
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix → raw base64
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      // Send BOTH fields in one batch so no stale-closure overwrite can happen
      onChangeBatch({
        [fieldKey]:               base64,
        [`${fieldKey}_name`]:     file.name,
      });
      setUploading(false);
    };
    reader.onerror = () => { setError('Failed to read file'); setUploading(false); };
    reader.readAsDataURL(file);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeBatch({ [fieldKey]: '', [`${fieldKey}_name`]: '' });
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div style={S.fieldRow}>
      <label style={S.fieldLbl}>{label}{isReq && <span style={{ color: '#DC2626' }}> *</span>}</label>

      <div
        style={{
          border: `2px dashed ${dragging ? '#7C3AED' : hasFile ? '#22C55E' : error ? '#DC2626' : '#E8E6E0'}`,
          borderRadius: 8,
          padding: hasFile ? '10px 12px' : '14px 12px',
          background: dragging ? '#F5F3FF' : hasFile ? '#F0FDF4' : '#FAFAF9',
          cursor: locked ? 'default' : 'pointer',
          transition: 'all .15s',
          textAlign: 'center' as const,
        }}
        onClick={() => { if (!locked) inputRef.current?.click(); }}
        onDragOver={e => { if (locked) return; e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={e => {
          if (locked) return;
          e.preventDefault(); setDragging(false);
          const f = e.dataTransfer.files[0];
          if (f) processFile(f);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          style={{ display: 'none' }}
          disabled={locked}
          onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); }}
        />

        {uploading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 11, color: '#888' }}>
            <svg style={{ animation: 'rcp-spin .7s linear infinite' }} width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="4.5" stroke="#E8E6E0" strokeWidth="1.5"/>
              <path d="M6 1.5a4.5 4.5 0 0 1 4.5 4.5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Reading file…
          </div>
        ) : hasFile ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>✅</span>
            <div style={{ flex: 1, textAlign: 'left' as const, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#15803D', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                {fileName}
              </div>
              <div style={{ fontSize: 9, color: '#AAA', marginTop: 1 }}>Encoded as base64 · click to replace</div>
            </div>
            {!locked && (
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14, lineHeight: 1, padding: 2, flexShrink: 0 }}
                onClick={clear}
              >✕</button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 18, marginBottom: 4 }}>📂</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#555' }}>
              {dragging ? 'Drop file here' : 'Click or drag to upload'}
            </div>
            <div style={{ fontSize: 10, color: '#AAA', marginTop: 2 }}>
              Accepts {accept === '*' ? 'any file' : accept}
            </div>
          </div>
        )}
      </div>

      {error && <div style={{ fontSize: 10, color: '#DC2626', marginTop: 2 }}>⚠ {error}</div>}
      {def.description && !hasFile && <div style={S.hint}>{def.description}</div>}
    </div>
  );
};

// ─── Schema field renderer ─────────────────────────────────────────────────────

const SchemaFields: React.FC<{
  schema:        Record<string, any>;
  values:        Record<string, any>;
  locked:        boolean;
  onChange:      (key: string, val: any) => void;
  /** Called by file fields to update multiple keys atomically */
  onChangeBatch: (patch: Record<string, any>) => void;
}> = ({ schema, values, locked, onChange, onChangeBatch }) => {
  const props    = schema?.properties ?? {};
  const required = schema?.required   ?? [];
  const entries  = Object.entries(props) as [string, any][];
  if (entries.length === 0) return <div style={S.noParams}>No configurable parameters</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {entries.map(([key, def]) => {
        // Skip hidden fields — set programmatically (e.g. prompts_file_name)
        if (def['ui:widget'] === 'hidden') return null;

        const val   = values[key] ?? def.default ?? '';
        const label = def.title ?? key.replace(/_/g, ' ');
        const isReq = required.includes(key);

        // ── File upload widget ──
        if (def.type === 'file') return (
          <FileField
            key={key}
            fieldKey={key}
            def={def}
            values={values}
            isReq={isReq}
            locked={locked}
            onChangeBatch={onChangeBatch}
          />
        );

        if (def.type === 'boolean') return (
          <div key={key} style={S.fieldRow}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
              <label style={S.toggleWrap}>
                <input type="checkbox" style={{ display: 'none' }} checked={!!val} disabled={locked} onChange={e => onChange(key, e.target.checked)} />
                <span style={{ ...S.toggleSlider, background: val ? '#1A1A1A' : '#E8E6E0', opacity: locked ? .5 : 1 }}>
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
            <select style={{ ...S.sel, opacity: locked ? .6 : 1 }} value={val} disabled={locked} onChange={e => onChange(key, e.target.value)}>
              {def.enum.map((v: string) => <option key={v} value={v}>{v}</option>)}
            </select>
            {def.description && <div style={S.hint}>{def.description}</div>}
          </div>
        );

        if (def.type === 'integer' || def.type === 'number') return (
          <div key={key} style={S.fieldRow}>
            <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
            <input style={{ ...S.inp, opacity: locked ? .6 : 1 }} type="number" min={def.minimum} max={def.maximum} value={val} disabled={locked}
              onChange={e => onChange(key, def.type === 'integer' ? parseInt(e.target.value) : parseFloat(e.target.value))} />
            {def.description && <div style={S.hint}>{def.description}</div>}
          </div>
        );

        return (
          <div key={key} style={S.fieldRow}>
            <label style={S.fieldLbl}>{label}{isReq && ' *'}</label>
            <input style={{ ...S.inp, opacity: locked ? .6 : 1 }} type="text" value={val} disabled={locked}
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

const RunConfigPanel: React.FC<RunConfigPanelProps> = ({ onParamsChange, locked = false }) => {
  const activeRunId     = useAppStore(s => s.activeRunId);
  const runs            = useAppStore(s => s.runs);
  const runDiscovery    = useAppStore(s => s.runDiscovery);
  const setRunDiscovery = useAppStore(s => s.setRunDiscovery);

  const run = runs.find(r => r.runid === activeRunId);

  // ── Load discovery ONCE globally (schemas are static metadata) ──────────────
  // Keyed on whether we've ever loaded, not on per-run. Once loaded it never
  // re-fetches unless the store is explicitly reset.
  const discoveryLoaded  = runDiscovery.loadedForRunId !== null;
  const discoveryLoading = runDiscovery.loading;

  useEffect(() => {
    // Already loaded or currently loading — do nothing
    if (discoveryLoaded || discoveryLoading) return;

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
          loadedForRunId: 'global', // sentinel — doesn't change per run
          loading: false,
        });
      } catch (err) {
        console.error('[RunConfigPanel] Failed to load node discovery:', err);
        // Always reset loading so the panel doesn't stay stuck in spinner
        setRunDiscovery({ loading: false, loadedForRunId: null });
      }
    };
    load();
  }, [discoveryLoaded, discoveryLoading]);

  // ── Resolve schemas from discovery ────────────────────────────────────────
  const cfg             = run?.config;
  const attackNodeName  = cfg?.attack_node_config?.node_type  ?? '—';
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

  // ── Local param state ─────────────────────────────────────────────────────
  // Single form object avoids 4 separate setState calls and stale closures.
  const [params, setParams] = useState<{
    attack:   Record<string, any>;
    defense:  Record<string, any>;
    eval:     Record<string, any>;
    strategy: Record<string, any>;
  }>({ attack: {}, defense: {}, eval: {}, strategy: {} });

  // Track which run+strategy we've seeded for so PATCH updates to the store
  // don't re-wipe in-progress edits. We only re-seed when the run ID or
  // strategy/node type actually changes, never when params change.
  const seededForRef = React.useRef<string>('');

  useEffect(() => {
    if (!run || runDiscovery.loading || !discoveryLoaded) return;

    // Build a stable key from the run id + node/strategy names.
    // This changes only when the user switches runs or the run config is
    // updated with a different node/strategy — never on param edits.
    const seedKey = `${run.runid}|${attackNodeName}|${defenseNodeName}|${evalNodeName}|${stratName}`;
    if (seededForRef.current === seedKey) return;
    seededForRef.current = seedKey;

    const seedFromSchema = (schema: Record<string, any>, existing: Record<string, any>) => {
      const props = schema?.properties ?? {};
      const seeded: Record<string, any> = {};
      for (const [k, def] of Object.entries(props) as [string, any][]) {
        if (def.type === 'file') continue; // never seed file fields — user must upload
        if (def['ui:widget'] === 'hidden') continue;
        if (def.default !== undefined) seeded[k] = def.default;
        else if (def.enum?.length) seeded[k] = def.enum[0];
      }
      // Existing saved values win over schema defaults
      return { ...seeded, ...existing };
    };

    setParams({
      attack:   seedFromSchema(attackSchema,  cfg?.attack_node_config?.node_params  ?? {}),
      defense:  seedFromSchema(defenseSchema, cfg?.defense_node_config?.node_params ?? {}),
      eval:     seedFromSchema(evalSchema,    cfg?.evaluation_node_config?.node_params ?? {}),
      strategy: seedFromSchema(stratSchema,   cfg?.strategy_config?.strategy_params   ?? {}),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.runid, attackNodeName, defenseNodeName, evalNodeName, stratName, discoveryLoaded]);

  // ── Generic updater — functional setState avoids ALL stale closure issues ─
  const updateSection = React.useCallback(
    (section: 'attack' | 'defense' | 'eval' | 'strategy', patch: Record<string, any>) => {
      if (locked) return;
      setParams(prev => {
        const next = { ...prev[section], ...patch };
        const updated = { ...prev, [section]: next };
        // Fire upstream inside the functional update so we always have fresh state
        setTimeout(() => {
          const apiKey =
            section === 'attack'   ? 'attack_node_params'      :
            section === 'defense'  ? 'defense_node_params'     :
            section === 'eval'     ? 'evaluation_node_params'  :
                                     'strategy_params';
          onParamsChange?.({ [apiKey]: next });
        }, 0);
        return updated;
      });
    },
    [locked, onParamsChange]
  );

  const handleChange = (section: 'attack' | 'defense' | 'eval' | 'strategy') =>
    (key: string, val: any) => updateSection(section, { [key]: val });

  const handlePatch = (section: 'attack' | 'defense' | 'eval' | 'strategy') =>
    (patch: Record<string, any>) => updateSection(section, patch);

  // ─────────────────────────────────────────────────────────────────────────────

  if (!run) return <div style={S.empty}>No active run</div>;

  const isManual = cfg?.graph_type === 'manual';
  const isBatch  = cfg?.graph_type === 'batch';

  return (
    <div style={S.root}>
      {locked && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#FFFBEB', borderBottom: '1px solid #FCD34D', fontSize: 11, color: '#92400E' }}>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><rect x="2" y="4.5" width="7" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><path d="M3.5 4.5V3a2 2 0 0 1 4 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
          Config locked while running
        </div>
      )}

      {/* ── Run info ── */}
      <div style={S.runInfo}>
        <div style={S.runName}>{run.name}</div>
        {run.description && <div style={S.runDesc}>{run.description}</div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
          <span style={{ ...S.pill, background: isManual ? '#EEF2FF' : isBatch ? '#F5F3FF' : '#F0FDF4', color: isManual ? '#4F46E5' : isBatch ? '#7C3AED' : '#15803D' }}>
            {isManual ? '⚔ Manual' : isBatch ? '📦 Batch' : '🤖 Automatic'}
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
          <Section icon={<Zap size={13} />} title="Attack Node" subtitle={attackNodeName} badgeColor="#EF4444">
            {attackNodeDesc && <div style={S.nodeDesc}>{attackNodeDesc}</div>}
            <div style={S.readOnlyRow}>
              <span style={S.roKey}>Node Type</span>
              <span style={S.roVal}>{attackNodeName}</span>
            </div>
            <div style={S.divider} />
            <SchemaFields
              schema={attackSchema}
              values={params.attack}
              locked={locked}
              onChange={handleChange('attack')}
              onChangeBatch={handlePatch('attack')}
            />
          </Section>

          {/* ── Defense Node ── */}
          <Section icon={<Shield size={13} />} title="Defense Node" subtitle={defenseNodeName} badgeColor="#22C55E">
            {defenseNodeDesc && <div style={S.nodeDesc}>{defenseNodeDesc}</div>}
            <div style={S.readOnlyRow}>
              <span style={S.roKey}>Node Type</span>
              <span style={S.roVal}>{defenseNodeName}</span>
            </div>
            <div style={S.divider} />
            <SchemaFields
              schema={defenseSchema}
              values={params.defense}
              locked={locked}
              onChange={handleChange('defense')}
              onChangeBatch={handlePatch('defense')}
            />
          </Section>

          {/* ── Evaluation Node ── */}
          <Section icon={<BarChart2 size={13} />} title="Evaluation Node" subtitle={evalNodeName} badgeColor="#6366F1" defaultOpen={isManual}>
            {evalNodeDesc && <div style={S.nodeDesc}>{evalNodeDesc}</div>}
            <div style={S.readOnlyRow}>
              <span style={S.roKey}>Node Type</span>
              <span style={S.roVal}>{evalNodeName}</span>
            </div>
            <div style={S.divider} />
            <SchemaFields
              schema={evalSchema}
              values={params.eval}
              locked={locked}
              onChange={handleChange('eval')}
              onChangeBatch={handlePatch('eval')}
            />
          </Section>

          {/* ── Strategy — default open so file upload is immediately visible ── */}
          <Section icon={<SlidersHorizontal size={13} />} title="Strategy" subtitle={stratName} badgeColor="#0369A1" defaultOpen={true}>
            {stratDesc && <div style={S.nodeDesc}>{stratDesc}</div>}
            <div style={S.readOnlyRow}>
              <span style={S.roKey}>Strategy Name</span>
              <span style={S.roVal}>{stratName}</span>
            </div>
            <div style={S.divider} />
            <SchemaFields
              schema={stratSchema}
              values={params.strategy}
              locked={locked}
              onChange={handleChange('strategy')}
              onChangeBatch={handlePatch('strategy')}
            />
          </Section>
        </>
      )}

      <style>{`@keyframes rcp-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
// ─── Styles ───────────────────────────────────────────────────────────────────

// ─── Styles ───────────────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  root:        { display: 'flex', flexDirection: 'column', gap: 0, background: '#fff' },
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