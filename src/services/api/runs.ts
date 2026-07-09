import { apiFetch, BASE_URL } from '../http';
import {
  Run,
  CreateRunRequest,
  UpdateRunRequest,
  RunConfig,
  StartAutomaticRunRequest,
  StartAutomaticRunResponse,
  ComponentType,
} from '../../types';

// Derives a component list from graph config when the backend doesn't provide one
function deriveComponents(graphConfig: any): ComponentType[] {
  if (!graphConfig) return [];
  const components: ComponentType[] = [];
  if (graphConfig.attack_node_config) components.push('attack');
  if (graphConfig.defense_node_config) components.push('defense');
  if (graphConfig.graph_type === 'manual') components.push('manual');
  return components;
}

export function normalizeRun(raw: any): Run {
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
 */
export const updateRun = async (runId: string, request: UpdateRunRequest): Promise<Run> =>
  normalizeRun(await apiFetch<any>(`${BASE_URL}/runs/${runId}`, {
    method: 'PATCH',
    body: JSON.stringify(request),
  }));

/** DELETE /runs/{runId} */
export const deleteRun = (runId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}`, { method: 'DELETE' });

/**
 * POST /runs/{runId}/start
 * Always call updateRun (PATCH) first to sync params.
 */
export const startAutomaticRun = async (
  runId: string,
  request?: StartAutomaticRunRequest
): Promise<StartAutomaticRunResponse> =>
  apiFetch<StartAutomaticRunResponse>(`${BASE_URL}/runs/${runId}/start`, {
    method: 'POST',
    body: JSON.stringify(request ?? {}),
  });

export interface StopRunResponse {
  run_id: string;
  status: string;
  message?: string;
}

/** POST /runs/{runId}/stop */
export const stopRun = (runId: string): Promise<StopRunResponse> =>
  apiFetch<StopRunResponse>(`${BASE_URL}/runs/${runId}/stop`, { method: 'POST' });

/** GET /runs/{runId}/stats */
export const fetchRunStats = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/stats`);

export type RunStartMode = 'automatic' | 'manual';
export const resolveRunStartMode = (config: RunConfig): RunStartMode =>
  config.graph_type === 'manual' ? 'manual' : 'automatic';

export const testConnection = async (url: string): Promise<boolean> => {
  try { return (await fetch(`${url}/health`)).ok; } catch { return false; }
};
