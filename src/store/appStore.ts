import { Zap, Shield } from 'lucide-react';
import { create } from 'zustand';
import {
  Run,
  AttackConfig,
  AttackPrompt,
  AttackStats,
  DefenseConfig,
  DefenseResponse,
  DefenseStats,
  ComponentType,
  ComponentLabel,
} from '../types';

// ─── Component label map ──────────────────────────────────────────────────────
export const componentLabels: Record<ComponentType, ComponentLabel> = {
  'attack':  { name: 'Attack Testing',  icon: Zap,    color: '#EF4444' },
  'defense': { name: 'Defense Testing', icon: Shield, color: '#22C55E' },
};

// ─── Store shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Run management
  runs: Run[];
  activeRunId: string | null;

  // Attack
  attackConfig: AttackConfig | null;
  attackPrompts: AttackPrompt[];
  attackStats: AttackStats | null;
  isAttacking: boolean;
  attackError: string | null;

  // Defense
  defenseConfig: DefenseConfig | null;
  defenseResponses: DefenseResponse[];
  defenseStats: DefenseStats | null;
  isEvaluating: boolean;
  defenseError: string | null;

  // Connection status (used by AttackTestingPage)
  connectionStatus: 'idle' | 'testing' | 'connected' | 'failed';

  // Actions — runs
  setRuns: (runs: Run[]) => void;
  addRun: (run: Run) => void;
  updateRun: (id: string, patch: Partial<Run>) => void;
  deleteRun: (id: string) => void;
  setActiveRun: (id: string | null) => void;

  // Actions — attack
  setAttackConfig: (config: AttackConfig) => void;
  setAttackPrompts: (prompts: AttackPrompt[]) => void;
  addAttackPrompt: (prompt: AttackPrompt) => void;
  clearAttackPrompts: () => void;
  setAttackStats: (stats: AttackStats) => void;
  setIsAttacking: (v: boolean) => void;
  setAttackError: (msg: string | null) => void;

  // Actions — defense
  setDefenseConfig: (config: DefenseConfig) => void;
  setDefenseResponses: (responses: DefenseResponse[]) => void;
  addDefenseResponse: (response: DefenseResponse) => void;
  clearDefenseResponses: () => void;
  setDefenseStats: (stats: DefenseStats) => void;
  setIsEvaluating: (v: boolean) => void;
  setDefenseError: (msg: string | null) => void;

  // Actions — connection
  setConnectionStatus: (s: 'idle' | 'testing' | 'connected' | 'failed') => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  runs: [],
  activeRunId: null,

  attackConfig: null,
  attackPrompts: [],
  attackStats: null,
  isAttacking: false,
  attackError: null,

  defenseConfig: null,
  defenseResponses: [],
  defenseStats: null,
  isEvaluating: false,
  defenseError: null,

  connectionStatus: 'idle',

  // Runs — use run.runid as the identifier (matching backend schema)
  setRuns: (runs) => set({ runs }),
  addRun:  (run)  => set((s) => ({ runs: [...s.runs, run] })),
  updateRun: (id, patch) =>
    set((s) => ({
      runs: s.runs.map((r) => (r.runid === id ? { ...r, ...patch } : r)),
    })),
  deleteRun: (id) =>
    set((s) => ({ runs: s.runs.filter((r) => r.runid !== id) })),
  setActiveRun: (activeRunId) => set({ activeRunId }),

  // Attack
  setAttackConfig:   (attackConfig)   => set({ attackConfig }),
  setAttackPrompts:  (attackPrompts)  => set({ attackPrompts: attackPrompts }),
  addAttackPrompt:   (prompt)         => set((s) => {
    const exists = s.attackPrompts.some(x => x.promptId === prompt.promptId);
    if (exists) return s;

    return {
      attackPrompts: [...s.attackPrompts, prompt],
    };
  }),
  clearAttackPrompts: ()              => set({ attackPrompts: [] }),
  setAttackStats:    (attackStats)    => set({ attackStats }),
  setIsAttacking:    (isAttacking)    => set({ isAttacking }),
  setAttackError:    (attackError)    => set({ attackError }),

  // Defense
  setDefenseConfig:    (defenseConfig)    => set({ defenseConfig }),
  setDefenseResponses: (defenseResponses) => set({ defenseResponses }),
  addDefenseResponse:  (response)         => set((s) => ({ defenseResponses: [...s.defenseResponses, response] })),
  clearDefenseResponses: ()               => set({ defenseResponses: [] }),
  setDefenseStats:     (defenseStats)     => set({ defenseStats }),
  setIsEvaluating:     (isEvaluating)     => set({ isEvaluating }),
  setDefenseError:     (defenseError)     => set({ defenseError }),

  // Connection
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
}));