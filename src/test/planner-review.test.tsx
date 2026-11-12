import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlanner } from "@/hooks/use-planner";
import { initialState, preferences, review, undo, updatePlan } from "@/lib/dinner";
import type { ReviewResult } from "@/lib/menu-workflow";
const { liveReview } = vi.hoisted(() => ({ liveReview: vi.fn() }));
vi.mock("@/lib/menu.functions", () => ({ reviewWithMenu: liveReview }));

beforeEach(() => {
  localStorage.clear();
  liveReview.mockReset();
});
describe("review lifecycle", () => {
  it.each(["edit", "undo", "reset", "mode", "cancel"] as const)(
    "ignores a delayed response after %s",
    async (action) => {
      let resolve!: (value: ReviewResult) => void;
      liveReview.mockImplementation(
        () =>
          new Promise<ReviewResult>((done) => {
            resolve = done;
          }),
      );
      const { result } = renderHook(usePlanner);
      await waitFor(() => expect(result.current.loaded).toBe(true));
      act(() => result.current.setState((s) => updatePlan(s, preferences(s.plan, { guests: 7 }))));
      act(() => result.current.setMode("live"));
      const snapshot = result.current.state;
      let pending!: Promise<void>;
      act(() => {
        pending = result.current.requestReview();
      });
      expect(result.current.pending).toBe(true);
      act(() => {
        if (action === "edit")
          result.current.setState((s) => updatePlan(s, preferences(s.plan, { guests: 8 })));
        if (action === "undo") result.current.setState(undo);
        if (action === "reset")
          result.current.setState((s) => ({ ...initialState(), revision: s.revision + 1 }));
        if (action === "mode") result.current.setMode("sample");
        if (action === "cancel") result.current.cancelReview();
      });
      const proposal = { ...review(snapshot.plan, snapshot.revision), mode: "live" as const };
      await act(async () => {
        resolve({ ok: true, proposal });
        await pending;
      });
      expect(result.current.state.proposal).toBeNull();
      expect(result.current.pending).toBe(false);
      expect(result.current.error).toBeNull();
    },
  );
  it("keeps proposals separate, dismisses without changing the plan and never falls back silently", async () => {
    const { result } = renderHook(usePlanner);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    const original = result.current.state.plan;
    await act(() => result.current.requestReview());
    expect(result.current.state.proposal?.mode).toBe("sample");
    expect(result.current.state.plan).toBe(original);
    act(() => result.current.setState((s) => ({ ...s, proposal: null })));
    expect(result.current.state.plan).toBe(original);
    act(() => result.current.setMode("live"));
    liveReview.mockResolvedValue({
      ok: false,
      code: "configuration",
      message: "Live Menu is not configured.",
    });
    await act(() => result.current.requestReview());
    expect(result.current.error).toBe("Live Menu is not configured.");
    expect(result.current.state.proposal).toBeNull();
    expect(result.current.mode).toBe("live");
  });
  it("does not persist live-mode edits or proposals to browser storage", async () => {
    const { result } = renderHook(usePlanner);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    const sample = localStorage.getItem("hotpot-together-v1");
    act(() => result.current.setMode("live"));
    act(() => result.current.setState((s) => updatePlan(s, preferences(s.plan, { guests: 9 }))));
    expect(localStorage.getItem("hotpot-together-v1")).toBe(sample);
  });
  it("keeps the latest review when an older request resolves out of order", async () => {
    const resolvers: ((value: ReviewResult) => void)[] = [];
    liveReview.mockImplementation(
      () => new Promise<ReviewResult>((resolve) => resolvers.push(resolve)),
    );
    const { result } = renderHook(usePlanner);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.setMode("live"));
    const first = result.current.state;
    let firstPending!: Promise<void>;
    act(() => {
      firstPending = result.current.requestReview();
    });
    act(() => result.current.setState((s) => updatePlan(s, preferences(s.plan, { guests: 7 }))));
    const second = result.current.state;
    let secondPending!: Promise<void>;
    act(() => {
      secondPending = result.current.requestReview();
    });
    await act(async () => {
      resolvers[1]!({
        ok: true,
        proposal: { ...review(second.plan, second.revision), mode: "live" },
      });
      await secondPending;
    });
    expect(result.current.state.proposal?.revision).toBe(second.revision);
    await act(async () => {
      resolvers[0]!({
        ok: true,
        proposal: { ...review(first.plan, first.revision), mode: "live" },
      });
      await firstPending;
    });
    expect(result.current.state.proposal?.revision).toBe(second.revision);
    expect(result.current.state.plan).toEqual(second.plan);
  });
});
