import { describe, it, expect } from 'vitest';
import { initialPlan, initialState, preferences, review, cost, packages, catalog, acceptProposal, updatePlan, undo } from '@/lib/dinner';
describe('shared dinner rules', () => {
  it('starts with six guests, no vegetarians, $120 and a $99 confirmed estimate', () => {
    const p = initialPlan(); expect([p.guests,p.vegetarians,p.budget,cost(p)]).toEqual([6,0,120,99]);
  });
  it('never allows more vegetarian guests than total guests', () => {
    expect(preferences(initialPlan(),{ guests: 2, vegetarians: 8 }).vegetarians).toBe(2);
  });
  it('rounds required quantity up to whole packages and sums their prices', () => {
    expect(packages(501,catalog[0])).toBe(2); expect(cost({...initialPlan(), quantities:{...initialPlan().quantities,napa:1001}})).toBe(103);
  });
  it('expands to eight with one vegetarian and calculates $150, exceeding $120', () => {
    const p = review(preferences(initialPlan(),{guests:8,vegetarians:1}),2);
    expect(cost(p.plan)).toBe(150); expect(p.plan.quantities.tofu).toBe(900); expect(p.alternatives.map(a=>cost(a.plan))).toEqual([118,119]);
  });
  it('does not reduce kept beef and reports no feasible budget alternative', () => {
    const p = review({...preferences(initialPlan(),{guests:8,vegetarians:1}),kept:['beef']},2);
    expect(p.plan.quantities.beef).toBe(1050); expect(p.alternatives).toHaveLength(0);
  });
  it('kept quantities are editable by the user', () => {
    const s = updatePlan(initialState(),{...initialPlan(),kept:['beef'],quantities:{...initialPlan().quantities,beef:600}});
    expect(s.plan.quantities.beef).toBe(600); expect(s.plan.kept).toEqual(['beef']);
  });
  it('input changes invalidate previews and stale proposals cannot apply', () => {
    const s=initialState(); const proposed={...s,proposal:review(s.plan,s.revision)};
    const changed=updatePlan(proposed,preferences(s.plan,{guests:8}));
    expect(changed.proposal).toBeNull(); expect(acceptProposal(changed,proposed.proposal.plan)).toBe(changed);
  });
  it('applies one complete plan and Undo restores the previous complete plan', () => {
    const s=initialState(); const draft=preferences(s.plan,{guests:8,vegetarians:1});
    const ready={...updatePlan(s,draft),proposal:review(draft,2)};
    const accepted=acceptProposal(ready,ready.proposal.alternatives[0].plan);
    expect(cost(accepted.plan)).toBe(118); expect(accepted.plan.budget).toBe(120); expect(accepted.proposal).toBeNull(); expect(undo(accepted).plan).toEqual(draft);
  });
  it('does not resurrect removed ingredients in a proposal', () => {
    expect(review({...initialPlan(),quantities:{...initialPlan().quantities,lotus:0}},1).plan.quantities.lotus).toBe(0);
  });
  it('cannot accept an over-budget proposal or silently raise the limit', () => {
    const p=preferences(initialPlan(),{guests:8,vegetarians:1}); const s={...initialState(),plan:p,proposal:review(p,1)};
    expect(acceptProposal(s,s.proposal.plan)).toBe(s); expect(s.plan.budget).toBe(120);
  });
});