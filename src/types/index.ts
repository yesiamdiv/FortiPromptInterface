import { LucideIcon } from 'lucide-react';

export type SessionStatus = 'running' | 'idle' | 'paused' | 'completed' | 'failed';
// export type ComponentType = 'attack-testing' | 'defense-testing' | 'attack-training' | 'defense-training';
export type ComponentType = 'attack-testing' | 'defense-testing';
export type AttackType = 'single' | 'chain';
export type AttackStatus = 'success' | 'partial' | 'blocked';
export type LogType = 'pass' | 'block';

export interface ComponentLabel {
  name: string;
  icon: LucideIcon;
  color: string;
}

export interface Run {
  id: string;
  name: string;
  description: string;
  components: ComponentType[];
  status: SessionStatus;
  lastActive: string;
  created: string;
}

export interface RunTemplate {
  name: string;
  description: string;
  components: ComponentType[];
}

export interface AttackPrompt {
  id: number;
  type: AttackType;
  timestamp: string;
  status: AttackStatus;
  prompts: string[];
}

export interface DefenseLog {
  id: number;
  type: LogType;
  layer: string;
  prompt: string;
  result: string;
  time: string;
}

// --- New Types ---

export interface AttackConfig {
  model: string;
  temperature: number;
  max_tokens: number;
  prompts: string[];
}

export interface BackendConfig {
  url: string;
  apiKey?: string;
}

export interface DefenseLayer {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  order: number;
}

export interface DefenseStats {
  blockedAttacks: number;
  passedLegitimate: number;
  accuracy: number;
}

export interface DefenseBackendConfig {
  url: string;
}

export interface DataStorageConfig {
  type: 'local' | 'remote';
  path?: string;
}

export interface EvaluationResult {
  id: string;
  runId: string;
  attackPrompt: string;
  defenseResponse: string;
  evaluation: string;
  reasoning: string;
  timestamp: string;
}
