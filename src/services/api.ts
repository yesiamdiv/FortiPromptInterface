import { httpService } from './httpService';
import { RunState, BackendConfig } from '../types';

export const fetchRuns = async (): Promise<RunState[]> => {
  try {
    const response = await httpService().get<RunState[]>('/runs');
    return response.data;
  } catch (error) {
    console.error('Error fetching runs:', error);
    throw error;
  }
};

export const createRun = async (runData: Partial<RunState>): Promise<RunState> => {
  try {
    const response = await httpService().post<RunState>('/runs', runData);
    return response.data;
  } catch (error) {
    console.error('Error creating run:', error);
    throw error;
  }
};

export const updateRun = async (id: string, runData: Partial<RunState>): Promise<RunState> => {
  try {
    const response = await httpService().put<RunState>(`/runs/${id}`, runData);
    return response.data;
  } catch (error) {
    console.error(`Error updating run ${id}:`, error);
    throw error;
  }
};

export const deleteRun = async (id: string): Promise<void> => {
  try {
    await httpService().delete(`/runs/${id}`);
  } catch (error) {
    console.error(`Error deleting run ${id}:`, error);
    throw error;
  }
};

// Configuration related API calls
export const fetchBackendConfig = async (): Promise<BackendConfig> => {
  try {
    const response = await httpService().get<BackendConfig>('/config/backend');
    return response.data;
  } catch (error) {
    console.error('Error fetching backend config:', error);
    throw error;
  }
};

export const updateBackendConfig = async (config: BackendConfig): Promise<BackendConfig> => {
  try {
    const response = await httpService().put<BackendConfig>('/config/backend', config);
    return response.data;
  } catch (error) {
    console.error('Error updating backend config:', error);
    throw error;
  }
};
