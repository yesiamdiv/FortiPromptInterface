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
