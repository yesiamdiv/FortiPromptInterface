import { Zap, Shield, MessageSquare } from 'lucide-react';
import { create } from 'zustand';
import {
  Run,
  AttackPrompt,
  DefenseResponse,
  EvalResult,
  EvalStats,
  ComponentType,
  ComponentLabel,
  RunProgress,
  NodeSchema,
  StrategySchema,
} from '../types';

// ─── Component label map ───────────────────────────────────────────────────────

export const componentLabels: Record<ComponentType, ComponentLabel> = {
  attack:  { name: 'Attack Testing',  icon: Zap,           color: '#EF4444' },
  defense: { name: 'Defense Testing', icon: Shield,        color: '#22C55E' },
  manual:  { name: 'Manual Attack',   icon: MessageSquare, color: '#6366F1' },
};

// ─── Discovery cache ──────────────────────────────────────────────────────────

export interface RunDiscovery {
  attackNodes:    NodeSchema[];
  defenseNodes:   NodeSchema[];
  evalNodes:      NodeSchema[];
  strategies:     StrategySchema[];
  loadedForRunId: string | null;
  loading:        boolean;
}

// ─── Store shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Runs
  runs:        Run[];
  activeRunId: string | null;

  /** True while a run is executing — locks the config panel */
  isRunLocked: boolean;

  // Progress (automatic run)
  runProgress: RunProgress | null;

  // Discovery cache
  runDiscovery: RunDiscovery;

  // Attack (keyed by session_id)
  attackPrompts: Record<string, AttackPrompt[]>;
  isAttacking:   boolean;
  attackError:   string | null;

  // Defense (keyed by session_id)
  defenseResponses: Record<string, DefenseResponse[]>;
  defenseStats:     DefenseStats | null;
  isEvaluating:     boolean;
  defenseError:     string | null;

  // Evaluation (keyed by session_id)
  evalResults: Record<string, EvalResult[]>;

  // Connection
  connectionStatus: 'idle' | 'testing' | 'connected' | 'failed';

  // ── Run actions ───────────────────────────────────────────────────────────────
  setRuns:      (runs: Run[]) => void;
  upsertRun:    (run: Run)    => void;   // add or update by runid
  updateRun:    (id: string, patch: Partial<Run>) => void;
  deleteRun:    (id: string)  => void;
  setActiveRun: (id: string | null) => void;
  setIsRunLocked: (v: boolean) => void;

  // ── Progress ──────────────────────────────────────────────────────────────────
  setRunProgress: (p: RunProgress | null) => void;

  // ── Discovery ─────────────────────────────────────────────────────────────────
  setRunDiscovery: (d: Partial<RunDiscovery>) => void;

  // ── Attack actions ────────────────────────────────────────────────────────────
  setAttackPrompts:   (prompts: Record<string, AttackPrompt[]>) => void;
  addAttackPrompt:    (sessionId: string, prompt: AttackPrompt)  => void;
  clearAttackPrompts: (sessionId?: string)                        => void;
  setIsAttacking:     (v: boolean)                                => void;
  setAttackError:     (msg: string | null)                        => void;

  // ── Defense actions ───────────────────────────────────────────────────────────
  setDefenseResponses:   (responses: Record<string, DefenseResponse[]>) => void;
  addDefenseResponse:    (sessionId: string, response: DefenseResponse)  => void;
  clearDefenseResponses: (sessionId?: string)                             => void;
  setDefenseStats:       (stats: DefenseStats)                            => void;
  setIsEvaluating:       (v: boolean)                                     => void;
  setDefenseError:       (msg: string | null)                             => void;

  // ── Evaluation actions ────────────────────────────────────────────────────────
  addEvalResult:     (sessionId: string, result: EvalResult) => void;
  setEvalResults:    (results: Record<string, EvalResult[]>) => void;
  setEvalStats:      (stats: EvalStats)                      => void;
  clearEvalResults:  (sessionId?: string)                      => void;

  // ── Connection ────────────────────────────────────────────────────────────────
  setConnectionStatus: (s: 'idle' | 'testing' | 'connected' | 'failed') => void;

  // ── Reset per-run state ───────────────────────────────────────────────────────
  resetRunState: () => void;
}

const defaultDiscovery: RunDiscovery = {
  attackNodes:    [],
  defenseNodes:   [],
  evalNodes:      [],
  strategies:     [],
  loadedForRunId: null,
  loading:        false,
};

export const useAppStore = create<AppState>((set) => ({
  runs:        [],
  activeRunId: null,
  isRunLocked: false,
  runProgress: null,
  runDiscovery: defaultDiscovery,

  attackPrompts: {},
  isAttacking:   false,
  attackError:   null,

  defenseResponses: {},
  defenseStats:     null,
  isEvaluating:     false,
  defenseError:     null,

  evalResults: {},

  connectionStatus: 'idle',

  // Runs
  setRuns:   (runs)  => set({ runs }),
  upsertRun: (run) => set(s => {
    if (s.runs.some(r => r.runid === run.runid)) {
      return { runs: s.runs.map(r => r.runid === run.runid ? { ...r, ...run } : r) };
    }
    return { runs: [...s.runs, run] };
  }),
  updateRun: (id, patch) =>
    set(s => ({ runs: s.runs.map(r => r.runid === id ? { ...r, ...patch } : r) })),
  deleteRun: (id) => set(s => ({ runs: s.runs.filter(r => r.runid !== id) })),
  setActiveRun: (activeRunId) => set({ activeRunId }),
  setIsRunLocked: (isRunLocked) => set({ isRunLocked }),

  // Progress
  setRunProgress: (runProgress) => set({ runProgress }),

  // Discovery
  setRunDiscovery: (d) => set(s => ({ runDiscovery: { ...s.runDiscovery, ...d } })),

  // Attack
  setAttackPrompts:  (attackPrompts) => set({ attackPrompts }),
  addAttackPrompt:   (sessionId, prompt) => set(s => {
    const existing = s.attackPrompts[sessionId] ?? [];
    if (existing.some(x => x.promptId === prompt.promptId)) return s;
    return { attackPrompts: { ...s.attackPrompts, [sessionId]: [...existing, prompt] } };
  }),
  clearAttackPrompts: (sessionId) => set(s => {
    if (sessionId) {
      const next = { ...s.attackPrompts };
      delete next[sessionId];
      return { attackPrompts: next };
    }
    return { attackPrompts: {} };
  }),
  setIsAttacking:    (isAttacking)   => set({ isAttacking }),
  setAttackError:    (attackError)   => set({ attackError }),

  // Defense
  setDefenseResponses:   (defenseResponses) => set({ defenseResponses }),
  addDefenseResponse: (sessionId, response) => set(s => {
    const existing = s.defenseResponses[sessionId] ?? [];
    if (existing.some(x => x.promptId === response.promptId)) return s;
    return { defenseResponses: { ...s.defenseResponses, [sessionId]: [...existing, response] } };
  }),
  clearDefenseResponses: (sessionId) => set(s => {
    if (sessionId) {
      const next = { ...s.defenseResponses };
      delete next[sessionId];
      return { defenseResponses: next };
    }
    return { defenseResponses: {} };
  }),
  setDefenseStats:       (defenseStats)     => set({ defenseStats }),
  setIsEvaluating:       (isEvaluating)     => set({ isEvaluating }),
  setDefenseError:       (defenseError)     => set({ defenseError }),

  // Evaluation
  addEvalResult: (sessionId, result) => set(s => {
    const existing = (s.evalResults[sessionId] ?? []).findIndex(r => r.evalId === result.evalId);
    if (existing >= 0) {
      const prev = s.evalResults[sessionId][existing];
      const merged = {
        ...prev,
        attackContent:  result.attackContent  ?? prev.attackContent,
        defenseContent: result.defenseContent ?? prev.defenseContent,
        was_blocked:    result.was_blocked    ?? prev.was_blocked,
        attack_type:    result.attack_type    ?? prev.attack_type,
      };
      const next = [...s.evalResults[sessionId]];
      next[existing] = merged;
      return { evalResults: { ...s.evalResults, [sessionId]: next } };
    }
    const prev = s.evalResults[sessionId] ?? [];
    return { evalResults: { ...s.evalResults, [sessionId]: [...prev, result] } };
  }),
  setEvalResults:   (evalResults) => set({ evalResults }),
  setEvalStats:     (evalStats) => set({ evalStats }),
  clearEvalResults: (sessionId) => set(s => {
    if (sessionId) {
      const next = { ...s.evalResults };
      delete next[sessionId];
      return { evalResults: next };
    }
    return { evalResults: {} };
  }),

  // Connection
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Reset
  resetRunState: () => set({
    isRunLocked:      false,
    runProgress:      null,
    runDiscovery:     defaultDiscovery,
    attackPrompts:    {},
    isAttacking:      false,
    attackError:      null,
    defenseResponses: {},
    defenseStats:     null,
    isEvaluating:     false,
    defenseError:     null,
    evalResults:      {},
    connectionStatus: 'idle',
  }),
}));
