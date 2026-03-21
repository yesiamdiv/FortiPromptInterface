# FortiPrompt Frontend - Copilot Instructions

## Project Overview

FortiPrompt's frontend is a React.js application built with TypeScript, designed to manage and visualize LLM adversarial testing. It interacts with a backend via REST APIs and WebSockets.

The application is structured around three core areas:

1.  **Dashboard Page**: Provides an overview of testing runs, enabling users to create new runs and configure their parameters.
2.  **Run Workspace**: Dedicated dashboards for individual testing runs, featuring distinct sections for Attack and Defense testing.
    *   **Attack Testing**: Allows configuration of attack parameters and displays attack results.
    *   **Defense Testing**: Enables modification of defense parameters and visualizes defense performance and logs.
3.  **Backend Communication**: Utilizes WebSockets for real-time updates and long-lived connections, interacting with a backend API.

## Core Principles

*   **TypeScript First**: Strictly adhere to TypeScript for type safety. Use existing types and interfaces defined in `src/types/index.ts`. Avoid creating new, redundant types or interfaces. If a type needs modification, update the existing definition.
*   **Pattern Adherence**: Follow established patterns and conventions within the codebase. Before implementing new features, review existing components and utilities (e.g., in `src/components`, `src/services`, `src/utils`, `src/store`) to maintain consistency.
*   **State Management**: Utilize Zustand (`src/store/appStore.ts`) for global state management. Ensure all state modifications are handled through the defined actions to maintain predictability.
*   **API Integration**: Interact with the backend through the services defined in `src/services/api.ts`. Use WebSockets for real-time data.
*   **Component Reusability**: Prioritize the use of existing components (`src/components/`) to ensure consistency and reduce development time.

## Architectural Memory

To facilitate faster problem-solving and maintain context, architectural decisions, design patterns, and key ideas should be documented.

*   **Location**: Store these notes in `/.github/memories/` directory.
*   **Format**: Use Markdown files (e.g., `architecture.md`, `design-patterns.md`).
*   **Content**: Document the rationale behind architectural choices, explain complex components, and outline design patterns used.
*   **Retrieval**: These notes will be used to provide context for new chat sessions, ensuring a consistent understanding of the project's architecture.

## Development Workflow

1.  **Understand Requirements**: Clarify the feature or change needed.
2.  **Identify Affected Areas**: Determine which parts of the frontend (pages, components, services, store) will be impacted.
3.  **Consult Existing Code**: Review similar implementations for patterns and best practices.
4.  **Implement Changes**: Write clean, type-safe TypeScript code, adhering to project conventions.
5.  **Update Documentation**: If architectural decisions are made, document them in the `.github/memory/` directory.
6.  **Test**: Ensure the changes work as expected and do not introduce regressions.
