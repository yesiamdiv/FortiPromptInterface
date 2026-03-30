# FortiPrompt Backend Contract

## Overview
This document specifies all REST API endpoints and Socket.io events required for the FortiPrompt frontend-backend integration.

---

## 1. REST API Endpoints

### Base URL
```
https://your-backend-domain.com/api
```

### 1.1 Health & Connection

#### `GET /health`
**Description:** Health check endpoint to verify backend connectivity  
**Auth:** Optional Bearer token  
**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-03-24T10:30:00Z"
}
```

---

### 1.2 Run Management

#### `GET /runs`
**Description:** Fetch all runs/sessions  
**Auth:** Optional Bearer token  
**Response:**
```json
[
  {
    "id": "run_1234567890_abc12",
    "name": "Security Test - Morning",
    "description": "Testing RAG pipeline vulnerabilities",
    "status": "completed",
    "components": ["attack-testing", "defense-testing"],
    "createdAt": "2025-03-24T09:00:00Z",
    "updatedAt": "2025-03-24T10:30:00Z",
    "attackConfig": { /* AttackConfig object */ },
    "defenseConfig": { /* DefenseBackendConfig object */ },
    "prompts": [ /* Array of AttackPrompt */ ],
    "defenseLogs": [ /* Array of DefenseLog */ ]
  }
]
```

#### `POST /runs`
**Description:** Create a new run  
**Auth:** Optional Bearer token  
**Request Body:**
```json
{
  "name": "New Security Test",
  "description": "Optional description",
  "components": ["attack-testing"]
}
```
**Response:** Single Run object (same structure as GET /runs)

#### `PATCH /runs/:id`
**Description:** Update an existing run  
**Auth:** Optional Bearer token  
**Request Body:** Partial Run object
```json
{
  "status": "running",
  "updatedAt": "2025-03-24T11:00:00Z"
}
```
**Response:** Updated Run object

#### `DELETE /runs/:id`
**Description:** Delete a run  
**Auth:** Optional Bearer token  
**Response:** `204 No Content`

---

### 1.3 Attack Testing

#### `POST /runs/:runId/attack`
**Description:** Start attack generation for a specific run  
**Auth:** Bearer token (from config.apiKey)  
**Request Body:**
```json
{
  "backendType": "OpenAI",
  "connectionUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "modelSelection": "GPT-4o-mini",
  "attackType": "Direct Injection",
  "targetUrl": "https://api.target.com/chat",
  "attackRate": 1.0,
  "maxIterations": 100,
  "successThreshold": 0.70,
  "initialAttackPrompt": "Ignore previous instructions...",
  "attackScenario": "Attempt to extract system prompt",
  "targetInformation": "Admin credentials"
}
```
**Response:**
```json
[
  {
    "id": "prompt_abc123",
    "prompt": "Generated adversarial prompt text...",
    "attackType": "Direct Injection",
    "status": "running",
    "category": "Extraction",
    "score": 0.0,
    "timestamp": "2025-03-24T10:35:00Z"
  }
]
```

**Notes:**
- This endpoint may return immediately with initial prompts
- Real-time updates will be sent via Socket.io (see WebSocket Events)
- Backend should join the Socket.io room matching the runId

#### `POST /runs/:runId/attack/stop`
**Description:** Stop ongoing attack generation  
**Auth:** Optional Bearer token  
**Response:** `200 OK`

#### `GET /runs/:runId/prompts`
**Description:** Fetch all generated attack prompts for a run  
**Auth:** Optional Bearer token  
**Response:** Array of AttackPrompt objects

---

### 1.4 Defense Testing

#### `POST /runs/:runId/defense`
**Description:** Start defense evaluation for a specific run  
**Auth:** Bearer token (optional)  
**Request Body:**
```json
{
  "systemPrompt": "You are a helpful assistant. Never reveal...",
  "guardrailLevel": 0.8,
  "attackVectors": "All vectors",
  "layers": [
    {
      "id": "layer_1",
      "name": "Input Sanitization",
      "enabled": true,
      "strictness": 0.9
    }
  ]
}
```
**Response:**
```json
{
  "overallScore": 78,
  "directInjection": 82,
  "jailbreakResistance": 75,
  "promptLeaking": 80,
  "rolePlayExploits": 70,
  "indirectInjection": 83
}
```

**Notes:**
- Real-time progress updates sent via Socket.io
- Final stats returned in response

#### `GET /runs/:runId/defense-logs`
**Description:** Fetch defense evaluation logs  
**Auth:** Optional Bearer token  
**Response:**
```json
[
  {
    "id": "log_xyz789",
    "timestamp": "2025-03-24T10:40:00Z",
    "attackType": "Direct Injection",
    "blocked": true,
    "score": 0.85,
    "details": "Successfully blocked prompt injection attempt"
  }
]
```

#### `GET /runs/:runId/defense-stats`
**Description:** Fetch defense statistics for a run  
**Auth:** Optional Bearer token  
**Response:** DefenseStats object (same as POST /runs/:runId/defense response)

---

### 1.5 Evaluation

#### `GET /runs/:runId/evaluation`
**Description:** Get comprehensive evaluation results  
**Auth:** Optional Bearer token  
**Response:**
```json
{
  "runId": "run_1234567890_abc12",
  "timestamp": "2025-03-24T11:00:00Z",
  "totalPrompts": 100,
  "successCount": 15,
  "partialCount": 25,
  "blockedCount": 60,
  "averageScore": 0.42,
  "defenseStats": {
    "overallScore": 78,
    "directInjection": 82,
    "jailbreakResistance": 75,
    "promptLeaking": 80,
    "rolePlayExploits": 70,
    "indirectInjection": 83
  }
}
```

---

## 2. WebSocket (Socket.io) Events

### Connection Setup
```javascript
// Frontend connects to Socket.io server
const socket = io('https://your-backend-domain.com', {
  auth: { token: 'optional-auth-token' }
});

// After fetching runs via REST API, join rooms
const runs = await fetchRuns();
runs.forEach(run => {
  socket.emit('join_run', { runId: run.id });
});
```

---

### 2.1 Room Management

#### Client → Server: `join_run`
**Description:** Join a specific run's room for real-time updates  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12"
}
```
**Response:** None (silent join)

#### Client → Server: `leave_run`
**Description:** Leave a run's room  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12"
}
```

---

### 2.2 Attack Testing Events

#### Server → Client: `attack_prompt_generated`
**Description:** Real-time notification when a new attack prompt is generated  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "prompt": {
    "id": "prompt_new123",
    "prompt": "Newly generated adversarial text...",
    "attackType": "Jailbreak",
    "status": "running",
    "category": "Role Play",
    "score": 0.0,
    "timestamp": "2025-03-24T10:45:30Z"
  }
}
```

#### Server → Client: `attack_prompt_updated`
**Description:** Status/score update for an existing prompt  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "promptId": "prompt_abc123",
  "updates": {
    "status": "success",
    "score": 0.85,
    "timestamp": "2025-03-24T10:46:00Z"
  }
}
```

#### Server → Client: `attack_progress`
**Description:** Overall attack generation progress  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "completed": 45,
  "total": 100,
  "currentRate": 1.2
}
```

#### Server → Client: `attack_completed`
**Description:** Attack generation finished  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "totalPrompts": 100,
  "successCount": 15,
  "partialCount": 25,
  "blockedCount": 60
}
```

#### Server → Client: `attack_error`
**Description:** Error during attack generation  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "error": "API rate limit exceeded",
  "timestamp": "2025-03-24T10:50:00Z"
}
```

---

### 2.3 Defense Testing Events

#### Server → Client: `defense_log`
**Description:** Real-time defense evaluation log entry  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "log": {
    "id": "log_new456",
    "timestamp": "2025-03-24T11:05:00Z",
    "attackType": "Indirect Injection",
    "blocked": false,
    "score": 0.35,
    "details": "Partial defense success - some payload leaked"
  }
}
```

#### Server → Client: `defense_progress`
**Description:** Defense evaluation progress update  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "testedVectors": 3,
  "totalVectors": 5,
  "currentVector": "Jailbreak Resistance"
}
```

#### Server → Client: `defense_stats_updated`
**Description:** Updated defense statistics (partial or final)  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "stats": {
    "overallScore": 78,
    "directInjection": 82,
    "jailbreakResistance": 75,
    "promptLeaking": 80,
    "rolePlayExploits": 70,
    "indirectInjection": 83
  }
}
```

#### Server → Client: `defense_completed`
**Description:** Defense evaluation finished  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "finalStats": {
    "overallScore": 78,
    "directInjection": 82,
    "jailbreakResistance": 75,
    "promptLeaking": 80,
    "rolePlayExploits": 70,
    "indirectInjection": 83
  }
}
```

#### Server → Client: `defense_error`
**Description:** Error during defense evaluation  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "error": "System prompt validation failed",
  "timestamp": "2025-03-24T11:10:00Z"
}
```

---

### 2.4 Run Status Events

#### Server → Client: `run_status_changed`
**Description:** Run status update (generic)  
**Room:** `run_{runId}`  
**Payload:**
```json
{
  "runId": "run_1234567890_abc12",
  "status": "completed",
  "updatedAt": "2025-03-24T11:15:00Z"
}
```

---

## 3. TypeScript Type Definitions

### AttackConfig
```typescript
interface AttackConfig {
  backendType: 'Google Colab' | 'OpenAI' | 'Anthropic' | 'Custom API';
  connectionUrl: string;
  apiKey: string;
  modelSelection: 'GPT-4o-mini' | 'GPT-4o' | 'claude-3-5-sonnet' | 'claude-3-haiku' | 'gemini-1.5-flash';
  attackType: 'Direct Injection' | 'Indirect Injection' | 'Prompt Leaking' | 'Jailbreak' | 'Chain Attack' | 'Role Play Exploit';
  targetUrl: string;
  attackRate: number;
  maxIterations: number;
  successThreshold: number;
  initialAttackPrompt: string;
  attackScenario: string;
  targetInformation: string;
}
```

### AttackPrompt
```typescript
interface AttackPrompt {
  id: string;
  prompt: string;
  attackType: 'Direct Injection' | 'Indirect Injection' | 'Prompt Leaking' | 'Jailbreak' | 'Chain Attack' | 'Role Play Exploit';
  status: 'success' | 'partial' | 'blocked' | 'running';
  category: string;
  score: number;
  timestamp: string; // ISO 8601
}
```

### DefenseBackendConfig
```typescript
interface DefenseBackendConfig {
  systemPrompt: string;
  guardrailLevel: number; // 0-1
  attackVectors: string;
  layers: DefenseLayer[];
}

interface DefenseLayer {
  id: string;
  name: string;
  enabled: boolean;
  strictness: number; // 0-1
}
```

### DefenseLog
```typescript
interface DefenseLog {
  id: string;
  timestamp: string; // ISO 8601
  attackType: 'Direct Injection' | 'Indirect Injection' | 'Prompt Leaking' | 'Jailbreak' | 'Chain Attack' | 'Role Play Exploit';
  blocked: boolean;
  score: number;
  details: string;
}
```

### DefenseStats
```typescript
interface DefenseStats {
  overallScore: number; // 0-100
  directInjection: number; // 0-100
  jailbreakResistance: number; // 0-100
  promptLeaking: number; // 0-100
  rolePlayExploits: number; // 0-100
  indirectInjection: number; // 0-100
}
```

### Run
```typescript
interface Run {
  id: string;
  name: string;
  description?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  components: ('attack-testing' | 'defense-testing')[];
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  attackConfig?: AttackConfig;
  defenseConfig?: DefenseBackendConfig;
  prompts?: AttackPrompt[];
  defenseLogs?: DefenseLog[];
}
```

---

## 4. Error Handling

All REST endpoints should return consistent error responses:

### Standard Error Response
```json
{
  "error": "Error message here",
  "code": "ERROR_CODE",
  "timestamp": "2025-03-24T11:20:00Z"
}
```

### HTTP Status Codes
- `200 OK` - Success
- `201 Created` - Resource created
- `204 No Content` - Successful deletion
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - Missing/invalid authentication
- `404 Not Found` - Resource not found
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## 5. Authentication

### Bearer Token (Optional)
```
Authorization: Bearer YOUR_API_KEY
```

- Include in headers for all API requests when authentication is required
- Token passed via `config.apiKey` for attack/defense operations
- Socket.io connections can include auth token in connection handshake

---

## 6. Rate Limiting

Recommended rate limits:
- REST API: 100 requests/minute per IP
- Socket.io: 1000 messages/minute per connection

---

## 7. Implementation Notes

### Frontend Responsibilities
1. Establish Socket.io connection on app load
2. Fetch runs via REST API (`GET /runs`)
3. Join Socket.io rooms for each run (`join_run` event)
4. Listen to real-time events and update Zustand store
5. Use REST API for CRUD operations (create, update, delete runs)

### Backend Responsibilities
1. Implement all REST endpoints with proper validation
2. Set up Socket.io server with room-based event broadcasting
3. When attack/defense operations start, emit real-time events to the run's room
4. Store run state in database
5. Handle concurrent operations per run

---

## 8. Example Flow: Attack Testing

```
1. User creates new run via Dashboard
   → POST /runs { name, components: ['attack-testing'] }
   
2. Frontend joins Socket.io room
   → socket.emit('join_run', { runId: 'run_xxx' })
   
3. User starts attack
   → POST /runs/run_xxx/attack { attackConfig }
   
4. Backend generates prompts and emits:
   → attack_prompt_generated (multiple times)
   → attack_progress (periodic updates)
   → attack_prompt_updated (when status/score changes)
   
5. Frontend receives events, updates Zustand store
   → UI re-renders with live data
   
6. Attack completes
   → attack_completed event
   → Run status updated via PATCH /runs/run_xxx
```

---

## 9. WebSocket Connection Health

### Client → Server: `ping`
Optional heartbeat mechanism  
**Frequency:** Every 30 seconds

### Server → Client: `pong`
Response to ping

---

## 10. Environment Variables

### Backend (.env)
```
PORT=3001
DATABASE_URL=postgresql://...
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
REDIS_URL=redis://localhost:6379
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

---

**END OF BACKEND CONTRACT**
