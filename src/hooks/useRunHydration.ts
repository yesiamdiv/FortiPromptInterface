import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/appStore';
import {
  fetchRun,
  fetchRunAttacks,
  fetchRunDefences,
  fetchRunEvaluations,
  fetchRunStats,
} from '../services/api';
import { websocketService } from '../services/websocket';

/**
 * Fetches all data for a run and populates the store.
 * Called once when runId changes — tab switches within the same run do NOT re-fetch.
 *
 * For manual runs: does nothing after fetching the run itself — ManualAttackPage
 * fetches its own sessions and history.
 * For automatic/batch runs: fetches attacks, defences, evaluations, and stats in parallel.
 */
export function useRunHydration(runId: string | undefined) {
  const upsertRun            = useAppStore(s => s.upsertRun);
  const resetRunState        = useAppStore(s => s.resetRunState);
  const setActiveRun         = useAppStore(s => s.setActiveRun);
  const setIsRunLocked       = useAppStore(s => s.setIsRunLocked);
  const setIsAttacking       = useAppStore(s => s.setIsAttacking);
  const clearAttackPrompts   = useAppStore(s => s.clearAttackPrompts);
  const clearDefenseResponses = useAppStore(s => s.clearDefenseResponses);
  const clearEvalResults     = useAppStore(s => s.clearEvalResults);
  const addAttackPrompt      = useAppStore(s => s.addAttackPrompt);
  const addDefenseResponse   = useAppStore(s => s.addDefenseResponse);
  const addEvalResult        = useAppStore(s => s.addEvalResult);
  const setEvalStats         = useAppStore(s => s.setEvalStats);
  const setDefenseStats      = useAppStore(s => s.setDefenseStats);

  // Track which runId we last hydrated so tab switches don't re-trigger
  const hydratedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!runId) return;

    // Only reset + re-hydrate when switching to a *different* run
    if (hydratedForRef.current === runId) return;
    hydratedForRef.current = runId;

    resetRunState();
    setActiveRun(runId);
    clearAttackPrompts();
    clearDefenseResponses();
    clearEvalResults();

    const hydrateData = async () => {
      let run: any = null;
      try {
        run = await fetchRun(runId);
        upsertRun(run);
      } catch { /* run not found — leave nav showing stale data from store */ }

      // Reflect live run status in nav and lock state
      if (run?.status === 'running') {
        setIsRunLocked(true);
        setIsAttacking(true);
      }

      // Manual runs manage their own sessions — nothing more to do here
      const isManualRun = run?.config?.graph_type === 'manual';
      if (!run || isManualRun) return;

      const [attacks, defences, evaluations, stats] = await Promise.allSettled([
        fetchRunAttacks(runId),
        fetchRunDefences(runId),
        fetchRunEvaluations(runId),
        fetchRunStats(runId),
      ]);

      if (attacks.status === 'fulfilled') {
        for (const a of attacks.value) {
          addAttackPrompt({
            promptId:  a.turn_id,
            content:   a.prompt,
            status:    'generated',
            timestamp: a.timestamp ?? new Date().toISOString(),
            metadata:  a.metadata ?? {},
          });
        }
      }

      if (defences.status === 'fulfilled') {
        for (const d of defences.value) {
          addDefenseResponse({
            promptId:        d.turn_id,
            defenseResponse: d.response,
            evaluation:      d.was_blocked ? 'blocked' : 'passed',
            was_blocked:     d.was_blocked ?? false,
            blocked_by:      d.metadata?.blocked_by,
            attack_type:     d.metadata?.attack_type,
            timestamp:       d.timestamp ?? new Date().toISOString(),
          });
        }
      }

      if (evaluations.status === 'fulfilled') {
        const attackMap  = attacks.status  === 'fulfilled' ? Object.fromEntries(attacks.value.map((a: any)  => [a.turn_id, a]))  : {};
        const defenceMap = defences.status === 'fulfilled' ? Object.fromEntries(defences.value.map((d: any) => [d.turn_id, d])) : {};
        for (const e of evaluations.value) {
          const cat = (e.category ?? '').toLowerCase();
          const verdict: 'breach' | 'defended' | 'partial' =
            cat.includes('partial')  ? 'partial'  :
            e.success === true       ? 'breach'   :
            'defended';
          addEvalResult({
            evalId:         e.turn_id,
            promptId:       e.turn_id,
            verdict,
            score:          e.score ?? 0,
            reasoning:      e.feedback ?? '',
            timestamp:      e.timestamp ?? new Date().toISOString(),
            attackContent:  (attackMap as any)[e.turn_id]?.prompt,
            defenseContent: (defenceMap as any)[e.turn_id]?.response,
            was_blocked:    (defenceMap as any)[e.turn_id]?.was_blocked,
            attack_type:    (defenceMap as any)[e.turn_id]?.metadata?.attack_type,
          });
        }
      }

      if (stats.status === 'fulfilled') {
        const s = stats.value;
        const total = s.total_evaluations ?? 0;
        setEvalStats({
          total,
          breaches:     total ? Math.round((s.success_rate  ?? 0) * total) : 0,
          defended:     total ? total - Math.round((s.success_rate ?? 0) * total) : 0,
          partial:      0,
          averageScore: s.average_score ?? 0,
          breachRate:   s.success_rate  ?? 0,
        });
        setDefenseStats({
          totalResponses:      s.total_defences ?? 0,
          blockedCount:        total ? Math.round((s.blocked_rate ?? 0) * total) : 0,
          passedCount:         total ? total - Math.round((s.blocked_rate ?? 0) * total) : 0,
          overallDefenseScore: s.blocked_rate != null ? Math.round(s.blocked_rate * 100) : 0,
        });
      }
    };

    hydrateData();

    websocketService.joinRun(runId);
    return () => { websocketService.leaveRun(runId); };
  // Only re-run when runId changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  return hydratedForRef;
}
