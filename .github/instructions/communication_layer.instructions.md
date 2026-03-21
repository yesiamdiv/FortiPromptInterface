# Agent Instructions: Communication Layer

## Purpose

This agent is responsible for implementing the API communication layer of the frontend application. This includes handling REST API calls and WebSocket connections to interact with the backend.

## Key Responsibilities

1.  **REST API Integration:**
    *   Implement functions for all RESTful operations (e.g., fetching runs, creating/updating runs, retrieving configurations).
    *   Utilizes `axios` for robust HTTP requests.
    *   Includes comprehensive error handling for API requests.
    *   **File Structure Considerations:**
        *   `api.ts`: Main entry point for API service, potentially re-exporting other modules.
        *   `runsApi.ts`: Functions specifically for run-related API calls (`fetchRuns`, `createRun`, `updateRun`, `deleteRun`).
        *   `configApi.ts`: Functions for fetching/updating global configurations.
        *   `httpService.ts`: A base service for handling `axios` instance creation, interceptors (for auth, error handling), and common request logic.
    *   Implement robust error handling for API requests, including toast notifications for failures.
2.  **WebSocket Integration:**
    *   Establish and manage a persistent WebSocket connection using `socket.io-client`.
    *   Handle incoming messages from the backend (e.g., run updates, new data, status changes).
    *   Parse WebSocket messages and dispatch appropriate actions to the Zustand store.
    *   Implement connection health checks and automatic retry mechanisms for connection loss.
    *   Handle WebSocket-specific errors with toast notifications.
3.  **Modularity:** Ensure the communication layer is independent of the state management and UI layers.
4.  **Initial State Loading:**
    *   On application startup, fetch initial data (e.g., existing runs) via REST API.
    *   Establish WebSocket connection and subscribe to relevant channels/topics.
5.  **Error Handling:**
    *   Implement toast notifications for critical errors (e.g., connection failures).
    *   Handle component-specific errors where data display is affected by API issues.

## Technologies

*   **Frontend:** TypeScript, React
*   **State Management:** Zustand
*   **WebSocket Client:** `socket.io-client`
*   **HTTP Client:** `axios`

## Deliverables

*   Implementation of `src/services/api.ts` (or a similar file structure for API services).
*   A dedicated module/service for WebSocket management.
*   Integration with the Zustand store for state updates based on API responses and WebSocket messages.
*   Error handling mechanisms (toast notifications, component-level messages).
*   Initial data fetching logic on application load.