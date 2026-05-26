// services/websocket.ts
// Room model:
//   Automatic runs → join run_id room
//   Manual runs    → join session_id room after createManualSession()
//
// isRunLocked is set true on run_started and false on run_completed/run_error/run_idle

import { io, Socket } from 'socket.io-client';
import { useAppStore } from '../store/appStore';
import { useManualStore } from '../store/manualStore';

import {
  WSNewRunAvailable, WSRunStarted, WSRunProgress, WSRunCompleted,
  WSRunError, WSAttackGenerated, WSDefenseResponseGenerated,
  WSEvalResult, WSEvalStats, WSDefenseStats, WSAttackStats,
  EvalResult,
} from '../types';

import {
  WSManualAttackGenerated,
  WSManualDefenseResponse, WSManualEvaluationComplete,
  WSManualTurnCompleted, WSRunIdle,
} from '../types/manual';

class WebSocketService {
  private socket: Socket | null = null;
  private _connected = false;

  connect(url: string, authToken?: string): void {
    if (this.socket?.connected) return;
    this.socket = io(url, {
      path: '/socket.io',  // explicit — matches backend mount
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
  }

  joinRun(runId: string): void {
    this.socket?.emit('join_run_room', { run_id: runId });
  }
  leaveRun(runId: string): void {
    this.socket?.emit('leave_run_room', { run_id: runId });
  }

  /** Call immediately after createManualSession() */
  joinSessionRoom(sessionId: string): void {
    this.socket?.emit('join_session_room', { session_id: sessionId });
  }
  leaveSessionRoom(sessionId: string): void {
    this.socket?.emit('leave_session_room', { session_id: sessionId });
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => { this._connected = true; });
    this.socket.on('disconnect', () => { this._connected = false; });
    this.socket.on('connect_error', (err) => { console.error('[WS]', err); });

    this.setupGlobalEvents();
    this.setupAutomaticRunEvents();
    this.setupManualRunEvents();
  }

  private setupGlobalEvents(): void {
    this.socket!.on('new_run_available', (data: WSNewRunAvailable) => {
      const { addRun } = useAppStore.getState();
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

  private setupAutomaticRunEvents(): void {
    const s = this.socket!;

    // ── Run lifecycle ─────────────────────────────────────────────────────────

    s.on('run_started', (data: WSRunStarted) => {
      const { updateRun, setIsRunLocked, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      updateRun(data.run_id, { status: 'running' });
      setIsRunLocked(true);   // Lock config panel once run begins
    });

    s.on('run_progress', (data: WSRunProgress) => {
      const { setRunProgress, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      setRunProgress({ current: data.current, total: data.total, message: data.message, progress_percent: data.progress_percent });
    });

    s.on('run_completed', (data: WSRunCompleted) => {
      const { updateRun, setIsAttacking, setIsEvaluating, setIsRunLocked, setRunProgress, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      updateRun(data.run_id, { status: 'completed', updatedAt: new Date().toISOString() });
      setIsAttacking(false);
      setIsEvaluating(false);
      setIsRunLocked(false);  // Unlock config panel
      setRunProgress(null);
    });

    s.on('run_error', (data: WSRunError) => {
      const { updateRun, setIsAttacking, setIsEvaluating, setIsRunLocked, setAttackError, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      updateRun(data.run_id, { status: 'failed', updatedAt: new Date().toISOString() });
      setIsAttacking(false);
      setIsEvaluating(false);
      setIsRunLocked(false);
      setAttackError(data.error);
    });

    // ── Attack node ────────────────────────────────────────────────────────────

    s.on('attack_generated', (data: WSAttackGenerated) => {
      const { addAttackPrompt, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;   // snake_case
      addAttackPrompt({
        promptId:  data.turn_id,
        content:   data.attack.full_text,
        status:    'generated',
        timestamp: data.attack.timestamp ?? new Date().toISOString(),
        metadata:  data.attack.metadata ?? {},
      });
    });

    // ── Defense node ───────────────────────────────────────────────────────────

    s.on('defence_response', (data: WSDefenseResponseGenerated) => {
      const { addDefenseResponse, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      addDefenseResponse({
        promptId:        data.turn_id,
        defenseResponse: data.defence.full_text ?? '',
        evaluation:      data.defence.was_blocked ? 'blocked' : 'passed',
        was_blocked:     data.defence.was_blocked ?? false,
        blocked_by:      data.defence.blocked_by,
        attack_type:     data.defence.attack_type,
        timestamp:       data.defence.timestamp ?? new Date().toISOString(),
      });
    });

    // ── Evaluation node ────────────────────────────────────────────────────────
    // Suggested new backend events — see API_DOCS.md for implementation spec.

    s.on('evaluation_result', (data: WSEvalResult) => {
      const { addEvalResult, activeRunId, attackPrompts, defenseResponses } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      // Cross-join with already-stored attack prompt and defense response
      const matchedAttack  = attackPrompts.find(a => a.promptId === data.turn_id);
      const matchedDefence = defenseResponses.find(d => d.promptId === data.turn_id);
      addEvalResult({
        evalId:         data.turn_id,
        promptId:       data.turn_id,
        verdict:        data.evaluation.success ? 'breach' : 'defended',
        score:          data.evaluation.score ?? 0,
        reasoning:      data.evaluation.reasoning ?? '',
        timestamp:      data.evaluation.timestamp ?? new Date().toISOString(),
        attackContent:  matchedAttack?.content,
        defenseContent: matchedDefence?.defenseResponse,
        was_blocked:    matchedDefence?.was_blocked,
        attack_type:    matchedDefence?.attack_type,
      });
    });

    // Also listen under the alternate event name the backend may use
    s.on('evaluation_complete', (data: WSEvalResult) => {
      const { addEvalResult, activeRunId, attackPrompts, defenseResponses } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      if (useAppStore.getState().evalResults.some(r => r.evalId === data.turn_id)) return;
      const matchedAttack  = attackPrompts.find(a => a.promptId === data.turn_id);
      const matchedDefence = defenseResponses.find(d => d.promptId === data.turn_id);
      addEvalResult({
        evalId:         data.turn_id,
        promptId:       data.turn_id,
        verdict:        data.evaluation.success ? 'breach' : 'defended',
        score:          data.evaluation.score ?? 0,
        reasoning:      data.evaluation.reasoning ?? '',
        timestamp:      data.evaluation.timestamp ?? new Date().toISOString(),
        attackContent:  matchedAttack?.content,
        defenseContent: matchedDefence?.defenseResponse,
        was_blocked:    matchedDefence?.was_blocked,
        attack_type:    matchedDefence?.attack_type,
      });
    });

    s.on('evaluation_stats_updated', (data: WSEvalStats) => {
      const { setEvalStats, activeRunId } = useAppStore.getState();
      if (activeRunId !== data.run_id) return;
      setEvalStats(data.stats);
    });
  }

  private setupManualRunEvents(): void {
    const s = this.socket!;

    /**
     * manual_attack_generated — user's prompt has been echoed back.
     * Render from attack.metadata.user_input — NOT attack.prompt (that's full LLM context).
     */
    s.on('manual_attack_generated', (data: WSManualAttackGenerated) => {
      const { appendTurnToActiveSession, activeSession } = useManualStore.getState();
      if (activeSession?.session_id !== data.session_id) return;
      const userText = data.attack.metadata?.user_input ?? data.attack.preview ?? '(attack)';
      appendTurnToActiveSession({
        turn_id:   data.turn_id,
        role:      'attacker',
        content:   userText,
        timestamp: new Date().toISOString(),
        metadata:  data.attack.metadata ?? {},
      });
    });

    /** manual_defence_response — defense system replied */
    s.on('manual_defence_response', (data: WSManualDefenseResponse) => {
      const { appendTurnToActiveSession, activeSession } = useManualStore.getState();
      if (activeSession?.session_id !== data.session_id) return;
      const text       = data.defence.full_text ?? data.defence.response ?? '(defense response)';
      const wasBlocked = !!data.defence.was_blocked;
      appendTurnToActiveSession({
        turn_id:   data.turn_id,
        role:      'defense',
        content:   text,
        timestamp: new Date().toISOString(),
        metadata:  { was_blocked: wasBlocked, blocked_by: (data.defence as any).blocked_by, attack_type: (data.defence as any).attack_type, ...data.defence.metadata },
      });
    });

    /** manual_evaluation_complete — eval node result for this turn */
    s.on('manual_evaluation_complete', (data: WSManualEvaluationComplete) => {
      const { appendTurnToActiveSession, activeSession } = useManualStore.getState();
      if (activeSession?.session_id !== data.session_id) return;
      const label   = data.evaluation.label ?? (data.evaluation.success ? 'breached' : 'blocked');
      const score   = data.evaluation.score;
      const reasoning = data.evaluation.reasoning ?? '';
      appendTurnToActiveSession({
        turn_id:   `eval-${data.turn_id}`,
        role:      'evaluation',
        content:   reasoning,
        timestamp: new Date().toISOString(),
        metadata:  { label, score, ...data.evaluation },
      });
    });

    s.on('manual_turn_completed', (_data: WSManualTurnCompleted) => {
      // run_idle follows — that's what re-enables input
    });

    /**
     * run_idle — re-enable the chat input box.
     * This fires after every manual turn cycle completes.
     */
    s.on('run_idle', (data: WSRunIdle) => {
      const { setIsWaitingForResponse, activeSession } = useManualStore.getState();
      if (activeSession?.session_id === data.session_id) {
        setIsWaitingForResponse(false);
      }
    });
  }

  isConnected(): boolean { return this._connected && this.socket?.connected === true; }
  getSocket(): Socket | null { return this.socket; }
}

export const websocketService = new WebSocketService();