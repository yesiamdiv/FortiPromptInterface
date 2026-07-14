// services/api.ts
// ─── FortiPrompt REST API Client ─────────────────────────────────────────────
//
// Flow:
//   Automatic: createRun (with RunConfig) → updateRun (PATCH flat params) → startAutomaticRun
//   Manual:    createRun → createManualSession → submitManualTurn (repeat until run_idle)
//
// ⚠ Chat rendering rule:
//   User bubble  → turn.metadata.user_input  (NEVER turn.content / attack.prompt)
//   Defense/AI   → turn.content (for defense / target roles)

import {
  Run,
  CreateRunRequest,
  UpdateRunRequest,
  RunConfig,
  StrategySchema,
  Provider,
  NodeSchema,
  StartAutomaticRunRequest,
  StartAutomaticRunResponse,
  ComponentType,
} from '../types';

import {
  CreateManualSessionRequest,
  ManualSessionResponse,
  ManualTurnHistoryResponse,
  RawTurnRecord,
  SubmitManualTurnRequest,
  SubmitManualTurnResponse,
} from '../types/manual';

// ─── Base URL ─────────────────────────────────────────────────────────────────

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8000/api/v1';

// ─── Generic fetch ────────────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

// Helper: derive component list from config if not provided by backend
function deriveComponents(graphConfig: any): ComponentType[] {
  if (!graphConfig) return [];
  const components: ComponentType[] = [];
  if (graphConfig.attack_node_config) components.push('attack');
  if (graphConfig.defense_node_config) components.push('defense');
  if (graphConfig.graph_type === 'manual') components.push('manual');
  return components;
}

function normalizeRun(raw: any): Run {
  const config = raw.graph_config ?? raw.config;
  return {
    runid:       raw.run_id,
    name:        raw.name ?? '',
    description: raw.description ?? '',
    status:      raw.status,
    components:  raw.components ?? deriveComponents(config),
    config:      config,
    createdAt:   raw.created_at,
    updatedAt:   raw.updated_at ?? raw.completed_at ?? raw.started_at ?? raw.created_at,
  };
}

// ─── Session Normalizer ───────────────────────────────────────────────────────

/**
 * Backend returns SessionObject (with turn_ids, total_turns).
 * Frontend ChatSession adds `turns: ChatTurn[]` which is UI-only (populated from history).
 */
function normalizeSession(raw: any): ManualSessionResponse {
  return {
    session_id:  raw.session_id,
    run_id:      raw.run_id,
    name:        raw.name ?? '',
    description: raw.description ?? null,
    status:      raw.status ?? 'idle',
    created_at:  raw.created_at ?? new Date().toISOString(),
    updated_at:  raw.updated_at ?? raw.created_at ?? new Date().toISOString(),
    turn_ids:    raw.turn_ids ?? [],
    total_turns: raw.total_turns ?? 0,
    // UI-only fields — start empty, populated by history fetch or WS events
    turns:       [],
  };
}



export const testConnection = async (url: string): Promise<boolean> => {
  try { return (await fetch(`${url}/health`)).ok; } catch { return false; }
};

// =============================================================================
// RUNS
// =============================================================================

/** GET /runs */
export const fetchRuns = async (): Promise<Run[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/runs`);
  const arr: any[] = Array.isArray(data) ? data : data?.runs ?? [];
  return arr.map(normalizeRun);
};

/** GET /runs/{runId} */
export const fetchRun = async (runId: string): Promise<Run> =>
  normalizeRun(await apiFetch<any>(`${BASE_URL}/runs/${runId}`));

/**
 * POST /runs
 * Creates the run in IDLE state — does NOT start execution.
 * graph_type inside config determines 'automatic' | 'manual'.
 */
export const createRun = async (request: CreateRunRequest): Promise<Run> =>
  normalizeRun(await apiFetch<any>(`${BASE_URL}/runs`, {
    method: 'POST',
    body: JSON.stringify(request),
  }));

/**
 * PATCH /runs/{runId}
 * Flat payload — no nested graph_config wrapper.
 * Call this BEFORE startAutomaticRun to sync strategy/node params.
 * Backend ignores unknown fields safely.
 */
export const updateRun = async (runId: string, request: UpdateRunRequest): Promise<Run> =>
  normalizeRun(await apiFetch<any>(`${BASE_URL}/runs/${runId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  }));

/** DELETE /runs/{runId} */
export const deleteRun = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}`, { method: 'DELETE' });

// =============================================================================
// AUTOMATIC EXECUTION
// =============================================================================

/**
 * POST /runs/{runId}/start
 * Starts the automatic run. Always call updateRun (PATCH) first to sync params.
 */
export const startAutomaticRun = async (
  runId: string,
  request?: StartAutomaticRunRequest
): Promise<StartAutomaticRunResponse> =>
  apiFetch<StartAutomaticRunResponse>(`${BASE_URL}/runs/${runId}/start`, {
    method: 'POST',
    body: JSON.stringify(request ?? {}),
  });

/** POST /runs/{runId}/stop */
export interface StopRunResponse {
  run_id: string;
  status: string;
  message?: string;
}

export const stopRun = (runId: string): Promise<StopRunResponse> =>
  apiFetch<StopRunResponse>(`${BASE_URL}/runs/${runId}/stop`, { method: 'POST' });

// =============================================================================
// RUN DATA (SYNC)
// =============================================================================

/** GET /runs/{runId}/attacks */
export const fetchRunAttacks = async (runId: string) => {
  const data = await apiFetch<any>(`${BASE_URL}/runs/${runId}/attacks`);
  return data?.attacks ?? [];
};

/** GET /runs/{runId}/defences */
export const fetchRunDefences = async (runId: string) => {
  const data = await apiFetch<any>(`${BASE_URL}/runs/${runId}/defences`);
  return data?.defences ?? [];
};

/** GET /runs/{runId}/evaluations */
export const fetchRunEvaluations = async (runId: string) => {
  const data = await apiFetch<any>(`${BASE_URL}/runs/${runId}/evaluations`);
  return data?.evaluations ?? [];
};

/** GET /runs/{runId}/stats */
export const fetchRunStats = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/stats`);

/** GET /runs/{runId}/stats/charts */
export const fetchRunCharts = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/stats/charts`);

// =============================================================================
// MANUAL EXECUTION
// =============================================================================

/**
 * POST /runs/{runId}/sessions
 * Creates a chat session. After this, call websocketService.joinSessionRoom(session_id).
 */
export const createManualSession = async (
  runId: string,
  request: CreateManualSessionRequest
): Promise<ManualSessionResponse> => {
  const raw = await apiFetch<any>(`${BASE_URL}/runs/${runId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return normalizeSession(raw);
};

/**
 * POST /runs/{runId}/sessions/{sessionId}/manual_turn
 * One turn: Attack → Defense → Eval.
 * Disable input box after calling; re-enable ONLY on run_idle WS event.
 * ⚠ Render user bubble from turn.metadata.user_input — NOT turn.content.
 */
export const submitManualTurn = async (
  runId: string,
  sessionId: string,
  request: SubmitManualTurnRequest
): Promise<SubmitManualTurnResponse> =>
  apiFetch<SubmitManualTurnResponse>(
    `${BASE_URL}/runs/${runId}/sessions/${sessionId}/manual_turn`,
    { method: 'POST', body: JSON.stringify(request) }
  );

/**
 * GET /runs/{runId}/sessions/{sessionId}/history
 * Returns raw typed records. Frontend assembles ChatTurn[] from sub-records.
 */
export const getManualSessionHistory = async (
  runId: string,
  sessionId: string
): Promise<ManualTurnHistoryResponse> => {
  const raw = await apiFetch<any>(
    `${BASE_URL}/runs/${runId}/sessions/${sessionId}/history`
  );
  return {
    session: normalizeSession(raw.session),
    turns: raw.turns ?? [],
  };
};

/** GET /runs/{runId}/sessions/{sessionId} */
export const getManualSession = async (
  runId: string,
  sessionId: string
): Promise<ManualSessionResponse> => {
  const raw = await apiFetch<any>(`${BASE_URL}/runs/${runId}/sessions/${sessionId}`);
  return normalizeSession(raw);
};

/** GET /runs/{runId}/sessions */
export const fetchManualSessions = async (runId: string): Promise<ManualSessionResponse[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/runs/${runId}/sessions`);
  const arr: any[] = Array.isArray(data) ? data : data?.sessions ?? [];
  return arr.map(normalizeSession);
};

/** DELETE /runs/{runId}/sessions/{sessionId} */
export const deleteManualSession = (runId: string, sessionId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}/sessions/${sessionId}`, { method: 'DELETE' });

// =============================================================================
// DISCOVERY
// =============================================================================

/** GET /strategies — all strategies + schemas for dynamic form building */
export const getStrategies = async (): Promise<StrategySchema[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/strategies`);
  return Array.isArray(data) ? data : data?.strategies ?? [];
};

/** GET /strategies/{name}/schema */
export const getStrategySchema = async (name: string): Promise<StrategySchema> =>
  apiFetch<StrategySchema>(`${BASE_URL}/strategies/${name}/schema`);

/** GET /providers */
export const getProviders = async (): Promise<Provider[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/providers`);
  return Array.isArray(data) ? data : data?.providers ?? [];
};

/**
 * GET /nodes/{type}
 * Returns node schemas with dynamic param definitions for RunConfigPanel.
 * type: 'attack' | 'defense' | 'evaluation'
 */
export const getNodes = async (
  nodeType: 'attack' | 'defense' | 'evaluation'
): Promise<NodeSchema[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/nodes/${nodeType}`);
  return Array.isArray(data) ? data : data?.nodes ?? [];
};

// Resolves start mode from RunConfig
export type RunStartMode = 'automatic' | 'manual';
export const resolveRunStartMode = (config: RunConfig): RunStartMode =>
  config.graph_type === 'manual' ? 'manual' : 'automatic';