import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

// ─── Attack ───────────────────────────────────────────────────────────────────

export type AttackStatus = 'success' | 'partial' | 'blocked' | 'running';

export type AttackType =
  | 'Direct Injection'
  | 'Indirect Injection'
  | 'Prompt Leaking'
  | 'Jailbreak'
  | 'Chain Attack'
  | 'Role Play Exploit';

export interface AttackConfig {
  backendType: BackendType;
  connectionUrl: string;
  apiKey: string;
  modelSelection: ModelSelection;
  attackType: AttackType;
  targetUrl: string;
  attackRate: number;
  maxIterations: number;
  successThreshold: number;
  initialAttackPrompt: string;
  attackScenario: string;
  targetInformation: string;
}

export interface AttackPrompt {
  id: string;
  prompt: string;
  attackType: AttackType;
  status: AttackStatus;
  category: string;
  score: number;
  timestamp: string;
}

/** @deprecated use AttackPrompt */
export type GeneratedPrompt = AttackPrompt;

// ─── Backend / Model ──────────────────────────────────────────────────────────

export type BackendType = 'Google Colab' | 'OpenAI' | 'Anthropic' | 'Custom API';

export type ModelSelection =
  | 'GPT-4o-mini'
  | 'GPT-4o'
  | 'claude-3-5-sonnet'
  | 'claude-3-haiku'
  | 'gemini-1.5-flash';

export interface BackendConfig {
  backendType: BackendType;
  connectionUrl: string;
  apiKey?: string;
  modelSelection: ModelSelection;
}

// ─── Defense ─────────────────────────────────────────────────────────────────

export interface DefenseLayer {
  id: string;
  name: string;
  enabled: boolean;
  strictness: number;
}

export interface DefenseLog {
  id: string;
  timestamp: string;
  attackType: AttackType;
  blocked: boolean;
  score: number;
  details: string;
}

export interface DefenseStats {
  overallScore: number;
  directInjection: number;
  jailbreakResistance: number;
  promptLeaking: number;
  rolePlayExploits: number;
  indirectInjection: number;
}

export interface DefenseBackendConfig {
  systemPrompt: string;
  guardrailLevel: number;
  attackVectors: string;
  layers: DefenseLayer[];
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export interface DataStorageConfig {
  persistLogs: boolean;
  exportFormat: 'json' | 'csv';
  retentionDays: number;
}

// ─── Session / Run ────────────────────────────────────────────────────────────

export type ComponentType = 'attack-testing' | 'defense-testing';

export interface ComponentLabel {
  name: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  color: string;
}

export interface Run {
  id: string;
  name: string;
  description?: string;
  status: 'idle' | 'running' | 'completed' | 'failed';
  components: ComponentType[];
  createdAt: string;
  updatedAt: string;
  attackConfig?: AttackConfig;
  defenseConfig?: DefenseBackendConfig;
  prompts?: AttackPrompt[];
  defenseLogs?: DefenseLog[];
}

export interface RunTemplate {
  id: string;
  name: string;
  description: string;
  components: ComponentType[];
  attackConfig?: Partial<AttackConfig>;
  defenseConfig?: Partial<DefenseBackendConfig>;
}

// ─── Evaluation ───────────────────────────────────────────────────────────────

export interface EvaluationResult {
  runId: string;
  timestamp: string;
  totalPrompts: number;
  successCount: number;
  partialCount: number;
  blockedCount: number;
  averageScore: number;
  defenseStats?: DefenseStats;
}