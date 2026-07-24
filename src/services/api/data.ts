// Flat run data endpoints — isolated here for easy Phase 2 replacement
// with the unified Session/Turn API. Do not add new callers.

import { apiFetch, BASE_URL } from '../http';

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

/** GET /runs/{runId}/stats/charts */
export const fetchRunCharts = (runId: string) =>
  apiFetch<any>(`${BASE_URL}/runs/${runId}/stats/charts`);
