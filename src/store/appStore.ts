import { Zap, Shield, MessageSquare } from 'lucide-react';
import { create } from 'zustand';
import {
  Run,
  AttackPrompt,
  AttackStats,
  DefenseResponse,
  DefenseStats,
  ComponentType,
  ComponentLabel,
  RunProgress,
} from '../types';

// ─── Component label map ────────────────────────────────────────────────────────

export const componentLabels: Record<ComponentType, ComponentLabel> = {
  attack:  { name: 'Attack Testing',  icon: Zap,           color: '#EF4444' },
  defense: { name: 'Defense Testing', icon: Shield,        color: '#22C55E' },
  manual:  { name: 'Manual Attack',   icon: MessageSquare, color: '#6366F1' },
};

// ─── Store shape ────────────────────────────────────────────────────────────────

interface AppState {
  // Runs
  runs: Run[];
  activeRunId: string | null;

  // Run execution progress (for automatic runs)
  runProgress: RunProgress | null;

  // Attack
  attackPrompts: AttackPrompt[];
  attackStats: AttackStats | null;
  isAttacking: boolean;
  attackError: string | null;

  // Defense
  defenseResponses: DefenseResponse[];
  defenseStats: DefenseStats | null;
  isEvaluating: boolean;
  defenseError: string | null;

  // Connection
  connectionStatus: 'idle' | 'testing' | 'connected' | 'failed';

  // ─── Run actions ─────────────────────────────────────────────────────────────
  setRuns:      (runs: Run[]) => void;
  addRun:       (run: Run)    => void;
  updateRun:    (id: string, patch: Partial<Run>) => void;
  deleteRun:    (id: string)  => void;
  setActiveRun: (id: string | null) => void;

  // ─── Progress ─────────────────────────────────────────────────────────────────
  setRunProgress: (p: RunProgress | null) => void;

  // ─── Attack actions ───────────────────────────────────────────────────────────
  setAttackPrompts:   (prompts: AttackPrompt[]) => void;
  addAttackPrompt:    (prompt: AttackPrompt)    => void;
  clearAttackPrompts: () => void;
  setAttackStats:     (stats: AttackStats)      => void;
  setIsAttacking:     (v: boolean)              => void;
  setAttackError:     (msg: string | null)      => void;

  // ─── Defense actions ──────────────────────────────────────────────────────────
  setDefenseResponses:   (responses: DefenseResponse[]) => void;
  addDefenseResponse:    (response: DefenseResponse)    => void;
  clearDefenseResponses: () => void;
  setDefenseStats:       (stats: DefenseStats)          => void;
  setIsEvaluating:       (v: boolean)                   => void;
  setDefenseError:       (msg: string | null)           => void;

  // ─── Connection ───────────────────────────────────────────────────────────────
  setConnectionStatus: (s: 'idle' | 'testing' | 'connected' | 'failed') => void;

  // ─── Reset per-run state (call when opening a different run) ─────────────────
  resetRunState: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  runs:        [],
  activeRunId: null,
  runProgress: null,

  attackPrompts: [],
  attackStats:   null,
  isAttacking:   false,
  attackError:   null,

  defenseResponses: [],
  defenseStats:     null,
  isEvaluating:     false,
  defenseError:     null,

  connectionStatus: 'idle',

  // Runs
  setRuns:   (runs)  => set({ runs }),
  addRun:    (run)   => set(s => ({ runs: [...s.runs, run] })),
  updateRun: (id, patch) =>
    set(s => ({ runs: s.runs.map(r => r.runid === id ? { ...r, ...patch } : r) })),
  deleteRun: (id)    => set(s => ({ runs: s.runs.filter(r => r.runid !== id) })),
  setActiveRun: (activeRunId) => set({ activeRunId }),

  // Progress
  setRunProgress: (runProgress) => set({ runProgress }),

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

  // Connection
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Reset run-specific state
  resetRunState: () => set({
    runProgress:      null,
    attackPrompts:    [],
    attackStats:      null,
    isAttacking:      false,
    attackError:      null,
    defenseResponses: [],
    defenseStats:     null,
    isEvaluating:     false,
    defenseError:     null,
    connectionStatus: 'idle',
  }),
}));
