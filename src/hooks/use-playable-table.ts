import { useCallback, useEffect, useRef, useState } from "react";
import { catalog, preferences, type ItemId, type PlannerMode, type Proposal } from "@/lib/dinner";
import { reviewWithMenu } from "@/lib/menu.functions";
import { reviewPlates } from "@/lib/plate-portions";
import {
  acceptanceError,
  addFriend,
  changedPlates,
  changePlate,
  initialTable,
  makeOffer,
  sameTable,
  validTable,
  withFriends,
  type TableOffer,
  type TableSnapshot,
} from "@/lib/playable-table";

type TableState = {
  snapshot: TableSnapshot;
  history: TableSnapshot[];
  revision: number;
  requestId: string | null;
  offer: TableOffer | null;
  record: Proposal | null;
  automatic: boolean;
  status: "idle" | "pending" | "ready" | "error";
  error: string;
  notice: string;
  reason: string;
};
const initial = (): TableState => ({
  snapshot: initialTable(),
  history: [],
  revision: 1,
  requestId: null,
  offer: null,
  record: null,
  automatic: false,
  status: "idle",
  error: "",
  notice: "",
  reason: "",
});
const storageKey = "hotpot-playable-table-v1";
export function usePlayableTable() {
  const [state, setState] = useState(initial);
  const current = useRef(state);
  const [mode, setInternalMode] = useState<PlannerMode>("sample");
  const modeRef = useRef(mode);
  const [loaded, setLoaded] = useState(false);
  const generation = useRef(0);
  const request = useRef<AbortController | null>(null);
  const publish = useCallback((next: TableState) => {
    current.current = next;
    setState(next);
  }, []);
  const invalidate = useCallback(() => {
    generation.current++;
    request.current?.abort();
    request.current = null;
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          validTable(saved.snapshot) &&
          Array.isArray(saved.history) &&
          saved.history.every(validTable)
        )
          publish({ ...initial(), snapshot: saved.snapshot, history: saved.history.slice(-30) });
      }
    } catch {
      publish({
        ...current.current,
        notice: "Browser saving is unavailable. You can still prepare this table.",
      });
    }
    setLoaded(true);
    return invalidate;
  }, [invalidate, publish]);
  useEffect(() => {
    if (!loaded || mode !== "sample") return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ snapshot: state.snapshot, history: state.history }),
      );
    } catch {
      /* Table interactions keep working when storage is unavailable. */
    }
  }, [loaded, mode, state.snapshot, state.history]);

  useEffect(() => {
    if (!loaded || !state.automatic) return;
    const serial = ++generation.current;
    const snapshot = state.snapshot;
    const revision = state.revision;
    const requestId = crypto.randomUUID?.() ?? `table-${Date.now()}-${serial}`;
    const controller = new AbortController();
    request.current = controller;
    const label =
      `${state.reason} Prepare this table for ${snapshot.plan.guests} friends, ${snapshot.plan.vegetarians} vegetarian, within $${snapshot.plan.budget}.`.slice(
        0,
        240,
      );
    const run = async () => {
      if (controller.signal.aborted) return;
      publish({ ...current.current, requestId, status: "pending", error: "" });
      try {
        const result =
          mode === "sample"
            ? {
                ok: true as const,
                proposal: reviewPlates(snapshot.plan, revision, requestId, label),
              }
            : await reviewWithMenu({
                data: {
                  plan: snapshot.plan,
                  revision,
                  requestId,
                  userRequest: label,
                  presentation: "plates",
                },
                signal: controller.signal,
              });
        if (
          serial !== generation.current ||
          controller.signal.aborted ||
          current.current.revision !== revision ||
          current.current.requestId !== requestId ||
          modeRef.current !== mode
        )
          return;
        if (!result.ok) {
          publish({ ...current.current, automatic: false, status: "error", error: result.message });
          return;
        }
        if (result.proposal.mode !== mode)
          throw new Error("The suggestion has the wrong planning mode.");
        const offer = makeOffer(result.proposal, snapshot, revision, requestId);
        publish({
          ...current.current,
          automatic: false,
          status: "ready",
          offer: changedPlates(offer, snapshot.plan).length ? offer : null,
          record: result.proposal,
          notice: changedPlates(offer, snapshot.plan).length
            ? ""
            : "Menu checked the table. Your selected plates already fit this group.",
        });
      } catch (error) {
        if (serial === generation.current && !controller.signal.aborted)
          publish({
            ...current.current,
            automatic: false,
            status: "error",
            error:
              error instanceof Error
                ? error.message
                : "Menu could not check the table. Your plates are unchanged.",
          });
      } finally {
        if (request.current === controller) request.current = null;
      }
    };
    // Real input batching, not a simulated processing delay. Sample runs immediately.
    const timer = mode === "live" ? setTimeout(() => void run(), 300) : null;
    if (mode === "sample") void run();
    return () => {
      if (timer) clearTimeout(timer);
      controller.abort();
    };
  }, [state.revision, state.automatic, state.snapshot, state.reason, loaded, mode, publish]);

  const edit = (change: (s: TableSnapshot) => TableSnapshot, reason: string) => {
    const s = current.current;
    const snapshot = change(s.snapshot);
    if (!validTable(snapshot) || sameTable(snapshot, s.snapshot)) return;
    invalidate();
    publish({
      ...s,
      snapshot,
      history: [...s.history, s.snapshot].slice(-30),
      revision: s.revision + 1,
      requestId: null,
      offer: null,
      record: null,
      automatic: true,
      status: "idle",
      error: "",
      notice: "",
      reason,
    });
  };
  const setMode = (next: PlannerMode) => {
    if (modeRef.current === next) return;
    invalidate();
    modeRef.current = next;
    setInternalMode(next);
    publish({
      ...current.current,
      revision: current.current.revision + 1,
      requestId: null,
      offer: null,
      record: null,
      automatic: true,
      status: "idle",
      error: "",
      notice: "",
      reason: "Check the current selected plates.",
    });
  };
  const addPlate = (id: ItemId, delta = 1) =>
    edit(
      (s) => changePlate(s, id, delta),
      `The host ${delta > 0 ? "added" : "removed"} a plate of ${catalog.find((item) => item.id === id)?.name}.`,
    );
  const toggleKeep = (id: ItemId) =>
    edit(
      (s) =>
        s.plan.quantities[id] === 0
          ? s
          : {
              ...s,
              plan: {
                ...s.plan,
                kept: s.plan.kept.includes(id)
                  ? s.plan.kept.filter((kept) => kept !== id)
                  : [...s.plan.kept, id],
              },
            },
      "The host changed a Must keep constraint.",
    );
  const accept = (id?: ItemId, identity = current.current.offer?.requestId) => {
    const s = current.current;
    const offer = s.offer;
    if (
      !offer ||
      offer.revision !== s.revision ||
      offer.requestId !== s.requestId ||
      identity !== offer.requestId
    )
      return;
    const error = acceptanceError(s.snapshot.plan, offer, id);
    if (error) {
      publish({ ...s, notice: error });
      return;
    }
    const plan = id
      ? {
          ...s.snapshot.plan,
          quantities: { ...s.snapshot.plan.quantities, [id]: offer.target.quantities[id] },
        }
      : offer.target;
    const snapshot = { ...s.snapshot, plan };
    const revision = s.revision + 1;
    const requestId = `${offer.source.requestId}:choice:${revision}`;
    const remaining = { ...offer, revision, requestId };
    invalidate();
    publish({
      ...s,
      snapshot,
      history: [...s.history, s.snapshot].slice(-30),
      revision,
      requestId,
      offer: changedPlates(remaining, plan).length ? remaining : null,
      automatic: false,
      status: "ready",
      notice: "Suggested plates placed. You can Undo.",
      error: "",
    });
  };
  const decline = (id?: ItemId) => {
    const s = current.current;
    const offer = s.offer;
    if (!offer || offer.revision !== s.revision || offer.requestId !== s.requestId) return;
    invalidate();
    if (!id) {
      publish({
        ...s,
        offer: null,
        requestId: null,
        automatic: false,
        notice: "Suggestions dismissed. Your selected plates stayed.",
        status: "idle",
      });
      return;
    }
    const target = {
      ...offer.target,
      quantities: { ...offer.target.quantities, [id]: s.snapshot.plan.quantities[id] },
    };
    const next = { ...offer, target };
    publish({
      ...s,
      offer: changedPlates(next, s.snapshot.plan).length ? next : null,
      automatic: false,
      notice: "That suggestion was dismissed. Your selected plates stayed.",
    });
  };
  const undo = () => {
    const s = current.current;
    const snapshot = s.history.at(-1);
    if (!snapshot) return;
    invalidate();
    publish({
      ...initial(),
      snapshot,
      history: s.history.slice(0, -1),
      revision: s.revision + 1,
      notice: "Previous table restored.",
    });
  };
  const reset = () => {
    invalidate();
    publish({
      ...initial(),
      revision: current.current.revision + 1,
      notice: "Six friends. A table ready to share.",
    });
  };
  const retry = () => {
    invalidate();
    publish({
      ...current.current,
      revision: current.current.revision + 1,
      automatic: true,
      status: "idle",
      error: "",
      notice: "",
    });
  };
  return {
    ...state,
    mode,
    loaded,
    setMode,
    addPlate,
    toggleKeep,
    accept,
    decline,
    undo,
    reset,
    retry,
    addFriend: () =>
      edit(
        addFriend,
        "A vegetarian friend joined. Suggest suitable plates without changing attendance or budget.",
      ),
    setVegetarian: (id: number, vegetarian: boolean) =>
      edit(
        (s) =>
          withFriends(
            s,
            s.friends.map((f) => (f.id === id ? { ...f, vegetarian } : f)),
          ),
        "A friend changed their dietary preference.",
      ),
    removeFriend: (id: number) =>
      edit(
        (s) =>
          s.friends.length > 1
            ? withFriends(
                s,
                s.friends.filter((f) => f.id !== id),
              )
            : s,
        "A friend left the table.",
      ),
    setBudget: (budget: number) =>
      edit(
        (s) => ({ ...s, plan: preferences(s.plan, { budget }) }),
        "The host changed the budget.",
      ),
  };
}
