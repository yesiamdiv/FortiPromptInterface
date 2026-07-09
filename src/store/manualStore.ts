// store/manualStore.ts
import { create } from 'zustand';
import {
  ChatSession,
  ChatTurn,
  ManualRunConfig,
  ManualRunStats,
} from '../types';

interface ManualState {
  manualConfig:    ManualRunConfig | null;
  activeSession:   ChatSession | null;
  sessions:        ChatSession[];
  manualStats:     ManualRunStats | null;
  isSavingSession: boolean;
  isWaitingForResponse: boolean;
  manualError:     string | null;

  setManualConfig: (config: ManualRunConfig) => void;

  // Sessions list
  setSessions:   (sessions: ChatSession[]) => void;
  // mode: 'prepend' (default, newest on top) | 'append'
  addSession:    (session: ChatSession, mode?: 'prepend' | 'append') => void;
  updateSession: (sessionId: string, patch: Partial<ChatSession>) => void;
  removeSession: (sessionId: string) => void;

  // Active session
  setActiveSession:          (session: ChatSession | null) => void;
  appendTurnToActiveSession: (turn: ChatTurn)              => void;
  updateTurnInActiveSession: (turnId: string, patch: Partial<ChatTurn>) => void;

  setManualStats:          (stats: ManualRunStats)  => void;
  setIsSavingSession:      (v: boolean)             => void;
  setIsWaitingForResponse: (v: boolean)             => void;
  setManualError:          (msg: string | null)     => void;
  resetManualState:        ()                       => void;
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

  addSession: (session, mode = 'prepend') =>
    set(s => ({
      sessions: mode === 'prepend'
        ? [session, ...s.sessions]
        : [...s.sessions, session],
    })),

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

  /**
   * Appends a turn to activeSession.turns AND keeps the matching
   * entry in the sessions list in sync (turn count + total_turns).
   */
  appendTurnToActiveSession: (turn) =>
    set(s => {
      if (!s.activeSession) return {};
      const updatedSession: ChatSession = {
        ...s.activeSession,
        turns:       [...s.activeSession.turns, turn],
        total_turns: s.activeSession.total_turns + 1,
      };
      return {
        activeSession: updatedSession,
        // Keep the sessions list entry in sync so the sidebar turn count is live
        sessions: s.sessions.map(sess =>
          sess.session_id === s.activeSession!.session_id
            ? { ...sess, total_turns: updatedSession.total_turns, turns: updatedSession.turns }
            : sess
        ),
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
  resetManualState:        ()                     => set({ ...defaultState }),
}));
