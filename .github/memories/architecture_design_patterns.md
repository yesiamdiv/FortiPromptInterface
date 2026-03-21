# Architecture and Design Patterns

## Key Principles Followed:

*   **State Management:** Centralized state management using Zustand (`useAppStore`) for global application state.
*   **Component-Based Architecture:** UI is built using reusable React components.
*   **Type Safety:** Emphasis on TypeScript for defining interfaces and types (`ComponentType`, `Run`, etc.) to ensure type safety.
*   **Separation of Concerns:** Logic is divided into components (`App.tsx`, `RunManager`, `AttackTestingPage`, `DefenseTestingPage`), a store (`appStore.ts`), types (`index.ts`), and API services (`api.ts`).
*   **Terminology Consistency:** Adopted consistent terminology (e.g., "run" instead of "session").

## Challenges Encountered:

*   **File Manipulation Errors:** Repeated failures in applying string replacements using `replace_string_in.file` tool due to issues with exact string matching, whitespace, and formatting.
*   **Type Export Issues:** Difficulty in correctly exporting types from `index.ts` which led to cascading errors in other files.
