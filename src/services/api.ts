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
} from '../types';

import {
  CreateManualSessionRequest,
  ManualSessionResponse,
  ManualTurnHistoryResponse,
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

function normalizeRun(raw: any): Run {
  return {
    runid:       raw.run_id,
    name:        raw.name,
    description: raw.description,
    status:      raw.status,
    components:  raw.components ?? [],
    config:      raw.config ?? raw.graph_config, // accept either field name
    createdAt:   raw.created_at,
    updatedAt:   raw.updated_at,
  };
}

// =============================================================================
// CONNECTION
// =============================================================================

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
export const stopRun = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}/stop`, { method: 'POST' });

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
): Promise<ManualSessionResponse> =>
  apiFetch<ManualSessionResponse>(`${BASE_URL}/runs/${runId}/sessions`, {
    method: 'POST',
    body: JSON.stringify(request),
  });

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
 * ⚠ Render user bubbles from turn.metadata.user_input — NOT turn.content.
 */
export const getManualSessionHistory = async (
  runId: string,
  sessionId: string
): Promise<ManualTurnHistoryResponse> =>
  apiFetch<ManualTurnHistoryResponse>(
    `${BASE_URL}/runs/${runId}/sessions/${sessionId}/history`
  );

/** GET /runs/{runId}/sessions/{sessionId} */
export const getManualSession = async (
  runId: string,
  sessionId: string
): Promise<ManualSessionResponse> =>
  apiFetch<ManualSessionResponse>(`${BASE_URL}/runs/${runId}/sessions/${sessionId}`);

/** GET /runs/{runId}/sessions */
export const fetchManualSessions = async (runId: string): Promise<ManualSessionResponse[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/runs/${runId}/sessions`);
  return Array.isArray(data) ? data : data?.sessions ?? [];
};

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

// =============================================================================
// LEGACY COMPAT (api_manual.ts shims — used by ManualAttackPage)
// =============================================================================

export const fetchManualConfig = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/config`);

export const updateManualConfig = (runId: string, config: any) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/config`, {
    method: 'PUT', body: JSON.stringify(config),
  });

export const saveSession = (runId: string, sessionId: string, body?: any) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}/save`, {
    method: 'POST', body: JSON.stringify(body ?? {}),
  });

export const fetchManualStats = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/stats`);

export const deleteManualSession = (runId: string, sessionId: string) =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}`, { method: 'DELETE' });

// Resolves start mode from RunConfig
export type RunStartMode = 'automatic' | 'manual';
export const resolveRunStartMode = (config: RunConfig): RunStartMode =>
  config.graph_type === 'manual' ? 'manual' : 'automatic';