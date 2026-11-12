import { describe, it, expect } from "vitest";
import {
  initialPlan,
  initialState,
  preferences,
  review,
  cost,
  packages,
  catalog,
  acceptProposal,
  updatePlan,
  undo,
  shoppingAssistant,
} from "@/lib/dinner";
describe("shared dinner rules", () => {
  it("all-vegetarian review removes beef from portions, purchases and cost while keeping it restorable", () => {
    const draft = preferences(initialPlan(), { vegetarians: 6 });
    const proposal = review(draft, 1);
    expect(proposal.plan.quantities.beef).toBe(0);
    expect(proposal.pipeline.shopping.affected).toContain("beef");
    expect(proposal.pipeline.shopping.purchases.some((row) => row.item.id === "beef")).toBe(false);
    expect(proposal.pipeline.shopping.extraPacks).toBe(7);
    expect(proposal.pipeline.budget.total).toBe(97);
    const state = { ...initialState(), plan: draft, proposal };
    const applied = acceptProposal(state, proposal.plan);
    expect(applied.plan.quantities.beef).toBe(0);
    expect(undo(applied).plan).toEqual(draft);
    expect(catalog.find((item) => item.id === "beef")?.base).toBe(900);
  });
  it("all-vegetarian review cannot remove kept beef", () => {
    expect(() =>
      review({ ...preferences(initialPlan(), { vegetarians: 6 }), kept: ["beef"] }, 1),
    ).toThrow(/vegetarian/);
  });
  it("broth removal removes its $8 cost and restoring it returns the same complete plan", () => {
    const original = initialState();
    const removed = updatePlan(original, {
      ...original.plan,
      quantities: { ...original.plan.quantities, broth: 0 },
    });
    expect(cost(removed.plan)).toBe(91);
    expect(shoppingAssistant(removed.plan).map((row) => row.item.id)).not.toContain("broth");
    expect(review(removed.plan, removed.revision).plan.quantities.broth).toBe(0);
    const restored = updatePlan(removed, {
      ...removed.plan,
      quantities: { ...removed.plan.quantities, broth: 1 },
    });
    expect(restored.plan).toEqual(original.plan);
    expect(cost(restored.plan)).toBe(99);
    expect(undo(restored).plan).toEqual(removed.plan);
  });
  it("starts with six guests, no vegetarians, $120 and a $99 confirmed estimate", () => {
    const p = initialPlan();
    expect([p.guests, p.vegetarians, p.budget, cost(p)]).toEqual([6, 0, 120, 99]);
  });
  it("never allows more vegetarian guests than total guests", () => {
    expect(preferences(initialPlan(), { guests: 2, vegetarians: 8 }).vegetarians).toBe(2);
  });
  it("rounds required quantity up to whole packages and sums their prices", () => {
    const napa = catalog.find((item) => item.id === "napa");
    if (!napa) throw new Error("Missing napa");
    expect(packages(501, napa)).toBe(2);
    expect(
      cost({ ...initialPlan(), quantities: { ...initialPlan().quantities, napa: 1001 } }),
    ).toBe(103);
  });
  it("expands to eight with one vegetarian and calculates $146, exceeding $120", () => {
    const p = review(preferences(initialPlan(), { guests: 8, vegetarians: 1 }), 2);
    expect(cost(p.plan)).toBe(146);
    expect(p.plan.quantities.tofu).toBe(900);
    expect(p.alternatives.map((a) => cost(a.plan))).toEqual([114, 115]);
  });
  it("Menu feeds Shopping purchases which feed the Budget estimate", () => {
    const p = review(preferences(initialPlan(), { guests: 8, vegetarians: 1 }), 2);
    expect(p.pipeline.shopping.source).toBe(p.pipeline.menu.id);
    expect(p.pipeline.budget.source).toBe(p.pipeline.shopping.id);
    expect(p.pipeline.menu.plan.quantities.napa).toBe(1100);
    expect(p.pipeline.menu.plan.quantities.noodles).toBe(700);
    expect(p.pipeline.shopping.extraPacks).toBe(8);
    expect(p.pipeline.budget.total).toBe(
      p.pipeline.shopping.purchases.reduce((sum, row) => sum + row.subtotal, 0),
    );
    expect(p.pipeline.budget.overBy).toBe(26);
    expect(p.alternatives.map((a) => a.pipeline.budget.total)).toEqual([114, 115]);
  });
  it("550 g planned tofu purchases two 300 g packs, totaling 600 g and $8", () => {
    const row = shoppingAssistant({
      ...initialPlan(),
      quantities: { ...initialPlan().quantities, tofu: 550 },
    }).find((r) => r.item.id === "tofu");
    expect(row?.packs).toBe(2);
    expect(row?.purchasedQuantity).toBe(600);
    expect(row?.subtotal).toBe(8);
  });
  it("does not reduce kept beef and reports no feasible budget alternative", () => {
    const p = review(
      { ...preferences(initialPlan(), { guests: 8, vegetarians: 1 }), kept: ["beef"] },
      2,
    );
    expect(p.plan.quantities.beef).toBe(1050);
    expect(p.alternatives).toHaveLength(0);
  });
  it("kept quantities are editable by the user", () => {
    const s = updatePlan(initialState(), {
      ...initialPlan(),
      kept: ["beef"],
      quantities: { ...initialPlan().quantities, beef: 600 },
    });
    expect(s.plan.quantities.beef).toBe(600);
    expect(s.plan.kept).toEqual(["beef"]);
  });
  it("input changes invalidate previews and stale proposals cannot apply", () => {
    const s = initialState();
    const proposed = { ...s, proposal: review(s.plan, s.revision) };
    const changed = updatePlan(proposed, preferences(s.plan, { guests: 8 }));
    expect(changed.proposal).toBeNull();
    expect(acceptProposal(changed, proposed.proposal.plan)).toBe(changed);
  });
  it("applies one complete plan and Undo restores the previous complete plan", () => {
    const s = initialState();
    const draft = preferences(s.plan, { guests: 8, vegetarians: 1 });
    const ready = { ...updatePlan(s, draft), proposal: review(draft, 2) };
    const option = ready.proposal.alternatives[0];
    if (!option) throw new Error("Missing alternative");
    const accepted = acceptProposal(ready, option.plan);
    expect(cost(accepted.plan)).toBe(114);
    expect(accepted.plan.budget).toBe(120);
    expect(accepted.proposal).toBeNull();
    expect(undo(accepted).plan).toEqual(draft);
  });
  it("does not resurrect removed ingredients in a proposal", () => {
    expect(
      review({ ...initialPlan(), quantities: { ...initialPlan().quantities, lotus: 0 } }, 1).plan
        .quantities.lotus,
    ).toBe(0);
  });
  it("cannot accept an over-budget proposal or silently raise the limit", () => {
    const p = preferences(initialPlan(), { guests: 8, vegetarians: 1 });
    const s = { ...initialState(), plan: p, proposal: review(p, 1) };
    expect(acceptProposal(s, s.proposal.plan)).toBe(s);
    expect(s.plan.budget).toBe(120);
  });
});
