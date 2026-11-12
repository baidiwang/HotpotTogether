import { describe, expect, it, vi } from "vitest";
import { cost, menuAssistant, proposalViolations } from "@/lib/dinner";
import { generateMenuReview } from "@/lib/menu.server";
import { plateCount, reviewPlates, wholePlatePlan } from "@/lib/plate-portions";
import {
  acceptanceError,
  addFriend,
  changePlate,
  initialTable,
  makeOffer,
  parsePlateDrag,
} from "@/lib/playable-table";

describe("playable table quantities", () => {
  it("maps the arranged six-person table exactly to whole plates and existing purchases", () => {
    const { plan } = initialTable();
    expect(
      ["napa", "enoki", "tofu", "beef", "lotus", "noodles", "bok", "broth"].map((id) =>
        plateCount(plan, id as keyof typeof plan.quantities),
      ),
    ).toEqual([4, 2, 2, 3, 2, 2, 2, 1]);
    expect(cost(plan)).toBe(99);
    expect(changePlate(changePlate(initialTable(), "napa", 1), "napa", -1)).toEqual(initialTable());
  });
  it("uses actual overage and one revision for the seven-person sample table", () => {
    const s = addFriend(initialTable());
    const p = reviewPlates(s.plan, 2, "sample-test", "A vegetarian friend joined.");
    expect(s.friends.at(-1)?.vegetarian).toBe(true);
    expect(s.plan.quantities).toEqual(initialTable().plan.quantities);
    expect(p.attempts.map((a) => a.feedback.total)).toEqual([121, 105]);
    expect(p.attempts[0]?.feedback.overage).toBe(1);
    expect(proposalViolations(p.plan, s.plan)).toEqual([]);
  });
  it("protects identity and the current selected minimum, with honest unresolved budgets", () => {
    const s = addFriend(initialTable());
    s.plan.kept = ["beef"];
    const p = reviewPlates(s.plan, 2, "keep-test", "Keep the beef.");
    expect(p.plan.quantities.beef).toBeGreaterThanOrEqual(900);
    expect(p.pipeline.budget.total).toBe(116);
    s.plan.budget = 50;
    const unresolved = reviewPlates(s.plan, 3, "tight-test", "Keep the budget.");
    expect(unresolved.result).toBe("unresolved");
    expect(unresolved.attempts).toHaveLength(2);
    expect(unresolved.plan.quantities.beef).toBeGreaterThanOrEqual(900);
    expect(acceptanceError(s.plan, makeOffer(unresolved, s, 3, "tight-test"))).toMatch(
      /over budget/,
    );
  });
  it("checks partial acceptance against selected purchases, not an eventual saving", () => {
    const s = addFriend(initialTable());
    const source = reviewPlates(s.plan, 2, "partial", "Prepare dinner.");
    const offer = makeOffer(source, s, 2, "partial");
    expect(acceptanceError(s.plan, offer, "tofu")).toBeNull();
    const noBeefSaving = {
      ...offer,
      target: { ...offer.target, quantities: { ...offer.target.quantities, beef: 900 } },
    };
    expect(acceptanceError(s.plan, noBeefSaving)).toMatch(/\$1 over budget/);
  });
  it("rejects unknown, malformed and unbound suggestion drags", () => {
    expect(parsePlateDrag('{"id":"fake","from":"tray"}')).toBeNull();
    expect(parsePlateDrag('{"id":"beef","from":"suggestion"}')).toBeNull();
    expect(parsePlateDrag("not json")).toBeNull();
    expect(parsePlateDrag('{"id":"tofu","from":"tray"}')).toEqual({ id: "tofu", from: "tray" });
  });
  it("sends whole-plate Shopping/Budget feedback to the real Menu adapter (mocked transport)", async () => {
    const s = addFriend(initialTable());
    s.plan.kept = ["beef"];
    const sample = reviewPlates(s.plan, 4, "plate-server", "Prepare this table.");
    const outputs = [menuAssistant(s.plan), sample.plan];
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) =>
        new Response(
          JSON.stringify({
            choices: [
              {
                finish_reason: "stop",
                message: {
                  content: JSON.stringify({
                    summary: "Recommend whole plates for the friends.",
                    recommendations: Object.entries(outputs.shift()!.quantities).map(
                      ([id, quantity]) => ({ id, quantity }),
                    ),
                  }),
                },
              },
            ],
          }),
          { status: 200 },
        ),
    );
    const result = await generateMenuReview(
      {
        plan: s.plan,
        revision: 4,
        requestId: "plate-server",
        userRequest: "Prepare this table.",
        presentation: "plates",
      },
      { enabled: "true", apiKey: "unit-test-only", model: "test-model", fetcher },
    );
    expect(result.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const body = JSON.parse(fetcher.mock.calls[1]![1]!.body as string);
    const context = JSON.parse(body.messages.at(-1).content);
    expect(context.portionSizes.beef).toBe(300);
    expect(context.feedback).toMatchObject({
      total: 121,
      overage: 1,
      limit: 120,
      protectedIngredients: [{ id: "beef", minimum: 900 }],
    });
    if (result.ok) expect(result.proposal.pipeline.budget.total).toBe(116);
    expect(wholePlatePlan(s.plan)).toEqual(s.plan);
  });
});
