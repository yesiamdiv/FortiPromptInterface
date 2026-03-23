import {
  Run,
  AttackConfig,
  AttackPrompt,
  DefenseBackendConfig,
  DefenseLog,
  DefenseStats,
  EvaluationResult,
} from '../types';

// ─── Base config ──────────────────────────────────────────────────────────────
// Set REACT_APP_API_URL in your .env file when the backend is ready.
// e.g.  REACT_APP_API_URL=https://my-colab-backend.ngrok.io/api
const BASE_URL = process.env.REACT_APP_API_URL ?? 'https://your-backend.com/api';

const makeHeaders = (apiKey?: string): HeadersInit => ({
  'Content-Type': 'application/json',
  ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
});

// Generic fetch wrapper with typed error
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${text}`);
  }
  return res.json() as Promise<T>;
}

// ─── Connection ───────────────────────────────────────────────────────────────

/**
 * Pings the backend health endpoint.
 * Returns true on 2xx, false on network/auth error.
 */
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

export const fetchRuns = (): Promise<Run[]> =>
  apiFetch<Run[]>(`${BASE_URL}/runs`, { headers: makeHeaders() });

export const createRun = (run: Partial<Run>): Promise<Run> =>
  apiFetch<Run>(`${BASE_URL}/runs`, {
    method: 'POST',
    headers: makeHeaders(),
    body: JSON.stringify(run),
  });

export const updateRun = (id: string, patch: Partial<Run>): Promise<Run> =>
  apiFetch<Run>(`${BASE_URL}/runs/${id}`, {
    method: 'PATCH',
    headers: makeHeaders(),
    body: JSON.stringify(patch),
  });

export const deleteRun = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}`, {
    method: 'DELETE',
    headers: makeHeaders(),
  });

// ─── Attack ───────────────────────────────────────────────────────────────────

/**
 * Sends attack config to the backend; backend streams or returns generated prompts.
 */
export const startAttack = (
  runId: string,
  config: AttackConfig
): Promise<AttackPrompt[]> =>
  apiFetch<AttackPrompt[]>(`${BASE_URL}/runs/${runId}/attack`, {
    method: 'POST',
    headers: makeHeaders(config.apiKey),
    body: JSON.stringify(config),
  });

export const stopAttack = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}/attack/stop`, {
    method: 'POST',
    headers: makeHeaders(),
  });

export const fetchAttackPrompts = (runId: string): Promise<AttackPrompt[]> =>
  apiFetch<AttackPrompt[]>(`${BASE_URL}/runs/${runId}/prompts`, {
    headers: makeHeaders(),
  });

// ─── Defense ─────────────────────────────────────────────────────────────────

export const startDefenseEvaluation = (
  runId: string,
  config: DefenseBackendConfig,
  apiKey?: string
): Promise<DefenseStats> =>
  apiFetch<DefenseStats>(`${BASE_URL}/runs/${runId}/defense`, {
    method: 'POST',
    headers: makeHeaders(apiKey),
    body: JSON.stringify(config),
  });

export const fetchDefenseLogs = (runId: string): Promise<DefenseLog[]> =>
  apiFetch<DefenseLog[]>(`${BASE_URL}/runs/${runId}/defense-logs`, {
    headers: makeHeaders(),
  });

export const fetchDefenseStats = (runId: string): Promise<DefenseStats> =>
  apiFetch<DefenseStats>(`${BASE_URL}/runs/${runId}/defense-stats`, {
    headers: makeHeaders(),
  });

// ─── Evaluation ───────────────────────────────────────────────────────────────

export const fetchEvaluation = (runId: string): Promise<EvaluationResult> =>
  apiFetch<EvaluationResult>(`${BASE_URL}/runs/${runId}/evaluation`, {
    headers: makeHeaders(),
  });