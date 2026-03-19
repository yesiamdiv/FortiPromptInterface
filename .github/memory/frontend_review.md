# Frontend Review Findings

## Summary of Findings:

*   **State Management**: The application uses `zustand` for global state management (`appStore.ts`), but there's significant duplication of state (e.g., `runs`, `attackPrompts`, running status flags) managed via local `useState` in page components. This needs to be consolidated to use the global store.
*   **Mock Data**: Many data structures (`runs`, `attackPrompts`, `logs`, `consoleOutput`, statistics) are hardcoded mock data. These should be replaced with actual data fetching or streaming mechanisms.
*   **Component Definitions**:
    *   `ComponentType` in `types/index.ts` is incomplete, missing training-related types.
    *   `componentLabels` objects are defined in multiple places and not consistently typed using the `ComponentLabel` interface.
*   **Backend Configuration**: The `BackendConfigForm` component is reused effectively, but the specific configurations (e.g., WebSocket URL for defense logs, API endpoints for training) need to be properly integrated with the backend logic.
*   **UI/UX**: Some UI elements appear incomplete (e.g., "Success Threshold" input), and some features (like dataset upload/linking) require backend implementation.

## To-Do List:

*   **Consolidate State Management**:
    *   Refactor page components (`App.tsx`, `SessionManagerPage.tsx`, `AttackTestingPage.tsx`, `DefenseTestingPage.tsx`, `AttackTrainingPage.tsx`, `DefenseTrainingPage.tsx`) to use `useAppStore` for managing state (runs, attack prompts, defense logs, running status flags) instead of local `useState`.
    *   Ensure all state modifications are done via actions defined in `appStore.ts`.
*   **Centralize Configuration**:
    *   Define `componentLabels` in a single, central location (e.g., `types/index.ts` or `appStore.ts`) and ensure it's typed using `ComponentLabel`.
    *   Update `ComponentType` in `types/index.ts` to include `'attack-training'` and `'defense-training'`.
*   **Implement Data Fetching/Streaming**:
    *   Replace mock data for `runs`, `attackPrompts`, `defenseLogs`, and `consoleOutput` with actual data fetched from the backend API or streamed via WebSockets.
    *   Implement backend logic for these data sources.
*   **Complete UI/UX Features**:
    *   Finalize incomplete UI elements (e.g., "Success Threshold" input).
    *   Implement functionality for dataset upload/linking in `DefenseTrainingPage.tsx`.
    *   Ensure consistent display of logs/console output across training pages.
*   **Type Safety**:
    *   Ensure all instances of `componentLabels` are correctly typed using the `ComponentLabel` interface.
