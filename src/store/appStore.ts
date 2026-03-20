import { create } from 'zustand';
import {
  Run,
  AttackConfig,
  AttackPrompt,
  BackendConfig,
  DefenseLayer,
  DefenseLog,
  DefenseStats,
  DefenseBackendConfig,
  DataStorageConfig,  ComponentType,
  ComponentLabel,} from '../types';

interface AppState {
  // Run Management
  runs: Run[];
  activeRun: Run | null;
  currentView: 'run-manager' | 'run-workspace';
  activeTab: ComponentType | 'overview';


  // Component Labels
  componentLabels: Record<ComponentType, ComponentLabel>;

  // Attack State
  attackConfig: Partial<AttackConfig>;
  attackBackendConfig: Partial<BackendConfig>;
  attackRunning: boolean;
  attackPrompts: AttackPrompt[];
  attackProgress: {
    current: number;
    total: number;
  };

  // Defense State
  defenseConfig: Partial<DefenseBackendConfig>;
  defenseLayers: DefenseLayer[];
  defenseLogs: DefenseLog[];
  defenseStats: DefenseStats;
  defenseRunning: boolean;
  dataStorageConfig: Partial<DataStorageConfig>;

  // Actions - Run Management
  setRuns: (runs: Run[]) => void;
  addRun: (run: Run) => void;
  updateRun: (id: string, updates: Partial<Run>) => void;
  deleteRun: (id: string) => void;
  setActiveRun: (run: Run | null) => void;
  setCurrentView: (view: 'run-manager' | 'run-workspace') => void;
  setActiveTab: (tab: ComponentType | 'overview') => void;

  // Actions - Attack
  setAttackConfig: (config: Partial<AttackConfig>) => void;
  setAttackBackendConfig: (config: Partial<BackendConfig>) => void;
  setAttackRunning: (running: boolean) => void;
  addAttackPrompt: (prompt: AttackPrompt) => void;
  setAttackPrompts: (prompts: AttackPrompt[]) => void;
  updateAttackProgress: (progress: { current: number; total: number }) => void;

  // Actions - Defense
  setDefenseConfig: (config: Partial<DefenseBackendConfig>) => void;
  setDefenseLayers: (layers: DefenseLayer[]) => void;
  toggleDefenseLayer: (id: string) => void;
  addDefenseLog: (log: DefenseLog) => void;
  setDefenseLogs: (logs: DefenseLog[]) => void;
  clearDefenseLogs: () => void;
  setDefenseStats: (stats: DefenseStats) => void;
  setDefenseRunning: (running: boolean) => void;
  setDataStorageConfig: (config: Partial<DataStorageConfig>) => void;

  // Fetch Functions
  fetchRuns: async () => {
    const fetchedRuns = await api.fetchRuns();
    set({ runs: fetchedRuns });
  };
  fetchAttackPrompts: async (runId: string) => {
    const prompts = await api.fetchAttackPrompts(runId);
    set({ attackPrompts: prompts });
  };
  fetchDefenseLogs: async (runId: string) => {
    const logs = await api.fetchDefenseLogs(runId);
    set({ defenseLogs: logs });
  };
  fetchConsoleOutput: (runId: string) => Promise<void>;
  fetchConsoleOutput: async (runId) => {
    const output = await api.fetchConsoleOutput(runId);
    set({ consoleOutput: output });
  },
}

export const useAppStore = create<AppState>((set) => ({
  // Initial State - Run Management
  runs: [],
  activeRun: null,
  currentView: 'run-manager',
  activeTab: 'overview',

  // Initial State - Attack
  attackConfig: {},
  attackBackendConfig: {},
  attackRunning: false,
  attackPrompts: [],
  attackProgress: { current: 0, total: 0 },

  // Initial State - Defense
  defenseConfig: {},
  defenseLayers: [
    {
      id: '1',
      type: 'input-sanitizer',
      name: 'Input Sanitizer',
      enabled: true,
      order: 1,
    },
    {
      id: '2',
      type: 'semantic-filter',
      name: 'Semantic Filter',
      enabled: true,
      order: 2,
    },
    {
      id: '3',
      type: 'regex-scanner',
      name: 'Regex Scanner',
      enabled: true,
      order: 3,
    },
    {
      id: '4',
      type: 'context-validator',
      name: 'Context Validator',
      enabled: true,
      order: 4,
    },
    {
      id: '5',
      type: 'output-filter',
      name: 'Output Filter',
      enabled: true,
      order: 5,
    },
  ],
  defenseLogs: [],
  defenseStats: {
    blockedAttacks: 0,
    passedLegitimate: 0,
    accuracy: 0,
  },
  defenseRunning: false,
  dataStorageConfig: {},

  // Initial State - Component Labels
  componentLabels: {
    'attack-testing': { name: 'Attack Testing', icon: Zap, color: 'red' },
    'defense-testing': { name: 'Defense Testing', icon: Shield, color: 'blue' },
  },

  // Initial State - Training
  trainingActive: false,
  consoleOutput: [],

  // Actions - Run Management
  setRuns: (runs) => set({ runs }),
  addRun: (run) => set((state) => ({ runs: [...state.runs, run] })),
  updateRun: (id, updates) =>
    set((state) => ({
      runs: state.runs.map((run) => (run.id === id ? { ...run, ...updates } : run)),
    })),
  deleteRun: (id) => set((state) => ({ runs: state.runs.filter((run) => run.id !== id) })),
  setActiveRun: (run) => set({ activeRun: run }),
  setCurrentView: (view) => set({ currentView: view }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Actions - Attack
  setAttackConfig: (config) =>
    set((state) => ({ attackConfig: { ...state.attackConfig, ...config } })),
  setAttackBackendConfig: (config) =>
    set((state) => ({ attackBackendConfig: { ...state.attackBackendConfig, ...config } })),
  setAttackRunning: (running) => set({ attackRunning: running }),
  addAttackPrompt: (prompt) =>
    set((state) => ({ attackPrompts: [...state.attackPrompts, prompt] })),
  setAttackPrompts: (prompts) => set({ attackPrompts: prompts }),
  updateAttackProgress: (progress) => set({ attackProgress: progress }),

  // Actions - Defense
  setDefenseConfig: (config) =>
    set((state) => ({ defenseConfig: { ...state.defenseConfig, ...config } })),
  setDefenseLayers: (layers) => set({ defenseLayers: layers }),
  toggleDefenseLayer: (id) =>
    set((state) => ({
      defenseLayers: state.defenseLayers.map((layer) =>
        layer.id === id ? { ...layer, enabled: !layer.enabled } : layer
      ),
    })),
  addDefenseLog: (log) => set((state) => ({ defenseLogs: [log, ...state.defenseLogs] })),
  setDefenseLogs: (logs) => set({ defenseLogs: logs }),
  clearDefenseLogs: () => set({ defenseLogs: [] }),
  setDefenseStats: (stats) => set({ defenseStats: stats }),
  setDefenseRunning: (running) => set({ defenseRunning: running }),
  setDataStorageConfig: (config) =>
    set((state) => ({ dataStorageConfig: { ...state.dataStorageConfig, ...config } })),
  // Fetch Functions
  fetchRuns: async () => {
    const fetchedRuns = await api.fetchRuns();
    set({ runs: fetchedRuns });
  };
  fetchAttackPrompts: async (runId: string) => {
    const prompts = await api.fetchAttackPrompts(runId);
    set({ attackPrompts: prompts });
  };
  fetchDefenseLogs: async (runId: string) => {
    const logs = await api.fetchDefenseLogs(runId);
    set({ defenseLogs: logs });
  };
  fetchConsoleOutput: (runId: string) => Promise<void>;
  fetchConsoleOutput: async (runId) => {
    const output = await api.fetchConsoleOutput(runId);
    set({ consoleOutput: output });
  },
}));
