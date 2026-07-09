import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/appStore';
import { updateRun as updateRunApi } from '../services/api';
import { UpdateRunRequest } from '../types';

/**
 * Buffers UpdateRunRequest patches and flushes them to the backend
 * after an 800ms debounce. Used by RunConfigPanel via RunShell.
 *
 * Returns handleParamsChange (call from the panel) and saving (spinner flag).
 */
export function useRunParamSync(runId: string | undefined, isLocked: boolean) {
  const updateRunStore = useAppStore(s => s.updateRun);
  const [pendingUpdate, setPendingUpdate] = useState<UpdateRunRequest | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pendingUpdate || !runId || isLocked) return;
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        const updated = await updateRunApi(runId, pendingUpdate);
        updateRunStore(runId, updated);
        setPendingUpdate(null);
      } catch { /* non-fatal — params will be re-sent on next change */ }
      finally { setSaving(false); }
    }, 800);
    return () => clearTimeout(timer);
  }, [pendingUpdate, runId, isLocked, updateRunStore]);

  const handleParamsChange = useCallback((update: UpdateRunRequest) => {
    if (isLocked) return;
    setPendingUpdate(prev => {
      if (!prev) return update;
      // Merge patch fields so rapid changes don't overwrite each other
      const merged: UpdateRunRequest = { ...prev };
      if (update.strategy_params)        merged.strategy_params        = { ...(prev.strategy_params ?? {}),        ...update.strategy_params };
      if (update.attack_node_params)     merged.attack_node_params     = { ...(prev.attack_node_params ?? {}),     ...update.attack_node_params };
      if (update.defense_node_params)    merged.defense_node_params    = { ...(prev.defense_node_params ?? {}),    ...update.defense_node_params };
      if (update.evaluation_node_params) merged.evaluation_node_params = { ...(prev.evaluation_node_params ?? {}), ...update.evaluation_node_params };
      return merged;
    });
  }, [isLocked]);

  /**
   * Flush any pending update immediately (e.g. before starting a run).
   * Returns the flushed patch or null if nothing was pending.
   */
  const flushPending = useCallback(async (): Promise<UpdateRunRequest | null> => {
    if (!pendingUpdate || !runId) return null;
    setSaving(true);
    try {
      const updated = await updateRunApi(runId, pendingUpdate);
      updateRunStore(runId, updated);
      setPendingUpdate(null);
      return pendingUpdate;
    } catch {
      return null;
    } finally {
      setSaving(false);
    }
  }, [pendingUpdate, runId, updateRunStore]);

  return { handleParamsChange, flushPending, saving };
}
