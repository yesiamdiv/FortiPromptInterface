import { initHttpService, httpService } from './httpService';
import { initWebSocket, closeWebSocket, getWebSocket } from './webSocketService';
import { fetchRuns, fetchBackendConfig } from './api';
import { BackendConfig, DataStorageConfig, RunState } from '../types';
import { useAppStore } from '../store/appStore';

// Initialize services on app startup
export const initializeServices = (backendConfig: BackendConfig, dataStorageConfig: DataStorageConfig) => {
  // Initialize HTTP service
  initHttpService(backendConfig);
  useAppStore.getState().globalConfigState.setBackendConfig(backendConfig);
  useAppStore.getState().globalConfigState.setDataStorageConfig(dataStorageConfig);

  // Initialize WebSocket service
  initWebSocket(backendConfig);
};

// Close WebSocket connection on app shutdown
export const cleanupServices = () => {
  closeWebSocket();
};

// Example of how to use the services (e.g., in a component or effect)
export const loadInitialData = async () => {
  try {
    // Fetch runs and update store
    const runs = await fetchRuns();
    useAppStore.getState().runsState.setRuns(runs.reduce((acc: Record<string, RunState>, run: RunState) => {
      acc[run.id] = run;
      return acc;
    }, {} as Record<string, RunState>));

    // Fetch backend config if not already set
    if (!useAppStore.getState().globalConfigState.backendConfig.url) {
      const config = await fetchBackendConfig();
      initializeServices(config, useAppStore.getState().globalConfigState.dataStorageConfig);
    }

  } catch (error) {
    console.error('Failed to load initial data:', error);
    // Handle error, e.g., show a toast notification
  }
};
