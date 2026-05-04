// store/manualStore.ts
import { create } from 'zustand';
import {
  ChatSession,
  ChatTurn,
  ManualRunConfig,
  ManualRunStats,
} from '../types/manual';

interface ManualState {
  manualConfig:    ManualRunConfig | null;
  activeSession:   ChatSession | null;
  sessions:        ChatSession[];
  manualStats:     ManualRunStats | null;
  isSavingSession: boolean;
  isWaitingForResponse: boolean; // true while a manual turn is processing
  manualError:     string | null;

  // Config
  setManualConfig: (config: ManualRunConfig) => void;

  // Sessions list
  setSessions:   (sessions: ChatSession[]) => void;
  addSession:    (session: ChatSession)    => void;
  updateSession: (sessionId: string, patch: Partial<ChatSession>) => void;
  removeSession: (sessionId: string)      => void;

  // Active session
  setActiveSession:          (session: ChatSession | null) => void;
  appendTurnToActiveSession: (turn: ChatTurn)              => void;
  updateTurnInActiveSession: (turnId: string, patch: Partial<ChatTurn>) => void;

  // Stats
  setManualStats: (stats: ManualRunStats) => void;

  // Status flags
  setIsSavingSession:      (v: boolean)      => void;
  setIsWaitingForResponse: (v: boolean)      => void;
  setManualError:          (msg: string | null) => void;

  // Reset
  resetManualState: () => void;
}

const defaultState = {
  manualConfig:         null,
  activeSession:        null,
  sessions:             [] as ChatSession[],
  manualStats:          null,
  isSavingSession:      false,
  isWaitingForResponse: false,
  manualError:          null,
};

export const useManualStore = create<ManualState>((set) => ({
  ...defaultState,

  setManualConfig: (manualConfig) => set({ manualConfig }),

  setSessions: (sessions) => set({ sessions }),

  addSession: (session) =>
    set(s => ({ sessions: [session, ...s.sessions] })),

  updateSession: (sessionId, patch) =>
    set(s => ({
      sessions: s.sessions.map(sess =>
        sess.session_id === sessionId ? { ...sess, ...patch } : sess
      ),
      activeSession:
        s.activeSession?.session_id === sessionId
          ? { ...s.activeSession, ...patch }
          : s.activeSession,
    })),

  removeSession: (sessionId) =>
    set(s => ({
      sessions: s.sessions.filter(sess => sess.session_id !== sessionId),
      activeSession:
        s.activeSession?.session_id === sessionId ? null : s.activeSession,
    })),

  setActiveSession: (session) => set({ activeSession: session }),

  appendTurnToActiveSession: (turn) =>
    set(s => {
      if (!s.activeSession) return {};
      return {
        activeSession: {
          ...s.activeSession,
          turns: [...s.activeSession.turns, turn],
        },
      };
    }),

  updateTurnInActiveSession: (turnId, patch) =>
    set(s => {
      if (!s.activeSession) return {};
      return {
        activeSession: {
          ...s.activeSession,
          turns: s.activeSession.turns.map(t =>
            t.turn_id === turnId ? { ...t, ...patch } : t
          ),
        },
      };
    }),

  setManualStats:          (manualStats)          => set({ manualStats }),
  setIsSavingSession:      (isSavingSession)      => set({ isSavingSession }),
  setIsWaitingForResponse: (isWaitingForResponse) => set({ isWaitingForResponse }),
  setManualError:          (manualError)          => set({ manualError }),

  resetManualState: () => set({ ...defaultState }),
}));
