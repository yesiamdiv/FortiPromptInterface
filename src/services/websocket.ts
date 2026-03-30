import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';
import {
  AttackPrompt,
  DefenseLog,
  DefenseStats,
} from '../types';

// Optional: define missing type if not already موجود
type AttackStats = {
  total: number;
  completed: number;
};

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
    this.socket.emit('join_run_channel', { runId });
  }

  leaveRun(runId: string): void {
    if (!this.socket) return;
    this.socket.emit('leave_run_channel', { runId });
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

    // ── Attack ──────────────────────────────────────────────────────────────
    this.socket.on('attack_generated', (data: {
      runId: string;
      prompt: AttackPrompt;
    }) => {
      const { addAttackPrompt, activeRunId } = useAppStore.getState();
      if (activeRunId === data.runId) {
        addAttackPrompt(data.prompt);
      }
    });

    this.socket.on('attack_prompt_updated', (data: {
      runId: string;
      promptId: string;
      updates: Partial<AttackPrompt>;
    }) => {
      const { attackPrompts, setAttackPrompts, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        const updated = attackPrompts.map(p =>
          p.id === data.promptId ? { ...p, ...data.updates } : p
        );
        setAttackPrompts(updated);
      }
    });

    this.socket.on('attack_stats_updated', (data: {
      runId: string;
      stats: AttackStats;
    }) => {
      console.log('[WebSocket] attack stats:', data);
    });

    this.socket.on('attack_completed', (data: {
      runId: string;
    }) => {
      const { setIsAttacking, updateRun, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        setIsAttacking(false);
        updateRun(data.runId, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    this.socket.on('attack_error', (data: {
      runId: string;
      error: string;
      timestamp: string;
    }) => {
      const { setAttackError, setIsAttacking, updateRun, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        setAttackError(data.error);
        setIsAttacking(false);
        updateRun(data.runId, {
          status: 'failed',
          updatedAt: data.timestamp,
        });
      }
    });

    // ── Defense ─────────────────────────────────────────────────────────────
    this.socket.on('defense_log', (data: {
      runId: string;
      log: DefenseLog;
    }) => {
      const { addDefenseLog, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        addDefenseLog(data.log);
      }
    });

    this.socket.on('defense_progress', (data: {
      runId: string;
      testedVectors: number;
      totalVectors: number;
    }) => {
      console.log('[WebSocket] defense progress:', data);
    });

    this.socket.on('defense_stats_updated', (data: {
      runId: string;
      stats: DefenseStats;
    }) => {
      const { setDefenseStats, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        setDefenseStats(data.stats);
      }
    });

    this.socket.on('defense_completed', (data: {
      runId: string;
      finalStats: DefenseStats;
    }) => {
      const { setDefenseStats, setIsEvaluating, updateRun, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        setDefenseStats(data.finalStats);
        setIsEvaluating(false);
        updateRun(data.runId, {
          status: 'completed',
          updatedAt: new Date().toISOString(),
        });
      }
    });

    this.socket.on('defense_error', (data: {
      runId: string;
      error: string;
      timestamp: string;
    }) => {
      const { setDefenseError, setIsEvaluating, updateRun, activeRunId } = useAppStore.getState();

      if (activeRunId === data.runId) {
        setDefenseError(data.error);
        setIsEvaluating(false);
        updateRun(data.runId, {
          status: 'failed',
          updatedAt: data.timestamp,
        });
      }
    });

    // ── Run Status ──────────────────────────────────────────────────────────
    this.socket.on('run_status_changed', (data: {
      runId: string;
      status: 'idle' | 'running' | 'completed' | 'failed';
      updatedAt: string;
    }) => {
      const { updateRun } = useAppStore.getState();
      updateRun(data.runId, {
        status: data.status,
        updatedAt: data.updatedAt,
      });
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