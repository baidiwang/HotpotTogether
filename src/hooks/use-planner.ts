import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  exampleRequest,
  friendsExample,
  initialPlan,
  initialState,
  review,
  requestDescription,
  samePlan,
  updatePlan,
  validPlan,
  type ItemId,
  type Plan,
  type PlannerMode,
  type PlannerState,
  type Proposal,
  type ReviewAttempt,
} from "@/lib/dinner";
import { reviewWithMenu } from "@/lib/menu.functions";
const STORAGE_KEY = "hotpot-together-v1";
export function usePlanner() {
  const [state, setInternalState] = useState<PlannerState>(initialState);
  const [mode, setInternalMode] = useState<PlannerMode>("sample");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [userRequest, setUserRequest] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [lastRun, setLastRun] = useState<Proposal | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<ReviewAttempt[]>([]);
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
    setFailedAttempts([]);
  }, []);
  const setState: Dispatch<SetStateAction<PlannerState>> = useCallback(
    (action) => {
      invalidate();
      setInternalState(action);
      setReviewOpen(false);
      setLastRun(null);
      setReviewNotice("");
      setUserRequest("");
    },
    [invalidate],
  );
  const setMode = useCallback(
    (next: PlannerMode) => {
      invalidate();
      setInternalMode(next);
      setInternalState((s) => ({ ...s, proposal: null, requestId: null, message: "" }));
      setReviewOpen(false);
      setLastRun(null);
      setUserRequest("");
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
            requestId: null,
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
  useEffect(() => {
    if (reviewOpen && document.documentElement.clientWidth < 1024) {
      document
        .getElementById("shared-workspace")
        ?.scrollIntoView({ block: "start", behavior: "instant" });
    }
  }, [reviewOpen]);
  const editPlan = (next: Plan, message = "") => {
    invalidate();
    if (state.proposal) setLastRun(state.proposal);
    const keptOnly = samePlan({ ...next, kept: state.plan.kept }, state.plan);
    setInternalState((s) => updatePlan(s, next, message));
    if (!keptOnly || !userRequest) setUserRequest(requestDescription(next));
    setReviewNotice(
      keptOnly
        ? "Kept constraints changed. The previous proposal is invalid."
        : "Plan changed. The previous proposal is invalid.",
    );
  };
  const setKept = (id: ItemId, kept: boolean) =>
    editPlan({
      ...state.plan,
      kept: kept
        ? [...new Set([...state.plan.kept, id])]
        : state.plan.kept.filter((item) => item !== id),
    });
  const runReview = async (snapshot: PlannerState, label: string) => {
    invalidate();
    const serialId = serial.current;
    const requestId = crypto.randomUUID?.() ?? `review-${Date.now()}-${serialId}`;
    const controller = new AbortController();
    request.current = controller;
    setUserRequest(label);
    setReviewOpen(true);
    setReviewNotice("");
    setLastRun(null);
    setInternalState((s) => ({ ...s, proposal: null, requestId, message: "" }));
    setPending(true);
    try {
      const result =
        mode === "sample"
          ? {
              ok: true as const,
              proposal: review(snapshot.plan, snapshot.revision, requestId, label),
            }
          : await reviewWithMenu({
              data: {
                plan: snapshot.plan,
                revision: snapshot.revision,
                requestId,
                userRequest: label,
              },
              signal: controller.signal,
            });
      if (serialId !== serial.current) return;
      if (!result.ok) {
        setError(result.message);
        setFailedAttempts(result.attempts ?? []);
        return;
      }
      if (
        result.proposal.revision !== snapshot.revision ||
        result.proposal.requestId !== requestId ||
        result.proposal.mode !== mode
      ) {
        setError("The review no longer matches this request. Review again.");
        return;
      }
      setInternalState((s) =>
        s.revision === snapshot.revision &&
        s.requestId === requestId &&
        samePlan(s.plan, snapshot.plan)
          ? { ...s, proposal: result.proposal }
          : s,
      );
    } catch (err) {
      if (serialId === serial.current)
        setError(
          mode === "sample" && err instanceof Error
            ? err.message
            : "The review request failed. Your plan is unchanged. Retry or choose Sample mode.",
        );
    } finally {
      if (serialId === serial.current) {
        setPending(false);
        request.current = null;
      }
    }
  };
  const requestReview = () => runReview(state, userRequest || requestDescription(state.plan));
  const startExample = () => {
    const next = updatePlan(state, friendsExample());
    setInternalState(next);
    return runReview(next, exampleRequest);
  };
  const dismissReview = () => {
    invalidate();
    setInternalState((s) => ({ ...s, proposal: null, requestId: null, message: "" }));
    setReviewOpen(false);
    setLastRun(null);
    setUserRequest("");
  };
  const cancelReview = () => {
    invalidate();
    setInternalState((s) => ({ ...s, proposal: null, requestId: null }));
    setReviewNotice("Review cancelled. No recommendation was applied.");
  };
  return {
    state,
    setState,
    editPlan,
    setKept,
    storageWarning,
    reviewedPlan,
    setReviewedPlan,
    mode,
    setMode,
    pending,
    error,
    requestReview,
    cancelReview,
    dismissReview,
    startExample,
    reviewOpen,
    userRequest,
    reviewNotice,
    lastRun,
    failedAttempts,
    loaded,
  };
}
