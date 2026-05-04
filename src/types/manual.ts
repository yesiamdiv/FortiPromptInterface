// types/manual.ts

export type ChatRole = 'attacker' | 'target' | 'defense' | 'evaluation';
export type SessionStatus = 'active' | 'saved' | 'evaluated';
export type EvaluationLabel = 'breached' | 'blocked' | 'partial';
export type FilterMode = 'none' | 'regex' | 'semantic' | 'llm_judge';

// ─── Turn ──────────────────────────────────────────────────────────────────────

export interface ChatTurn {
  turn_id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  metadata: Record<string, any>;
  // When role === 'attacker': metadata.user_input is the clean user text
  // content / prompt is the full accumulated LLM context — DO NOT render it
}

// ─── Session ───────────────────────────────────────────────────────────────────

export interface ChatSession {
  session_id: string;
  run_id: string;
  label?: string;
  turns: ChatTurn[];
  status: SessionStatus;
  evaluation_score?: number;
  evaluation_label?: EvaluationLabel;
  evaluation_reasoning?: string;
  defense_filter_used?: string;
  created_at: string;
  saved_at?: string;
  evaluated_at?: string;
}

// ─── Config ────────────────────────────────────────────────────────────────────

export interface ManualDefenseConfig {
  filter_mode: FilterMode;
  model?: string;
  parameters: Record<string, any>;
}

export interface ManualRunConfig {
  defense_config: ManualDefenseConfig;
  domain?: string;
  notes?: string;
}

// ─── Stats ──────────────────────────────────────────────────────────────────────

export interface ManualRunStats {
  total_sessions: number;
  saved_sessions: number;
  active_sessions: number;
  breach_count: number;
  blocked_count: number;
  partial_count: number;
  average_score?: number;
}

// ─── API Requests / Responses ──────────────────────────────────────────────────

/** Used by POST /runs/{run_id}/sessions */
export interface CreateManualSessionRequest {
  name?: string;
  description?: string;
  initial_payload?: {
    prompt?: string;
    runtime_config?: Record<string, any>;
  };
}

export interface ManualSessionResponse extends ChatSession {}

export interface ManualTurnHistoryResponse {
  session: ChatSession;
  turns: ChatTurn[];
}

/** Used by POST /runs/{run_id}/sessions/{session_id}/manual_turn */
export interface SubmitManualTurnRequest {
  prompt: string;
  runtime_config?: Record<string, any>;
}

export interface SubmitManualTurnResponse {
  turn_id: string;
  session_id: string;
  run_id: string;
}

// ─── Legacy api_manual.ts types (kept for backward compat) ────────────────────

export interface CreateSessionRequest {
  label?: string;
}

export interface AddTurnRequest {
  role: ChatRole;
  content: string;
}

export interface AddTurnResponse {
  turn_id: string;
  session_id: string;
}

export interface SaveSessionRequest {
  label?: string;
}

export interface SaveSessionResponse {
  session_id: string;
  evaluation_score?: number;
  evaluation_label?: EvaluationLabel;
  evaluation_reasoning?: string;
}

// ─── WebSocket Events ──────────────────────────────────────────────────────────

export interface WSManualSessionCreated {
  runId: string;
  session: ChatSession;
}

export interface WSManualTurnAdded {
  runId: string;
  sessionId: string;
  turn: ChatTurn;
}

export interface WSManualSessionEvaluated {
  runId: string;
  sessionId: string;
  evaluation: {
    score: number;
    label: EvaluationLabel;
    reasoning: string;
  };
  defense_filter_used: string;
}

export interface WSManualAttackGenerated {
  run_id: string;
  session_id: string;
  turn_id: string;
  index: number;
  attack: {
    prompt?: string;         // full LLM context — do NOT render
    preview?: string;        // short preview
    full_text?: string;      // full text
    metadata?: {
      user_input?: string;   // ← render THIS as the user bubble
      [key: string]: any;
    };
  };
}

export interface WSManualDefenseResponse {
  run_id: string;
  session_id: string;
  turn_id: string;
  index: number;
  defence: {
    full_text?: string;
    response?: string;
    preview?: string;
    was_blocked?: boolean;
    metadata?: Record<string, any>;
  };
}

export interface WSManualEvaluationComplete {
  run_id: string;
  session_id: string;
  turn_id: string;
  index: number;
  evaluation: {
    score?: number;
    success?: boolean;
    reasoning?: string;
    label?: EvaluationLabel;
    [key: string]: any;
  };
}

export interface WSManualTurnCompleted {
  run_id: string;
  session_id: string;
  turn_id: string;
  index: number;
}

export interface WSRunIdle {
  run_id: string;
  message: string;
  last_turn_id: string;
  iteration_count: number;
  session_id: string;
}
