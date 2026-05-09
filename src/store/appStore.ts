import { Zap, Shield, MessageSquare, BarChart2 } from 'lucide-react';
import { create } from 'zustand';
import {
  Run,
  AttackPrompt,
  AttackStats,
  DefenseResponse,
  DefenseStats,
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

  // Attack
  attackPrompts: AttackPrompt[];
  attackStats:   AttackStats | null;
  isAttacking:   boolean;
  attackError:   string | null;

  // Defense
  defenseResponses: DefenseResponse[];
  defenseStats:     DefenseStats | null;
  isEvaluating:     boolean;
  defenseError:     string | null;

  // Evaluation
  evalResults: EvalResult[];
  evalStats:   EvalStats | null;

  // Connection
  connectionStatus: 'idle' | 'testing' | 'connected' | 'failed';

  // ── Run actions ───────────────────────────────────────────────────────────────
  setRuns:      (runs: Run[]) => void;
  addRun:       (run: Run)    => void;
  updateRun:    (id: string, patch: Partial<Run>) => void;
  deleteRun:    (id: string)  => void;
  setActiveRun: (id: string | null) => void;
  setIsRunLocked: (v: boolean) => void;

  // ── Progress ──────────────────────────────────────────────────────────────────
  setRunProgress: (p: RunProgress | null) => void;

  // ── Discovery ─────────────────────────────────────────────────────────────────
  setRunDiscovery: (d: Partial<RunDiscovery>) => void;

  // ── Attack actions ────────────────────────────────────────────────────────────
  setAttackPrompts:   (prompts: AttackPrompt[]) => void;
  addAttackPrompt:    (prompt: AttackPrompt)    => void;
  clearAttackPrompts: ()                         => void;
  setAttackStats:     (stats: AttackStats)       => void;
  setIsAttacking:     (v: boolean)               => void;
  setAttackError:     (msg: string | null)       => void;

  // ── Defense actions ───────────────────────────────────────────────────────────
  setDefenseResponses:   (responses: DefenseResponse[]) => void;
  addDefenseResponse:    (response: DefenseResponse)    => void;
  clearDefenseResponses: ()                              => void;
  setDefenseStats:       (stats: DefenseStats)           => void;
  setIsEvaluating:       (v: boolean)                    => void;
  setDefenseError:       (msg: string | null)            => void;

  // ── Evaluation actions ────────────────────────────────────────────────────────
  addEvalResult:     (result: EvalResult) => void;
  setEvalResults:    (results: EvalResult[]) => void;
  clearEvalResults:  ()                      => void;
  setEvalStats:      (stats: EvalStats)      => void;

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

  attackPrompts: [],
  attackStats:   null,
  isAttacking:   false,
  attackError:   null,

  defenseResponses: [],
  defenseStats:     null,
  isEvaluating:     false,
  defenseError:     null,

  evalResults: [],
  evalStats:   null,

  connectionStatus: 'idle',

  // Runs
  setRuns:   (runs)  => set({ runs }),
  addRun:    (run)   => set(s => ({ runs: [...s.runs, run] })),
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
  addAttackPrompt:   (prompt)        => set(s => {
    if (s.attackPrompts.some(x => x.promptId === prompt.promptId)) return s;
    return { attackPrompts: [...s.attackPrompts, prompt] };
  }),
  clearAttackPrompts: () => set({ attackPrompts: [] }),
  setAttackStats:    (attackStats)   => set({ attackStats }),
  setIsAttacking:    (isAttacking)   => set({ isAttacking }),
  setAttackError:    (attackError)   => set({ attackError }),

  // Defense
  setDefenseResponses:   (defenseResponses) => set({ defenseResponses }),
  addDefenseResponse:    (response)         => set(s => ({ defenseResponses: [...s.defenseResponses, response] })),
  clearDefenseResponses: ()                 => set({ defenseResponses: [] }),
  setDefenseStats:       (defenseStats)     => set({ defenseStats }),
  setIsEvaluating:       (isEvaluating)     => set({ isEvaluating }),
  setDefenseError:       (defenseError)     => set({ defenseError }),

  // Evaluation
  addEvalResult: (result) => set(s => {
    if (s.evalResults.some(r => r.evalId === result.evalId)) return s;
    return { evalResults: [...s.evalResults, result] };
  }),
  setEvalResults:   (evalResults) => set({ evalResults }),
  clearEvalResults: ()            => set({ evalResults: [] }),
  setEvalStats:     (evalStats)   => set({ evalStats }),

  // Connection
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Reset
  resetRunState: () => set({
    isRunLocked:      false,
    runProgress:      null,
    runDiscovery:     defaultDiscovery,
    attackPrompts:    [],
    attackStats:      null,
    isAttacking:      false,
    attackError:      null,
    defenseResponses: [],
    defenseStats:     null,
    isEvaluating:     false,
    defenseError:     null,
    evalResults:      [],
    evalStats:        null,
    connectionStatus: 'idle',
  }),
}));