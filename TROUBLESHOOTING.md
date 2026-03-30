# Troubleshooting Guide

This guide covers common issues you might encounter and how to solve them.

---

## 🔍 Quick Diagnostic Checklist

Before diving into specific issues, run through this checklist:

- [ ] All files copied to correct locations (see FILE_PLACEMENT_GUIDE.md)
- [ ] `npm install` completed successfully
- [ ] `.env` file created with backend URLs
- [ ] `socket.io-client` installed
- [ ] Backend server is running
- [ ] No TypeScript errors in console

---

## 🚨 Common Issues

### Issue 1: "Module not found: socket.io-client"

**Error Message:**
```
Module not found: Can't resolve 'socket.io-client'
```

**Cause:** The socket.io-client package is not installed.

**Solution:**
```bash
npm install socket.io-client@^4.7.2
npm install --save-dev @types/socket.io-client@^3.0.0
```

**Verify Installation:**
```bash
npm list socket.io-client
# Should show: socket.io-client@4.7.2
```

---

### Issue 2: WebSocket Connection Fails

**Error Message (in browser console):**
```
[WebSocket] Connection error: Error: ...
```

**Symptoms:**
- No real-time updates
- Console shows connection errors
- Attacks don't show live progress

**Diagnosis:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for WebSocket error messages

**Possible Causes & Solutions:**

#### A. Backend Not Running
```bash
# Check if backend is accessible
curl http://localhost:3001/health
```
**Solution:** Start your backend server

#### B. Wrong URL in .env
Check your `.env` file:
```env
REACT_APP_SOCKET_URL=http://localhost:3001
```
**Solution:** Update URL to match your backend

#### C. CORS Issues
**Error:** `Access to XMLHttpRequest has been blocked by CORS policy`

**Backend Solution:**
```javascript
// In your backend server
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000", // Your frontend URL
    methods: ["GET", "POST"]
  }
});
```

#### D. Port Already in Use
```bash
# Check if port is in use
lsof -i :3001  # Backend port
lsof -i :3000  # Frontend port
```

---

### Issue 3: Cannot Find Module './pages/HomePage'

**Error Message:**
```
Module not found: Can't resolve './pages/HomePage'
```

**Cause:** HomePage.tsx not in correct location

**Solution:**
```bash
# Ensure file is here:
ls src/pages/HomePage.tsx

# If missing, copy it:
cp HomePage.tsx src/pages/
```

**Check All Required Files:**
```bash
# Run this to verify all files are in place
ls src/pages/HomePage.tsx
ls src/pages/DashboardPage.tsx
ls src/services/websocket.ts
ls src/components/run/CreateRunModal.tsx
ls src/App.tsx
```

---

### Issue 4: TypeScript Errors

**Error Message:**
```
TS2307: Cannot find module 'socket.io-client' or its corresponding type declarations.
```

**Solution:**
```bash
npm install --save-dev @types/socket.io-client
```

**Other Common TypeScript Errors:**

#### Missing Types
```bash
# Install missing type definitions
npm install --save-dev @types/react @types/react-dom @types/node
```

#### Strict Mode Issues
If you see errors about undefined values:
```typescript
// In tsconfig.json, you can temporarily disable:
{
  "compilerOptions": {
    "strict": false  // Not recommended for production
  }
}
```

---

### Issue 5: API Requests Failing

**Error Message:**
```
[404] Not found
[500] Internal Server Error
```

**Diagnosis:**
1. Open browser DevTools → Network tab
2. Look for failed requests (red)
3. Click on failed request to see details

**Solutions:**

#### A. Wrong API URL
Check `.env`:
```env
REACT_APP_API_URL=http://localhost:3001/api
```

**Test Backend:**
```bash
curl http://localhost:3001/api/health
```

#### B. Backend Endpoint Not Implemented
Check `BACKEND_CONTRACT.md` for required endpoints.

**Verify endpoint exists:**
```bash
curl http://localhost:3001/api/runs
```

#### C. CORS Issues
**Backend Solution:**
```javascript
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
```

---

### Issue 6: Dashboard Doesn't Load Runs

**Symptoms:**
- Dashboard shows empty state
- No runs displayed
- No errors in console

**Diagnosis:**
```bash
# Check if backend returns runs
curl http://localhost:3001/api/runs

# Should return JSON array
```

**Solutions:**

#### A. Backend Returns Empty Array
- This is normal if no runs created yet
- Create a run via UI to test

#### B. Backend Returns Error
- Check backend logs
- Verify database connection
- Check API endpoint implementation

#### C. Frontend Not Calling API
Add debugging:
```typescript
// In DashboardPage.tsx
const loadRuns = async () => {
  console.log('[Dashboard] Fetching runs...');
  const runs = await fetchRuns();
  console.log('[Dashboard] Received runs:', runs);
  // ...
};
```

---

### Issue 7: Real-Time Updates Not Working

**Symptoms:**
- Attack starts but no prompts appear
- Table doesn't update automatically
- Must refresh page to see updates

**Diagnosis:**
1. Check WebSocket connection:
```javascript
// In browser console
websocketService.isConnected()
// Should return: true
```

2. Check if joined room:
```javascript
// Backend should log when client joins room
```

**Solutions:**

#### A. Not Joined to Room
```javascript
// In App.tsx, verify this runs:
websocketService.joinRun(run.id);
```

#### B. Backend Not Emitting Events
Check backend logs for event emissions.

**Backend should emit:**
```javascript
io.to(`run_${runId}`).emit('attack_prompt_generated', {
  runId,
  prompt: { ... }
});
```

#### C. Event Handler Not Working
Add debugging:
```typescript
// In websocket.ts
this.socket.on('attack_prompt_generated', (data) => {
  console.log('[WebSocket] Received:', data);
  // ...
});
```

---

### Issue 8: Environment Variables Not Working

**Symptoms:**
- `process.env.REACT_APP_API_URL` is `undefined`
- Backend URLs not loading

**Cause:** React requires `REACT_APP_` prefix and restart after changes.

**Solution:**
1. Verify `.env` file exists in project root
2. Check variable names start with `REACT_APP_`
3. **Restart development server** (CTRL+C, then `npm start`)

**Valid .env format:**
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

**Invalid .env format:**
```env
# Missing REACT_APP_ prefix
API_URL=http://localhost:3001/api  ❌

# Extra spaces
REACT_APP_API_URL = http://localhost:3001/api  ❌

# Quotes (not needed)
REACT_APP_API_URL="http://localhost:3001/api"  ⚠️ Works but unnecessary
```

---

### Issue 9: Build Fails in Production

**Error Message:**
```
Failed to compile
```

**Common Causes:**

#### A. TypeScript Errors
```bash
# Check for errors
npm run build
```

Fix all TypeScript errors before building.

#### B. Missing Environment Variables
For production build:
```bash
# Create .env.production
REACT_APP_API_URL=https://api.yourdomain.com
REACT_APP_SOCKET_URL=https://api.yourdomain.com
```

#### C. Import Errors
Check all imports are correct:
```typescript
// ✓ Correct
import HomePage from './pages/HomePage';

// ✗ Wrong (missing extension, wrong path)
import HomePage from './HomePage.tsx';
```

---

### Issue 10: CreateRunModal Doesn't Appear

**Symptoms:**
- Click "New Run" button
- Nothing happens
- No modal shows

**Diagnosis:**
```javascript
// In browser console, check state
console.log(showCreateModal);
```

**Solutions:**

#### A. Modal Component Not Imported
```typescript
// In DashboardPage.tsx
import CreateRunModal from '../components/run/CreateRunModal';
```

#### B. State Not Updating
Add debugging:
```typescript
const handleCreateClick = () => {
  console.log('[Dashboard] Opening modal...');
  setShowCreateModal(true);
};
```

#### C. Z-Index Issues
Modal might be behind other elements:
```css
/* In CreateRunModal styles */
.modal-overlay {
  z-index: 1000;  /* Increase if needed */
}
```

---

### Issue 11: Attacks Don't Start

**Symptoms:**
- Click "Start Attack"
- Nothing happens
- No API calls made

**Diagnosis:**
1. Check browser console for errors
2. Open Network tab to see if API call made
3. Check backend logs

**Solutions:**

#### A. Backend Endpoint Missing
Implement `POST /runs/:runId/attack` endpoint.

#### B. Missing Required Fields
Check attack config is complete:
```typescript
// All these must be filled:
- attackType
- targetUrl
- initialAttackPrompt
```

#### C. API Error Not Displayed
Add error handling:
```typescript
try {
  await startAttack(runId, config);
} catch (err) {
  console.error('[Attack] Error:', err);
  setAttackError(err.message);
}
```

---

### Issue 12: Cannot Delete Run

**Error Message:**
```
Failed to delete run
```

**Solutions:**

#### A. Backend Endpoint Not Implemented
Implement `DELETE /runs/:runId` endpoint.

#### B. Foreign Key Constraints
If run has related data:
```sql
-- Backend should cascade delete:
DELETE FROM attack_prompts WHERE run_id = ?;
DELETE FROM defense_logs WHERE run_id = ?;
DELETE FROM runs WHERE id = ?;
```

#### C. Frontend State Not Updating
Check store action is called:
```typescript
deleteRunFromStore(runId);
```

---

## 🔧 Debugging Tools

### Browser DevTools

**Console:**
```javascript
// Check WebSocket connection
websocketService.isConnected()

// Check store state
useAppStore.getState()

// Check runs
useAppStore.getState().runs

// Check connection status
useAppStore.getState().connectionStatus
```

**Network Tab:**
- View all API requests
- Check request/response
- See status codes
- View request headers

**Application Tab:**
- Check localStorage
- View session storage
- Inspect cookies

### Backend Testing

**Test Health Endpoint:**
```bash
curl http://localhost:3001/api/health
```

**Test Runs Endpoint:**
```bash
curl http://localhost:3001/api/runs
```

**Test with Authentication:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/runs
```

### WebSocket Testing

**Test Socket.io Connection:**
```javascript
// In browser console
const socket = io('http://localhost:3001');
socket.on('connect', () => console.log('Connected!'));
socket.on('disconnect', () => console.log('Disconnected!'));
```

---

## 📊 Common Error Codes

| Code | Meaning | Common Cause |
|------|---------|-------------|
| 400 | Bad Request | Invalid data sent to API |
| 401 | Unauthorized | Missing/invalid API key |
| 404 | Not Found | Endpoint doesn't exist or run not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Backend error |
| 502 | Bad Gateway | Backend not responding |
| 503 | Service Unavailable | Backend overloaded |

---

## 🔍 Logging Best Practices

### Add Console Logs

**In Components:**
```typescript
useEffect(() => {
  console.log('[DashboardPage] Mounted');
  loadRuns();
  
  return () => {
    console.log('[DashboardPage] Unmounting');
  };
}, []);
```

**In Services:**
```typescript
export const fetchRuns = async () => {
  console.log('[API] Fetching runs...');
  const response = await fetch(`${BASE_URL}/runs`);
  console.log('[API] Response:', response.status);
  const data = await response.json();
  console.log('[API] Received runs:', data.length);
  return data;
};
```

**In WebSocket:**
```typescript
socket.on('attack_prompt_generated', (data) => {
  console.log('[WebSocket] New prompt:', data);
  // ...
});
```

---

## 🆘 Still Stuck?

### Checklist Before Asking for Help

1. [ ] Checked all common issues above
2. [ ] Verified file structure matches FILE_PLACEMENT_GUIDE.md
3. [ ] Backend is running and accessible
4. [ ] No TypeScript errors
5. [ ] Environment variables set correctly
6. [ ] Browser console checked for errors
7. [ ] Network tab checked for failed requests

### Information to Provide

When reporting an issue, include:

1. **Error Message**: Full error from console
2. **Browser**: Chrome, Firefox, Safari, etc.
3. **Node Version**: `node --version`
4. **npm Version**: `npm --version`
5. **Steps to Reproduce**: What you did before error
6. **Network Requests**: Screenshot of Network tab
7. **Console Output**: Screenshot of Console tab
8. **File Structure**: Output of `ls -R src/`

### Debug Mode

Enable verbose logging:

```typescript
// In .env
REACT_APP_DEBUG=true

// In code, check:
if (process.env.REACT_APP_DEBUG === 'true') {
  console.log('Debug info here');
}
```

---

## 📚 Additional Resources

- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Socket.io Client Docs](https://socket.io/docs/v4/client-api/)
- [Zustand DevTools](https://github.com/pmndrs/zustand#devtools)
- [Chrome DevTools Guide](https://developer.chrome.com/docs/devtools/)

---

## 🎯 Quick Fixes

### Reset Everything

If nothing works, try fresh start:

```bash
# Stop dev server (CTRL+C)

# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart
npm start
```

### Clear Browser Cache

```
Chrome: CTRL+SHIFT+DELETE → Clear cached images and files
Firefox: CTRL+SHIFT+DELETE → Cache
Safari: CMD+OPTION+E
```

### Check for Port Conflicts

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

---

**Remember:** Most issues are simple configuration problems. Work through the checklist systematically!
