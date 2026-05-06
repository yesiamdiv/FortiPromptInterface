import React, { useState, useEffect, useRef } from 'react';
import {
  Send, Save, Trash2, Plus, CheckCircle2, XCircle,
  AlertTriangle, Clock, Zap, Loader, MessageSquare,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useManualStore } from '../store/manualStore';
import {
  fetchManualSessions, saveSession, fetchManualStats,
  deleteManualSession, createManualSession,
  submitManualTurn, getManualSessionHistory,
} from '../services/api';
import { websocketService } from '../services/websocket';
import { ChatSession, ChatTurn, EvaluationLabel } from '../types/manual';

interface ManualAttackPageProps {
  onBack: () => void;
  embedded?: boolean;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────

const evalColor = (label?: string) => {
  if (label === 'breached') return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
  if (label === 'blocked')  return { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' };
  if (label === 'partial')  return { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D' };
  return { bg: '#F7F6F3', text: '#888', border: '#E8E6E0' };
};

const evalIcon = (label?: string) => {
  if (label === 'breached') return <Zap size={10}/>;
  if (label === 'blocked')  return <CheckCircle2 size={10}/>;
  if (label === 'partial')  return <AlertTriangle size={10}/>;
  return <Clock size={10}/>;
};

const ScoreBar: React.FC<{ score?: number }> = ({ score }) => {
  if (score == null) return null;
  const pct   = Math.round(score * 100);
  const color = score >= 0.7 ? '#EF4444' : score >= 0.4 ? '#F59E0B' : '#22C55E';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 5 }}>
      <div style={{ flex: 1, height: 3, background: '#E8E6E0', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width .4s' }}/>
      </div>
      <span style={{ fontSize: 10, fontWeight: 600, color, minWidth: 28 }}>{pct}%</span>
    </div>
  );
};

// ─── Turn bubble ───────────────────────────────────────────────────────────────

const TurnBubble: React.FC<{ turn: ChatTurn }> = ({ turn }) => {
  const isAttacker   = turn.role === 'attacker';
  const isDefense    = turn.role === 'defense';
  const isEvaluation = turn.role === 'evaluation';

  if (isEvaluation) {
    const label = turn.metadata?.label as EvaluationLabel | undefined;
    const score = turn.metadata?.score  as number | undefined;
    const c     = evalColor(label);
    return (
      <div style={{ alignSelf: 'center', maxWidth: '72%', margin: '2px 0' }}>
        <div style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 10, padding: '9px 13px', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: turn.content ? 4 : 0, fontWeight: 600 }}>
            {evalIcon(label)}
            Evaluation{label ? ` · ${label}` : ''}
            {score != null && (
              <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, fontWeight: 400 }}>
                ({Math.round(score * 100)}%)
              </span>
            )}
          </div>
          {turn.content && (
            <div style={{ fontSize: 11, opacity: .75, lineHeight: 1.5 }}>{turn.content}</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignSelf: isAttacker ? 'flex-end' : 'flex-start', maxWidth: '78%' }}>
      <div style={{
        padding: '9px 13px',
        background: isAttacker ? '#1A1A1A' : isDefense ? '#FEF2F2' : '#fff',
        color: isAttacker ? '#fff' : '#1A1A1A',
        border: isAttacker ? 'none' : `1px solid ${isDefense ? '#FCA5A5' : '#E8E6E0'}`,
        borderRadius: isAttacker ? '14px 14px 3px 14px' : '14px 14px 14px 3px',
        boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      }}>
        <div style={{ fontSize: 9, fontWeight: 600, opacity: .45, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
          {isAttacker ? '⚔️ You' : isDefense ? '🛡 Defense' : '🎯 Target'}
          {isDefense && turn.metadata?.was_blocked && (
            <span style={{ background: '#FEF2F2', color: '#DC2626', padding: '0px 5px', borderRadius: 6, fontSize: 8, opacity: 1, fontWeight: 700 }}>
              BLOCKED
            </span>
          )}
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {turn.content || <span style={{ opacity: .3 }}>(empty)</span>}
        </div>
        <div style={{ fontSize: 9, opacity: .3, marginTop: 4, textAlign: 'right' }}>
          {new Date(turn.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// ─── Main component ────────────────────────────────────────────────────────────

const ManualAttackPage: React.FC<ManualAttackPageProps> = ({ onBack, embedded = false }) => {
  const activeRunId = useAppStore(s => s.activeRunId);
  const runs        = useAppStore(s => s.runs);
  const activeRun   = runs.find(r => r.runid === activeRunId);

  const {
    sessions, setSessions, addSession, updateSession, removeSession,
    activeSession, setActiveSession, appendTurnToActiveSession,
    manualStats, setManualStats,
    isSavingSession, setIsSavingSession,
    isWaitingForResponse, setIsWaitingForResponse,
    manualError, setManualError,
  } = useManualStore();

  const [loading,         setLoading]         = useState(true);
  const [input,           setInput]           = useState('');
  const [newSessionLabel, setNewSessionLabel] = useState('');
  const [startingSession, setStartingSession] = useState(false);
  const [saveLabelInput,  setSaveLabelInput]  = useState('');
  const [showSaveModal,   setShowSaveModal]   = useState(false);
  const [loadingHistory,  setLoadingHistory]  = useState(false);

  const chatEndRef      = useRef<HTMLDivElement>(null);
  const isSessionActive = activeSession?.status === 'active';
  const canSend         = isSessionActive && input.trim().length > 0 && !isWaitingForResponse;

  // ── Boot ──────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRunId) return;
    (async () => {
      setLoading(true);
      try {
        const [sess, stats] = await Promise.all([
          fetchManualSessions(activeRunId).catch(() => []),
          fetchManualStats(activeRunId).catch(() => null),
        ]);
        setSessions(sess ?? []);
        if (stats) setManualStats(stats);
      } catch (e: any) { setManualError(e.message); }
      finally { setLoading(false); }
    })();
  }, [activeRunId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.turns.length]);

  // ── New session ───────────────────────────────────────────────────────────────
  const handleNewSession = async () => {
    if (!activeRunId || startingSession) return;
    setStartingSession(true);
    try {
      const label = newSessionLabel.trim() || `Session ${sessions.length + 1}`;
      const sess  = await createManualSession(activeRunId, { name: label });
      addSession(sess);
      setActiveSession(sess);
      setNewSessionLabel('');
      websocketService.joinSessionRoom(sess.session_id);
    } catch (e: any) { setManualError(e.message); }
    finally { setStartingSession(false); }
  };

  // ── Select session ────────────────────────────────────────────────────────────
  const handleSelectSession = async (sess: ChatSession) => {
    setActiveSession(sess);
    setLoadingHistory(true);
    try {
      const history = await getManualSessionHistory(activeRunId!, sess.session_id);
      const full: ChatSession = {
        ...history.session,
        turns: history.turns.map(t => ({
          ...t,
          // Attacker turns: render metadata.user_input as display text (NOT attack.prompt)
          content: t.role === 'attacker' ? (t.metadata?.user_input ?? t.content) : t.content,
        })),
      };
      updateSession(sess.session_id, full);
      setActiveSession(full);
      if (full.status === 'active') websocketService.joinSessionRoom(sess.session_id);
    } catch { /* fall back to local state */ }
    finally { setLoadingHistory(false); }
  };

  // ── Delete session ────────────────────────────────────────────────────────────
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeRunId || !window.confirm('Delete this session? This cannot be undone.')) return;
    try {
      await deleteManualSession(activeRunId, sessionId);
      removeSession(sessionId);
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
        websocketService.leaveSessionRoom(sessionId);
      }
    } catch (e: any) { setManualError(e.message); }
  };

  // ── Send turn ─────────────────────────────────────────────────────────────────
  // RunConfigPanel syncs defense/eval node params via debounced PATCH.
  // This only sends the user prompt and triggers the backend turn cycle.
  const handleSend = async () => {
    if (!canSend || !activeRunId || !activeSession) return;
    const content = input.trim();
    setInput('');
    setIsWaitingForResponse(true);

    // Optimistic user bubble — WS will confirm via manual_attack_generated
    appendTurnToActiveSession({
      turn_id:   `opt-${Date.now()}`,
      role:      'attacker',
      content,
      timestamp: new Date().toISOString(),
      metadata:  { user_input: content },
    });

    try {
      await submitManualTurn(activeRunId, activeSession.session_id, { prompt: content });
      // WS sequence: manual_attack_generated → manual_defence_response
      //              → manual_evaluation_complete → run_idle (re-enables input)
    } catch (e: any) {
      setManualError(e.message);
      setIsWaitingForResponse(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Save & evaluate ───────────────────────────────────────────────────────────
  const handleSaveSession = async () => {
    if (!activeRunId || !activeSession || isSavingSession) return;
    setIsSavingSession(true);
    try {
      const result = await saveSession(activeRunId, activeSession.session_id, {
        label: saveLabelInput || undefined,
      });
      const patch = {
        status:               'evaluated' as const,
        evaluation_score:     result.evaluation_score,
        evaluation_label:     result.evaluation_label,
        evaluation_reasoning: result.evaluation_reasoning,
        saved_at:             new Date().toISOString(),
        evaluated_at:         new Date().toISOString(),
      };
      updateSession(activeSession.session_id, patch);
      setActiveSession({ ...activeSession, ...patch });
      setShowSaveModal(false);
      setSaveLabelInput('');
      const stats = await fetchManualStats(activeRunId).catch(() => null);
      if (stats) setManualStats(stats);
    } catch (e: any) { setManualError(e.message); }
    finally { setIsSavingSession(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300, gap: 10 }}>
        <style>{`@keyframes man-spin{to{transform:rotate(360deg)}}`}</style>
        <Loader size={20} style={{ animation: 'man-spin .7s linear infinite', color: '#888' }}/>
        <span style={{ fontSize: 13, color: '#888' }}>Loading sessions…</span>
      </div>
    );
  }

  const body = (
    <div style={{ display: 'flex', flexDirection: 'column', height: embedded ? 'calc(100vh - 52px)' : '100vh' }}>
      <style>{`
        @keyframes man-spin { to { transform: rotate(360deg); } }
        .man-sess:hover { background: #F7F6F3 !important; }
        .man-del { opacity: 0; transition: opacity .15s; }
        .man-sess:hover .man-del { opacity: 1 !important; }
      `}</style>

      {/* Error */}
      {manualError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 20px', background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', flexShrink: 0 }}>
          <XCircle size={12}/>{manualError}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14 }} onClick={() => setManualError(null)}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* ── Session sidebar ── */}
        <aside style={{ width: 210, flexShrink: 0, borderRight: '1px solid #E8E6E0', display: 'flex', flexDirection: 'column', background: '#FAFAF9' }}>

          {/* Stats chips */}
          {manualStats && (
            <div style={{ padding: '10px 12px', borderBottom: '1px solid #F0EDE6', display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              <span style={{ fontSize: 10, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 10, padding: '2px 7px', color: '#666' }}>
                {manualStats.total_sessions} sessions
              </span>
              <span style={{ fontSize: 10, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 10, padding: '2px 7px', color: '#DC2626' }}>
                {manualStats.breach_count} breached
              </span>
              <span style={{ fontSize: 10, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 10, padding: '2px 7px', color: '#15803D' }}>
                {manualStats.blocked_count} blocked
              </span>
            </div>
          )}

          {/* New session */}
          <div style={{ padding: 10, borderBottom: '1px solid #F0EDE6' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#BBB', marginBottom: 7, textTransform: 'uppercase', letterSpacing: '.4px' }}>New Session</div>
            <input
              style={{ height: 30, width: '100%', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 6, padding: '0 9px', fontSize: 12, fontFamily: 'inherit', outline: 'none', marginBottom: 6, boxSizing: 'border-box' }}
              placeholder="Label (optional)…"
              value={newSessionLabel}
              onChange={e => setNewSessionLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNewSession()}
            />
            <button
              style={{ width: '100%', height: 30, borderRadius: 6, border: 'none', background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: startingSession ? .6 : 1 }}
              onClick={handleNewSession}
              disabled={startingSession}
            >
              {startingSession ? <Loader size={11} style={{ animation: 'man-spin .7s linear infinite' }}/> : <Plus size={11}/>}
              {startingSession ? 'Starting…' : 'Start Session'}
            </button>
          </div>

          {/* List */}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '20px 12px', fontSize: 11, color: '#CCC', textAlign: 'center', lineHeight: 1.6 }}>
                No sessions yet.<br/>Start one above.
              </div>
            ) : sessions.map(sess => {
              const isActive = sess.session_id === activeSession?.session_id;
              const c        = evalColor(sess.evaluation_label);
              return (
                <div
                  key={sess.session_id}
                  className="man-sess"
                  style={{ padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #F0EDE6', background: isActive ? '#fff' : 'transparent', borderLeft: `2px solid ${isActive ? '#1A1A1A' : 'transparent'}`, transition: 'background .1s' }}
                  onClick={() => handleSelectSession(sess)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sess.label ?? sess.session_id.slice(-8)}
                      </div>
                      <div style={{ fontSize: 10, color: '#AAA', marginTop: 1 }}>
                        {sess.turns.length} turn{sess.turns.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <span style={{
                        fontSize: 9, padding: '2px 5px', borderRadius: 7, fontWeight: 500,
                        background: sess.status === 'active' ? '#EEF2FF' : c.bg,
                        color: sess.status === 'active' ? '#4F46E5' : c.text,
                        border: `1px solid ${sess.status === 'active' ? '#C7D2FE' : c.border}`,
                      }}>
                        {sess.status === 'active' ? 'live' : (sess.evaluation_label ?? 'saved')}
                      </span>
                      <button
                        className="man-del"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2, borderRadius: 4, display: 'flex' }}
                        onClick={e => handleDeleteSession(sess.session_id, e)}
                      >
                        <Trash2 size={10}/>
                      </button>
                    </div>
                  </div>
                  {sess.status === 'evaluated' && <ScoreBar score={sess.evaluation_score}/>}
                </div>
              );
            })}
          </div>
        </aside>

        {/* ── Chat area ── */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {!activeSession ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#CCC' }}>
              <MessageSquare size={36}/>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#888' }}>No session selected</div>
              <div style={{ fontSize: 12, color: '#BBB', textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
                Start a new session or select one from the left panel
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div style={{ padding: '9px 16px', background: '#fff', borderBottom: '1px solid #E8E6E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: '-.2px' }}>
                    {activeSession.label ?? activeSession.session_id.slice(-8)}
                  </div>
                  <div style={{ fontSize: 10, color: '#AAA', marginTop: 1 }}>
                    {activeSession.turns.length} turn{activeSession.turns.length !== 1 ? 's' : ''} · {new Date(activeSession.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {activeSession.status === 'evaluated' && (() => {
                    const c = evalColor(activeSession.evaluation_label);
                    return (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                        {evalIcon(activeSession.evaluation_label)}
                        {activeSession.evaluation_label}
                        {activeSession.evaluation_score != null && ` · ${Math.round(activeSession.evaluation_score * 100)}%`}
                      </span>
                    );
                  })()}
                  {isSessionActive && (
                    <button
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      onClick={() => setShowSaveModal(true)}
                    >
                      <Save size={11}/>Save &amp; Evaluate
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {loadingHistory ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 0', gap: 8 }}>
                    <Loader size={16} style={{ animation: 'man-spin .7s linear infinite', color: '#888' }}/>
                    <span style={{ fontSize: 13, color: '#888' }}>Loading history…</span>
                  </div>
                ) : activeSession.turns.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#BBB', fontSize: 13, marginTop: 40 }}>
                    Type your first attack message below…
                  </div>
                ) : (
                  activeSession.turns.map((turn, i) => (
                    <TurnBubble key={turn.turn_id || i} turn={turn}/>
                  ))
                )}

                {isWaitingForResponse && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 7, padding: '9px 13px', background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: '14px 14px 14px 3px', fontSize: 12, color: '#888' }}>
                    <Loader size={11} style={{ animation: 'man-spin .7s linear infinite' }}/>
                    Processing turn…
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* Input */}
              {isSessionActive ? (
                <div style={{ display: 'flex', gap: 8, padding: '10px 16px', background: '#fff', borderTop: '1px solid #E8E6E0', flexShrink: 0 }}>
                  <textarea
                    style={{
                      flex: 1, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 10,
                      padding: '9px 13px', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1A',
                      outline: 'none', resize: 'none', lineHeight: 1.5,
                      opacity: isWaitingForResponse ? .5 : 1, transition: 'opacity .15s',
                    }}
                    placeholder={isWaitingForResponse ? 'Waiting for response…' : 'Type attack (Enter to send · Shift+Enter for newline)'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={isWaitingForResponse}
                  />
                  <button
                    style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', alignSelf: 'flex-end', flexShrink: 0, opacity: canSend ? 1 : .3, transition: 'opacity .15s' }}
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    <Send size={15}/>
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0', color: '#15803D', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                  <CheckCircle2 size={12}/>Session saved — start a new session to continue attacking.
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Save modal ── */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSaveModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 20px 48px rgba(0,0,0,.15)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8E6E0' }}>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.3px' }}>Save &amp; Evaluate Session</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16 }} onClick={() => setShowSaveModal(false)}>✕</button>
            </div>
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 13, color: '#666', lineHeight: 1.6 }}>
                Saving locks the session and runs the evaluator — you'll receive a breach / blocked / partial verdict with a score.
              </p>
              <label style={{ fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.4px' }}>Session Label (optional)</label>
              <input
                style={{ height: 34, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none' }}
                placeholder={activeSession?.label ?? 'e.g. SQL injection attempt…'}
                value={saveLabelInput}
                onChange={e => setSaveLabelInput(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px 16px', borderTop: '1px solid #E8E6E0' }}>
              <button style={{ padding: '8px 14px', background: '#F0EDE6', color: '#555', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 16px', background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: isSavingSession ? .6 : 1 }}
                onClick={handleSaveSession}
                disabled={isSavingSession}
              >
                {isSavingSession
                  ? <><Loader size={11} style={{ animation: 'man-spin .7s linear infinite' }}/>Evaluating…</>
                  : <><Save size={11}/>Save &amp; Evaluate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) return body;

  return (
    <div style={{ fontFamily: 'inherit', background: '#F7F6F3', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', height: 52, background: '#fff', borderBottom: '1px solid #E8E6E0', flexShrink: 0 }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#888', cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit' }}>
          ← Back
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.3px' }}>Manual Attack</span>
        {activeRun && <span style={{ fontSize: 13, color: '#888' }}>— {activeRun.name}</span>}
      </nav>
      {body}
    </div>
  );
};

export default ManualAttackPage;