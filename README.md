# FortiPrompt Frontend

**Automated Red-Team Security Platform for AI Systems**

FortiPrompt is a comprehensive security testing platform for LLM-powered applications. Test your AI systems against prompt injection, jailbreak attempts, and adversarial attacks before they reach production.

---

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm/yarn
- Backend API server running (see Backend Contract)

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Configure your backend URLs in .env
# REACT_APP_API_URL=http://localhost:3001/api
# REACT_APP_SOCKET_URL=http://localhost:3001

# Start development server
npm start
```

The application will open at `http://localhost:3000`

---

## 📋 Features

### 1. **Dashboard**
- Create and manage isolated testing "runs"
- View run status in real-time
- Export run data as JSON
- Template-based run creation

### 2. **Attack Testing**
- Generate adversarial prompts automatically
- Multiple attack vectors:
  - Direct Injection
  - Indirect Injection
  - Prompt Leaking
  - Jailbreak
  - Chain Attack
  - Role Play Exploit
- Real-time attack generation with WebSocket updates
- Configurable attack rate and iteration limits
- Detailed scoring and categorization

### 3. **Defense Testing**
- Evaluate system prompt robustness
- Test guardrail effectiveness
- Stress-test input sanitization
- Multi-layered defense scoring
- Actionable hardening recommendations

---

## 🏗️ Architecture

### State Management (Zustand)

All global application state is managed via Zustand store (`store/appStore.ts`):

- **Runs**: List of all testing runs
- **Attack State**: Active attack configuration, generated prompts, attack status
- **Defense State**: Defense configuration, logs, statistics
- **Backend Config**: Connection settings
- **Storage Config**: Data persistence settings

**DO NOT** store trivial UI state (dropdowns, toggles) in the store. Only high-value data belongs here.

### API Layer (`services/api.ts`)

All HTTP requests to the backend are centralized in the API service:

```typescript
import { fetchRuns, createRun, startAttack } from './services/api';
```

### WebSocket Layer (`services/websocket.ts`)

Real-time updates are handled via Socket.io:

```typescript
import { websocketService } from './services/websocket';

// Connect on app mount
websocketService.connect('http://localhost:3001');

// Join run rooms
websocketService.joinRun(runId);
```

**WebSocket Events:**
- `attack_prompt_generated` - New attack prompt created
- `attack_prompt_updated` - Prompt status/score updated
- `attack_completed` - Attack generation finished
- `defense_log` - New defense evaluation log
- `defense_stats_updated` - Defense scores updated
- `defense_completed` - Defense evaluation finished

---

## 📂 Project Structure

```
src/
├── components/
│   └── run/
│       ├── CreateRunModal.tsx      # Modal for creating new runs
│       ├── RunCard.tsx             # Run display card (unused in current version)
│       ├── TemplateCard.tsx        # Template selection card
│       └── BackendConfigForm.tsx   # Backend configuration form
├── pages/
│   ├── HomePage.tsx                # Landing page with CTA
│   ├── DashboardPage.tsx           # Main dashboard for run management
│   ├── AttackTestingPage.tsx      # Attack testing interface
│   └── DefenseTestingPage.tsx     # Defense testing interface
├── services/
│   ├── api.ts                      # HTTP API client
│   └── websocket.ts                # Socket.io service
├── store/
│   └── appStore.ts                 # Zustand global store
├── types/
│   └── index.ts                    # TypeScript type definitions
├── utils/
│   └── run.ts                      # Run utility functions
├── App.tsx                         # Root component with routing
└── index.tsx                       # Application entry point
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_SOCKET_URL=http://localhost:3001
```

### Backend Connection

The frontend expects a backend server with the following:

1. **REST API Endpoints** (see `BACKEND_CONTRACT.md`)
   - `GET /health` - Health check
   - `GET /runs` - Fetch all runs
   - `POST /runs` - Create new run
   - `POST /runs/:runId/attack` - Start attack testing
   - `POST /runs/:runId/defense` - Start defense evaluation
   - And more...

2. **Socket.io Server** with room-based event broadcasting
   - Rooms named `run_{runId}`
   - Real-time events for attack/defense updates

See `BACKEND_CONTRACT.md` for complete API specification.

---

## 🎯 Usage Flow

### Creating and Running an Attack Test

1. **Navigate to Dashboard**
   - Click "Go to Dashboard" from home page

2. **Create New Run**
   - Click "New Run" button
   - Fill in run name and description
   - Select "Attack Testing" component
   - Click "Create Run"

3. **Configure Attack**
   - Open the run from dashboard
   - Configure backend connection (OpenAI, Anthropic, etc.)
   - Set attack parameters:
     - Attack type (Direct Injection, Jailbreak, etc.)
     - Target URL
     - Attack rate and max iterations
   - Fill in initial attack prompt and scenario

4. **Start Attack**
   - Click "Start Attack"
   - Watch real-time prompt generation
   - View success/partial/blocked status
   - Monitor overall statistics

5. **Export Results**
   - Return to dashboard
   - Click "Export" icon on run card
   - Download JSON report

### Creating and Running a Defense Test

1. **Create Run** with "Defense Testing" component selected

2. **Configure Defense Evaluation**
   - Enter system prompt to test
   - Set guardrail level (0-1)
   - Select attack vectors to test

3. **Run Evaluation**
   - Click "Run Defense Evaluation"
   - Watch real-time scoring updates
   - View per-vector breakdown

4. **Review Recommendations**
   - Read hardening suggestions
   - Implement fixes
   - Re-run evaluation to verify

---

## 🔌 WebSocket Integration

### Connection Lifecycle

```typescript
// 1. Connect on app mount
websocketService.connect(SOCKET_URL);

// 2. Fetch runs via REST API
const runs = await fetchRuns();

// 3. Join Socket.io rooms
runs.forEach(run => {
  websocketService.joinRun(run.id);
});

// 4. Listen for events (handled automatically)
// Events update Zustand store → React re-renders

// 5. Disconnect on unmount
websocketService.disconnect();
```

### Event Handling

WebSocket events automatically update the Zustand store:

```typescript
socket.on('attack_prompt_generated', (data) => {
  const { addAttackPrompt } = useAppStore.getState();
  addAttackPrompt(data.prompt);
});
```

React components subscribe to store changes:

```typescript
const attackPrompts = useAppStore(s => s.attackPrompts);
// Component re-renders when prompts update
```

---

## 🧪 Development

### Running Tests

```bash
npm test
```

### Building for Production

```bash
npm run build
```

### Code Style

- TypeScript strict mode enabled
- Component naming: PascalCase
- File naming: PascalCase for components, camelCase for utilities
- Use functional components with hooks

---

## 📊 Type Definitions

Key types are defined in `src/types/index.ts`:

```typescript
interface Run {
  id: string;
  name: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  components: ComponentType[];
  createdAt: string;
  updatedAt: string;
  attackConfig?: AttackConfig;
  defenseConfig?: DefenseBackendConfig;
}

interface AttackPrompt {
  id: string;
  prompt: string;
  attackType: AttackType;
  status: 'success' | 'partial' | 'blocked' | 'running';
  score: number;
  timestamp: string;
}

interface DefenseStats {
  overallScore: number;
  directInjection: number;
  jailbreakResistance: number;
  promptLeaking: number;
  rolePlayExploits: number;
  indirectInjection: number;
}
```

---

## 🐛 Troubleshooting

### WebSocket Connection Issues

```
[WebSocket] Connection error: ...
```

**Solution:**
- Verify `REACT_APP_SOCKET_URL` in `.env`
- Check backend Socket.io server is running
- Check CORS configuration on backend

### API Errors

```
[404] Not found
```

**Solution:**
- Verify `REACT_APP_API_URL` points to correct backend
- Check backend server is running
- Confirm endpoint exists (see `BACKEND_CONTRACT.md`)

### Runs Not Loading

**Solution:**
- Check browser console for errors
- Verify backend `/runs` endpoint returns valid JSON
- Check network tab for failed requests

---

## 📖 Backend Contract

See `BACKEND_CONTRACT.md` for complete specification of:

- REST API endpoints
- Socket.io events
- Request/response formats
- Authentication
- Error handling

---

## 🎨 Design System

### Colors

- Background: `#F7F6F3`
- Surface: `#fff`
- Border: `#E8E6E0`
- Text Primary: `#1A1A1A`
- Text Secondary: `#888`
- Attack (Red): `#EF4444`
- Defense (Green): `#22C55E`

### Typography

- Font: `DM Sans` (body), `DM Mono` (code/monospace)
- Headings: 600 weight, negative letter-spacing
- Body: 400 weight, 1.6 line-height

### Components

- Border radius: `8-12px`
- Transitions: `0.15s ease`
- Shadows: Subtle, `0 4px 12px rgba(0,0,0,0.06)`

---

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🔗 Links

- [Backend Contract](./BACKEND_CONTRACT.md)
- [Type Definitions](./src/types/index.ts)
- [Zustand Store](./src/store/appStore.ts)

---

**Built with React, TypeScript, Zustand, and Socket.io**
