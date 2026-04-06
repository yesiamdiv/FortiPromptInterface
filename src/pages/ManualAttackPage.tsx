import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft, MessageSquare, Send, Save, Trash2, Plus,
  Shield, ChevronDown, CheckCircle2, XCircle, AlertTriangle,
  Clock, BarChart2, Zap, Info, RotateCcw,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useManualStore } from '../store/manualStore';
import {
  fetchManualConfig,
  updateManualConfig,
  fetchManualSessions,
  createManualSession,
  addTurn,
  saveSession,
  fetchManualStats,
  deleteManualSession,
  fetchManualSession,
} from '../services/api_manual';
import { ChatSession, ChatTurn, FilterMode, ManualRunConfig } from '../types/manual';

interface ManualAttackPageProps {
  onBack: () => void;
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

const evalColor = (label?: string) => {
  if (label === 'breached') return { bg: '#FEF2F2', text: '#DC2626', border: '#FCA5A5' };
  if (label === 'blocked')  return { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' };
  if (label === 'partial')  return { bg: '#FFFBEB', text: '#B45309', border: '#FCD34D' };
  return { bg: '#F7F6F3', text: '#888', border: '#E8E6E0' };
};

const evalIcon = (label?: string) => {
  if (label === 'breached') return <Zap    size={12} />;
  if (label === 'blocked')  return <CheckCircle2 size={12} />;
  if (label === 'partial')  return <AlertTriangle size={12} />;
  return <Clock size={12} />;
};

const scoreBar = (score?: number) => {
  if (score === undefined || score === null) return null;
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? '#EF4444' : score >= 0.4 ? '#F59E0B' : '#22C55E';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
      <div style={{ flex: 1, height: 4, background: '#E8E6E0', borderRadius: 2 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width .4s' }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color, minWidth: 32 }}>{pct}%</span>
    </div>
  );
};

const FILTER_OPTIONS: { value: FilterMode; label: string; desc: string }[] = [
  { value: 'none',       label: 'None',       desc: 'No defense filter active' },
  // { value: 'regex',      label: 'Regex Filter', desc: 'Pattern-based blocking' },
  // { value: 'semantic',   label: 'Semantic Filter', desc: 'Embedding-based detection' },
  // { value: 'llm_judge',  label: 'LLM Judge',  desc: 'LLM evaluates each message' },
];

// ─── Component ────────────────────────────────────────────────────────────────

const ManualAttackPage: React.FC<ManualAttackPageProps> = ({ onBack }) => {
  const activeRunId = useAppStore(s => s.activeRunId);
  const runs        = useAppStore(s => s.runs);
  const activeRun   = runs.find(r => r.runid === activeRunId);

  const {
    manualConfig, setManualConfig,
    sessions, setSessions, addSession, updateSession, removeSession,
    activeSession, setActiveSession, appendTurnToActiveSession,
    manualStats, setManualStats,
    isSavingSession, setIsSavingSession,
    manualError, setManualError,
    resetManualState,
  } = useManualStore();

  const [loading, setLoading]           = useState(true);
  const [input, setInput]               = useState('');
  const [sending, setSending]           = useState(false);
  const [configOpen, setConfigOpen]     = useState(true);
  const [newSessionLabel, setNewSessionLabel] = useState('');
  const [startingSession, setStartingSession] = useState(false);
  const [saveLabelInput, setSaveLabelInput] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [loadingSession, setLoadingSession] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

  // ── Derived ──────────────────────────────────────────────────────────────
  
  const isSessionActive = activeSession?.status === 'active';

  // ── Boot ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeRunId) return;
    resetManualState();
    boot();
    return () => { resetManualState(); };
    // eslint-disable-next-line
  }, [activeRunId]);

  const boot = async () => {
    setLoading(true);
    try {
      const [cfg, sess, stats] = await Promise.all([
        fetchManualConfig(activeRunId!),
        fetchManualSessions(activeRunId!),
        fetchManualStats(activeRunId!).catch(() => null),
      ]);
      setManualConfig(cfg);
      setSessions(sess);
      if (stats) setManualStats(stats);
    } catch (e: any) {
      setManualError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Scroll chat to bottom on new turns
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeSession]);
  // ── Config save ───────────────────────────────────────────────────────────
  const handleConfigSave = async (newCfg: ManualRunConfig) => {
    if (!activeRunId) return;
    try {
      const saved = await updateManualConfig(activeRunId, newCfg);
      setManualConfig(saved);
    } catch (e: any) {
      setManualError(e.message);
    }
  };

  const handleFilterChange = (mode: FilterMode) => {
    if (!manualConfig) return;
    const updated: ManualRunConfig = {
      ...manualConfig,
      defense_config: { ...manualConfig.defense_config, filter_mode: mode },
    };
    setManualConfig(updated);
    handleConfigSave(updated);
  };

  const handleDomainChange = (domain: string) => {
    if (!manualConfig) return;
    const updated = { ...manualConfig, domain };
    setManualConfig(updated);
  };

  // ── Session management ────────────────────────────────────────────────────
  const handleNewSession = async () => {
    if (!activeRunId) return;
    setStartingSession(true);

    try {
      const label = newSessionLabel.trim() || `Session #${sessions.length + 1}`;
      const sess = await createManualSession(activeRunId, { label });

      addSession(sess);
      setActiveSession(sess); // ✅

      setNewSessionLabel('');
    } catch (e: any) {
      setManualError(e.message);
    } finally {
      setStartingSession(false);
    }
  };

  const handleSessionClick = async (sessionId: string) => {
    setLoadingSession(true);
    try {
      const sessionData = await fetchManualSession(activeRunId, sessionId);

      updateSession(sessionId, sessionData);
      setActiveSession(sessionData); // ✅ THIS is key

    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleSelectSession = (sess: ChatSession) => {
    setActiveSession(sess); // immediate UI
    handleSessionClick(sess.session_id); // fetch fresh
  };

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeRunId) return;
    if (!window.confirm('Delete this session?')) return;
    try {
      await deleteManualSession(activeRunId, sessionId);
      removeSession(sessionId);
      if (activeSession?.session_id === sessionId) {
        setActiveSession(null);
      }
    } catch (e: any) {
      setManualError(e.message);
    }
  };

  // ── Send turn ─────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || !activeRunId || !activeSession || sending) return;
    if (activeSession.status !== 'active') return;

    const content = input.trim();
    setInput('');
    setSending(true);

    const optimistic: ChatTurn = {
      turn_id: `opt-${Date.now()}`,
      role: 'attacker',
      content,
      timestamp: new Date().toISOString(),
      metadata: {},
    };

    appendTurnToActiveSession(optimistic);

    try {
      await addTurn(activeRunId, activeSession.session_id, {
        role: 'attacker',
        content,
      });
    } catch (e: any) {
      setManualError(e.message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Save session ──────────────────────────────────────────────────────────
  const handleSaveSession = async () => {
    if (!activeRunId || !activeSession || isSavingSession) return;

    setIsSavingSession(true);

    try {
      const result = await saveSession(
        activeRunId,
        activeSession.session_id,
        { label: saveLabelInput || undefined }
      );

      const updatedSession: Partial<ChatSession> = {
        status: 'evaluated',
        evaluation_score: result.evaluation_score,
        evaluation_label: result.evaluation_label as any,
        evaluation_reasoning: result.evaluation_reasoning,
        saved_at: new Date().toISOString(),
        evaluated_at: new Date().toISOString(),
      };

      updateSession(activeSession.session_id, updatedSession);

      setActiveSession({
        ...activeSession,
        ...updatedSession,
      });

      setShowSaveModal(false);
      setSaveLabelInput('');

      // Refresh stats
      const stats = await fetchManualStats(activeRunId).catch(() => null);
      if (stats) setManualStats(stats);

    } catch (e: any) {
      setManualError(e.message);
    } finally {
      setIsSavingSession(false);
    }
  };

  // ── Compute turns to display ──────────────────────────────────────────────
  // If we have a selected session that's evaluated, use its stored turns
  // For the active session in progress, use activeTurns (optimistic)
  const displayTurns = activeSession?.turns || [];

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={styles.loadRoot}>
        <div style={styles.spinner} />
        <span style={styles.loadText}>Loading Manual Attack…</span>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <style>{css}</style>

      {/* NAV */}
      <nav style={styles.nav}>
        <div style={styles.navLeft}>
          <button style={styles.backBtn} onClick={onBack}>
            <ArrowLeft size={14} /> Back
          </button>
          <div style={styles.navSep} />
          <span style={styles.navTitle}>Manual Attack</span>
          {activeRun && <span style={styles.navRunName}>— {activeRun.name}</span>}
        </div>
        <div style={styles.navRight}>
          {manualStats && (
            <div style={styles.statsRow}>
              <div style={styles.statChip}>
                <BarChart2 size={11} style={{ color: '#888' }} />
                <span>{manualStats.total_sessions} sessions</span>
              </div>
              <div style={{ ...styles.statChip, color: '#DC2626' }}>
                <Zap size={11} />
                <span>{manualStats.breach_count} breached</span>
              </div>
              <div style={{ ...styles.statChip, color: '#15803D' }}>
                <Shield size={11} />
                <span>{manualStats.blocked_count} blocked</span>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* ERROR BANNER */}
      {manualError && (
        <div style={styles.errorBanner}>
          <XCircle size={14} />
          <span>{manualError}</span>
          <button style={styles.errDismiss} onClick={() => setManualError(null)}>✕</button>
        </div>
      )}

      {/* MAIN LAYOUT */}
      <div style={styles.main}>

        {/* ── LEFT: Config panel ───────────────────────────────────────── */}
        <aside style={styles.sidebar}>
          {/* Config Section */}
          <div style={styles.sideCard}>
            <button style={styles.sectionToggle} onClick={() => setConfigOpen(o => !o)}>
              <span style={styles.sectionTitle}>
                <Shield size={13} style={{ color: '#22C55E' }} />
                Defense Config
              </span>
              <ChevronDown size={14} style={{ transform: configOpen ? 'rotate(180deg)' : 'none', transition: 'transform .2s', color: '#888' }} />
            </button>

            {configOpen && (
              <div style={styles.configBody}>
                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Filter Mode</label>
                  <div style={styles.filterList}>
                    {FILTER_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        style={{
                          ...styles.filterBtn,
                          ...(manualConfig?.defense_config.filter_mode === opt.value ? styles.filterBtnActive : {}),
                        }}
                        onClick={() => handleFilterChange(opt.value)}
                      >
                        <span style={styles.filterBtnLabel}>{opt.label}</span>
                        <span style={styles.filterBtnDesc}>{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.fieldLabel}>Attack Domain</label>
                  <input
                    style={styles.textInput}
                    placeholder="e.g. harassment, cybersecurity…"
                    value={manualConfig?.domain ?? ''}
                    onChange={e => handleDomainChange(e.target.value)}
                    onBlur={() => manualConfig && handleConfigSave(manualConfig)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* New Session */}
          <div style={styles.sideCard}>
            <div style={styles.sectionTitle}>
              <MessageSquare size={13} style={{ color: '#6366F1' }} />
              New Session
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                style={styles.textInput}
                placeholder="Session label (optional)…"
                value={newSessionLabel}
                onChange={e => setNewSessionLabel(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleNewSession()}
              />
              <button
                style={{ ...styles.primaryBtn, opacity: startingSession ? .6 : 1 }}
                onClick={handleNewSession}
                disabled={startingSession}
                className="man-hover-btn"
              >
                <Plus size={14} />
                {startingSession ? 'Starting…' : 'Start Session'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div style={styles.infoBox}>
            <Info size={12} style={{ color: '#6B7280', flexShrink: 0, marginTop: 1 }} />
            <span>Type your attack messages in the chat. Click <strong>Save & Evaluate</strong> when done to record the session and get a score.</span>
          </div>
        </aside>

        {/* ── CENTER: Chat area ─────────────────────────────────────────── */}
        <main style={styles.chatArea}>
          {!activeSession ? (
            <div style={styles.emptyChat}>
              <MessageSquare size={36} style={{ color: '#D4D2CC', marginBottom: 12 }} />
              <div style={styles.emptyChatTitle}>No session selected</div>
              <div style={styles.emptyChatSub}>Start a new session from the panel on the left, or select one below.</div>
            </div>
          ) : (
            <>
              {/* Session header */}
              <div style={styles.chatHeader}>
                <div>
                  <div style={styles.chatHeaderTitle}>{activeSession.label || activeSession.session_id.slice(-8)}</div>
                  <div style={styles.chatHeaderMeta}>
                    {activeSession.turns.length > 0 || activeSession.turns.length > 0
                      ? `${activeSession.status === 'active' ? activeSession.turns.length : activeSession.turns.length} turn${(activeSession.status === 'active' ? activeSession.turns.length : activeSession.turns.length) !== 1 ? 's' : ''}`
                      : 'No turns yet'
                    }
                    {' · '}
                    {new Date(activeSession.created_at).toLocaleTimeString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {activeSession.status === 'evaluated' && (() => {
                    const c = evalColor(activeSession.evaluation_label);
                    return (
                      <span style={{ ...styles.evalBadge, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                        {evalIcon(activeSession.evaluation_label)}
                        {activeSession.evaluation_label}
                        {activeSession.evaluation_score !== undefined && ` · ${Math.round(activeSession.evaluation_score * 100)}%`}
                      </span>
                    );
                  })()}
                  {isSessionActive && (
                    <button
                      style={styles.saveBtn}
                      onClick={() => setShowSaveModal(true)}
                      className="man-hover-btn"
                    >
                      <Save size={13} />
                      Save & Evaluate
                    </button>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div style={styles.messages}>
                {displayTurns.length === 0 && (
                  <div style={styles.noMessages}>Start typing your attack prompt below…</div>
                )}
                {displayTurns.map((turn, i) => (
                  <div
                    key={turn.turn_id || i}
                    style={{
                      ...styles.bubble,
                      alignSelf: turn.role === 'attacker' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      ...styles.bubbleInner,
                      background: turn.role === 'attacker' ? '#1A1A1A' : turn.role === 'defense' ? '#FEF2F2' : '#fff',
                      color: turn.role === 'attacker' ? '#fff' : '#1A1A1A',
                      border: turn.role === 'attacker' ? 'none' : `1px solid ${turn.role === 'defense' ? '#FCA5A5' : '#E8E6E0'}`,
                      borderRadius: turn.role === 'attacker' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    }}>
                      <div style={styles.bubbleRole}>
                        {turn.role === 'attacker' ? '⚔️ You' : turn.role === 'defense' ? '🛡 Defense' : '🎯 Target'}
                      </div>
                      <div style={styles.bubbleContent}>{turn.content}</div>
                      <div style={styles.bubbleTime}>{new Date(turn.timestamp).toLocaleTimeString()}</div>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              {isSessionActive ? (
                <div style={styles.inputRow}>
                  <textarea
                    ref={inputRef}
                    style={styles.chatInput}
                    placeholder="Type your attack message… (Enter to send, Shift+Enter for new line)"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                  />
                  <button
                    style={{ ...styles.sendBtn, opacity: (!input.trim() || sending) ? .4 : 1 }}
                    onClick={handleSend}
                    disabled={!input.trim() || sending}
                    className="man-hover-btn"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : (
                <div style={styles.closedBanner}>
                  <CheckCircle2 size={14} style={{ color: '#15803D' }} />
                  Session saved — start a new session to continue attacking.
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── BOTTOM: Session list ─────────────────────────────────────────── */}
      <section style={styles.bottomPanel}>
        <div style={styles.bottomHeader}>
          <span style={styles.bottomTitle}>Attack Sessions</span>
          <span style={styles.bottomCount}>{sessions.length} total</span>
        </div>

        {sessions.length === 0 ? (
          <div style={styles.bottomEmpty}>No sessions yet. Start a new one above.</div>
        ) : (
          <div style={styles.sessionGrid}>
            {sessions.map(sess => {
              const c      = evalColor(sess.evaluation_label);
              const active = sess.session_id === activeSession?.session_id;
              return (
                <div
                  key={sess.session_id}
                  style={{
                    ...styles.sessionCard,
                    border: active ? '1.5px solid #1A1A1A' : '1px solid #E8E6E0',
                    boxShadow: active ? '0 0 0 3px rgba(26,26,26,.06)' : 'none',
                    cursor: 'pointer',
                  }}
                  onClick={() => handleSelectSession(sess)}
                  className="man-sess-card"
                >
                  <div style={styles.sessCardTop}>
                    <div>
                      <div style={styles.sessLabel}>{sess.label || sess.session_id.slice(-8)}</div>
                      <div style={styles.sessMeta}>
                        {sess.turns.length > 0 ? `${sess.turns.length} turns` : ( active && activeSession.turns.length > 0 ? `${activeSession.turns.length} turns` : 'No turns')}
                        {' · '}
                        {new Date(sess.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                      {sess.status === 'active' ? (
                        <span style={styles.activePill}>active</span>
                      ) : (
                        <span style={{ ...styles.evalPill, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          {evalIcon(sess.evaluation_label)} {sess.evaluation_label}
                        </span>
                      )}
                      <button
                        style={styles.sessDeleteBtn}
                        onClick={(e) => handleDeleteSession(sess.session_id, e)}
                        className="man-del-btn"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  {sess.status === 'evaluated' && (
                    <>
                      {scoreBar(sess.evaluation_score)}
                      {sess.evaluation_reasoning && (
                        <div style={styles.sessReasoning}>{sess.evaluation_reasoning}</div>
                      )}
                    </>
                  )}
                  {sess.defense_filter_used && sess.defense_filter_used !== 'none' && (
                    <div style={styles.sessFilter}>
                      <Shield size={10} style={{ color: '#22C55E' }} />
                      Filter: {sess.defense_filter_used}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── SAVE MODAL ──────────────────────────────────────────────────── */}
      {showSaveModal && (
        <div style={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Save & Evaluate Session</span>
              <button style={styles.modalClose} onClick={() => setShowSaveModal(false)}>✕</button>
            </div>
            <div style={styles.modalBody}>
              <p style={styles.modalText}>
                Saving will lock this session and run the evaluator on your conversation.
                You can optionally add a label before saving.
              </p>
              <label style={styles.fieldLabel}>Session Label (optional)</label>
              <input
                style={styles.textInput}
                placeholder={activeSession?.label || 'e.g. SQL injection attempt…'}
                value={saveLabelInput}
                onChange={e => setSaveLabelInput(e.target.value)}
                autoFocus
              />
            </div>
            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setShowSaveModal(false)}>Cancel</button>
              <button
                style={{ ...styles.primaryBtn, opacity: isSavingSession ? .6 : 1, minWidth: 140 }}
                onClick={handleSaveSession}
                disabled={isSavingSession}
              >
                <Save size={13} />
                {isSavingSession ? 'Evaluating…' : 'Save & Evaluate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');
  * { box-sizing: border-box; }
  .man-hover-btn:hover { opacity: .85 !important; }
  .man-sess-card:hover { border-color: #D4D2CC !important; }
  .man-del-btn { opacity: 0; transition: opacity .15s !important; }
  .man-sess-card:hover .man-del-btn { opacity: 1 !important; }
`;

const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    background: '#F7F6F3',
    color: '#1A1A1A',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  loadRoot: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    minHeight: '100vh', gap: 12, fontFamily: "'DM Sans', sans-serif",
  },
  spinner: {
    width: 28, height: 28, border: '2.5px solid #E8E6E0',
    borderTopColor: '#1A1A1A', borderRadius: '50%',
    animation: 'spin .7s linear infinite',
  },
  loadText: { fontSize: 13, color: '#888' },

  // Nav
  nav: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 24px', height: 52, background: '#fff',
    borderBottom: '1px solid #E8E6E0', position: 'sticky', top: 0, zIndex: 100,
  },
  navLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  backBtn: {
    display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#888',
    cursor: 'pointer', border: 'none', background: 'none', fontFamily: 'inherit', transition: 'color .15s',
  },
  navSep: { width: 1, height: 16, background: '#E8E6E0' },
  navTitle: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.3px' },
  navRunName: { fontSize: 13, color: '#888' },
  navRight: { display: 'flex', alignItems: 'center', gap: 12 },
  statsRow: { display: 'flex', gap: 8 },
  statChip: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontSize: 11, color: '#666', background: '#F7F6F3',
    padding: '4px 10px', borderRadius: 20, border: '1px solid #E8E6E0',
  },

  // Error
  errorBanner: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 24px', background: '#FEF2F2', borderBottom: '1px solid #FCA5A5',
    color: '#DC2626', fontSize: 13,
  },
  errDismiss: {
    marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', fontSize: 14,
  },

  // Layout
  main: {
    display: 'grid', gridTemplateColumns: '260px 1fr',
    gap: 0, flex: 1, minHeight: 0, overflow: 'hidden',
  },

  // Sidebar
  sidebar: {
    background: '#fff', borderRight: '1px solid #E8E6E0',
    padding: 16, display: 'flex', flexDirection: 'column', gap: 12,
    overflowY: 'auto', maxHeight: 'calc(100vh - 52px - 280px)',
  },
  sideCard: {
    background: '#F7F6F3', border: '1px solid #E8E6E0',
    borderRadius: 10, padding: 14,
  },
  sectionToggle: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'inherit', padding: 0,
  },
  sectionTitle: {
    display: 'flex', alignItems: 'center', gap: 7,
    fontSize: 12, fontWeight: 600, letterSpacing: '0.2px', color: '#1A1A1A',
  },
  configBody: { marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 },
  fieldGroup: { display: 'flex', flexDirection: 'column', gap: 6 },
  fieldLabel: { fontSize: 10, fontWeight: 500, color: '#999', letterSpacing: '0.5px', textTransform: 'uppercase' },
  filterList: { display: 'flex', flexDirection: 'column', gap: 4 },
  filterBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
    padding: '8px 10px', background: '#fff', border: '1px solid #E8E6E0',
    borderRadius: 7, cursor: 'pointer', transition: 'all .15s', textAlign: 'left', fontFamily: 'inherit',
  },
  filterBtnActive: {
    background: '#1A1A1A', color: '#fff', border: '1px solid #1A1A1A',
  },
  filterBtnLabel: { fontSize: 12, fontWeight: 600 },
  filterBtnDesc:  { fontSize: 10, opacity: 0.65, marginTop: 1 },
  textInput: {
    height: 34, background: '#fff', border: '1px solid #E8E6E0',
    borderRadius: 7, padding: '0 10px', fontSize: 12,
    fontFamily: 'inherit', color: '#1A1A1A', outline: 'none', width: '100%',
  },
  primaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '9px 14px', background: '#1A1A1A', color: '#fff',
    fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity .15s',
  },
  infoBox: {
    display: 'flex', gap: 8, fontSize: 11, color: '#6B7280',
    background: '#F0EDE6', borderRadius: 8, padding: '10px 12px', lineHeight: 1.55,
  },

  // Chat area
  chatArea: {
    display: 'flex', flexDirection: 'column',
    maxHeight: 'calc(100vh - 52px - 280px)', overflow: 'hidden',
  },
  chatHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 20px', background: '#fff', borderBottom: '1px solid #E8E6E0', flexShrink: 0,
  },
  chatHeaderTitle: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.3px' },
  chatHeaderMeta: { fontSize: 11, color: '#AAA', marginTop: 2 },
  evalBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    fontSize: 11, fontWeight: 500, padding: '4px 10px', borderRadius: 20,
  },
  saveBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', background: '#1A1A1A', color: '#fff',
    fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none',
    cursor: 'pointer', fontFamily: 'inherit',
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: '16px 20px',
    display: 'flex', flexDirection: 'column', gap: 12,
  },
  noMessages: { textAlign: 'center', color: '#BBB', fontSize: 13, marginTop: 40 },
  emptyChat: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', color: '#888',
  },
  emptyChatTitle: { fontSize: 15, fontWeight: 600, marginBottom: 6 },
  emptyChatSub:   { fontSize: 13, color: '#AAA', textAlign: 'center', maxWidth: 280 },

  bubble: { display: 'flex', maxWidth: '78%' },
  bubbleInner: {
    padding: '10px 14px', boxShadow: '0 1px 3px rgba(0,0,0,.06)',
  },
  bubbleRole:    { fontSize: 10, fontWeight: 600, opacity: .55, marginBottom: 4 },
  bubbleContent: { fontSize: 13, lineHeight: 1.55, whiteSpace: 'pre-wrap', wordBreak: 'break-word' },
  bubbleTime:    { fontSize: 10, opacity: .4, marginTop: 5, textAlign: 'right' },

  inputRow: {
    display: 'flex', gap: 8, padding: '12px 20px',
    background: '#fff', borderTop: '1px solid #E8E6E0', flexShrink: 0,
  },
  chatInput: {
    flex: 1, background: '#F7F6F3', border: '1px solid #E8E6E0',
    borderRadius: 10, padding: '10px 14px', fontSize: 13,
    fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A', outline: 'none',
    resize: 'none', lineHeight: 1.5,
  },
  sendBtn: {
    width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 10,
    cursor: 'pointer', alignSelf: 'flex-end', flexShrink: 0,
  },
  closedBanner: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px',
    background: '#F0FDF4', borderTop: '1px solid #BBF7D0',
    color: '#15803D', fontSize: 12, fontWeight: 500, flexShrink: 0,
  },

  // Bottom panel
  bottomPanel: {
    background: '#fff', borderTop: '1px solid #E8E6E0',
    padding: '16px 24px', height: 280, overflowY: 'auto', flexShrink: 0,
  },
  bottomHeader: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14,
  },
  bottomTitle: { fontSize: 13, fontWeight: 600, letterSpacing: '-0.2px' },
  bottomCount: {
    fontSize: 10, fontWeight: 500, color: '#888',
    background: '#F0EDE6', padding: '2px 8px', borderRadius: 12,
  },
  bottomEmpty: { color: '#AAA', fontSize: 13, textAlign: 'center', padding: '16px 0' },
  sessionGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10,
  },
  sessionCard: {
    background: '#FAFAF9', borderRadius: 9, padding: '12px 14px', transition: 'border .15s',
  },
  sessCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' },
  sessLabel:   { fontSize: 13, fontWeight: 600, letterSpacing: '-0.2px' },
  sessMeta:    { fontSize: 11, color: '#AAA', marginTop: 2 },
  activePill: {
    fontSize: 10, fontWeight: 500, background: '#EEF2FF', color: '#4F46E5',
    padding: '3px 8px', borderRadius: 12, border: '1px solid #C7D2FE',
    display: 'inline-flex', alignItems: 'center',
  },
  evalPill: {
    fontSize: 10, fontWeight: 500, padding: '3px 8px', borderRadius: 12,
    display: 'inline-flex', alignItems: 'center', gap: 4,
  },
  sessDeleteBtn: {
    background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444',
    padding: 3, borderRadius: 4, display: 'flex', alignItems: 'center',
  },
  sessReasoning: {
    fontSize: 11, color: '#888', marginTop: 8, lineHeight: 1.5,
    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
  } as React.CSSProperties,
  sessFilter: {
    display: 'inline-flex', alignItems: 'center', gap: 4,
    fontSize: 10, color: '#555', marginTop: 6,
    background: '#F0FDF4', padding: '2px 8px', borderRadius: 10, border: '1px solid #BBF7D0',
  },

  // Modal
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modal: {
    background: '#fff', borderRadius: 12, width: 420,
    boxShadow: '0 20px 48px rgba(0,0,0,.15)', overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '18px 22px', borderBottom: '1px solid #E8E6E0',
  },
  modalTitle: { fontSize: 15, fontWeight: 600, letterSpacing: '-0.3px' },
  modalClose: {
    background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 16, lineHeight: 1,
  },
  modalBody: { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 },
  modalText: { fontSize: 13, color: '#666', lineHeight: 1.6, margin: 0 },
  modalFooter: {
    display: 'flex', justifyContent: 'flex-end', gap: 8,
    padding: '14px 22px 18px', borderTop: '1px solid #E8E6E0',
  },
  cancelBtn: {
    padding: '8px 16px', background: '#F0EDE6', color: '#555',
    fontSize: 12, fontWeight: 500, borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  },
};

export default ManualAttackPage;
