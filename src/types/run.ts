import { ForwardRefExoticComponent, RefAttributes } from 'react';
import { LucideProps } from 'lucide-react';

export type RunStatus = 'idle' | 'running' | 'completed' | 'failed' | 'stopped';
export type ComponentType = 'attack' | 'defense' | 'manual';

export interface ComponentLabel {
  name: string;
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>;
  color: string;
}

export interface RunConfig {
  graph_type: 'automatic' | 'manual' | 'batch';
  attack_node_config?: AttackNodeConfig;
  defense_node_config?: DefenseNodeConfig;
  evaluation_node_config?: EvaluationNodeConfig;
  strategy_config?: StrategyConfig;
}

export interface AttackNodeConfig   { node_type?: string; [key: string]: any; }
export interface DefenseNodeConfig  { node_type?: string; [key: string]: any; }
export interface EvaluationNodeConfig { node_type?: string; [key: string]: any; }

export interface StrategyConfig {
  strategy_name?: string;
  strategy_params?: Record<string, any>;
}

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

export interface RunProgress {
  current: number;
  total: number;
  message: string;
  progress_percent: number;
}

export interface StartAutomaticRunRequest {
  runtime_config?: Record<string, any>;
}

export interface StartAutomaticRunResponse {
  message: string;
  run_id: string;
  status: RunStatus;
}
