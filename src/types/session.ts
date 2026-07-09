export type ChatRole = 'attacker' | 'target' | 'defense' | 'evaluation';
export type SessionStatus = 'active' | 'completed' | 'idle';
export type EvaluationLabel = 'breached' | 'blocked' | 'partial';
export type FilterMode = 'none' | 'regex' | 'semantic' | 'llm_judge';

export interface ChatTurn {
  turn_id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  metadata: Record<string, any>;
  // When role === 'attacker': metadata.user_input is the clean user text.
  // content / prompt is the full accumulated LLM context — DO NOT render it.
}

/**
 * Mirrors the backend SessionObject exactly.
 * Extra UI-only fields (turns, evaluation_*) are layered on top locally.
 */
export interface ChatSession {
  session_id: string;
  run_id: string;
  name: string;
  description: string | null;
  status: 'active' | 'completed' | 'idle';
  created_at: string;
  updated_at: string;
  turn_ids: string[];
  total_turns: number;

  // UI-only fields — populated locally after fetching history or from WS events
  turns: ChatTurn[];
  evaluation_score?: number;
  evaluation_label?: EvaluationLabel;
  evaluation_reasoning?: string;
}

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

export interface ManualRunStats {
  total_sessions: number;
  saved_sessions: number;
  active_sessions: number;
  breach_count: number;
  blocked_count: number;
  partial_count: number;
  average_score?: number;
}

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

/**
 * GET /runs/{run_id}/sessions/{session_id}/history
 * The `turns` array contains raw typed records. The frontend assembles
 * ChatTurn objects from these sub-records.
 */
export interface RawTurnRecord {
  session_id: string;
  run_id: string;
  index: number;
  turn_id: string;
  attack_data_id?: string;
  defence_data_id?: string;
  evaluation_data_id?: string;
  attack_data?: {
    run_id: string; index: number; turn_id: string;
    prompt: string; metadata: Record<string, any>; timestamp: string;
  };
  defence_data?: {
    run_id: string; index: number; turn_id: string;
    response: string; status_code: number; was_blocked: boolean;
    metadata: Record<string, any>; timestamp: string;
  };
  evaluation_data?: {
    run_id: string; index: number; turn_id: string;
    score: number; success: boolean; category: string;
    feedback: string; metadata: Record<string, any>; timestamp: string;
  };
}

export interface ManualTurnHistoryResponse {
  session: ChatSession;
  turns: RawTurnRecord[];
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
