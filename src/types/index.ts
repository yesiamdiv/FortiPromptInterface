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

export interface Run {
  runid: string;
  name: string;
  description?: string;
  status: RunStatus;
  components: ComponentType[];
  graph_config?: GraphConfig;
  createdAt: string;
  updatedAt: string;
}

// ─── Graph / Strategy ──────────────────────────────────────────────────────────

export interface GraphConfig {
  strategy_name: string;
  strategy_params?: Record<string, any>;
  graph_type: 'automatic' | 'manual';
}

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

export interface RunConfig {
  graph_type: 'automatic' | 'manual';
  attack_node_config?: { node_type: string; };
  defense_node_config?: { node_type: string; };
  evaluation_node_config?: { node_type: string; };
  strategy_config: { strategy_name: string; strategy_params?: Record<string, any>; };
}

export interface CreateRunRequest {
  name: string;
  description?: string;
  config: RunConfig; // New: top-level config object
  payload?: Record<string, any>;
}

export interface UpdateRunRequest {
  name?: string;
  description?: string;
  strategy_params?: Record<string, any>; // Sent directly at the root now[cite: 4]
}

// ─── Run Progress (WebSocket) ──────────────────────────────────────────────────

export interface RunProgress {
  current: number;
  total: number;
  message: string;
  progress_percent: number;
}

// ─── Automatic Run Operations ──────────────────────────────────────────────────

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

// ─── Defense ─────────────────────────────────────────────────────────────────────

export type DefenseEvaluation = 'blocked' | 'passed' | 'failed_filter';

export interface DefenseFilter {
  name: string;
  enabled: boolean;
}

export interface DefenseConfig {
  filters: DefenseFilter[];
  model: string;
}

export interface DefenseResponse {
  promptId: string;
  defenseResponse: string;
  evaluation: DefenseEvaluation;
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

// ─── WebSocket Events ──────────────────────────────────────────────────────────

export interface WSJoinRunChannel   { runId: string; }
export interface WSLeaveRunChannel  { runId: string; }

export interface WSRunStarted {
  run_id: string;
  strategy: string;
  timestamp: string;
  session_id?: string;
}

export interface WSRunProgress {
  run_id: string;
  current: number;
  total: number;
  message: string;
  progress_percent: number;
}

export interface WSRunCompleted {
  run_id: string;
  total_attempts: number;
  timestamp: string;
}

export interface WSRunError {
  run_id: string;
  error: string;
  error_type?: string;
}

export interface WSNewRunAvailable {
  run_id: string;
  run_summary: { name: string; strategy: string; status: string };
}

export interface WSAttackGenerated {
  runId: string;
  prompt: AttackPrompt;
}

export interface WSDefenseResponseGenerated {
  runId: string;
  response: DefenseResponse;
}

export interface WSAttackStats {
  runId: string;
  stats: AttackStats;
}

export interface WSDefenseStats {
  runId: string;
  stats: DefenseStats;
}
