# Task Summary

This file outlines the high-level tasks for agents to perform. It serves as a reference for clearing out unwanted code and focusing on UI structure.

**Current Objective:**
Remove all functionality (state management, effects, functions, API calls, etc.) from the frontend application, leaving only the UI structure. This will create a clean slate for rebuilding functionality.

**Specific Actions:**
- **`src/App.tsx`**: Remove state, effects, and functional components. Retain JSX UI structure.
- **`src/index.tsx`**: Ensure only the main `App` component and necessary global providers are rendered. Remove state management initialization.
- **`src/components/common/BackendConfigForm.tsx`**: Remove state, event handlers, and functional logic. Retain form structure.
- **`src/components/session/CreateSessionModal.tsx`**: Remove state and session creation logic. Retain modal JSX.
- **`src/components/session/SessionCard.tsx`**: Remove state and effects. Retain display JSX.
- **`src/components/session/TemplateCard.tsx`**: Remove state and effects. Retain display JSX.
- **`src/pages/AttackTestingPage.tsx`**: Remove state, effects, and functional logic. Retain JSX UI structure.
- **`src/pages/AttackTrainingPage.tsx`**: Remove state, effects, and functional logic. Retain JSX UI structure.
- **`src/pages/DefenseTestingPage.tsx`**: Remove state, effects, and functional logic. Retain JSX UI structure.
- **`src/pages/DefenseTrainingPage.tsx`**: Remove state, effects, and functional logic. Retain JSX UI structure.
- **`src/pages/SessionManagerPage.tsx`**: Remove state, effects, and functional logic. Retain JSX UI structure.
- **`src/services/api.ts`**: Remove all API call functions.
- **`src/store/appStore.ts`**: Remove all state definitions, actions, and reducers.

**Verification:**
- Manually inspect each modified file to confirm all functionality has been removed.
