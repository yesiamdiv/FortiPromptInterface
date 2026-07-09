# FortiPrompt Frontend Architecture

## Component Tree

```
App
└── BrowserRouter
    └── AppInner
        ├── /              → HomePage
        ├── /dashboard     → DashboardPage
        ├── /runs/:id/:tab → RunShell
        │   ├── RunConfigPanel          (left panel — config, locked while running)
        │   ├── AttackTestingPage       (tab: attack)
        │   ├── DefenseTestingPage      (tab: defense)
        │   ├── EvaluationPage          (tab: evaluation)
        │   └── ManualAttackPage        (tab: manual — only for manual runs)
        └── /runs/:id      → RunShellRedirect (→ /runs/:id/attack)
```

## Store Responsibilities

### `appStore` (src/store/appStore.ts)

Holds global, cross-page state:

| Field | Purpose |
|---|---|
| `runs` | All run summaries (hydrated from GET /runs on init) |
| `activeRunId` | Currently viewed run |
| `isRunLocked` | Config panel locked while run is active |
| `runProgress` | Live progress from `run_progress` WS events |
| `runDiscovery` | Cached node/strategy schemas for the active run |
| `attackPrompts` | Attack prompts received for the active run |
| `defenseResponses` | Defense responses for the active run |
| `evalResults` | Evaluation results for the active run |
| `attackStats` / `defenseStats` / `evalStats` | Aggregate stats |

Use `appStore` when: you need data accessible across multiple tabs (attack, defense, eval pages all share `attackPrompts`).

### `manualStore` (src/store/manualStore.ts)

Holds manual-run-specific UI state:

| Field | Purpose |
|---|---|
| `sessions` | Session list for the active manual run |
| `activeSession` | Currently selected session (includes `turns: ChatTurn[]`) |
| `isWaitingForResponse` | Input box disabled while turn cycle is in-flight |
| `manualStats` | Aggregate stats for the manual run |

Use `manualStore` when: you're in a manual run context and need session/turn state.

**Rule of thumb:** `appStore` = run-level, `manualStore` = session-level. They reset independently (`resetRunState` / `resetManualState`).

## WebSocket Event → Store Action Mapping

### Automatic/Batch Run Events

| WS Event | Store Action |
|---|---|
| `new_run_available` | `appStore.upsertRun` |
| `run_started` | `appStore.updateRun`, `setIsRunLocked(true)` |
| `run_progress` | `appStore.setRunProgress` |
| `run_completed` | `appStore.updateRun`, `setIsRunLocked(false)`, `setIsAttacking(false)` |
| `run_error` | `appStore.updateRun`, `setIsRunLocked(false)`, `setAttackError` |
| `attack_generated` | `appStore.addAttackPrompt` |
| `defence_response` | `appStore.addDefenseResponse` |
| `evaluation_result` or `evaluation_complete` | `appStore.addEvalResult` (deduped) |
| `evaluation_stats_updated` | `appStore.setEvalStats` |

### Manual Run Events

| WS Event | Store Action |
|---|---|
| `manual_attack_generated` | `manualStore.appendTurnToActiveSession` (role: 'attacker') |
| `manual_defence_response` | `manualStore.appendTurnToActiveSession` (role: 'defense') |
| `manual_evaluation_complete` | `manualStore.appendTurnToActiveSession` (role: 'evaluation') |
| `run_idle` | `manualStore.setIsWaitingForResponse(false)` |

## Turn Rendering Rule

**This is a critical constraint.** For attacker turns in manual runs:

```
✅ Render: turn.metadata.user_input   — the clean text the user typed
❌ Never render: turn.content / attack.prompt — this is the full LLM context
```

This rule is enforced in two places:
- `src/utils/turnAssembly.ts` — `assembleChatTurns()` function (see JSDoc)
- `src/services/websocket.ts` — `manual_attack_generated` handler

## Data Flow

### Automatic Run

```
App mount
  → fetchRuns() → appStore.setRuns
  → websocketService.connect()

Navigate to /runs/:id
  → useRunHydration(runId)         [src/hooks/useRunHydration.ts]
      → fetchRun()                 → appStore.upsertRun
      → fetchRunAttacks()          → appStore.addAttackPrompt (×N)
      → fetchRunDefences()         → appStore.addDefenseResponse (×N)
      → fetchRunEvaluations()      → appStore.addEvalResult (×N)
      → fetchRunStats()            → appStore.setEvalStats, setDefenseStats

Click "Start Run"
  → RunShell.handleStartRun
      → useRunParamSync.flushPending()   (sync any buffered params first)
      → startAutomaticRun()
      ← run_started WS → isRunLocked = true
      ← attack_generated WS (×N)
      ← defence_response WS (×N)
      ← evaluation_result WS (×N)
      ← run_completed WS → isRunLocked = false
```

### Manual Run

```
Navigate to /runs/:id/manual
  → useRunHydration() fetches run, sees graph_type='manual', stops (no flat data to fetch)
  → ManualAttackPage mounts
      → fetchManualSessions() → manualStore.setSessions

Click "New Session"
  → createManualSession()      → manualStore.addSession
  → websocketService.joinSessionRoom(session_id)

Select existing session
  → getManualSessionHistory()
  → assembleChatTurns(rawTurns)  [src/utils/turnAssembly.ts]
  → manualStore.setActiveSession({ ...session, turns: assembled })

Type message and send
  → submitManualTurn()
  → manualStore.setIsWaitingForResponse(true)
  ← manual_attack_generated WS → appendTurnToActiveSession (role: attacker)
  ← manual_defence_response WS → appendTurnToActiveSession (role: defense)
  ← manual_evaluation_complete WS → appendTurnToActiveSession (role: evaluation)
  ← run_idle WS → setIsWaitingForResponse(false)
```

## How to Add a New Run Type

1. **Add the graph_type** to `RunConfig.graph_type` union in `src/types/run.ts`
2. **Add a tab** to `getAvailableTabs()` in `src/pages/RunShell.tsx` and `TAB_META`
3. **Create a page** at `src/pages/<NewType>Page.tsx` — receive `embedded?: boolean` prop
4. **Mount the page** in `RunShell`'s tab content block
5. **Add WS handlers** in `src/services/websocket.ts` if the run type has new events
6. **Update `useRunHydration`** if the run type has existing flat data endpoints to pre-load

For multi-turn runs (Phase 2): data will come from `GET /runs/:id/sessions` + `GET /runs/:id/sessions/:sid/turns` — see `FRONTEND_REFACTOR_PLAN.md` Phase 2.

## File Layout (Phase 1 Complete)

```
src/
  config/
    env.ts          ← typed env variable accessor (REACT_APP_API_URL, REACT_APP_SOCKET_URL)
    index.ts
  hooks/
    useRunHydration.ts    ← run data fetch + store population (fires once per runId)
    useRunParamSync.ts    ← debounced PATCH logic with flush-on-start
    index.ts
  pages/
    RunShell.tsx              ← layout + navigation, ~170 lines
    RunShell.styles.ts
    ManualAttackPage.tsx      ← session CRUD + chat UI
    AttackTestingPage.tsx
    DefenseTestingPage.tsx
    EvaluationPage.tsx
    DashboardPage.tsx
    HomePage.tsx
  services/
    http.ts          ← apiFetch helper only
    api/
      runs.ts        ← run CRUD, start/stop, normalizeRun
      sessions.ts    ← manual session endpoints, normalizeSession
      data.ts        ← flat data endpoints (deprecated — Phase 2 replaces these)
      discovery.ts   ← strategies, nodes, providers
    api.ts           ← backward-compat barrel
    index.ts         ← barrel
    websocket.ts
  store/
    appStore.ts      ← global run-level state
    manualStore.ts   ← manual session/turn UI state
  types/
    run.ts           ← Run, RunStatus, RunConfig, requests
    nodes.ts         ← NodeSchema, StrategySchema, Provider
    session.ts       ← ChatSession, ChatTurn, manual API types
    data.ts          ← AttackPrompt, DefenseResponse, EvalResult, stats
    websocket.ts     ← all WS event interfaces
    index.ts         ← barrel
  utils/
    turnAssembly.ts  ← assembleChatTurns(RawTurnRecord[]) → ChatTurn[]
    run.ts           ← exportRun, generateRunId, nowISO
    index.ts
  components/
    RunConfigPanel.tsx
    RunConfigPanel.styles.ts
    common/
      BackendConfigForm.tsx
    run/
      CreateRunModal.tsx
      CreateSessionModal.tsx
      SessionCard.tsx
      TemplateCard.tsx
  App.tsx
  index.tsx
  index.css

docs/
  frontend-architecture.md    ← this file
```
