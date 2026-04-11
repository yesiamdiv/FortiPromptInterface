// types/manual.ts
// ─── Manual Attack Types ─────────────────────────────────────────────────────

export type ChatRole = 'attacker' | 'target' | 'defense';
export type SessionStatus = 'active' | 'saved' | 'evaluated';
export type EvaluationLabel = 'breached' | 'blocked' | 'partial';

export interface DefenseResult {
  malicious: number;
  confidence: number;
  category: string;
}

export interface ChatTurn {
  turn_id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
  metadata: { defense_result?: DefenseResult } & Record<string, any>;
}

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

export type FilterMode = 'none' | 'regex' | 'semantic' | 'llm_judge';

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

// ─── API Request/Response Types ───────────────────────────────────────────────

export interface CreateSessionRequest {
  label?: string;
}

export interface AddTurnRequest {
  role: ChatRole;
  content: string;
  metadata?: Record<string, any>;
}

export interface AddTurnResponse {
  turn_id: string;
  session_id: string;
  run_id: string;
  defense_result?: DefenseResult | null;
}

export interface SaveSessionRequest {
  label?: string;
}

export interface SaveSessionResponse {
  session_id: string;
  run_id: string;
  status: string;
  evaluation_score: number;
  evaluation_label: string;
  evaluation_reasoning: string;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

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
