# Architectural Plan: API Communication and State Management

## 1. Overview

This document outlines the plan for implementing the API communication and state management layers of the frontend application. The core components for API communication (`httpService.ts`, `webSocketService.ts`, `api.ts`) and state management (`appStore.ts`) are largely implemented. The focus has been on establishing a robust and modular system for handling data flow between the backend and the frontend, ensuring a seamless user experience, with particular attention to error handling and type safety.

## 2. Core Components

### 2.1. API Communication Layer

*   **Location:** `src/services/api.ts`, `src/services/httpService.ts`, and `src/services/webSocketService.ts`.
*   **Responsibility:** Manage all external communication with the backend, including REST API calls and WebSocket connections.
*   **`httpService.ts`:**
    *   Manages the Axios instance (`apiClient`).
    *   Initializes the `apiClient` with a `baseURL` and `X-API-Key` from `BackendConfig`.
    *   Implements a response interceptor for generic error handling, displaying toast notifications for API errors using `react-toastify`.
    *   Provides `initHttpService` to set up the service and `httpService` to get the configured Axios instance.
*   **`webSocketService.ts`:**
    *   Manages the Socket.IO client instance (`socket`).
    *   Initializes the socket connection with the backend URL from `BackendConfig`.
    *   Handles WebSocket connection events (`connect`, `disconnect`, `connect_error`) and displays toast notifications for status changes and errors using `react-toastify`.
    *   Subscribes to backend events (e.g., `run_update`) and dispatches actions to the Zustand store to update the application state.
    *   Provides `initWebSocket` to establish the connection, `closeWebSocket` to terminate it, and `getWebSocket` to access the socket instance.
*   **`api.ts`:**
    *   Contains specific functions for interacting with the backend REST API (e.g., `fetchRuns`, `createRun`, `updateRun`, `deleteRun`, `fetchBackendConfig`, `updateBackendConfig`).
    *   These functions utilize the `httpService` to make HTTP requests.
    *   Includes error handling for individual API calls, logging errors to the console and displaying toast notifications for user feedback.

### 2.2. State Management Layer

*   **Location:** `src/store/appStore.ts`
*   **Library:** Zustand
*   **Structure:** A single store file with distinct state slices, now clearly separating data interfaces from action interfaces:
    *   `runsState`: Manages all `RunState` objects, `activeRunId`, and related actions (`setRuns`, `addRun`, `updateRun`, `deleteRun`, `setActiveRun`).
    *   `globalConfigState`: Manages static configurations (`backendConfig`, `dataStorageConfig`) through `GlobalConfigData` and provides actions (`setBackendConfig`, `setDataStorageConfig`) via `GlobalConfigActions`.
*   **Actions:** Defined immutably within each slice for state mutations. These actions are triggered by the API communication layer or UI interactions.
*   **Modularity:** Each slice encapsulates a specific domain of the application state.

### 2.3. Service Initialization and Cleanup (`src/services/index.ts`)

*   **`initializeServices`:**
    *   Takes `BackendConfig` and `DataStorageConfig` as input.
    *   Calls `initHttpService` to set up the Axios instance.
    *   Calls `setBackendConfig` and `setDataStorageConfig` on the Zustand store to store the configurations.
    *   Calls `initWebSocket` to establish the WebSocket connection.
*   **`cleanupServices`:**
    *   Calls `closeWebSocket` to terminate the WebSocket connection when the application shuts down.
*   **`loadInitialData`:**
    *   Fetches initial run data using `fetchRuns` and updates the Zustand store via `setRuns`.
    *   Fetches backend configuration if not already set and initializes services.

### 2.4. UI Layer (Future Development)

*   **Responsibility:** Render the user interface based on the state managed by Zustand and interact with the API layer.
*   **Data Flow:** Components will subscribe to relevant parts of the Zustand store using `useStore` hooks. State changes in Zustand will automatically trigger UI updates.

## 4. Data Flow

1.  **Backend -> WebSocket:** Backend sends real-time updates.
2.  **WebSocket Listener -> Zustand Store:** The WebSocket listener receives messages, processes them, and dispatches actions to update the Zustand store (e.g., `updateRun`).
3.  **Zustand Store:** Manages state mutations immutably.
4.  **Zustand Store -> React UI Components:** Components subscribed to the store receive state updates and re-render accordingly.

## 5. Initial State Loading & Run Lifecycle

*   **Application Startup:**
    1.  `initializeServices` is called with initial backend and data storage configurations.
    2.  `loadInitialData` fetches all existing runs via REST API (`fetchRuns`).
    3.  `setRuns` populates `runsState` in Zustand.
    4.  WebSocket connection is established and subscribes to relevant channels.
*   **Individual Run Data Loading:**
    *   Fetch complete run history (prompts, logs, evaluations) via REST API when a run is first accessed or if data is missing. This should be done individually and progressively for each run.
*   **Run Creation:**
    *   Default configurations (attacker, defender) from backend presets.
    *   Initial status: 'idle' or 'configured'.
    *   Backend registers and saves the run.
*   **Starting a Run:** Requires explicit frontend "start" action; backend initiates the cycle.
*   **Configuration:** Runs can be configured before starting or potentially while running.
*   **Deletion:** Hard delete by default. Option for deleting only generated data (prompts, responses, evaluations) may be considered.
*   **Error Handling (UI):**
    *   Toast notifications for API/WebSocket connection failures (implemented in `httpService.ts` and `webSocketService.ts`).
    *   Error messages within components for data display issues.

## 6. Current Todo List

- [x] Create httpService.ts for Axios instance and error handling
- [x] Implement fetchRuns in api.ts using httpService
- [x] Implement createRun, updateRun, deleteRun in api.ts
- [x] Implement config related API calls in api.ts
- [x] Implement WebSocket integration
- [x] Integrate API and WebSocket with Zustand store
- [x] Implement toast notifications for error handling
- [ ] Update documentation with code changes (Currently doing this)