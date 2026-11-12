import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePlayableTable } from "@/hooks/use-playable-table";
import { cost } from "@/lib/dinner";
import { reviewPlates } from "@/lib/plate-portions";
import type { ReviewResult } from "@/lib/menu-workflow";
const { liveReview } = vi.hoisted(() => ({ liveReview: vi.fn() }));
vi.mock("@/lib/menu.functions", () => ({ reviewWithMenu: liveReview }));
beforeEach(() => {
  localStorage.clear();
  liveReview.mockReset();
});
describe("direct table control", () => {
  it("automatically responds, accepts a plate separately, and Undo restores selected food", async () => {
    const { result } = renderHook(usePlayableTable);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.addFriend());
    await waitFor(() => expect(result.current.offer).not.toBeNull());
    expect(result.current.snapshot.plan.guests).toBe(7);
    expect(result.current.snapshot.plan.quantities.tofu).toBe(600);
    const identity = result.current.offer!.requestId;
    act(() => result.current.accept("tofu", identity));
    expect(result.current.snapshot.plan.quantities.tofu).toBe(900);
    expect(result.current.offer?.requestId).not.toBe(identity);
    expect(cost(result.current.snapshot.plan)).toBe(103);
    const accepted = result.current.snapshot;
    act(() => result.current.accept("beef", identity));
    expect(result.current.snapshot).toBe(accepted);
    act(() => result.current.undo());
    expect(result.current.snapshot.plan.quantities.tofu).toBe(600);
    expect(result.current.snapshot.plan.guests).toBe(7);
    act(() => result.current.undo());
    expect(result.current.snapshot.friends).toHaveLength(6);
  });
  it("rejects without applying and reruns after Must keep with unchanged selected quantities", async () => {
    const { result } = renderHook(usePlayableTable);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.addFriend());
    await waitFor(() => expect(result.current.offer).not.toBeNull());
    const quantities = { ...result.current.snapshot.plan.quantities };
    act(() => result.current.decline("beef"));
    expect(result.current.offer?.target.quantities.beef).toBe(900);
    expect(result.current.snapshot.plan.quantities).toEqual(quantities);
    const old = result.current.offer!.requestId;
    act(() => result.current.toggleKeep("beef"));
    await waitFor(() => expect(result.current.offer?.requestId).not.toBe(old));
    expect(result.current.snapshot.plan.quantities).toEqual(quantities);
    expect(result.current.offer?.target.quantities.beef).toBeGreaterThanOrEqual(900);
    act(() => result.current.accept());
    expect(result.current.snapshot.plan.kept).toContain("beef");
    expect(cost(result.current.snapshot.plan)).toBe(116);
    act(() => result.current.reset());
    expect(result.current.snapshot.friends).toHaveLength(6);
  });
  it("allows edits during Live requests and ignores old results", async () => {
    const resolvers: ((r: ReviewResult) => void)[] = [];
    liveReview.mockImplementation(() => new Promise<ReviewResult>((r) => resolvers.push(r)));
    const { result } = renderHook(usePlayableTable);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.setMode("live"));
    await waitFor(() => expect(liveReview).toHaveBeenCalledTimes(1));
    const first = liveReview.mock.calls[0]![0];
    act(() => result.current.addFriend());
    expect(first.signal.aborted).toBe(true);
    expect(result.current.snapshot.plan.guests).toBe(7);
    await act(async () =>
      resolvers[0]!({
        ok: true,
        proposal: {
          ...reviewPlates(
            first.data.plan,
            first.data.revision,
            first.data.requestId,
            first.data.userRequest,
          ),
          mode: "live",
        },
      }),
    );
    expect(result.current.offer).toBeNull();
    await waitFor(() => expect(liveReview).toHaveBeenCalledTimes(2));
    const second = liveReview.mock.calls[1]![0];
    await act(async () =>
      resolvers[1]!({
        ok: true,
        proposal: {
          ...reviewPlates(
            second.data.plan,
            second.data.revision,
            second.data.requestId,
            second.data.userRequest,
          ),
          mode: "live",
        },
      }),
    );
    expect(result.current.offer?.revision).toBe(result.current.revision);
    expect(result.current.snapshot.plan.quantities.beef).toBe(900);
  });
  it("shows Live configuration errors without Sample fallback and still permits manual edits", async () => {
    liveReview.mockResolvedValue({
      ok: false,
      code: "configuration",
      message: "Live Menu is not configured.",
    });
    const { result } = renderHook(usePlayableTable);
    await waitFor(() => expect(result.current.loaded).toBe(true));
    act(() => result.current.setMode("live"));
    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.mode).toBe("live");
    expect(result.current.offer).toBeNull();
    act(() => result.current.addPlate("tofu"));
    expect(result.current.snapshot.plan.quantities.tofu).toBe(900);
    act(() => result.current.reset());
    expect(result.current.snapshot.plan.quantities.tofu).toBe(600);
  });
});
