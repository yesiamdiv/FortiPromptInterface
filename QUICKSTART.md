# FortiPrompt Frontend - Quick Start Guide

## What Was Fixed

All contract mismatches between frontend and backend have been resolved:

✅ **WebSocket events** now use correct names and snake_case fields  
✅ **API endpoints** have correct paths and return types  
✅ **Dead code** removed (api_manual.ts and legacy shims)  
✅ **New sync endpoints** added for reconnect support  
✅ **Type safety** restored - all types match backend payloads

---

## Installation

### Option 1: Extract the Archive
```bash
tar -xzf FortipromptInterface_FIXED.tar.gz
cd FortipromptInterface_fixed
npm install
```

### Option 2: Copy Fixed Files
Copy these files from the fixed version to your existing project:
- `src/services/websocket.ts`
- `src/services/api.ts`
- `src/types/index.ts`
- `src/types/manual.ts`

Delete this file:
- `src/services/api_manual.ts`

---

## Environment Setup

Ensure your `.env` or environment variables include:

```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
REACT_APP_WS_URL=http://localhost:8000
```

The WebSocket connection will automatically use the standard Socket.IO path `/socket.io`.

---

## Key Changes to Be Aware Of

### 1. WebSocket Event Names Changed
- `join_run_channel` → `join_run_room`
- `defense_response_generated` → `defence_response` (British spelling)
- Event payloads now use **snake_case**: `run_id`, `turn_id`, `session_id`

### 2. Event Data Structure Changed
```typescript
// OLD
socket.on('attack_generated', (data) => {
  addAttack(data.prompt);  // ❌ data.prompt doesn't exist
});

// NEW
socket.on('attack_generated', (data) => {
  addAttack({
    promptId: data.turn_id,
    content: data.attack.full_text,  // ✅ nested structure
    timestamp: data.attack.timestamp
  });
});
```

### 3. API Changes
- `stopRun()` now returns `StopRunResponse` instead of `void`
- New endpoints available:
  - `fetchRunAttacks(runId)`
  - `fetchRunDefences(runId)`
  - `fetchRunEvaluations(runId)`
  - `fetchRunStats(runId)`
  - `deleteManualSession(runId, sessionId)` (corrected path)

### 4. Removed (Breaking)
These functions no longer exist:
- `fetchManualConfig()`
- `updateManualConfig()`
- `saveSession()`
- `fetchManualStats()`
- `api_manual.ts` (entire file)

---

## Integration Steps

### Step 1: Update Your Components

If you have components that use WebSocket events, update them:

```typescript
// Example: AttackTestingPage.tsx
useEffect(() => {
  if (!activeRunId) return;
  
  // NEW: Sync existing attacks on mount (reconnect support)
  fetchRunAttacks(activeRunId).then(attacks => {
    attacks.forEach(a => {
      addAttackPrompt({
        promptId: a.turn_id,
        content: a.prompt,
        status: 'generated',
        timestamp: a.timestamp,
        metadata: a.metadata
      });
    });
  });
}, [activeRunId]);
```

### Step 2: Verify WebSocket Connection

The connection code is already fixed, but verify your App.tsx calls it correctly:

```typescript
// App.tsx or similar initialization
useEffect(() => {
  const wsUrl = process.env.REACT_APP_WS_URL || 'http://localhost:8000';
  websocketService.connect(wsUrl);
  
  return () => websocketService.disconnect();
}, []);
```

### Step 3: Update Room Subscription Logic

For automatic runs:
```typescript
// When viewing a run page
useEffect(() => {
  if (runId) {
    websocketService.joinRun(runId);  // ✅ already fixed internally
    return () => websocketService.leaveRun(runId);
  }
}, [runId]);
```

For manual sessions:
```typescript
// After creating a session
const session = await createManualSession(runId, request);
websocketService.joinSessionRoom(session.session_id);  // ✅ critical!
setActiveSession(session);
```

---

## Testing Checklist

### Backend Must Be Running
Ensure the backend is running with the v2 contract fixes at:
- API: `http://localhost:8000/api/v1`
- WebSocket: `http://localhost:8000/socket.io`

### Test Sequence

1. **Connection Test**
   ```bash
   curl http://localhost:8000/health
   # Should return: {"status":"ok","service":"fortiprompt"}
   ```

2. **Create and Start Automatic Run**
   - Create run via UI
   - Start run
   - Verify attacks appear in AttackTestingPage
   - Verify defences appear in DefenseTestingPage
   - Verify evaluations appear in EvaluationPage

3. **Reconnect Test**
   - Refresh the page while a run is active
   - Verify historical data loads via sync endpoints
   - Verify live updates still work

4. **Manual Session Test**
   - Create manual run
   - Create session
   - Submit a turn
   - Verify chat input locks
   - Verify attack → defence → evaluation bubbles appear
   - Verify `run_idle` event re-enables input

5. **Statistics Test**
   - Run a few iterations
   - Verify stat chips update in real-time
   - Refresh page
   - Verify stats persist (via `fetchRunStats`)

---

## Troubleshooting

### WebSocket not connecting
Check browser console for:
```
[WS] connect_error
```

**Solution:** Verify backend is running and CORS allows your origin.

### Events not arriving
Check that you called:
```typescript
websocketService.joinRun(runId);  // for automatic runs
// OR
websocketService.joinSessionRoom(sessionId);  // for manual sessions
```

### Type errors
If you see TypeScript errors about missing fields, you may need to update your component code to match the new event shapes. See the type definitions in `src/types/index.ts` and `src/types/manual.ts`.

### 404 errors on API calls
Check the endpoint paths in browser DevTools Network tab. All paths should start with `/api/v1/` (not `/manual/`).

---

## What's Next

### Recommended Enhancements (Optional)

1. **Add sync calls on page mount** (Phase 4-F6)
   - Update `AttackTestingPage.tsx` to call `fetchRunAttacks()` on mount
   - Update `DefenseTestingPage.tsx` to call `fetchRunDefences()` on mount
   - Update `EvaluationPage.tsx` to call `fetchRunEvaluations()` on mount

2. **Session list on sidebar** (Phase 4)
   - Call `fetchManualSessions(runId)` to populate the session list
   - This endpoint is now available (was 404 before)

3. **Better error handling**
   - Wrap all API calls in try-catch
   - Show user-friendly error messages

4. **Loading states**
   - Show spinners while fetching historical data
   - Disable UI while waiting for WebSocket events

---

## Documentation

For detailed technical information:
- `CHANGES_IMPLEMENTED.md` - Full change log
- `FRONTEND_REFACTORING_PLAN.md` - Original implementation plan
- Backend API Contract v2 - Backend team's documentation

---

## Support

If you encounter issues:

1. Run the verification script:
   ```bash
   ./verify_changes.sh
   ```

2. Check the browser console for errors

3. Verify backend is running the v2 contract

4. Review `CHANGES_IMPLEMENTED.md` for breaking changes

---

## Success Criteria

You'll know everything is working when:
- ✅ WebSocket connects without errors
- ✅ Automatic runs show attacks/defences/evaluations in real-time
- ✅ Manual chat sessions work end-to-end
- ✅ Page refresh preserves run data (via sync endpoints)
- ✅ No console errors about undefined fields
- ✅ Statistics update correctly

Good luck! 🚀
