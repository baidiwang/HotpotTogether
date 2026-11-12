import { describe, expect, it } from "vitest";
import {
  acceptProposal,
  catalog,
  cost,
  friendsExample,
  initialPlan,
  initialState,
  packages,
  preferences,
  proposalError,
  review,
  shoppingAssistant,
  undo,
  updatePlan,
} from "@/lib/dinner";

import { tighterBudgetFixture, unresolvedBudgetFixture } from "./fixtures/plans";

describe("shared dinner rules and bounded collaboration", () => {
  it("keeps the six-person baseline and current package arithmetic", () => {
    const plan = initialPlan();
    expect([plan.guests, plan.vegetarians, plan.budget, cost(plan)]).toEqual([6, 0, 120, 99]);
    const tofu = catalog.find((item) => item.id === "tofu")!;
    expect(packages(550, tofu)).toBe(2);
    expect(
      shoppingAssistant({ ...plan, quantities: { ...plan.quantities, tofu: 550 } }).find(
        (row) => row.item.id === "tofu",
      ),
    ).toMatchObject({ packs: 2, purchasedQuantity: 600, subtotal: 8 });
  });
  it("finishes a feasible first pass without an unnecessary revision", () => {
    const run = review(initialPlan(), 1, "first-pass");
    expect(run.attempts).toHaveLength(1);
    expect(run.result).toBe("feasible");
    expect(cost(run.plan)).toBe(99);
  });
  it("builds the labeled example from the six-person baseline without changing its budget or quantities", () => {
    const plan = friendsExample();
    expect(plan).toEqual({ ...initialPlan(), guests: 8, vegetarians: 1, kept: ["beef"] });
  });
  it("feeds a real $26 overage and package thresholds back to Menu, then recalculates", () => {
    const confirmed = friendsExample();
    const run = review(confirmed, 2, "feedback-run");
    expect(run.attempts).toHaveLength(2);
    const [first, revised] = run.attempts;
    expect(first?.feedback).toMatchObject({
      total: 146,
      limit: 120,
      overage: 26,
      protectedIngredients: [{ id: "beef", minimum: 900 }],
    });
    expect(first?.feedback.packageImplications.find((row) => row.id === "enoki")).toMatchObject({
      planned: 500,
      packs: 4,
      purchased: 600,
      surplus: 100,
      lowerPackThreshold: 450,
      reductionForOneLessPack: 50,
      saving: 5,
    });
    expect(revised?.pipeline.budget.total).toBe(120);
    expect(run.result).toBe("feasible");
    expect(run.plan.quantities.beef).toBe(900);
    expect(proposalError(run.plan, confirmed)).toBeNull();
    expect(
      run.attempts.every(
        (a) =>
          a.pipeline.budget.total ===
          a.pipeline.shopping.purchases.reduce((sum, row) => sum + row.subtotal, 0),
      ),
    ).toBe(true);
    expect(revised?.changedFromPrevious).toEqual(["enoki", "beef"]);
  });
  it("uses a genuinely tighter $100 fixture and preserves kept beef through revision", () => {
    const plan = tighterBudgetFixture();
    const run = review(plan, 3, "tight-budget");
    expect(run.attempts.map((a) => a.pipeline.budget.total)).toEqual([146, 100]);
    expect(run.plan).toMatchObject({ guests: 8, vegetarians: 1, budget: 100, kept: ["beef"] });
    expect(run.plan.quantities.beef).toBe(900);
  });
  it("remains unresolved after one revision when even kept beef and broth cost more than the limit", () => {
    const plan = unresolvedBudgetFixture();
    const run = review(plan, 3, "impossible-budget");
    expect(run.attempts).toHaveLength(2);
    expect(run.result).toBe("unresolved");
    expect(run.pipeline.budget.overBy).toBeGreaterThan(0);
    expect(run.plan.quantities.beef).toBeGreaterThanOrEqual(900);
    expect(run.plan.budget).toBe(50);
    const state = { ...initialState(), plan, revision: 3, requestId: run.requestId, proposal: run };
    expect(acceptProposal(state, run.plan)).toBe(state);
  });
  it("never resolves contradictory all-vegetarian and kept-beef constraints by dropping beef", () => {
    const plan = { ...friendsExample(), vegetarians: 8 };
    const run = review(plan, 1);
    expect(run.result).toBe("unresolved");
    expect(run.attempts).toHaveLength(2);
    expect(run.plan.quantities.beef).toBeGreaterThanOrEqual(900);
    expect(run.attempts[1]?.feedback.violations.join(" ")).toMatch(/vegetarian/);
  });
  it("keeps removed ingredients removed and broth selection part of the shared cost", () => {
    const plan = {
      ...initialPlan(),
      quantities: { ...initialPlan().quantities, lotus: 0, broth: 0 },
    };
    const run = review(plan, 1);
    expect(run.plan.quantities.lotus).toBe(0);
    expect(run.plan.quantities.broth).toBe(0);
    expect(cost(plan)).toBe(86);
  });
  it("applies only the latest validated revision and Undo restores the complete prior plan", () => {
    const plan = friendsExample();
    const run = review(plan, 2, "accept-this");
    const state = { ...initialState(), plan, revision: 2, requestId: run.requestId, proposal: run };
    const applied = acceptProposal(state, run.plan);
    expect(applied.plan).toEqual(run.plan);
    expect(applied.proposal).toBeNull();
    expect(undo(applied).plan).toEqual(plan);
    expect(acceptProposal({ ...state, requestId: "other-request" }, run.plan).plan).toEqual(plan);
    expect(acceptProposal(state, run.attempts[0]!.pipeline.menu.plan)).toBe(state);
  });
  it("an edit invalidates proposals without mutating the previous run", () => {
    const plan = friendsExample();
    const run = review(plan, 2, "old-run");
    const ready = { ...initialState(), plan, revision: 2, requestId: run.requestId, proposal: run };
    const changed = updatePlan(ready, { ...plan, kept: [...plan.kept, "enoki"] });
    expect(changed.proposal).toBeNull();
    expect(changed.requestId).toBeNull();
    expect(changed.revision).toBe(3);
    expect(changed.plan.quantities).toEqual(plan.quantities);
    expect(run.requestId).toBe("old-run");
  });
  it("normalizes guest settings without exceeding bounds", () => {
    expect(preferences(initialPlan(), { guests: 2, vegetarians: 8 }).vegetarians).toBe(2);
  });
});
