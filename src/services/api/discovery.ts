import { apiFetch, BASE_URL } from '../http';
import { StrategySchema, Provider, NodeSchema } from '../../types';

/** GET /strategies — all strategies + schemas for dynamic form building */
export const getStrategies = async (): Promise<StrategySchema[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/strategies`);
  return Array.isArray(data) ? data : data?.strategies ?? [];
};

/** GET /strategies/{name}/schema */
export const getStrategySchema = async (name: string): Promise<StrategySchema> =>
  apiFetch<StrategySchema>(`${BASE_URL}/strategies/${name}/schema`);

/** GET /providers */
export const getProviders = async (): Promise<Provider[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/providers`);
  return Array.isArray(data) ? data : data?.providers ?? [];
};

/**
 * GET /nodes/{type}
 * Returns node schemas with dynamic param definitions for RunConfigPanel.
 * type: 'attack' | 'defense' | 'evaluation'
 */
export const getNodes = async (
  nodeType: 'attack' | 'defense' | 'evaluation'
): Promise<NodeSchema[]> => {
  const data = await apiFetch<any>(`${BASE_URL}/nodes/${nodeType}`);
  return Array.isArray(data) ? data : data?.nodes ?? [];
};
