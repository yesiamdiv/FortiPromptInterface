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
  defenseResponse: string;
  evaluation: DefenseEvaluation;
  was_blocked: boolean;
  blocked_by?: string;
  attack_type?: string;
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

export type EvalVerdict = 'breach' | 'defended' | 'partial';

/**
 * Result from the evaluation node.
 * Contains both the original attack prompt and defense response for context.
 */
export interface EvalResult {
  evalId: string;
  promptId: string;
  verdict: EvalVerdict;
  score: number;
  reasoning: string;
  timestamp: string;
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
  breachRate: number;
}
