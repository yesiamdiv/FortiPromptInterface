// pages/ManualAttackPage.tsx
//
// Layout (all within the height allocated by RunShell — no page overflow):
//   top section:   session creation form + session list (fixed height, scrolls internally)
//   bottom section: chat interface (fills remaining space, messages scroll internally)
//
// Sending a message = one full attack→defense→eval cycle (no separate start button).

import React, { useState, useEffect, useRef } from 'react';
import { Send, Save, Trash2, Plus, CheckCircle2, XCircle, AlertTriangle, Clock, Zap, Shield, Loader, BarChart2, MessageSquare } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useManualStore } from '../store/manualStore';
import { fetchManualSessions, deleteManualSession, createManualSession, submitManualTurn, getManualSessionHistory, fetchRunStats } from '../services/api';
import { websocketService } from '../services/websocket';
import { ChatSession, ChatTurn, EvaluationLabel } from '../types/manual';

interface ManualAttackPageProps { embedded?: boolean; }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
      <div style={{ flex: 1, height: 2, background: '#E8E6E0', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2 }}/>
      </div>
      <span style={{ fontSize: 9, fontFamily: 'DM Mono,monospace', color, minWidth: 24 }}>{pct}%</span>
    </div>
  );
};

// ─── Turn bubble ──────────────────────────────────────────────────────────────

const TurnBubble: React.FC<{ turn: ChatTurn }> = ({ turn }) => {
  const isAttacker   = turn.role === 'attacker';
  const isDefense    = turn.role === 'defense';
  const isEvaluation = turn.role === 'evaluation';

  if (isEvaluation) {
    const label = turn.metadata?.label as EvaluationLabel | undefined;
    const score = turn.metadata?.score  as number | undefined;
    const c     = evalColor(label);
    return (
      <div style={{ alignSelf: 'center', maxWidth: '80%', margin: '2px 0' }}>
        <div style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 10, padding: '8px 12px', fontSize: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontWeight: 600, marginBottom: turn.content ? 4 : 0 }}>
            <BarChart2 size={10}/>
            Evaluation
            {label && <span style={{ fontWeight: 400 }}>· {label}</span>}
            {score != null && <span style={{ fontFamily: 'DM Mono,monospace', fontSize: 10, fontWeight: 400 }}>({Math.round(score * 100)}%)</span>}
          </div>
          {turn.content && <div style={{ fontSize: 11, opacity: .8, lineHeight: 1.5 }}>{turn.content}</div>}
        </div>
      </div>
    );
  }

  const wasBlocked = isDefense && turn.metadata?.was_blocked;
  const blockedBy  = turn.metadata?.blocked_by;
  const attackType = turn.metadata?.attack_type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignSelf: isAttacker ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
      <div style={{ fontSize: 9, fontWeight: 600, color: '#AAA', marginBottom: 3, paddingLeft: isAttacker ? 0 : 2, textAlign: isAttacker ? 'right' : 'left', display: 'flex', alignItems: 'center', gap: 4 }}>
        {isAttacker ? (
          <><Zap size={9}/> You (Attacker)</>
        ) : wasBlocked ? (
          <><Shield size={9} style={{ color: '#22C55E' }}/> Defense · Blocked</>
        ) : (
          <><Shield size={9}/> Defense · LLM Response</>
        )}
      </div>

      <div style={{
        padding: '9px 12px',
        background: isAttacker ? '#1A1A1A' : wasBlocked ? '#F0FDF4' : '#fff',
        color: isAttacker ? '#fff' : '#1A1A1A',
        border: isAttacker ? 'none' : `1px solid ${wasBlocked ? '#86EFAC' : '#E8E6E0'}`,
        borderRadius: isAttacker ? '12px 12px 3px 12px' : '12px 12px 12px 3px',
        boxShadow: '0 1px 3px rgba(0,0,0,.05)',
      }}>
        <div style={{ fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {turn.content || <span style={{ opacity: .35 }}>(empty)</span>}
        </div>

        {isDefense && (blockedBy || attackType) && (
          <div style={{ display: 'flex', gap: 5, marginTop: 7, flexWrap: 'wrap' }}>
            {blockedBy && (
              <span style={{ fontSize: 9, background: '#EEF2FF', color: '#6366F1', padding: '2px 6px', borderRadius: 8, fontWeight: 500 }}>
                via {blockedBy}
              </span>
            )}
            {attackType && (
              <span style={{ fontSize: 9, background: '#F7F6F3', color: '#888', padding: '2px 6px', borderRadius: 8, border: '1px solid #E8E6E0' }}>
                {attackType}
              </span>
            )}
          </div>
        )}

        <div style={{ fontSize: 9, opacity: .3, marginTop: 4, textAlign: isAttacker ? 'right' : 'left' }}>
          {new Date(turn.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ManualAttackPage: React.FC<ManualAttackPageProps> = ({ embedded = false }) => {
  const activeRunId = useAppStore(s => s.activeRunId);

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
  const [newLabel,        setNewLabel]        = useState('');
  const [newDesc,         setNewDesc]         = useState('');
  const [startingSession, setStartingSession] = useState(false);
  const [saveLabelInput,  setSaveLabelInput]  = useState('');
  const [showSaveModal,   setShowSaveModal]   = useState(false);
  const [loadingHistory,  setLoadingHistory]  = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const isSessionActive = activeSession?.status === 'active';
  const canSend = isSessionActive && input.trim().length > 0 && !isWaitingForResponse;

  // ── Boot ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRunId) return;
    (async () => {
      setLoading(true);
      try {
        const [rawSess, runStats] = await Promise.all([
          fetchManualSessions(activeRunId).catch(() => []),
          fetchRunStats(activeRunId).catch(() => null),
        ]);
        const sess = [...(rawSess ?? [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setSessions(sess);
        if (runStats) {
          setManualStats({
            total_sessions:  sess.length,
            saved_sessions:  sess.filter((s: any) => s.status === 'completed').length,
            active_sessions: sess.filter((s: any) => s.status === 'active').length,
            breach_count:    runStats.total_evaluations
              ? Math.round((runStats.success_rate ?? 0) * runStats.total_evaluations)
              : 0,
            blocked_count:   runStats.total_evaluations
              ? Math.round((runStats.blocked_rate ?? 0) * runStats.total_evaluations)
              : 0,
            partial_count:   0,
            average_score:   runStats.average_score,
          });
        }
      } catch (e: any) { setManualError(e.message); }
      finally { setLoading(false); }
    })();
  }, [activeRunId]);

  // Auto-scroll chat to bottom when turns change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession?.turns.length]);

  // ── Create session ────────────────────────────────────────────────────────────
  const handleNewSession = async () => {
    if (!activeRunId || startingSession) return;
    setStartingSession(true);
    try {
      const label = newLabel.trim() || `Session ${sessions.length + 1}`;
      const sess  = await createManualSession(activeRunId, { name: label, description: newDesc.trim() || undefined });
      addSession(sess, 'prepend');
      setActiveSession(sess);
      setNewLabel('');
      setNewDesc('');
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
      const assembled: ChatTurn[] = [];
      for (const raw of (history.turns ?? [])) {
        if (raw.attack_data) {
          assembled.push({
            turn_id:   `atk-${raw.turn_id}`,
            role:      'attacker',
            content:   raw.attack_data.metadata?.user_input ?? raw.attack_data.prompt,
            timestamp: raw.attack_data.timestamp,
            metadata:  raw.attack_data.metadata ?? {},
          });
        }
        if (raw.defence_data) {
          assembled.push({
            turn_id:   `def-${raw.turn_id}`,
            role:      'defense',
            content:   raw.defence_data.response,
            timestamp: raw.defence_data.timestamp,
            metadata:  { was_blocked: raw.defence_data.was_blocked, blocked_by: raw.defence_data.metadata?.blocked_by, attack_type: raw.defence_data.metadata?.attack_type },
          });
        }
        if (raw.evaluation_data) {
          const label = raw.evaluation_data.success ? 'breached' : 'blocked';
          assembled.push({
            turn_id:   `eval-${raw.turn_id}`,
            role:      'evaluation',
            content:   raw.evaluation_data.feedback,
            timestamp: raw.evaluation_data.timestamp,
            metadata:  { label, score: raw.evaluation_data.score, category: raw.evaluation_data.category },
          });
        }
      }
      const full: ChatSession = { ...history.session, turns: assembled };
      updateSession(sess.session_id, full);
      setActiveSession(full);
      if (full.status === 'active') websocketService.joinSessionRoom(sess.session_id);
    } catch { /* fall back to empty turns */ }
    finally { setLoadingHistory(false); }
  };

  // ── Delete session ────────────────────────────────────────────────────────────
  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeRunId || !window.confirm('Delete this session?')) return;
    try {
      await deleteManualSession(activeRunId, sessionId);
      removeSession(sessionId);
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
        websocketService.leaveSessionRoom(sessionId);
      }
    } catch (e: any) { setManualError(e.message); }
  };

  // ── Send turn ────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!canSend || !activeRunId || !activeSession) return;
    const content = input.trim();
    setInput('');
    setIsWaitingForResponse(true);
    try {
      await submitManualTurn(activeRunId, activeSession.session_id, { prompt: content });
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
      const patch = { status: 'completed' as const };
      updateSession(activeSession.session_id, patch);
      setActiveSession({ ...activeSession, ...patch });
      setShowSaveModal(false);
      setSaveLabelInput('');
      const runStats = await fetchRunStats(activeRunId).catch(() => null);
      if (runStats) {
        const currentSessions = useManualStore.getState().sessions;
        setManualStats({
          total_sessions:  currentSessions.length,
          saved_sessions:  currentSessions.filter(s => s.status === 'completed').length,
          active_sessions: currentSessions.filter(s => s.status === 'active').length,
          breach_count:    runStats.total_evaluations
            ? Math.round((runStats.success_rate ?? 0) * runStats.total_evaluations) : 0,
          blocked_count:   runStats.total_evaluations
            ? Math.round((runStats.blocked_rate ?? 0) * runStats.total_evaluations) : 0,
          partial_count:   0,
          average_score:   runStats.average_score,
        });
      }
    } catch (e: any) { setManualError(e.message); }
    finally { setIsSavingSession(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, fontFamily: "'DM Sans',sans-serif" }}>
      <style>{`@keyframes man-spin{to{transform:rotate(360deg)}}`}</style>
      <Loader size={18} style={{ animation: 'man-spin .7s linear infinite', color: '#888' }}/>
      <span style={{ fontSize: 13, color: '#888' }}>Loading sessions…</span>
    </div>
  );

  return (
    // Outer: fills the height given by RunShell's <main style={S.content}>
    // overflow:hidden prevents this component from ever growing the page
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: "'DM Sans', sans-serif", overflow: 'hidden' }}>
      <style>{`
        @keyframes man-spin { to { transform: rotate(360deg); } }
        .man-spin { animation: man-spin .7s linear infinite; }
        .man-sess:hover { background: #F7F6F3 !important; }
        .man-del { opacity: 0; transition: opacity .15s; }
        .man-sess:hover .man-del { opacity: 1 !important; }
      `}</style>

      {/* ── Error banner ── */}
      {manualError && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px', background: '#FEF2F2', borderBottom: '1px solid #FCA5A5', fontSize: 12, color: '#DC2626', flexShrink: 0 }}>
          <XCircle size={12}/>{manualError}
          <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 13 }} onClick={() => setManualError(null)}>✕</button>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TOP SECTION: Session management — fixed portion, scrolls internally
          flex: 0 0 auto + maxHeight: 40% gives it a ceiling;
          children with overflow:auto scroll within.
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #E8E6E0', display: 'flex', maxHeight: '40%', minHeight: 120, overflow: 'hidden' }}>

        {/* Create session form — fixed width, always visible */}
        <div style={{ width: 240, flexShrink: 0, borderRight: '1px solid #E8E6E0', padding: 16, display: 'flex', flexDirection: 'column', gap: 10, background: '#FAFAF9', overflowY: 'auto' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.4px' }}>New Session</div>

          {manualStats && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 8, padding: '2px 6px', color: '#666' }}>
                {manualStats.total_sessions} total
              </span>
              <span style={{ fontSize: 9, background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '2px 6px', color: '#DC2626' }}>
                {manualStats.breach_count} breached
              </span>
              <span style={{ fontSize: 9, background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '2px 6px', color: '#15803D' }}>
                {manualStats.blocked_count} blocked
              </span>
            </div>
          )}

          <div>
            <label style={{ fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: 4 }}>
              Session Label
            </label>
            <input
              style={{ height: 30, width: '100%', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 6, padding: '0 9px', fontSize: 12, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
              placeholder="e.g. SQL injection v1"
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNewSession()}
            />
          </div>

          <div>
            <label style={{ fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.3px', display: 'block', marginBottom: 4 }}>
              Notes (optional)
            </label>
            <textarea
              style={{ width: '100%', background: '#fff', border: '1px solid #E8E6E0', borderRadius: 6, padding: '7px 9px', fontSize: 12, fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.45, boxSizing: 'border-box' }}
              placeholder="What are you testing…"
              rows={2}
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
            />
          </div>

          <button
            style={{ height: 32, borderRadius: 6, border: 'none', background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: startingSession ? .6 : 1, width: '100%' }}
            onClick={handleNewSession}
            disabled={startingSession}
          >
            {startingSession ? <Loader size={11} className="man-spin"/> : <Plus size={11}/>}
            {startingSession ? 'Creating…' : 'Create Session'}
          </button>
        </div>

        {/* Session list — scrolls independently */}
        <div style={{ flex: 1, overflowY: 'auto', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid #F0EDE6', position: 'sticky', top: 0, background: '#fff', zIndex: 1 }}>
            <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>Sessions</span>
            <span style={{ fontSize: 10, color: '#BBB', fontFamily: 'DM Mono,monospace' }}>{sessions.length}</span>
          </div>

          {sessions.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#CCC', fontSize: 12 }}>
              No sessions yet — create one
            </div>
          ) : (
            sessions.map(sess => {
              const isActive = sess.session_id === activeSession?.session_id;
              const c        = evalColor(sess.evaluation_label);
              return (
                <div
                  key={sess.session_id}
                  className="man-sess"
                  style={{ padding: '9px 14px', cursor: 'pointer', borderBottom: '1px solid #F0EDE6', background: isActive ? '#F7F6F3' : '#fff', borderLeft: `2px solid ${isActive ? '#1A1A1A' : 'transparent'}` }}
                  onClick={() => handleSelectSession(sess)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sess.name || sess.session_id.slice(-8)}
                      </div>
                      <div style={{ fontSize: 10, color: '#AAA', marginTop: 2 }}>
                        {sess.turns.length > 0 ? sess.turns.length : sess.total_turns} turn{(sess.turns.length || sess.total_turns) !== 1 ? 's' : ''} · {new Date(sess.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 8, fontWeight: 500, background: sess.status === 'active' ? '#EEF2FF' : c.bg, color: sess.status === 'active' ? '#4F46E5' : c.text, border: `1px solid ${sess.status === 'active' ? '#C7D2FE' : c.border}` }}>
                        {sess.status === 'active' ? 'live' : sess.status}
                      </span>
                      <button
                        className="man-del"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', padding: 2, display: 'flex' }}
                        onClick={e => handleDeleteSession(sess.session_id, e)}
                      >
                        <Trash2 size={10}/>
                      </button>
                    </div>
                  </div>
                  {sess.evaluation_score != null && <ScoreBar score={sess.evaluation_score}/>}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          BOTTOM SECTION: Chat interface — fills remaining height
          flex:1 + minHeight:0 ensures it never pushes beyond the page
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
        {!activeSession ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#CCC' }}>
            <MessageSquare size={32}/>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#888' }}>Select a session above to start</div>
            <div style={{ fontSize: 11, color: '#BBB', textAlign: 'center', maxWidth: 240, lineHeight: 1.5 }}>
              Create a new session or click an existing one. Your prompt will trigger a full attack→defense→eval cycle.
            </div>
          </div>
        ) : (
          <>
            {/* Chat header — fixed, does not scroll */}
            <div style={{ padding: '9px 20px', background: '#fff', borderBottom: '1px solid #E8E6E0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>
                  {activeSession.name || activeSession.session_id.slice(-8)}
                </div>
                <div style={{ fontSize: 10, color: '#AAA', marginTop: 1 }}>
                  {activeSession.turns.length} turn{activeSession.turns.length !== 1 ? 's' : ''} · {new Date(activeSession.created_at).toLocaleTimeString()}
                  {isWaitingForResponse && <span style={{ color: '#6366F1', marginLeft: 8 }}>· Processing…</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {activeSession.status === 'completed' && (() => {
                  const c = evalColor(activeSession.evaluation_label);
                  return (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500, padding: '3px 9px', borderRadius: 20, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                      {evalIcon(activeSession.evaluation_label)}
                      {activeSession.evaluation_label ?? 'completed'}
                      {activeSession.evaluation_score != null && ` · ${Math.round(activeSession.evaluation_score * 100)}%`}
                    </span>
                  );
                })()}
                {isSessionActive && (
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#1A1A1A', color: '#fff', fontSize: 11, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                    onClick={() => setShowSaveModal(true)}
                  >
                    <Save size={11}/>Save &amp; Evaluate
                  </button>
                )}
              </div>
            </div>

            {/* Messages — flex:1 + minHeight:0 + overflowY:auto = proper scroll within container */}
            <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loadingHistory ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '30px 0', gap: 8 }}>
                  <Loader size={16} className="man-spin" style={{ color: '#888' }}/>
                  <span style={{ fontSize: 12, color: '#888' }}>Loading history…</span>
                </div>
              ) : activeSession.turns.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#CCC', fontSize: 12, marginTop: 30 }}>
                  Type your attack prompt below — each message starts one evaluation cycle.
                </div>
              ) : (
                activeSession.turns.map((turn, i) => (
                  <TurnBubble key={turn.turn_id || i} turn={turn}/>
                ))
              )}

              {isWaitingForResponse && (
                <div style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: '12px 12px 12px 3px', fontSize: 12, color: '#888' }}>
                  <Loader size={11} className="man-spin"/>
                  Defense &amp; evaluation in progress…
                </div>
              )}
              <div ref={chatEndRef}/>
            </div>

            {/* Input area — fixed at bottom, does not scroll */}
            {isSessionActive ? (
              <div style={{ padding: '10px 20px 14px', background: '#fff', borderTop: '1px solid #E8E6E0', flexShrink: 0 }}>
                <div style={{ fontSize: 10, color: '#CCC', marginBottom: 6 }}>
                  Each message triggers one attack→defense→eval cycle. The session context is used for multi-turn continuity.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <textarea
                    style={{
                      flex: 1, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 10,
                      padding: '9px 13px', fontSize: 13, fontFamily: 'inherit', color: '#1A1A1A',
                      outline: 'none', resize: 'none', lineHeight: 1.5,
                      opacity: isWaitingForResponse ? .5 : 1, transition: 'opacity .15s',
                    }}
                    placeholder={isWaitingForResponse ? 'Waiting for cycle to complete…' : 'Type your attack prompt (Enter to send · Shift+Enter for newline)'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    disabled={isWaitingForResponse}
                  />
                  <button
                    style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', background: canSend ? '#1A1A1A' : '#E8E6E0', color: '#fff', border: 'none', borderRadius: 10, cursor: canSend ? 'pointer' : 'default', alignSelf: 'flex-end', flexShrink: 0, transition: 'background .15s' }}
                    onClick={handleSend}
                    disabled={!canSend}
                  >
                    <Send size={15}/>
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', background: '#F0FDF4', borderTop: '1px solid #BBF7D0', color: '#15803D', fontSize: 12, fontWeight: 500, flexShrink: 0 }}>
                <CheckCircle2 size={12}/>Session completed — create a new session to continue.
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Save modal ── */}
      {showSaveModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowSaveModal(false)}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, boxShadow: '0 20px 48px rgba(0,0,0,.15)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', borderBottom: '1px solid #E8E6E0' }}>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '-.3px' }}>Save &amp; Evaluate Session</span>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16 }} onClick={() => setShowSaveModal(false)}>✕</button>
            </div>
            <div style={{ padding: '15px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: 12, color: '#666', lineHeight: 1.6 }}>
                Saving locks this session and runs the evaluator — you'll receive a breach / blocked / partial verdict.
              </p>
              <label style={{ fontSize: 10, fontWeight: 500, color: '#999', textTransform: 'uppercase', letterSpacing: '.4px' }}>Session Label (optional)</label>
              <input
                style={{ height: 32, background: '#F7F6F3', border: '1px solid #E8E6E0', borderRadius: 7, padding: '0 10px', fontSize: 12, fontFamily: 'inherit', color: '#1A1A1A', outline: 'none' }}
                placeholder={activeSession?.description ?? 'e.g. SQL injection attempt'}
                value={saveLabelInput}
                onChange={e => setSaveLabelInput(e.target.value)}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px 15px', borderTop: '1px solid #E8E6E0' }}>
              <button style={{ padding: '7px 14px', background: '#F0EDE6', color: '#555', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit' }} onClick={() => setShowSaveModal(false)}>
                Cancel
              </button>
              <button
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', background: '#1A1A1A', color: '#fff', fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: isSavingSession ? .6 : 1 }}
                onClick={handleSaveSession}
                disabled={isSavingSession}
              >
                {isSavingSession ? <><Loader size={11} className="man-spin"/>Evaluating…</> : <><Save size={11}/>Save &amp; Evaluate</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManualAttackPage;
