import { io, Socket } from 'socket.io-client';
import { BackendConfig } from '../types';
import { useAppStore } from '../store/appStore';

// Placeholder for a toast notification function. This should be replaced with an actual UI library's toast.
const showToast = (message: string, type: 'error' | 'success' | 'info') => {
  console.log(`Toast (${type}): ${message}`);
};

let socket: Socket | null = null;

export const initWebSocket = (config: BackendConfig) => {
  if (socket) {
    console.log('WebSocket already connected.');
    return;
  }

  socket = io(config.url, {
    // Add any necessary options here, e.g., authentication tokens
    // auth: {
    //   token: config.apiKey
    // }
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
    showToast('Connected to backend', 'success');
    // Subscribe to relevant events after connection
    // Example: Subscribe to updates for all runs
    socket?.emit('subscribe', { topic: 'runs' });
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
    showToast('Disconnected from backend', 'error');
    socket = null;
  });

  socket.on('connect_error', (err) => {
    console.error('WebSocket connection error:', err);
    showToast(`WebSocket connection error: ${err.message}`, 'error');
    // Consider implementing retry logic here
  });

  // Example of handling a run update event
  socket.on('run_update', (updatedRun) => {
    console.log('Received run update:', updatedRun);
    // Dispatch action to update the store
    useAppStore.getState().runsState.updateRun(updatedRun.id, updatedRun);
  });

  // Add more event listeners as needed for other backend events
  socket.on('run_created', (newRun) => {
    console.log('Received new run:', newRun);
    useAppStore.getState().runsState.addRun(newRun);
  });

  socket.on('run_deleted', (runId) => {
    console.log('Received run deletion:', runId);
    useAppStore.getState().runsState.deleteRun(runId);
  });

  // Add more event listeners as needed for other backend events
  // socket.on('new_prompt', (data) => { ... });
  // socket.on('evaluation_result', (data) => { ... });
};

export const closeWebSocket = () => {
  if (socket) {
    socket.close();
    socket = null;
    console.log('WebSocket closed');
  }
};

export const getWebSocket = (): Socket => {
  if (!socket) {
    throw new Error('WebSocket not initialized. Call initWebSocket first.');
  }
  return socket;
};
