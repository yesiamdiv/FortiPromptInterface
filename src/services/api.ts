/**
 * API Service Layer
 * 
 * This file contains placeholder functions for backend communication.
 * Implement these functions once the backend API is ready.
 * 
 * Backend should be REST API + WebSocket for real-time updates
 * Recommended: FastAPI (Python) with WebSocket support
 */

import {
  Run,
  AttackConfig,
  AttackPrompt,
  DefenseLog,
  DefenseStats,
  EvaluationResult,
} from '../types';

// Base URL - Update this when backend is ready
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';

// ==================== RUN MANAGEMENT ====================

/**
 * Fetch all runs from backend
 * GET /api/runs
 */
export const fetchRuns = async (): Promise<Run[]> => {
  return [];
};

/**
 * Create a new run
 * POST /api/runs
 */
export const createRun = async (run: Omit<Run, 'id'>): Promise<Run> => {
  return { ...run, id: '' };
};

/**
 * Update an existing run
 * PATCH /api/runs/:id
 */
export const updateRun = async (id: string, updates: Partial<Run>): Promise<Run> => {
  return { id, ...updates } as Run;
};

/**
 * Delete a run
 * DELETE /api/runs/:id
 */
export const deleteRun = async (id: string): Promise<void> => {
};

/**
 * Export run data
 * GET /api/runs/:id/export
 */
export const exportRun = async (id: string): Promise<Blob> => {
  return new Blob();
};

// ==================== ATTACK OPERATIONS ====================

/**
 * Start an attack test
 * POST /api/runs/:runId/attack/start
 */
export const startAttack = async (runId: string, config: AttackConfig): Promise<void> => {
};

/**
 * Stop an attack test
 * POST /api/runs/:runId/attack/stop
 */
export const stopAttack = async (runId: string): Promise<void> => {
};

/**
 * Fetch attack prompts from backend
 * GET /api/runs/:runId/attack/prompts
 */
export const fetchAttackPrompts = async (runId: string): Promise<AttackPrompt[]> => {
  return [];
};

/**
 * Test backend connection
 * POST /api/attack/test-connection
 */
export const testAttackBackendConnection = async (url: string, apiKey?: string): Promise<boolean> => {
  return false;
};

// ==================== DEFENSE OPERATIONS ====================

/**
 * Start defense monitoring
 * POST /api/runs/:runId/defense/start
 */
export const startDefense = async (runId: string): Promise<void> => {
};

/**
 * Stop defense monitoring
 * POST /api/runs/:runId/defense/stop
 */
export const stopDefense = async (runId: string): Promise<void> => {
};

/**
 * Fetch defense logs from backend
 * GET /api/runs/:runId/defense/logs
 */
export const fetchDefenseLogs = async (runId: string): Promise<DefenseLog[]> => {
  return [];
};

/**
 * Fetch defense statistics
 * GET /api/runs/:runId/defense/stats
 */
// export const fetchDefenseStats = async (runId: string): Promise<DefenseStats> => {
//   return {};
// };

/**
 * Export defense logs
 * GET /api/runs/:runId/defense/export
 */
export const exportDefenseLogs = async (runId: string): Promise<Blob> => {
  return new Blob();
};

/**
 * Test defense backend connection
 * POST /api/defense/test-connection
 */
export const testDefenseBackendConnection = async (url: string): Promise<boolean> => {
  return false;
};

// ==================== EVALUATION OPERATIONS ====================

/**
 * Fetch evaluation results for a run
 * GET /api/runs/:runId/evaluation
 */
export const fetchEvaluationResults = async (runId: string): Promise<EvaluationResult[]> => {
  return [];
};

/**
 * Fetch console output from backend
 * GET /api/runs/:runId/training/console
 */
export const fetchConsoleOutput = async (runId: string): Promise<string[]> => {
  return [];
};

// ==================== WEBSOCKET CONNECTIONS ====================

/**
 * Create WebSocket connection for real-time attack updates
 * WS /ws/runs/:runId/attack
 */
export const connectAttackWebSocket = (
  runId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket | null => {
  return null;
};

/**
 * Create WebSocket connection for real-time defense logs
 * WS /ws/runs/:runId/defense
 */
export const connectDefenseWebSocket = (
  runId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket | null => {
  return null;
};

/**
 * Create WebSocket connection for run status updates
 * WS /ws/runs/:runId/status
 */
export const connectRunStatusWebSocket = (
  runId: string,
  onMessage: (data: any) => void,
  onError?: (error: Event) => void
): WebSocket | null => {
  return null;
};

/**
 * Subscribe to run updates via WebSocket
 * @param runId
 * @param onUpdate
 */
export const subscribeToRunUpdates = (runId: string, onUpdate: (data: any) => void) => {
  const ws = new WebSocket(`${WS_BASE_URL}/${runId}`);

  ws.onopen = () => {
    console.log('Connected to WebSocket');
  };

  ws.onmessage = (event: MessageEvent) => {
    const data = JSON.parse(event.data);
    onUpdate(data);
  };

  ws.onclose = () => {
    console.log('Disconnected from WebSocket');
  };

  ws.onerror = (error: Event) => {
    console.error('WebSocket error:', error);
  };

  return () => {
    ws.close();
  };
};
