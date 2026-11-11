import { useEffect, useState } from 'react';
import { initialState, validPlan, type PlannerState } from '@/lib/dinner';
const STORAGE_KEY = 'hotpot-together-v1';
export function usePlanner() {
  const [state, setState] = useState<PlannerState>(initialState);
  const [loaded, setLoaded] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored);
        if (validPlan(saved.plan) && Number.isInteger(saved.revision) && saved.revision > 0 && Array.isArray(saved.history) && saved.history.every(validPlan)) {
          setState({ plan: saved.plan, revision: saved.revision, history: saved.history.slice(-30), proposal: null, message: '' });
        }
      }
    } catch { setStorageWarning(true); }
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ plan: state.plan, revision: state.revision, history: state.history })); }
    catch { setStorageWarning(true); }
  }, [state.plan, state.revision, state.history, loaded]);
  return { state, setState, storageWarning };
}