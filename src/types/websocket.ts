import { AttackStats, DefenseStats, EvalStats } from './data';
import { EvaluationLabel, ChatSession, ChatTurn } from './session';

// ─── Automatic run WS events ───────────────────────────────────────────────────

export interface WSJoinRunChannel   { runId: string; }
export interface WSLeaveRunChannel  { runId: string; }

export interface WSRunStarted {
  run_id: string; strategy: string; timestamp: string; session_id?: string;
}
export interface WSRunProgress {
  run_id: string; current: number; total: number; message: string; progress_percent: number;
}
export interface WSRunCompleted {
  run_id: string; total_attempts: number; timestamp: string;
}
export interface WSRunError {
  run_id: string; error: string; error_type?: string;
}
export interface WSNewRunAvailable {
  run_id: string; run_summary: { name: string; strategy: string; status: string };
}
export interface WSAttackGenerated {
  run_id: string;
  turn_id: string;
  index: number;
  attack: {
    preview: string;
    full_text: string;
    type?: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  };
}
export interface WSDefenseResponseGenerated {
  run_id: string;
  turn_id: string;
  index: number;
  defence: {
    preview?: string;
    full_text?: string;
    status_code?: number;
    was_blocked?: boolean;
    latency_ms?: number;
    blocked_by?: string;
    attack_type?: string;
    timestamp?: string;
  };
}
export interface WSAttackStats {
  run_id: string; stats: AttackStats;
}
export interface WSDefenseStats {
  run_id: string; stats: DefenseStats;
}
export interface WSEvalResult {
  run_id: string;
  turn_id: string;
  index: number;
  evaluation: {
    score?: number;
    success?: boolean;
    category?: string;
    reasoning?: string;
    summary?: string;
    timestamp?: string;
  };
}
export interface WSEvalStats {
  run_id: string;
  stats: EvalStats;
}

// ─── Manual run WS events ──────────────────────────────────────────────────────

export interface WSManualSessionCreated {
  run_id: string;
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
    preview?: string;
    full_text?: string;
    metadata?: {
      user_input?: string;   // render THIS as the user bubble
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
