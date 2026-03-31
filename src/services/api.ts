import {
  Run,
  CreateRunRequest,
  UpdateRunRequest,
  AttackConfig,
  AttackPrompt,
  AttackStats,
  DefenseConfig,
  DefenseResponse,
  DefenseStats,
  StartAttackRequest,
  StartAttackResponse,
  StopAttackResponse,
} from '../types';

// ─── Base config ──────────────────────────────────────────────────────────────
const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8000/api';

const makeHeaders = (apiKey?: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
});

// Generic fetch wrapper
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${text}`);
  }
  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }
  return res.json() as Promise<T>;
}

// ─── Connection ───────────────────────────────────────────────────────────────
export const testConnection = async (
  url: string,
  apiKey?: string
): Promise<boolean> => {
  try {
    const res = await fetch(`${url}/health`, {
      headers: makeHeaders(apiKey),
    });
    return res.ok;
  } catch {
    return false;
  }
};

// ─── Runs ─────────────────────────────────────────────────────────────────────

/** GET /api/runs - Fetches a list of all test runs */
export const fetchRuns = async (): Promise<Run[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/runs`, {
    headers: makeHeaders(),
  });

  const runsArray = Array.isArray(data)
    ? data
    : Array.isArray(data?.runs)
    ? data.runs
    : [];

  // ✅ normalize backend → frontend
  return runsArray.map((run: any) => ({
    runid: run.run_id,                 // ⭐ FIX
    name: run.name,
    description: run.description,
    status: run.status,
    components: run.components,
    createdAt: run.created_at,         // ⭐ FIX
    updatedAt: run.updated_at,         // ⭐ FIX
  }));
};

/** POST /api/runs - Creates a new test run */
export const createRun = (request: CreateRunRequest): Promise<Run> =>
  apiFetch<Run>(`${BASE_URL}/runs`, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify(request),
  });

/** PATCH /api/runs/{runId} - Updates an existing test run */
export const updateRun = (
  runId: string,
  request: UpdateRunRequest
): Promise<Run> =>
  apiFetch<Run>(`${BASE_URL}/runs/${runId}`, {
    method: 'PATCH',
    headers: makeHeaders(),
    body: JSON.stringify(request),
  });

/** DELETE /api/runs/{runId} - Deletes a test run */
export const deleteRun = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}`, {
    method: 'DELETE',
    headers: makeHeaders(),
  });

// ─── Attack Configuration ─────────────────────────────────────────────────────

/** GET /api/runs/{runId}/attack/config - Retrieves attack configuration */
export const fetchAttackConfig = (runId: string): Promise<AttackConfig> =>
  apiFetch<AttackConfig>(`${BASE_URL}/runs/${runId}/attack/config`, {
    headers: makeHeaders(),
  });

/** PUT /api/runs/{runId}/attack/config - Creates or updates attack configuration */
export const updateAttackConfig = (
  runId: string,
  config: AttackConfig,
  apiKey?: string
): Promise<AttackConfig> =>
  apiFetch<AttackConfig>(`${BASE_URL}/runs/${runId}/attack/config`, {
    method: 'PUT',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(config),
  });

// ─── Attack Operations ────────────────────────────────────────────────────────

/** GET /api/runs/{runId}/attack/prompts - Retrieves all generated attack prompts */
export const fetchAttackPrompts = (runId: string): Promise<AttackPrompt[]> =>
  apiFetch<AttackPrompt[]>(`${BASE_URL}/runs/${runId}/attack/prompts`, {
    headers: makeHeaders(),
  });

/** GET /api/runs/{runId}/attack/stats - Retrieves attack statistics */
export const fetchAttackStats = (runId: string): Promise<AttackStats> =>
  apiFetch<AttackStats>(`${BASE_URL}/runs/${runId}/attack/stats`, {
    headers: makeHeaders(),
  });

/** POST /api/runs/{runId}/attack/start - Starts or resumes attack generation */
export const startAttack = (
  runId: string,
  request?: StartAttackRequest,
  apiKey?: string
): Promise<StartAttackResponse> =>
  apiFetch<StartAttackResponse>(`${BASE_URL}/runs/${runId}/attack/start`, {
    method: 'POST',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(request || {}),
  });

/** POST /api/runs/{runId}/attack/stop - Stops the ongoing attack generation */
export const stopAttack = (runId: string): Promise<StopAttackResponse> =>
  apiFetch<StopAttackResponse>(`${BASE_URL}/runs/${runId}/attack/stop`, {
    method: 'POST',
    headers: makeHeaders(),
  });

// ─── Defense Configuration ────────────────────────────────────────────────────

/** GET /api/runs/{runId}/defense/config - Retrieves defense configuration */
export const fetchDefenseConfig = (runId: string): Promise<DefenseConfig> =>
  apiFetch<DefenseConfig>(`${BASE_URL}/runs/${runId}/defense/config`, {
    headers: makeHeaders(),
  });

/** PUT /api/runs/{runId}/defense/config - Creates or updates defense configuration */
export const updateDefenseConfig = (
  runId: string,
  config: DefenseConfig,
  apiKey?: string
): Promise<DefenseConfig> =>
  apiFetch<DefenseConfig>(`${BASE_URL}/runs/${runId}/defense/config`, {
    method: 'PUT',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(config),
  });

// ─── Defense Operations ───────────────────────────────────────────────────────

/** GET /api/runs/{runId}/defense/responses - Retrieves all defense responses */
export const fetchDefenseResponses = (runId: string): Promise<DefenseResponse[]> =>
  apiFetch<DefenseResponse[]>(`${BASE_URL}/runs/${runId}/defense/responses`, {
    headers: makeHeaders(),
  });

/** GET /api/runs/{runId}/defense/stats - Retrieves defense statistics */
export const fetchDefenseStats = (runId: string): Promise<DefenseStats> =>
  apiFetch<DefenseStats>(`${BASE_URL}/runs/${runId}/defense/stats`, {
    headers: makeHeaders(),
  });

// ─── Legacy Compatibility (if needed) ─────────────────────────────────────────
// These functions can be kept for backwards compatibility during migration

/** @deprecated Use updateAttackConfig and startAttack instead */
export const startAttackLegacy = async (
  runId: string,
  config: AttackConfig,
  apiKey?: string
): Promise<AttackPrompt[]> => {
  // First update config
  await updateAttackConfig(runId, config, apiKey);
  // Then start attack
  await startAttack(runId, { resumeFromLastSaved: false }, apiKey);
  // Return prompts (they'll come via WebSocket in real implementation)
  return fetchAttackPrompts(runId);
};

/** @deprecated Use updateDefenseConfig and fetch stats separately */
export const startDefenseEvaluation = async (
  runId: string,
  config: DefenseConfig,
  apiKey?: string
): Promise<DefenseStats> => {
  // Update config
  await updateDefenseConfig(runId, config, apiKey);
  // Fetch and return stats (evaluation happens server-side)
  return fetchDefenseStats(runId);
};