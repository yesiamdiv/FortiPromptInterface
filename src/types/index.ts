import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

// ─── Attack ───────────────────────────────────────────────────────────────────

// Updated to match backend: "generated", "sent", "failed", "breached", "blocked"
export type AttackStatus = 'generated' | 'sent' | 'failed' | 'breached' | 'blocked';

export type AttackStrategy = 
  | 'default'
  | 'jailbreak'
  | 'prompt_injection'
  | 'indirect_injection'
  | 'prompt_leaking'
  | 'chain_attack'
  | 'role_play_exploit';

export type AttackDomain = 'copyright' | 'cybersecurity' |'harassment' | 'harmful' | 'illegal' | 'misinformation';

export interface AttackConfig {
  model: string;
  attackStrategy: AttackStrategy;
  domain: AttackDomain;
  modelUrl: string;
  iterations: number;
  parameters?: {
    temperature?: number;
    engine?: string;
    [key: string]: any;
  };
}

export interface AttackPrompt {
  promptId: string;
  content: string;
  status: AttackStatus;
  timestamp: string;
}

export interface AttackStats {
  totalPrompts: number;
  pendingAttacks: number;
  attacksGenerated: number;
}

// ─── Defense ─────────────────────────────────────────────────────────────────

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

// ─── Session / Run ────────────────────────────────────────────────────────────

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
  createdAt: string;
  updatedAt: string;
}

export interface CreateRunRequest {
  name: string;
  description?: string;
  components: ComponentType[];
}

export interface UpdateRunRequest {
  name?: string;
  description?: string;
  status?: RunStatus;
}

// ─── WebSocket Events ─────────────────────────────────────────────────────────

export interface WSJoinRunChannel {
  runId: string;
}

export interface WSLeaveRunChannel {
  runId: string;
}

export interface WSAttackGenerated {
  runId: string;
  prompt: AttackPrompt;
}

export interface WSAttackStatsUpdated {
  runId: string;
  stats: AttackStats;
}

export interface WSAttackCompleted {
  runId: string;
  finalStats: AttackStats;
}

export interface WSAttackError {
  runId: string;
  error: string;
  timestamp: string;
}

export interface WSDefenseResponseGenerated {
  runId: string;
  response: DefenseResponse;
}

export interface WSDefenseStatsUpdated {
  runId: string;
  stats: DefenseStats;
}

export interface WSDefenseCompleted {
  runId: string;
  finalStats: DefenseStats;
}

export interface WSDefenseError {
  runId: string;
  error: string;
  timestamp: string;
}

// ─── API Responses ────────────────────────────────────────────────────────────

export interface StartAttackRequest {
  resumeFromLastSaved?: boolean;
}

export interface StartAttackResponse {
  message: string;
  runId: string;
  status: RunStatus;
}

export interface StopAttackResponse {
  message: string;
  runId: string;
  status: RunStatus;
}