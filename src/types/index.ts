import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

// ─── Run / Session ─────────────────────────────────────────────────────────────

export type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'paused';
export type ComponentType = 'attack' | 'defense' | 'manual';

export interface ComponentLabel {
  name: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  color: string;
}

// ─── Node configs ──────────────────────────────────────────────────────────────

export interface AttackNodeConfig   { node_type?: string; [key: string]: any; }
export interface DefenseNodeConfig  { node_type?: string; [key: string]: any; }
export interface EvaluationNodeConfig { node_type?: string; [key: string]: any; }

export interface StrategyConfig {
  strategy_name?: string;
  strategy_params?: Record<string, any>;
}

export interface RunConfig {
  graph_type: 'automatic' | 'manual' | 'batch';
  attack_node_config?: AttackNodeConfig;
  defense_node_config?: DefenseNodeConfig;
  evaluation_node_config?: EvaluationNodeConfig;
  strategy_config?: StrategyConfig;
}

// ─── Run ───────────────────────────────────────────────────────────────────────

export interface Run {
  runid: string;
  name: string;
  description?: string;
  status: RunStatus;
  components: ComponentType[];
  config?: RunConfig;
  createdAt: string;
  updatedAt: string;
}

// ─── Discovery ─────────────────────────────────────────────────────────────────

export interface StrategySchema {
  strategy_name: string;
  description?: string;
  schema_definition: Record<string, any>;
}

export interface Provider {
  name: string;
  display_name?: string;
}

export interface NodeSchema {
  node_type: string;
  node_name: string;
  description?: string;
  schema_definition: Record<string, any>;
}

// ─── Run Requests ──────────────────────────────────────────────────────────────

export interface CreateRunRequest {
  name: string;
  description?: string;
  config: RunConfig;
  payload?: Record<string, any>;
}

export interface UpdateRunRequest {
  name?: string;
  description?: string;
  strategy_params?: Record<string, any>;
  attack_node_params?: Record<string, any>;
  defense_node_params?: Record<string, any>;
  evaluation_node_params?: Record<string, any>;
}

// ─── Run Progress ──────────────────────────────────────────────────────────────

export interface RunProgress {
  current: number;
  total: number;
  message: string;
  progress_percent: number;
}

// ─── Automatic Run ─────────────────────────────────────────────────────────────

export interface StartAutomaticRunRequest {
  runtime_config?: Record<string, any>;
}

export interface StartAutomaticRunResponse {
  message: string;
  run_id: string;
  status: RunStatus;
}

// ─── Attack ─────────────────────────────────────────────────────────────────────

export type AttackStatus = 'generated' | 'sent' | 'failed' | 'breached' | 'blocked';

export interface AttackPrompt {
  promptId: string;
  content: string;
  status: AttackStatus;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AttackStats {
  totalPrompts: number;
  pendingAttacks: number;
  attacksGenerated: number;
}

// ─── Defense ──────────────────────────────────────────────────────────────────

export type DefenseEvaluation = 'blocked' | 'passed' | 'failed_filter';

export interface DefenseFilter {
  name: string;
  enabled: boolean;
}

export interface DefenseConfig {
  filters: DefenseFilter[];
  model: string;
}

/**
 * A single response from the defense node.
 * was_blocked: true  → defense system intercepted the prompt before it reached the LLM
 * was_blocked: false → LLM replied; defenseResponse is the LLM reply
 * blocked_by:        → which filter layer caught it (e.g. 'regex_filter', 'llm_judge')
 * attack_type:       → detected attack category if identified (e.g. 'prompt_injection')
 */
export interface DefenseResponse {
  promptId: string;
  defenseResponse: string;    // LLM reply text OR block message
  evaluation: DefenseEvaluation;
  was_blocked: boolean;
  blocked_by?: string;        // which filter layer caught it
  attack_type?: string;       // detected attack category
  blockedAt?: string;
  timestamp: string;
}

export interface FilterPerformance {
  blocked: number;
  falsePositives: number;
}

export interface DefenseStats {
  totalResponses: number;
  blockedCount: number;
  passedCount: number;
  overallDefenseScore: number;
  filterPerformance?: Record<string, FilterPerformance>;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export type EvalVerdict = 'breach' | 'defended' | 'partial';

/**
 * Result from the evaluation node.
 * Contains both the original attack prompt and defense response for context.
 */
export interface EvalResult {
  evalId: string;
  promptId: string;
  verdict: EvalVerdict;
  score: number;           // 0–1, higher = more successful attack
  reasoning: string;       // evaluator explanation
  timestamp: string;
  // Denormalised context for display (populated from linked attack/defense data)
  attackContent?: string;
  defenseContent?: string;
  was_blocked?: boolean;
  attack_type?: string;
}

export interface EvalStats {
  total: number;
  breaches: number;
  defended: number;
  partial: number;
  averageScore: number;
  breachRate: number;       // 0–1
}

// ─── WebSocket Events ──────────────────────────────────────────────────────────

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

/**
 * Fired by the evaluation node after each attack-defense cycle.
 * Suggested new backend event — see API_DOCS.md.
 */
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