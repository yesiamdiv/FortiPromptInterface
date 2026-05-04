// services/api.ts
// ─── FortiPrompt REST API Client ─────────────────────────────────────────────
//
// Architecture:
//   Automatic run: createRun → updateRun (PATCH) → startAutomaticRun (POST) → WS events
//   Manual run:    createRun → createManualSession → submitManualTurn (repeat)
//                  Listen to session_id WS room; disable input until run_idle fires.
//
// ⚠ Chat history rendering rule:
//   User bubble  → turn.metadata.user_input   (NOT turn.content / attack.prompt)
//   Defense/AI   → turn.content (for defense/target roles)

import {
  Run,
  CreateRunRequest,
  UpdateRunRequest,
  GraphConfig,
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

// ─── Generic fetch wrapper ────────────────────────────────────────────────────

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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
    graph_config: raw.graph_config,
    createdAt:   raw.created_at,
    updatedAt:   raw.updated_at,
  };
}

// =============================================================================
// CONNECTION
// =============================================================================

export const testConnection = async (url: string): Promise<boolean> => {
  try {
    const res = await fetch(`${url}/health`);
    return res.ok;
  } catch {
    return false;
  }
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
export const fetchRun = async (runId: string): Promise<Run> => {
  const raw = await apiFetch<any>(`${BASE_URL}/runs/${runId}`);
  return normalizeRun(raw);
};

/**
 * POST /runs
 * Creates run in IDLE state — does NOT start execution.
 * graph_config.graph_type determines 'automatic' | 'manual'.
 */
export const createRun = async (request: CreateRunRequest): Promise<Run> => {
  const raw = await apiFetch<any>(`${BASE_URL}/runs`, {
    method: 'POST',
    body: JSON.stringify(request),
  });
  return normalizeRun(raw);
};

/**
 * PATCH /runs/{runId}
 * Update metadata and dynamic strategy parameters before starting a run.
 * The request payload strictly sends name, description, and strategy_params.
 */
export const updateRun = async (runId: string, request: UpdateRunRequest): Promise<Run> => {
  const raw = await apiFetch<any>(`${BASE_URL}/runs/${runId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  });
  return normalizeRun(raw);
};

/** DELETE /runs/{runId} */
export const deleteRun = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}`, { method: 'DELETE' });

// =============================================================================
// AUTOMATIC EXECUTION
// =============================================================================

/**
 * POST /runs/{runId}/start
 * Starts an AUTOMATIC run. Call updateRun (PATCH) first to sync UI config.
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
// MANUAL EXECUTION (Human-in-the-Loop)
// =============================================================================

/**
 * POST /runs/{runId}/sessions
 * Creates a new chat session. Returns session_id.
 * After calling: emit join_session_room({ session_id }) over WebSocket.
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
 * Submits one user prompt. Disable input after calling; re-enable on run_idle WS event.
 *
 * ⚠ DO NOT render attack.prompt as the user bubble.
 *    Use attack.metadata.user_input instead.
 */
export const submitManualTurn = async (
  runId: string,
  sessionId: string,
  request: SubmitManualTurnRequest
): Promise<SubmitManualTurnResponse> =>
  apiFetch<SubmitManualTurnResponse>(
    `${BASE_URL}/runs/${runId}/sessions/${sessionId}/manual_turn`,
    {
      method: 'POST',
      body: JSON.stringify(request),
    }
  );

/**
 * GET /runs/{runId}/sessions/{sessionId}/history
 * Render user bubbles from turn.metadata.user_input — NOT turn.content.
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

/** GET /strategies — fetch all strategies + schemas for dynamic form building */
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

/** GET /nodes/{type} — 'attack' | 'defense' | 'evaluation' */
export const getNodes = async (
  nodeType: 'attack' | 'defense' | 'evaluation'
): Promise<NodeSchema[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/nodes/${nodeType}`);
  return Array.isArray(data) ? data : data?.nodes ?? [];
};

// =============================================================================
// LEGACY manual API (api_manual.ts compatibility) — for existing ManualAttackPage
// =============================================================================

export const fetchManualConfig = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/config`);

export const updateManualConfig = (runId: string, config: any) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/config`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });

export const addTurn = (runId: string, sessionId: string, body: any) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}/turns`, {
    method: 'POST',
    body: JSON.stringify(body),
  });

export const saveSession = (runId: string, sessionId: string, body?: any) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}/save`, {
    method: 'POST',
    body: JSON.stringify(body ?? {}),
  });

export const fetchManualStats = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/stats`);

export const deleteManualSession = (runId: string, sessionId: string) =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}`, {
    method: 'DELETE',
  });

export const fetchManualSession = (runId: string | null, sessionId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}`);

// Resolves run start mode from graph config
export type RunStartMode = 'automatic' | 'manual';
export const resolveRunStartMode = (graphConfig: GraphConfig): RunStartMode =>
  graphConfig.graph_type === 'manual' ? 'manual' : 'automatic';