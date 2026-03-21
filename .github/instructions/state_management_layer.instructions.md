# Agent Instructions: State Management Layer

## Purpose

This agent is responsible for implementing the global state management for the frontend application using Zustand. This includes defining the store structure, state slices, and actions.

## Key Responsibilities

1.  **Zustand Store Implementation:**
    *   Create a single Zustand store file (`src/store/appStore.ts`).
    *   Define state slices for:
        *   `runsState`: Manages all `RunState` objects, `activeRunId`, and related actions (add, update, delete runs, set active run, update run status, add prompts/logs/results).
        *   `globalConfigState`: Manages static configurations (`backendConfig`, `dataStorageConfig`).
    *   Ensure all state mutations are immutable.
2.  **State Slice Actions:**
    *   Implement actions to handle state updates. These actions will be called by the API communication layer or UI components.
    *   Examples of actions: `addRun`, `updateRun`, `setRunStatus`, `addAttackPromptToRun`, `setActiveRun`, `setBackendConfig`, etc.
3.  **TypeScript Integration:**
    *   Utilize the TypeScript interfaces defined in `src/types/index.ts` for all state properties.
4.  **Initial State:**
    *   Ensure the store can be initialized with data fetched from the API (e.g., existing runs).
    *   Handle default values for configurations.
5.  **Modularity:** Keep the store logic well-organized and focused on state management.

## Technologies

*   **State Management Library:** Zustand
*   **Language:** TypeScript
*   **Type Definitions:** `src/types/index.ts`

## Deliverables

*   Implementation of `src/store/appStore.ts` with defined state slices and actions.
*   Integration with the API communication layer to trigger state updates.
*   Ensuring state is managed immutably.