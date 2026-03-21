# Zustand Store Pattern: Nested Actions vs Root Actions

## Purpose

This document defines two valid patterns for structuring a Zustand store:

* Nested actions (actions inside state slices)
* Root-level actions (actions at store root)

It also documents how to refactor between them, including required type and usage changes.

---

## Pattern A: Root-Level Actions

### Structure

```ts
{
  runsState: {
    runs: Record<string, RunState>,
    activeRunId: string | null
  },

  updateRun: (id: string, data: Partial<RunState>) => void
}
```

### Characteristics

* State contains only data
* Actions exist at the top level of the store
* Clear separation: state vs logic

---

## Pattern B: Nested Actions (Current Implementation)

### Structure

```ts
{
  runsState: {
    runs: Record<string, RunState>,
    activeRunId: string | null,

    updateRun: (id: string, data: Partial<RunState>) => void
  }
}
```

### Characteristics

* State and actions are colocated
* Each slice acts like a self-contained module
* Actions accessed via slice path

---

## Behavioral Difference

### Object Identity

* Nested pattern recreates entire `runsState` object on update
* Root pattern updates only data, actions remain stable

---

## Access Patterns

### Root-Level

```ts
useAppStore((s) => s.updateRun)
useAppStore.getState().updateRun()
```

### Nested

```ts
useAppStore((s) => s.runsState.updateRun)
useAppStore.getState().runsState.updateRun()
```

---

## Refactor: Nested → Root

### Step 1: Move Actions Out

#### Before

```ts
runsState: {
  runs: {},
  activeRunId: null,
  updateRun: (id, data) => set(...)
}
```

#### After

```ts
runsState: {
  runs: {},
  activeRunId: null
},
updateRun: (id, data) => set(...)
```

---

### Step 2: Update Usage

#### Before

```ts
useAppStore((s) => s.runsState.updateRun)
useAppStore.getState().runsState.updateRun()
```

#### After

```ts
useAppStore((s) => s.updateRun)
useAppStore.getState().updateRun()
```

---

### Step 3: Types Refactor

#### Before (Nested)

```ts
type RunsState = {
  runs: Record<string, RunState>;
  activeRunId: string | null;
  updateRun: (id: string, data: Partial<RunState>) => void;
};

type AppState = {
  runsState: RunsState;
};
```

---

#### After (Root-Level)

Split state and actions:

```ts
type RunsState = {
  runs: Record<string, RunState>;
  activeRunId: string | null;
};
```

```ts
type RunsActions = {
  updateRun: (id: string, data: Partial<RunState>) => void;
  addRun: (run: RunState) => void;
  deleteRun: (id: string) => void;
};
```

Combine:

```ts
type AppState = {
  runsState: RunsState;
} & RunsActions;
```

---

## Refactor: Root → Nested

### Step 1: Move Actions Into Slice

```ts
runsState: {
  runs: {},
  activeRunId: null,
  updateRun: fn
}
```

---

### Step 2: Update Usage

```ts
s.updateRun → s.runsState.updateRun
```

---

### Step 3: Types Refactor

```ts
type RunsState = {
  runs: Record<string, RunState>;
  activeRunId: string | null;

  updateRun: (id: string, data: Partial<RunState>) => void;
};
```

```ts
type AppState = {
  runsState: RunsState;
};
```

Remove separate action types.

---

## Store Definition Comparison

### Nested

```ts
create((set) => ({
  runsState: {
    runs: {},
    activeRunId: null,

    updateRun: (id, data) =>
      set((state) => ({
        runsState: {
          ...state.runsState,
          runs: { ...state.runsState.runs, [id]: data },
        },
      })),
  },
}));
```

---

### Root-Level

```ts
create((set) => ({
  runsState: {
    runs: {},
    activeRunId: null,
  },

  updateRun: (id, data) =>
    set((state) => ({
      runsState: {
        ...state.runsState,
        runs: {
          ...state.runsState.runs,
          [id]: data,
        },
      },
    })),
}));
```

---

## Key Transformation Summary

### Nested → Root

* Move actions out of slice
* Update all access paths
* Split types into state + actions
* Merge via intersection (`&`)

---

### Root → Nested

* Move actions into slice object
* Update access paths
* Merge actions into state type
* Remove separate action types

---

## Core Mental Model

### Nested

```
runsState = data + logic
```

### Root

```
runsState = data
store = data + logic
```

---

## Notes

* Both patterns are valid
* Difference is structural, not functional
* Refactor requires synchronized updates across:

  * store definition
  * usage sites
  * type definitions

---
