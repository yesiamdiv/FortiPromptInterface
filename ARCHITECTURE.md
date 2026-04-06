# FortiPrompt Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      FortiPrompt Frontend                        │
│                        (React + TypeScript)                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP + WebSocket
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FortiPrompt Backend                         │
│                   (Your Implementation Here)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                              ▼
                     ┌────────────────┐
                     │    Database    │
                     │  (PostgreSQL)  │
                     └────────────────┘
```

---

## Frontend Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                         App.tsx                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • WebSocket initialization                              │  │
│  │  • Route management                                      │  │
│  │  • Fetch runs and join Socket.io rooms                  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────┬──────────────────────────────────────────────┘
                  │
         ┌────────┼────────┐
         │        │        │
         ▼        ▼        ▼
    ┌────────┐ ┌─────────┐ ┌──────────┐
    │HomePage│ │Dashboard│ │Attack/   │
    │        │ │Page     │ │Defense   │
    │        │ │         │ │Pages     │
    └────────┘ └─────────┘ └──────────┘
         │        │             │
         └────────┼─────────────┘
                  │
         ┌────────┴────────┐
         │                 │
         ▼                 ▼
    ┌─────────┐      ┌──────────┐
    │Services │      │  Store   │
    │         │◄─────┤ (Zustand)│
    │• API    │      │          │
    │• Socket │      │          │
    └─────────┘      └──────────┘
         │                 ▲
         │                 │
         └─────────────────┘
           Updates store
```

---

## Data Flow Architecture

### 1. REST API Flow (CRUD Operations)

```
┌──────────┐       HTTP Request        ┌──────────┐
│          │──────────────────────────►│          │
│ Component│                            │ api.ts   │
│          │◄──────────────────────────│          │
└──────────┘       Response            └──────────┘
     │                                       │
     │ Updates                               │
     ▼                                       ▼
┌──────────┐                          ┌──────────┐
│  Zustand │                          │ Backend  │
│  Store   │                          │   API    │
└──────────┘                          └──────────┘
```

### 2. WebSocket Real-Time Flow

```
┌──────────────────────────────────────────────────────────────┐
│                        Backend                                │
│  (Generates attack prompts, evaluates defenses)              │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ Socket.io Event
                             │ (attack_prompt_generated)
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   websocket.ts                                │
│  • Receives event                                            │
│  • Extracts payload                                          │
│  • Calls store action                                        │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ addAttackPrompt()
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                   Zustand Store                               │
│  • Updates attackPrompts array                               │
│  • Notifies all subscribers                                  │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             │ State change
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                 React Components                              │
│  • Re-render with new data                                   │
│  • User sees live update                                     │
└──────────────────────────────────────────────────────────────┘
```

**Key Point**: No polling. No manual refresh. Pure event-driven.

---

## Component Hierarchy

```
App.tsx
├── HomePage
│   └── (Static presentation)
│
├── DashboardPage
│   ├── Run Cards (List)
│   │   └── Actions (Open, Edit, Delete, Export)
│   ├── Templates Section
│   └── CreateRunModal
│       └── Component Selection
│
├── AttackTestingPage
│   ├── Backend Configuration
│   ├── Attack Configuration
│   │   ├── Attack Type Selection
│   │   ├── Target URL
│   │   ├── Rate & Iteration Settings
│   │   └── Prompt & Scenario Inputs
│   └── Generated Prompts Table
│       ├── Status Filters
│       └── Real-time Updates (via WebSocket)
│
└── DefenseTestingPage
    ├── System Prompt Input
    ├── Guardrail Configuration
    ├── Defense Score Display
    │   ├── Overall Score
    │   └── Per-Vector Breakdown
    └── Recommendations Section
```

---

## State Management (Zustand)

```
┌──────────────────────────────────────────────────────────────┐
│                     appStore.ts                               │
├──────────────────────────────────────────────────────────────┤
│  State:                                                       │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • runs: Run[]                                          │  │
│  │ • activeRunId: string | null                          │  │
│  │ • attackConfig: AttackConfig | null                   │  │
│  │ • attackPrompts: AttackPrompt[]                       │  │
│  │ • isAttacking: boolean                                │  │
│  │ • defenseConfig: DefenseBackendConfig | null          │  │
│  │ • defenseLogs: DefenseLog[]                           │  │
│  │ • defenseStats: DefenseStats | null                   │  │
│  │ • isEvaluating: boolean                               │  │
│  │ • backendConfig: BackendConfig | null                 │  │
│  │ • connectionStatus: string                            │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
│  Actions:                                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ • setRuns(), addRun(), updateRun(), deleteRun()       │  │
│  │ • setActiveRun()                                      │  │
│  │ • setAttackPrompts(), addAttackPrompt()               │  │
│  │ • setDefenseStats(), addDefenseLog()                  │  │
│  │ • setIsAttacking(), setIsEvaluating()                 │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

**Design Principle**: Store only high-value, global data. Local UI state (dropdowns, toggles, form inputs) stays in component state.

---

## WebSocket Event Flow

### Attack Testing Events

```
Backend                     Frontend
───────                     ────────

Generate prompt
    │
    ├──► attack_prompt_generated ──► Add to store
    │                                  └──► UI updates
    │
    ├──► attack_progress ────────────► Update progress bar
    │
    ├──► attack_prompt_updated ──────► Update prompt status
    │                                   └──► UI updates
    │
    └──► attack_completed ────────────► Mark run complete
                                        └──► UI shows summary
```

### Defense Testing Events

```
Backend                     Frontend
───────                     ────────

Evaluate defense
    │
    ├──► defense_log ─────────────────► Add to logs
    │                                   └──► UI updates
    │
    ├──► defense_stats_updated ───────► Update scores
    │                                   └──► UI updates
    │
    └──► defense_completed ────────────► Show recommendations
                                         └──► UI updates
```

---

## API Endpoint Map

### Run Management
```
GET    /runs              → Fetch all runs
POST   /runs              → Create new run
PATCH  /runs/:id          → Update run
DELETE /runs/:id          → Delete run
```

### Attack Testing
```
POST   /runs/:id/attack       → Start attack generation
POST   /runs/:id/attack/stop  → Stop attack
GET    /runs/:id/prompts      → Fetch generated prompts
```

### Defense Testing
```
POST   /runs/:id/defense          → Start evaluation
GET    /runs/:id/defense-logs     → Fetch logs
GET    /runs/:id/defense-stats    → Fetch statistics
```

### Evaluation
```
GET    /runs/:id/evaluation   → Get comprehensive results
```

---

## Socket.io Room Architecture

```
┌────────────────────────────────────────────────────────────┐
│                   Socket.io Server                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│   Room: run_1234567890_abc12                               │
│   ├── Client A (Browser Tab 1)                             │
│   └── Client B (Browser Tab 2)                             │
│                                                             │
│   Room: run_9876543210_xyz89                               │
│   └── Client C (Different User)                            │
│                                                             │
└────────────────────────────────────────────────────────────┘

When backend generates prompt for run_1234567890_abc12:
  → Emit to room "run_1234567890_abc12"
  → Only Client A and B receive update
  → Client C does not receive update (different room)
```

**Benefits**:
- Isolated updates per run
- Multiple users can work on different runs simultaneously
- No cross-contamination of data

---

## Security Considerations

### Frontend
```
┌──────────────────────────────────────────────────────────┐
│  • API keys stored in environment variables              │
│  • Never expose sensitive data in client code            │
│  • HTTPS in production                                   │
│  • WebSocket secure (wss://) in production               │
└──────────────────────────────────────────────────────────┘
```

### Backend (Recommendations)
```
┌──────────────────────────────────────────────────────────┐
│  • Validate all inputs                                   │
│  • Rate limit API endpoints                              │
│  • Authenticate WebSocket connections                    │
│  • Use CORS whitelist                                    │
│  • Sanitize user-provided prompts                        │
│  • Implement proper session management                   │
└──────────────────────────────────────────────────────────┘
```

---

## Scalability Considerations

### Horizontal Scaling
```
┌──────────┐   ┌──────────┐   ┌──────────┐
│Frontend 1│   │Frontend 2│   │Frontend 3│
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
            ┌───────▼────────┐
            │  Load Balancer │
            └───────┬────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
┌────▼─────┐   ┌───▼──────┐   ┌──▼───────┐
│Backend 1 │   │Backend 2 │   │Backend 3 │
└────┬─────┘   └────┬─────┘   └────┬─────┘
     │              │              │
     └──────────────┼──────────────┘
                    │
            ┌───────▼────────┐
            │ Shared Database│
            └────────────────┘
```

**For Socket.io**: Use Redis adapter for pub/sub across backend instances.

---

## Performance Optimization

### Frontend
- **Code Splitting**: Lazy load pages
- **Memoization**: Use React.memo for expensive components
- **Virtual Scrolling**: For large prompt tables
- **Debouncing**: For search/filter inputs

### Backend
- **Connection Pooling**: Database connections
- **Caching**: Redis for frequently accessed data
- **Queue System**: For long-running attack generation
- **Batching**: Group Socket.io events when possible

---

## Error Handling Flow

```
┌────────────┐
│   Error    │
│  Occurs    │
└─────┬──────┘
      │
      ▼
┌─────────────────┐
│ Try-Catch Block │
└─────┬───────────┘
      │
      ├──► Log to Console
      │
      ├──► Update Store (setError)
      │
      └──► Display User-Friendly Message
           │
           ▼
      ┌─────────────┐
      │  Error UI   │
      │  Component  │
      └─────────────┘
```

---

## Development Workflow

```
1. Developer makes change
   ↓
2. TypeScript compiles
   ↓
3. Hot reload in browser
   ↓
4. Check browser console for errors
   ↓
5. Test with backend (if available)
   ↓
6. Commit changes
```

---

## Deployment Architecture

### Production Setup

```
┌──────────────────────────────────────────────────────────┐
│                      CDN (Cloudflare)                     │
│                    Static Assets (JS, CSS)                │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│               Frontend Hosting (Vercel/Netlify)           │
│                     React Application                     │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ HTTPS + WSS
                         │
┌────────────────────────▼─────────────────────────────────┐
│              Backend Server (Your Infrastructure)         │
│  • REST API                                              │
│  • Socket.io Server                                      │
│  • Attack Generation Engine                              │
│  • Defense Evaluation Engine                             │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                   Database (PostgreSQL)                   │
│  • Runs                                                  │
│  • Attack Prompts                                        │
│  • Defense Logs                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Monitoring & Observability

### Recommended Metrics

**Frontend**:
- WebSocket connection status
- API response times
- Error rates
- User actions (create run, start attack, etc.)

**Backend**:
- Attack generation throughput
- Defense evaluation time
- Socket.io connection count
- Database query performance

### Logging Strategy

```
Frontend: Console logs → Browser DevTools
           ↓
Backend:  Application logs → Log aggregator (e.g., Datadog)
           ↓
Database: Query logs → Performance monitoring
```

---

## Testing Strategy

### Frontend
- **Unit Tests**: Individual components
- **Integration Tests**: API service, WebSocket service
- **E2E Tests**: Complete user flows (Cypress/Playwright)

### Backend
- **Unit Tests**: Individual functions
- **Integration Tests**: API endpoints
- **Socket.io Tests**: Event emission and handling
- **Load Tests**: Concurrent attack generation

---

This architecture is designed to be:
- **Scalable**: Easily add more backend instances
- **Maintainable**: Clear separation of concerns
- **Real-time**: WebSocket for instant updates
- **Type-safe**: Full TypeScript coverage
- **Testable**: Modular design for easy testing
