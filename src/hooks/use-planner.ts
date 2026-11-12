import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  initialPlan,
  initialState,
  review,
  samePlan,
  validPlan,
  type Plan,
  type PlannerMode,
  type PlannerState,
} from "@/lib/dinner";
import { reviewWithMenu } from "@/lib/menu.functions";
const STORAGE_KEY = "hotpot-together-v1";
export function usePlanner() {
  const [state, setInternalState] = useState<PlannerState>(initialState);
  const [mode, setInternalMode] = useState<PlannerMode>("sample");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [reviewedPlan, setReviewedPlan] = useState<Plan>(initialPlan);
  const [storageWarning, setStorageWarning] = useState(false);
  const serial = useRef(0);
  const request = useRef<AbortController | null>(null);
  const invalidate = useCallback(() => {
    serial.current += 1;
    request.current?.abort();
    setPending(false);
    setError(null);
  }, []);
  // Every user mutation (including Undo, Reset, Dismiss and switching modes) cancels review.
  const setState: Dispatch<SetStateAction<PlannerState>> = useCallback(
    (action) => {
      invalidate();
      setInternalState(action);
    },
    [invalidate],
  );
  const setMode = useCallback(
    (next: PlannerMode) => {
      invalidate();
      setInternalMode(next);
      setInternalState((s) => ({ ...s, proposal: null, message: "" }));
    },
    [invalidate],
  );
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const saved = JSON.parse(stored);
        if (
          validPlan(saved.plan) &&
          Number.isSafeInteger(saved.revision) &&
          saved.revision > 0 &&
          Array.isArray(saved.history) &&
          saved.history.every(validPlan)
        ) {
          setInternalState({
            plan: saved.plan,
            revision: saved.revision,
            history: saved.history.slice(-30),
            proposal: null,
            message: "",
          });
          setReviewedPlan(
            validPlan(saved.reviewedPlan)
              ? saved.reviewedPlan
              : saved.history.length
                ? initialPlan()
                : saved.plan,
          );
        }
      }
    } catch {
      setStorageWarning(true);
    }
    setLoaded(true);
    return () => {
      serial.current += 1;
      request.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (!loaded || mode !== "sample") return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          plan: state.plan,
          revision: state.revision,
          history: state.history,
          reviewedPlan,
        }),
      );
    } catch {
      setStorageWarning(true);
    }
  }, [state.plan, state.revision, state.history, reviewedPlan, loaded, mode]);
  const requestReview = async () => {
    invalidate();
    const id = serial.current;
    const snapshot = state;
    const controller = new AbortController();
    request.current = controller;
    setInternalState((s) => ({ ...s, proposal: null, message: "" }));
    setPending(true);
    try {
      const result =
        mode === "sample"
          ? { ok: true as const, proposal: review(snapshot.plan, snapshot.revision) }
          : await reviewWithMenu({
              data: { plan: snapshot.plan, revision: snapshot.revision },
              signal: controller.signal,
            });
      if (id !== serial.current) return;
      if (!result.ok) {
        setError(result.message);
        return;
      }
      if (result.proposal.revision !== snapshot.revision || result.proposal.mode !== mode) {
        setError("The review no longer matches this plan. Review again.");
        return;
      }
      setInternalState((s) =>
        s.revision === snapshot.revision && samePlan(s.plan, snapshot.plan)
          ? { ...s, proposal: result.proposal }
          : s,
      );
    } catch (err) {
      if (id === serial.current)
        setError(
          mode === "sample" && err instanceof Error
            ? err.message
            : "The review request failed. Your plan is unchanged. Retry or choose Sample mode.",
        );
    } finally {
      if (id === serial.current) {
        setPending(false);
        request.current = null;
      }
    }
  };
  return {
    state,
    setState,
    storageWarning,
    reviewedPlan,
    setReviewedPlan,
    mode,
    setMode,
    pending,
    error,
    requestReview,
    cancelReview: invalidate,
    loaded,
  };
}
