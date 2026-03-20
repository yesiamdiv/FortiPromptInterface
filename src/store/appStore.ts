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
//   fetchRuns: async () => {
//     const fetchedRuns = await api.fetchRuns();
//     set({ runs: fetchedRuns });
//   };
//   fetchAttackPrompts: async (runId: string) => {
//     const prompts = await api.fetchAttackPrompts(runId);
//     set({ attackPrompts: prompts });
//   };
//   fetchDefenseLogs: async (runId: string) => {
//     const logs = await api.fetchDefenseLogs(runId);
//     set({ defenseLogs: logs });
//   };
//   fetchConsoleOutput: (runId: string) => Promise<void>;
//   fetchConsoleOutput: async (runId) => {
//     const output = await api.fetchConsoleOutput(runId);
//     set({ consoleOutput: output });
//   },
// })

// export const useAppStore = create<AppState>((set) => ({
//   // Initial State - Run Management
//   runs: [],
//   activeRun: null,
//   currentView: 'run-manager',
//   activeTab: 'overview',

//   // Component Labels
//   componentLabels: {
//     'attack-testing': { name: 'Attack Testing', icon: Zap, color: 'red' },
//     'defense-testing': { name: 'Defense Testing', icon: Shield, color: 'blue' },
//   },

//   // Initial State - Attack
//   attackConfig: {},
//   attackBackendConfig: {},
//   attackRunning: false,
//   attackPrompts: [],
//   attackProgress: { current: 0, total: 0 },

//   // Initial State - Defense
//   defenseConfig: {},
//   defenseLayers: [],
//   defenseLogs: [],
//   defenseStats: {},
//   defenseRunning: false,
//   dataStorageConfig: {},

//   // Actions - Run Management
//   setRuns: () => {},
//   addRun: () => {},
//   updateRun: () => {},
//   deleteRun: () => {},
//   setActiveRun: () => {},
//   setCurrentView: () => {},
//   setActiveTab: () => {},

//   // Actions - Attack
//   setAttackConfig: () => {},
//   setAttackBackendConfig: () => {},
//   setAttackRunning: () => {},
//   addAttackPrompt: () => {},
//   setAttackPrompts: () => {},
//   updateAttackProgress: () => {},

//   // Actions - Defense
//   setDefenseConfig: () => {},
//   setDefenseLayers: () => {},
//   toggleDefenseLayer: () => {},
//   addDefenseLog: () => {},
//   setDefenseLogs: () => {},
//   clearDefenseLogs: () => {},
//   setDefenseStats: () => {},
//   setDefenseRunning: () => {},
//   setDataStorageConfig: () => {},

//   // Fetch Functions
//   fetchRuns: async () => {},
//   fetchAttackPrompts: async () => {},
//   fetchDefenseLogs: async () => {},
//   fetchConsoleOutput: (runId: string) => Promise<void>,
//   fetchConsoleOutput: async (runId) => {},
// }));
}


export const useAppStore = create((set) => ({}))