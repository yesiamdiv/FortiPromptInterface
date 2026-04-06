// services/api_manual.ts
// ─── Manual Attack API Client ─────────────────────────────────────────────────

import {
  ManualRunConfig,
  ChatSession,
  ManualRunStats,
  CreateSessionRequest,
  AddTurnRequest,
  AddTurnResponse,
  SaveSessionRequest,
  SaveSessionResponse,
} from '../types/manual';

const BASE_URL = process.env.REACT_APP_API_URL ?? 'http://localhost:8000/api';

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const headers = (): HeadersInit => ({ 'Content-Type': 'application/json' });

// ── Config ────────────────────────────────────────────────────────────────────

export const fetchManualConfig = (runId: string): Promise<ManualRunConfig> =>
  apiFetch<ManualRunConfig>(`${BASE_URL}/runs/${runId}/manual/config`, { headers: headers() });

export const updateManualConfig = (runId: string, config: ManualRunConfig): Promise<ManualRunConfig> =>
  apiFetch<ManualRunConfig>(`${BASE_URL}/runs/${runId}/manual/config`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify(config),
  });

// ── Sessions ──────────────────────────────────────────────────────────────────

export const fetchManualSessions = (runId: string): Promise<ChatSession[]> =>
  apiFetch<ChatSession[]>(`${BASE_URL}/runs/${runId}/manual/sessions`, { headers: headers() });

export const createManualSession = (runId: string, body: CreateSessionRequest): Promise<ChatSession> =>
  apiFetch<ChatSession>(`${BASE_URL}/runs/${runId}/manual/sessions`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

export const fetchManualSession = (runId: string|null, sessionId: string): Promise<ChatSession> =>
  apiFetch<ChatSession>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}`, { headers: headers() });

export const deleteManualSession = (runId: string, sessionId: string): Promise<void> =>
  apiFetch<void>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}`, {
    method: 'DELETE',
    headers: headers(),
  });

// ── Turns ─────────────────────────────────────────────────────────────────────

export const addTurn = (runId: string, sessionId: string, body: AddTurnRequest): Promise<AddTurnResponse> =>
  apiFetch<AddTurnResponse>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}/turns`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  });

// ── Save / Evaluate ───────────────────────────────────────────────────────────

export const saveSession = (runId: string, sessionId: string, body?: SaveSessionRequest): Promise<SaveSessionResponse> =>
  apiFetch<SaveSessionResponse>(`${BASE_URL}/runs/${runId}/manual/sessions/${sessionId}/save`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body ?? {}),
  });

// ── Stats ─────────────────────────────────────────────────────────────────────

export const fetchManualStats = (runId: string): Promise<ManualRunStats> =>
  apiFetch<ManualRunStats>(`${BASE_URL}/runs/${runId}/manual/stats`, { headers: headers() });
