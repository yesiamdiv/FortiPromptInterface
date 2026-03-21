
# Task Summary

This file outlines the high-level tasks for agents. It serves as a reference to ensure agents understand their objectives without getting bogged down in excessive detail.

## Current Objective:

Implement state management using Zustand, define TypeScript interfaces for data modeling, and establish a robust API communication layer for handling long-living sessions and real-time updates.

## Specific Actions:

1.  **Zustand Store Design**: 
    *   Identify and categorize all application states that require central management.
    *   Define actions and mutations for managing the identified states.
    *   Consider performance implications and data structure complexity.
2.  **TypeScript Data Modeling**: 
    *   Define interfaces and/or classes for backend data structures.
    *   Model relationships between different data entities.
    *   Ensure type safety and adherence to best practices.
3.  **API Communication Layer**: 
    *   Implement a central module for handling all external backend communication.
    *   Integrate REST API calls for standard operations.
    *   Implement WebSocket support for real-time updates.
    *   Define clear contracts for API interactions.
4.  **Session Management**: 
    *   Design a strategy for managing long-living sessions.
    *   Handle concurrent runs and their states effectively.

## Target Files:

- `src/store/appStore.ts` (for Zustand store)
- `src/types/index.ts` (for TypeScript interfaces/classes)
- `src/services/api.ts` (for API communication)

This summary serves as a reference for the current task, guiding the implementation of state management, data modeling, and API communication.
