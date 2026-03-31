import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';
import {
  WSJoinRunChannel,
  WSLeaveRunChannel,
  WSAttackGenerated,
  WSAttackStatsUpdated,
  WSAttackCompleted,
  WSAttackError,
  WSDefenseResponseGenerated,
  WSDefenseStatsUpdated,
  WSDefenseCompleted,
  WSDefenseError,
} from '../types';

class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;

  // ─── Connect ──────────────────────────────────────────────────────────────
  connect(url: string, authToken?: string): void {
    if (this.socket?.connected) {
      console.warn('[WebSocket] Already connected');
      return;
    }

    this.socket = io(url, {
      auth: authToken ? { token: authToken } : undefined,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.setupEventListeners();
  }

  // ─── Disconnect ───────────────────────────────────────────────────────────
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      console.log('[WebSocket] Disconnected');
    }
  }

  // ─── Rooms ────────────────────────────────────────────────────────────────
  joinRun(runId: string): void {
    if (!this.socket) {
      console.error('[WebSocket] Not connected');
      return;
    }
    const payload: WSJoinRunChannel = { runId };
    this.socket.emit('join_run_channel', payload);
    console.log('[WebSocket] Joined run channel:', runId);
  }

  leaveRun(runId: string): void {
    if (!this.socket) return;
    const payload: WSLeaveRunChannel = { runId };
    this.socket.emit('leave_run_channel', payload);
    console.log('[WebSocket] Left run channel:', runId);
  }

  // ─── Events ───────────────────────────────────────────────────────────────
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection
    this.socket.on('connect', () => {
      this.connected = true;
      console.log('[WebSocket] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('[WebSocket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[WebSocket] Error:', error);
    });

    // ── Attack Events ───────────────────────────────────────────────────────

    // Server → Client: attack_generated
    this.socket.on('attack_generated', (data: WSAttackGenerated) => {
      const { addAttackPrompt, activeRunId } = useAppStore.getState();
      
      console.log('[WebSocket] attack_generated:', data);
      
      if (activeRunId === data.runId) {
        addAttackPrompt(data.prompt);
      }
    });

    // Server → Client: attack_stats_updated
    this.socket.on('attack_stats_updated', (data: WSAttackStatsUpdated) => {
      const { setAttackStats, activeRunId } = useAppStore.getState();
      
      console.log('[WebSocket] attack_stats_updated:', data);
      
      if (activeRunId === data.runId) {
        setAttackStats(data.stats);
      }
    });

    // Server → Client: attack_completed
    this.socket.on('attack_completed', (data: WSAttackCompleted) => {
      const { setIsAttacking, setAttackStats, updateRun, activeRunId } = useAppStore.getState();

      console.log('[WebSocket] attack_completed:', data);

      if (activeRunId === data.runId) {
        setAttackStats(data.finalStats);
        setIsAttacking(false);
        updateRun(data.runId, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Server → Client: attack_error
    this.socket.on('attack_error', (data: WSAttackError) => {
      const { setAttackError, setIsAttacking, updateRun, activeRunId } = useAppStore.getState();

      console.error('[WebSocket] attack_error:', data);

      if (activeRunId === data.runId) {
        setAttackError(data.error);
        setIsAttacking(false);
        updateRun(data.runId, {
          status: 'failed',
          updatedAt: data.timestamp,
        });
      }
    });

    // ── Defense Events ──────────────────────────────────────────────────────

    // Server → Client: defense_response_generated
    this.socket.on('defense_response_generated', (data: WSDefenseResponseGenerated) => {
      const { addDefenseResponse, activeRunId } = useAppStore.getState();

      console.log('[WebSocket] defense_response_generated:', data);

      if (activeRunId === data.runId) {
        addDefenseResponse(data.response);
      }
    });

    // Server → Client: defense_stats_updated
    this.socket.on('defense_stats_updated', (data: WSDefenseStatsUpdated) => {
      const { setDefenseStats, activeRunId } = useAppStore.getState();

      console.log('[WebSocket] defense_stats_updated:', data);

      if (activeRunId === data.runId) {
        setDefenseStats(data.stats);
      }
    });

    // Server → Client: defense_completed
    this.socket.on('defense_completed', (data: WSDefenseCompleted) => {
      const { setDefenseStats, setIsEvaluating, updateRun, activeRunId } = useAppStore.getState();

      console.log('[WebSocket] defense_completed:', data);

      if (activeRunId === data.runId) {
        setDefenseStats(data.finalStats);
        setIsEvaluating(false);
        updateRun(data.runId, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    // Server → Client: defense_error
    this.socket.on('defense_error', (data: WSDefenseError) => {
      const { setDefenseError, setIsEvaluating, updateRun, activeRunId } = useAppStore.getState();

      console.error('[WebSocket] defense_error:', data);

      if (activeRunId === data.runId) {
        setDefenseError(data.error);
        setIsEvaluating(false);
        updateRun(data.runId, {
          status: 'failed',
          updatedAt: data.timestamp,
        });
      }
    });
  }

  // ─── Utils ────────────────────────────────────────────────────────────────
  isConnected(): boolean {
    return this.connected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();