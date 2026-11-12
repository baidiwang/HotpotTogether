import { describe, expect, it, vi } from "vitest";
import {
  acceptProposal,
  catalog,
  cost,
  initialPlan,
  initialState,
  preferences,
  review,
  validPlan,
} from "@/lib/dinner";
import { menuContext, proposalFromMenu } from "@/lib/menu-workflow";
import { generateMenuReview } from "@/lib/menu.server";

const request = () => ({
  plan: initialPlan(),
  revision: 7,
  requestId: "test-request-7",
  userRequest: "Review the current dinner plan.",
});
const output = () => ({
  summary: "Balanced catalog portions for six guests.",
  recommendations: catalog.map((item) => ({
    id: item.id,
    quantity: initialPlan().quantities[item.id],
  })),
});
const credentials = {
  enabled: "true",
  apiKey: "test-server-only-credential",
  model: "test/structured-chat",
};
const gateway = (content: unknown = output(), status = 200) =>
  vi.fn<typeof fetch>().mockResolvedValue(
    new Response(
      JSON.stringify({
        choices: [{ finish_reason: "stop", message: { content: JSON.stringify(content) } }],
      }),
      { status },
    ),
  );

describe("structured Menu pipeline", () => {
  it("derives purchases and budget only from validated Menu quantities", () => {
    const data = output();
    data.recommendations.find((row) => row.id === "tofu")!.quantity = 550;
    const proposal = proposalFromMenu(data, request());
    expect(proposal.mode).toBe("live");
    expect(proposal.revision).toBe(7);
    const tofu = proposal.pipeline.shopping.purchases.find((row) => row.item.id === "tofu");
    expect([tofu?.packs, tofu?.purchasedQuantity, tofu?.subtotal]).toEqual([2, 600, 8]);
    expect(proposal.pipeline.budget.total).toBe(cost(proposal.plan));
    expect(request().plan.quantities.tofu).toBe(600);
  });
  it.each([
    "unknown-id",
    "duplicate-id",
    "missing-item",
    "fraction",
    "negative",
    "oversized",
    "invented-cost",
  ])("rejects %s instead of repairing model output", (scenario) => {
    const data = output();
    const rows = data.recommendations;
    if (scenario === "unknown-id") Object.assign(rows[0]!, { id: "lobster" });
    if (scenario === "duplicate-id") rows[0]!.id = "tofu";
    if (scenario === "missing-item") rows.pop();
    if (scenario === "fraction") rows[0]!.quantity = 1.5;
    if (scenario === "negative") rows[0]!.quantity = -1;
    if (scenario === "oversized") rows.find((row) => row.id === "broth")!.quantity = 31;
    if (scenario === "invented-cost") Object.assign(data, { total: 1 });
    expect(() => proposalFromMenu(data, request())).toThrow();
  });
  it("enforces kept minimums and user removals", () => {
    const kept = request();
    kept.plan.kept = ["beef"];
    const data = output();
    data.recommendations.find((row) => row.id === "beef")!.quantity = 600;
    expect(() => proposalFromMenu(data, kept)).toThrow(/kept/);
    const removed = request();
    removed.plan.quantities.lotus = 0;
    expect(() => proposalFromMenu(output(), removed)).toThrow(/removed/);
  });
  it("rejects non-vegetarian output and insufficient servings", () => {
    const vegetarian = request();
    vegetarian.plan.vegetarians = 6;
    expect(() => proposalFromMenu(output(), vegetarian)).toThrow(/vegetarian/);
    const data = output();
    data.recommendations.forEach((row) => {
      row.quantity = 1;
    });
    expect(() => proposalFromMenu(data, request())).toThrow(/too little food/);
  });
  it("includes preferences, catalog prices and kept constraints in model context", () => {
    const data = request();
    data.plan.kept = ["beef"];
    const context = menuContext(data);
    expect(context.guests).toBe(6);
    expect(context.catalog.find((item) => item.id === "beef")).toMatchObject({
      minimumKeptQuantity: 900,
      price: 16,
      packageSize: 300,
    });
  });
  it("cannot accept arbitrary quantities, changed preferences or budget inflation", () => {
    const original = initialState();
    const run = review(original.plan, original.revision);
    const state = { ...original, requestId: run.requestId, proposal: run };
    for (const plan of [
      preferences(state.plan, { budget: 200 }),
      preferences(state.plan, { guests: 7 }),
      { ...state.plan, quantities: { ...state.plan.quantities, tofu: 550 } },
    ]) {
      expect(acceptProposal(state, plan)).toBe(state);
    }
  });
  it.each([NaN, Infinity, -1, 30001, 1.5])(
    "rejects invalid persisted quantities: %s",
    (quantity) => {
      expect(
        validPlan({
          ...initialPlan(),
          quantities: { ...initialPlan().quantities, tofu: quantity },
        }),
      ).toBe(false);
    },
  );
  it("rejects duplicate kept IDs and unknown catalog keys in persisted data", () => {
    expect(validPlan({ ...initialPlan(), kept: ["beef", "beef"] })).toBe(false);
    expect(
      validPlan({ ...initialPlan(), quantities: { ...initialPlan().quantities, lobster: 10 } }),
    ).toBe(false);
  });
});

describe("server-side Lovable gateway", () => {
  it("uses a server credential and structured output, then runs the shared calculations", async () => {
    const fetcher = gateway();
    const result = await generateMenuReview(request(), { ...credentials, fetcher });
    expect(result.ok).toBe(true);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(url).toBe("https://ai.gateway.lovable.dev/v1/chat/completions");
    expect(init?.headers).toMatchObject({ Authorization: "Bearer test-server-only-credential" });
    const body = JSON.parse(String(init?.body));
    expect(body.response_format.json_schema.strict).toBe(true);
    expect(body.messages[1].content).toContain("minimumKeptQuantity");
    expect(JSON.stringify(result)).not.toContain(credentials.apiKey);
  });
  it("rejects missing configuration and invalid input without invoking the gateway", async () => {
    const fetcher = gateway();
    expect(await generateMenuReview(request(), { fetcher })).toMatchObject({
      ok: false,
      code: "configuration",
    });
    expect(
      await generateMenuReview(
        { ...request(), plan: { ...initialPlan(), guests: 31 } },
        { ...credentials, fetcher },
      ),
    ).toMatchObject({ ok: false, code: "invalid" });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([
    [429, "rate-limit"],
    [402, "credits"],
    [401, "configuration"],
    [500, "gateway"],
  ] as const)("reports HTTP %s honestly with no sample fallback", async (status, code) => {
    const result = await generateMenuReview(request(), {
      ...credentials,
      fetcher: gateway(output(), status),
    });
    expect(result).toMatchObject({ ok: false, code });
    expect(result).not.toHaveProperty("proposal");
  });
  it("rejects malformed, truncated and constraint-violating responses", async () => {
    const badFetchers = [
      vi.fn<typeof fetch>().mockResolvedValue(new Response("not-json")),
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [{ finish_reason: "length", message: { content: JSON.stringify(output()) } }],
          }),
        ),
      ),
      gateway({ summary: "Missing ingredient quantities." }),
    ];
    for (const fetcher of badFetchers)
      expect(await generateMenuReview(request(), { ...credentials, fetcher })).toMatchObject({
        ok: false,
      });
  });
  it("times out without a proposal or retry", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) =>
            init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))),
          ),
      );
    const result = await generateMenuReview(request(), { ...credentials, fetcher, timeoutMs: 5 });
    expect(result).toMatchObject({ ok: false, code: "timeout" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});

describe("bounded live feedback loop (mocked gateway)", () => {
  const expanded = {
    napa: 1100,
    enoki: 500,
    tofu: 900,
    beef: 1050,
    lotus: 500,
    noodles: 700,
    bok: 500,
    broth: 1,
  };
  const rows = (quantities: typeof expanded) => ({
    summary: "Catalog quantities for eight, preserving the kept beef.",
    recommendations: catalog.map((item) => ({ id: item.id, quantity: quantities[item.id] })),
  });
  const response = (quantities: typeof expanded) =>
    new Response(
      JSON.stringify({
        choices: [
          { finish_reason: "stop", message: { content: JSON.stringify(rows(quantities)) } },
        ],
      }),
    );
  it("sends exact calculated feedback to the second model call and stops on a valid revision", async () => {
    const input = {
      ...request(),
      plan: { ...initialPlan(), guests: 8, vegetarians: 1, kept: ["beef" as const] },
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(expanded))
      .mockResolvedValueOnce(response({ ...expanded, beef: 900, enoki: 300 }));
    const result = await generateMenuReview(input, { ...credentials, fetcher });
    expect(result.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(2);
    const context = JSON.parse(
      JSON.parse(String(fetcher.mock.calls[1]![1]?.body)).messages[1].content,
    );
    expect(context.feedback).toMatchObject({
      total: 146,
      limit: 120,
      overage: 26,
      protectedIngredients: [{ id: "beef", minimum: 900 }],
    });
    expect(context.previousRecommendation).toEqual(expanded);
    expect(context.attempt).toBe(2);
    if (result.ok) {
      expect(result.proposal.result).toBe("feasible");
      expect(result.proposal.pipeline.budget.total).toBe(120);
      expect(result.proposal.requestId).toBe(input.requestId);
      expect(result.proposal.attempts).toHaveLength(2);
    }
  });
  it("does not call a model again after a feasible first recommendation", async () => {
    const fetcher = gateway();
    const result = await generateMenuReview(request(), { ...credentials, fetcher });
    expect(result.ok).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("never runs a third attempt and never accepts a kept-item violation", async () => {
    const input = {
      ...request(),
      plan: { ...initialPlan(), guests: 8, vegetarians: 1, budget: 50, kept: ["beef" as const] },
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => response({ ...expanded, beef: 0 }));
    const result = await generateMenuReview(input, { ...credentials, fetcher });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.proposal.result).toBe("unresolved");
      expect(result.proposal.attempts[1]?.feedback.violations.join(" ")).toMatch(/kept/);
    }
  });
  it("retains the completed initial attempt when the revision errors, without sample fallback", async () => {
    const input = {
      ...request(),
      plan: { ...initialPlan(), guests: 8, vegetarians: 1, kept: ["beef" as const] },
    };
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(response(expanded))
      .mockResolvedValueOnce(new Response("unavailable", { status: 503 }));
    const result = await generateMenuReview(input, { ...credentials, fetcher });
    expect(result).toMatchObject({ ok: false, code: "gateway" });
    if (!result.ok) {
      expect(result.attempts).toHaveLength(1);
      expect(result.message).toMatch(/Revision failed/);
    }
    expect(result).not.toHaveProperty("proposal");
  });
});
