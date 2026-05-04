// services/websocket.ts
// ─── WebSocket (Socket.IO) Service ───────────────────────────────────────────
//
// Room model:
//   Automatic runs → join run_id room; listen for attack_generated, run_completed, etc.
//   Manual runs    → join session_id room; listen for manual_* events + run_idle.
//
// The input box MUST remain disabled until run_idle fires for the current session.

import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';
import { useManualStore } from '../store/manualStore';

import {
  WSNewRunAvailable,
  WSRunStarted,
  WSRunProgress,
  WSRunCompleted,
  WSRunError,
  WSAttackGenerated,
  WSDefenseResponseGenerated,
} from '../types';

import {
  WSManualSessionCreated,
  WSManualAttackGenerated,
  WSManualDefenseResponse,
  WSManualEvaluationComplete,
  WSManualTurnCompleted,
  WSRunIdle,
} from '../types/manual';

class WebSocketService {
  private socket: Socket | null = null;
  private _connected = false;

  // ─── Connect ───────────────────────────────────────────────────────────────

  connect(url: string, authToken?: string): void {
    if (this.socket?.connected) {
      console.warn('[WS] Already connected');
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

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this._connected = false;
    console.log('[WS] Disconnected');
  }

  // ─── Rooms ─────────────────────────────────────────────────────────────────

  joinRun(runId: string): void {
    this.socket?.emit('join_run_channel', { runId });
    console.log('[WS] Joined run room:', runId);
  }

  leaveRun(runId: string): void {
    this.socket?.emit('leave_run_channel', { runId });
  }

  /** Must be called after createManualSession() to receive manual_* events. */
  joinSessionRoom(sessionId: string): void {
    this.socket?.emit('join_session_room', { session_id: sessionId });
    console.log('[WS] Joined session room:', sessionId);
  }

  leaveSessionRoom(sessionId: string): void {
    this.socket?.emit('leave_session_room', { session_id: sessionId });
  }

  // ─── Event Listeners ───────────────────────────────────────────────────────

  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection lifecycle
    this.socket.on('connect', () => {
      this._connected = true;
      console.log('[WS] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      this._connected = false;
      console.log('[WS] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Error:', err);
    });

    this.setupGlobalEvents();
    this.setupAutomaticRunEvents();
    this.setupManualRunEvents();
  }

  // ─── Global events (all clients) ───────────────────────────────────────────

  private setupGlobalEvents(): void {
    this.socket!.on('new_run_available', (data: WSNewRunAvailable) => {
      const { addRun } = useAppStore.getState();
      console.log('[WS] new_run_available:', data);
      addRun({
        runid:       data.run_id,
        name:        data.run_summary.name,
        description: '',
        status:      data.run_summary.status as any,
        components:  [],
        createdAt:   new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      });
    });
  }

  // ─── Automatic run events (run_id room) ────────────────────────────────────

  private setupAutomaticRunEvents(): void {
    const s = this.socket!;

    s.on('run_started', (data: WSRunStarted) => {
      const { updateRun, activeRunId } = useAppStore.getState();
      if (activeRunId === data.run_id) {
        updateRun(data.run_id, { status: 'running' });
      }
    });

    s.on('run_progress', (data: WSRunProgress) => {
      const { setRunProgress, activeRunId } = useAppStore.getState();
      if (activeRunId === data.run_id) {
        setRunProgress({
          current:          data.current,
          total:            data.total,
          message:          data.message,
          progress_percent: data.progress_percent,
        });
      }
    });

    s.on('attack_generated', (data: WSAttackGenerated) => {
      const { addAttackPrompt, activeRunId } = useAppStore.getState();
      if (activeRunId === data.runId) {
        addAttackPrompt(data.prompt);
      }
    });

    s.on('defense_response_generated', (data: WSDefenseResponseGenerated) => {
      const { addDefenseResponse, activeRunId } = useAppStore.getState();
      if (activeRunId === data.runId) {
        addDefenseResponse(data.response);
      }
    });

    s.on('run_completed', (data: WSRunCompleted) => {
      const { updateRun, setIsAttacking, setRunProgress, activeRunId } = useAppStore.getState();
      if (activeRunId === data.run_id) {
        updateRun(data.run_id, { status: 'completed', updatedAt: new Date().toISOString() });
        setIsAttacking(false);
        setRunProgress(null);
      }
    });

    s.on('run_error', (data: WSRunError) => {
      const { updateRun, setIsAttacking, setAttackError, activeRunId } = useAppStore.getState();
      console.error('[WS] run_error:', data);
      if (activeRunId === data.run_id) {
        updateRun(data.run_id, { status: 'failed', updatedAt: new Date().toISOString() });
        setIsAttacking(false);
        setAttackError(data.error);
      }
    });
  }

  // ─── Manual run events (session_id room) ───────────────────────────────────

  private setupManualRunEvents(): void {
    const s = this.socket!;

    s.on('manual_session_created', (data: WSManualSessionCreated) => {
      const { addSession } = useManualStore.getState();
      console.log('[WS] manual_session_created:', data);
      addSession(data.session);
    });

    /**
     * manual_attack_generated — the AI's attack turn is ready.
     * Render user bubble from attack.metadata.user_input, NOT attack.prompt.
     */
    s.on('manual_attack_generated', (data: WSManualAttackGenerated) => {
      const { appendTurnToActiveSession, activeSession } = useManualStore.getState();
      if (activeSession?.session_id !== data.session_id) return;

      // Use metadata.user_input for the clean user-facing text
      const userText = data.attack.metadata?.user_input
        ?? data.attack.preview
        ?? data.attack.full_text
        ?? '(attack)';

      appendTurnToActiveSession({
        turn_id:   data.turn_id,
        role:      'attacker',
        content:   userText,
        timestamp: new Date().toISOString(),
        metadata:  data.attack.metadata ?? {},
      });
    });

    /**
     * manual_defence_response — the defense system replied.
     */
    s.on('manual_defence_response', (data: WSManualDefenseResponse) => {
      const { appendTurnToActiveSession, activeSession } = useManualStore.getState();
      if (activeSession?.session_id !== data.session_id) return;

      const text = data.defence.full_text ?? data.defence.response ?? '(defense response)';

      appendTurnToActiveSession({
        turn_id:   data.turn_id,
        role:      'defense',
        content:   text,
        timestamp: new Date().toISOString(),
        metadata:  {
          was_blocked: data.defence.was_blocked,
          ...data.defence.metadata,
        },
      });
    });

    /**
     * manual_evaluation_complete — append evaluation result as a turn.
     */
    s.on('manual_evaluation_complete', (data: WSManualEvaluationComplete) => {
      const { appendTurnToActiveSession, activeSession } = useManualStore.getState();
      if (activeSession?.session_id !== data.session_id) return;

      const reasoning = data.evaluation.reasoning ?? '';
      const label     = data.evaluation.label ?? (data.evaluation.success ? 'breached' : 'blocked');
      const score     = data.evaluation.score;

      appendTurnToActiveSession({
        turn_id:   `eval-${data.turn_id}`,
        role:      'evaluation',
        content:   reasoning,
        timestamp: new Date().toISOString(),
        metadata:  { label, score, ...data.evaluation },
      });
    });

    /**
     * manual_turn_completed — internal signal; run_idle will follow shortly.
     */
    s.on('manual_turn_completed', (data: WSManualTurnCompleted) => {
      console.log('[WS] manual_turn_completed, waiting for run_idle', data);
    });

    /**
     * run_idle — THE signal to re-enable the chat input box.
     * Also update the active session's last_turn_id in the store if needed.
     */
    s.on('run_idle', (data: WSRunIdle) => {
      const { setIsWaitingForResponse, activeSession } = useManualStore.getState();
      console.log('[WS] run_idle:', data);
      if (activeSession?.session_id === data.session_id) {
        setIsWaitingForResponse(false);
      }
    });
  }

  // ─── Utils ─────────────────────────────────────────────────────────────────

  isConnected(): boolean {
    return this._connected && this.socket?.connected === true;
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const websocketService = new WebSocketService();
