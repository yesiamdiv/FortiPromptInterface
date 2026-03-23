import { Zap, Shield } from 'lucide-react';
import { create } from 'zustand';
import {
  Run,
  AttackConfig,
  AttackPrompt,
  BackendConfig,
  DefenseLog,
  DefenseStats,
  DefenseBackendConfig,
  DataStorageConfig,
  ComponentType,
  ComponentLabel,
} from '../types';

// ─── Component label map ─────────────────────────────────────────────────────
// Used by SessionCard, TemplateCard, SessionManagerPage
export const componentLabels: Record<ComponentType, ComponentLabel> = {
  'attack-testing': { name: 'Attack Testing', icon: Zap,    color: '#EF4444' },
  'defense-testing': { name: 'Defense Testing', icon: Shield, color: '#22C55E' },
};

// ─── Store shape ──────────────────────────────────────────────────────────────

interface AppState {
  // Run management
  runs: Run[];
  activeRunId: string | null;

  // Attack
  attackConfig: AttackConfig | null;
  attackPrompts: AttackPrompt[];
  isAttacking: boolean;
  attackError: string | null;

  // Defense
  defenseConfig: DefenseBackendConfig | null;
  defenseLogs: DefenseLog[];
  defenseStats: DefenseStats | null;
  isEvaluating: boolean;
  defenseError: string | null;

  // Backend / connection
  backendConfig: BackendConfig | null;
  connectionStatus: 'idle' | 'testing' | 'connected' | 'failed';

  // Storage
  storageConfig: DataStorageConfig | null;

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
  setIsAttacking: (v: boolean) => void;
  setAttackError: (msg: string | null) => void;

  // Actions — defense
  setDefenseConfig: (config: DefenseBackendConfig) => void;
  setDefenseLogs: (logs: DefenseLog[]) => void;
  addDefenseLog: (log: DefenseLog) => void;
  setDefenseStats: (stats: DefenseStats) => void;
  setIsEvaluating: (v: boolean) => void;
  setDefenseError: (msg: string | null) => void;

  // Actions — backend
  setBackendConfig: (config: BackendConfig) => void;
  setConnectionStatus: (s: 'idle' | 'testing' | 'connected' | 'failed') => void;

  // Actions — storage
  setStorageConfig: (config: DataStorageConfig) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>((set) => ({
  runs: [],
  activeRunId: null,

  attackConfig: null,
  attackPrompts: [],
  isAttacking: false,
  attackError: null,

  defenseConfig: null,
  defenseLogs: [],
  defenseStats: null,
  isEvaluating: false,
  defenseError: null,

  backendConfig: null,
  connectionStatus: 'idle',

  storageConfig: null,

  // Runs
  setRuns: (runs) => set({ runs }),
  addRun: (run) => set((s) => ({ runs: [...s.runs, run] })),
  updateRun: (id, patch) =>
    set((s) => ({ runs: s.runs.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
  deleteRun: (id) => set((s) => ({ runs: s.runs.filter((r) => r.id !== id) })),
  setActiveRun: (activeRunId) => set({ activeRunId }),

  // Attack
  setAttackConfig: (attackConfig) => set({ attackConfig }),
  setAttackPrompts: (attackPrompts) => set({ attackPrompts }),
  addAttackPrompt: (prompt) =>
    set((s) => ({ attackPrompts: [...s.attackPrompts, prompt] })),
  clearAttackPrompts: () => set({ attackPrompts: [] }),
  setIsAttacking: (isAttacking) => set({ isAttacking }),
  setAttackError: (attackError) => set({ attackError }),

  // Defense
  setDefenseConfig: (defenseConfig) => set({ defenseConfig }),
  setDefenseLogs: (defenseLogs) => set({ defenseLogs }),
  addDefenseLog: (log) => set((s) => ({ defenseLogs: [...s.defenseLogs, log] })),
  setDefenseStats: (defenseStats) => set({ defenseStats }),
  setIsEvaluating: (isEvaluating) => set({ isEvaluating }),
  setDefenseError: (defenseError) => set({ defenseError }),

  // Backend
  setBackendConfig: (backendConfig) => set({ backendConfig }),
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  // Storage
  setStorageConfig: (storageConfig) => set({ storageConfig }),
}));