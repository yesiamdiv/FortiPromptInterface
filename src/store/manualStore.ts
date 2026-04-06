// store/manualStore.ts
// ─── Manual Attack Zustand Store ──────────────────────────────────────────────
// Import and spread this store into your existing appStore, or use it standalone.

import { create } from 'zustand';
import {
  ChatSession,
  ChatTurn,
  ManualRunConfig,
  ManualRunStats,
  EvaluationLabel,
} from '../types/manual';

interface ManualState {
  manualConfig: ManualRunConfig | null;

  activeSession: ChatSession | null;

  sessions: ChatSession[];

  manualStats: ManualRunStats | null;

  isSavingSession: boolean;
  manualError: string | null;

  // actions
  setManualConfig: (config: ManualRunConfig) => void;

  setSessions: (sessions: ChatSession[]) => void;
  addSession: (session: ChatSession) => void;
  updateSession: (sessionId: string, patch: Partial<ChatSession>) => void;
  removeSession: (sessionId: string) => void;

  // ✅ NEW
  setActiveSession: (session: ChatSession | null) => void;
  appendTurnToActiveSession: (turn: ChatTurn) => void;

  setManualStats: (stats: ManualRunStats) => void;

  setIsSavingSession: (v: boolean) => void;
  setManualError: (msg: string | null) => void;

  resetManualState: () => void;
}

const defaultState = {
  manualConfig: null,
  activeSession: null,
  sessions: [],
  manualStats: null,
  isSavingSession: false,
  manualError: null,
};

export const useManualStore = create<ManualState>((set) => ({
  ...defaultState,

  setManualConfig: (manualConfig) => set({ manualConfig }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set((s) => ({
      sessions: [session, ...s.sessions],
    })),

  updateSession: (sessionId, patch) =>
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.session_id === sessionId ? { ...sess, ...patch } : sess
      ),
      activeSession:
        s.activeSession?.session_id === sessionId
          ? { ...s.activeSession, ...patch }
          : s.activeSession,
    })),

  removeSession: (sessionId) =>
    set((s) => ({
      sessions: s.sessions.filter((sess) => sess.session_id !== sessionId),
      activeSession:
        s.activeSession?.session_id === sessionId ? null : s.activeSession,
    })),

  setActiveSession: (session) => set({ activeSession: session }),

  appendTurnToActiveSession: (turn) =>
    set((s) => {
      if (!s.activeSession) return {};
      return {
        activeSession: {
          ...s.activeSession,
          turns: [...s.activeSession.turns, turn],
        },
      };
    }),

  setManualStats: (manualStats) => set({ manualStats }),

  setIsSavingSession: (isSavingSession) => set({ isSavingSession }),
  setManualError: (manualError) => set({ manualError }),

  resetManualState: () => set({ ...defaultState }),
}));

// ─── WebSocket integration helper ─────────────────────────────────────────────
// Call this from your websocket.ts setupEventListeners() block:
//
//   this.socket.on('manual_session_created', (data) => {
//     const { addSession } = useManualStore.getState();
//     if (activeRunId === data.runId) addSession(data.session);
//   });
//
//   this.socket.on('manual_turn_added', (data) => {
//     const { appendActiveTurn, activeSessionId } = useManualStore.getState();
//     if (data.sessionId === activeSessionId) appendActiveTurn(data.turn);
//   });
//
//   this.socket.on('manual_session_evaluated', (data) => {
//     const { updateSession } = useManualStore.getState();
//     updateSession(data.sessionId, {
//       status: 'evaluated',
//       evaluation_score: data.evaluation.score,
//       evaluation_label: data.evaluation.label,
//       evaluation_reasoning: data.evaluation.reasoning,
//       defense_filter_used: data.defense_filter_used,
//     });
//   });
