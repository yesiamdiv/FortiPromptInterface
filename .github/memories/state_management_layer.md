# State Management Layer Documentation

## 1. Overview

This document outlines the state management implementation using Zustand in `src/store/appStore.ts`.

## 2. Store Structure

The store is created using `zustand` and enhanced with `devtools` for debugging.

```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { RunState, AppState, BackendConfig, DataStorageConfig } from '../types';

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // Runs Slice
      runs: {},
      activeRunId: null,
      setRuns: (runs) => set({ runs }),
      addRun: (run) =>
        set((state) => ({
          runs: { ...state.runs, [run.id]: run },
        })),
      updateRun: (id, updatedRun) =>
        set((state) => ({
          runs: {
            ...state.runs,
            [id]: { ...state.runs[id], ...updatedRun },
          },
        })),
      deleteRun: (id) =>
        set((state) => {
          const { [id]: _, ...restRuns } = state.runs;
          return { runs: restRuns };
        }),
      setActiveRun: (id) => set({ activeRunId: id }),

      // Global Config Slice
      backendConfig: {
        apiUrl: '',
        apiKey: '',
      },
      dataStorageConfig: {
        storageType: 'local',
      },
      setBackendConfig: (config) => set({ backendConfig: config }),
      setDataStorageConfig: (config) => set({ dataStorageConfig: config }),
    }),
    {
      name: 'app-store',
    }
  )
);
```

## 3. State Slices

### 3.1. `runsState`

Manages the state related to experiment runs.

- **State Properties:**
  - `runs`: A `Record<string, RunState['runs'][keyof RunState['runs']]>` where keys are run IDs and values are detailed run states.
  - `activeRunId`: The ID of the currently active run, or `null`.

- **Actions:**
  - `setRuns(runs: Record<string, RunState['runs'][keyof RunState['runs']]>)`: Sets the entire list of runs.
  - `addRun(run: RunState['runs'][keyof RunState['runs']])`: Adds a new run to the record.
  - `updateRun(id: string, updatedRun: Partial<RunState['runs'][keyof RunState['runs']]>)`: Updates an existing run by its ID.
  - `deleteRun(id: string)`: Removes a run from the record by its ID.
  - `setActiveRun(id: string | null)`: Sets the ID of the active run.

### 3.2. `globalConfigState`

Manages global configuration settings.

- **State Properties:**
  - `backendConfig`: Configuration for the backend connection (type `BackendConfig`).
  - `dataStorageConfig`: Configuration for data storage (type `DataStorageConfig`).

- **Actions:**
  - `setBackendConfig(config: BackendConfig)`: Sets the backend configuration.
  - `setDataStorageConfig(config: DataStorageConfig)`: Sets the data storage configuration.

## 4. TypeScript Integration

- The store utilizes the TypeScript interfaces defined in `src/types/index.ts` for all state properties.

## 5. Initial State

- The store is initialized with default values for `runs` and `globalConfigState`.

## 6. Modularity

- The store logic is well-organized and focused on state management.
