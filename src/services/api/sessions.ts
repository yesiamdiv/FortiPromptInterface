import { apiFetch, BASE_URL } from '../http';
import {
  CreateManualSessionRequest,
  ManualSessionResponse,
  ManualTurnHistoryResponse,
  SubmitManualTurnRequest,
  SubmitManualTurnResponse,
  ChatSession,
} from '../../types';

/**
 * Backend returns SessionObject (with turn_ids, total_turns).
 * Frontend ChatSession adds `turns: ChatTurn[]` which is UI-only (populated from history).
 */
export function normalizeSession(raw: any): ManualSessionResponse {
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
    turns: [],
  };
}

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
