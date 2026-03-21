// src/store/appStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { RunState, RunsState, RunsStateData, AppState, BackendConfig, DataStorageConfig, GlobalConfigState, GlobalConfigData } from '../types';
// Define the initial state for the runs slice
const initialRunsState: RunsStateData = {
  runs: {},
  activeRunId: null,
};

// Define the initial state for the global config slice
const initialGlobalConfigState: GlobalConfigData = {
  backendConfig: {
    url: '',
    apiKey: undefined,
  },
  dataStorageConfig: {
    type: 'local',
  },
};

// Create the Zustand store
export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // Runs Slice Actions
      runsState: {
        ...initialRunsState,
        setRuns: (runs: Record<string, RunState>) => set((state) => ({ runsState: { ...state.runsState, runs: runs } })),
        addRun: (run: RunState) =>
          set((state) => ({
            runsState: { ...state.runsState, runs: { ...state.runsState.runs, [run.id]: run } },
          })),
        updateRun: (id: string, updatedRun: Partial<RunState>) =>
          set((state) => ({
            runsState: {
              ...state.runsState,
              runs: {
                ...state.runsState.runs,
                [id]: { ...state.runsState.runs[id], ...updatedRun },
              },
            },
          })),
        deleteRun: (id: string) =>
          set((state) => {
            const { [id]: _, ...restRuns } = state.runsState.runs;
            return { runsState: { ...state.runsState, runs: restRuns } };
          }),
        setActiveRun: (id: string | null) =>
          set((state) => ({
            runsState: { ...state.runsState, activeRunId: id },
          })),
      },

      // Global Config Slice Actions
      globalConfigState: {
        ...initialGlobalConfigState,
        setBackendConfig: (config: BackendConfig) => set((state) => ({ globalConfigState: { ...state.globalConfigState, backendConfig: config } })),
        setDataStorageConfig: (config: DataStorageConfig) => set((state) => ({ globalConfigState: { ...state.globalConfigState, dataStorageConfig: config } })),
      },
    }),
    {
      name: 'app-store',
    }
  )
);
