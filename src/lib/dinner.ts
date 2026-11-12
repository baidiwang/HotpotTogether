export type ItemId = "napa" | "enoki" | "tofu" | "beef" | "lotus" | "noodles" | "bok" | "broth";
export type Item = {
  id: ItemId;
  name: string;
  unit: string;
  packageSize: number;
  price: number;
  vegetarian: boolean;
  base: number;
};
export const catalog: Item[] = [
  {
    id: "napa",
    name: "Napa cabbage",
    unit: "g",
    packageSize: 500,
    price: 4,
    vegetarian: true,
    base: 800,
  },
  {
    id: "enoki",
    name: "Enoki mushrooms",
    unit: "g",
    packageSize: 150,
    price: 5,
    vegetarian: true,
    base: 300,
  },
  {
    id: "tofu",
    name: "Silken tofu",
    unit: "g",
    packageSize: 300,
    price: 4,
    vegetarian: true,
    base: 600,
  },
  {
    id: "beef",
    name: "Beef rolls",
    unit: "g",
    packageSize: 300,
    price: 16,
    vegetarian: false,
    base: 900,
  },
  {
    id: "lotus",
    name: "Lotus root",
    unit: "g",
    packageSize: 300,
    price: 5,
    vegetarian: true,
    base: 300,
  },
  {
    id: "noodles",
    name: "Rice noodles",
    unit: "g",
    packageSize: 250,
    price: 4,
    vegetarian: true,
    base: 500,
  },
  {
    id: "bok",
    name: "Bok choy",
    unit: "g",
    packageSize: 300,
    price: 4,
    vegetarian: true,
    base: 300,
  },
  {
    id: "broth",
    name: "Two-way broth",
    unit: "set",
    packageSize: 1,
    price: 8,
    vegetarian: true,
    base: 1,
  },
];
export type Plan = {
  guests: number;
  vegetarians: number;
  budget: number;
  quantities: Record<ItemId, number>;
  kept: ItemId[];
};
export type Purchase = { item: Item; packs: number; purchasedQuantity: number; subtotal: number };
export type Pipeline = {
  menu: { id: "menu"; plan: Plan; affected: ItemId[] };
  shopping: {
    id: "shopping";
    source: "menu";
    purchases: Purchase[];
    affected: ItemId[];
    extraPacks: number;
    implications: PackageImplication[];
  };
  budget: { id: "budget"; source: "shopping"; total: number; overBy: number; drivers: ItemId[] };
};
export type PackageImplication = {
  id: ItemId;
  planned: number;
  packs: number;
  purchased: number;
  surplus: number;
  lowerPackThreshold: number;
  reductionForOneLessPack: number;
  saving: number;
};
export type ConstraintFeedback = {
  total: number;
  limit: number;
  overage: number;
  violations: string[];
  packageImplications: PackageImplication[];
  protectedIngredients: { id: ItemId; minimum: number }[];
  permittedChanges: { id: ItemId; minimum: number; maximum: number }[];
};
export type ReviewAttempt = {
  number: number;
  summary: string;
  pipeline: Pipeline;
  feedback: ConstraintFeedback;
  feasible: boolean;
  changedFromPrevious: ItemId[];
  portionRounding?: { id: ItemId; requested: number; planned: number }[];
};
export type Alternative = { title: string; explanation: string; plan: Plan; pipeline: Pipeline };
export type PlannerMode = "sample" | "live";
export type Proposal = {
  revision: number;
  plan: Plan;
  pipeline: Pipeline;
  alternatives: Alternative[];
  mode: PlannerMode;
  summary: string;
  requestId: string;
  userRequest: string;
  attempts: ReviewAttempt[];
  result: "feasible" | "unresolved";
};
export const initialPlan = (): Plan => ({
  guests: 6,
  vegetarians: 0,
  budget: 120,
  kept: [],
  quantities: {
    napa: 800,
    enoki: 300,
    tofu: 600,
    beef: 900,
    lotus: 300,
    noodles: 500,
    bok: 300,
    broth: 1,
  },
});
export const packages = (quantity: number, item: Item) =>
  Math.ceil(Math.max(0, quantity) / item.packageSize);
export const cost = (plan: Plan) =>
  catalog.reduce((sum, item) => sum + packages(plan.quantities[item.id], item) * item.price, 0);
export const quantityLabel = (quantity: number, item: Item) =>
  item.unit === "set"
    ? `${quantity} broth ${quantity === 1 ? "set" : "sets"}`
    : quantity >= 1000
      ? `${Number((quantity / 1000).toFixed(2))} kg`
      : `${quantity} g`;
export function preferences(
  plan: Plan,
  changes: Partial<Pick<Plan, "guests" | "vegetarians" | "budget">>,
): Plan {
  const finite = (value: number | undefined, fallback: number) =>
    value !== undefined && Number.isFinite(value) ? value : fallback;
  const guests = Math.max(1, Math.min(30, Math.floor(finite(changes.guests, plan.guests))));
  return {
    ...plan,
    guests,
    vegetarians: Math.max(
      0,
      Math.min(guests, Math.floor(finite(changes.vegetarians, plan.vegetarians))),
    ),
    budget:
      Math.round(Math.max(0, Math.min(10000, finite(changes.budget, plan.budget))) * 100) / 100,
  };
}
// Replaceable, synchronous sample specialists. They never claim to execute live AI.
export function menuAssistant(plan: Plan): Plan {
  const quantities = { ...plan.quantities };
  for (const item of catalog) {
    if (quantities[item.id] === 0) continue;
    const required =
      item.id === "broth"
        ? Math.ceil(plan.guests / 8)
        : item.id === "beef"
          ? Math.ceil((plan.guests - plan.vegetarians) * 150)
          : Math.ceil(
              ((item.base * plan.guests) / 6 +
                (["tofu", "enoki", "lotus", "bok"].includes(item.id)
                  ? plan.vegetarians * 100
                  : 0)) /
                50,
            ) * 50;
    quantities[item.id] = plan.kept.includes(item.id)
      ? Math.max(quantities[item.id], required)
      : required;
  }
  return { ...plan, quantities };
}
export const shoppingAssistant = (plan: Plan): Purchase[] =>
  catalog
    .filter((item) => plan.quantities[item.id] > 0)
    .map((item) => ({
      item,
      packs: packages(plan.quantities[item.id], item),
      purchasedQuantity: packages(plan.quantities[item.id], item) * item.packageSize,
      subtotal: packages(plan.quantities[item.id], item) * item.price,
    }));
// Every downstream stage consumes the output above it, including alternative recalculations.
export function coordinate(plan: Plan, confirmed: Plan): Pipeline {
  const menu: Pipeline["menu"] = {
    id: "menu",
    plan,
    affected: catalog
      .filter((item) => plan.quantities[item.id] !== confirmed.quantities[item.id])
      .map((item) => item.id),
  };
  const purchases = shoppingAssistant(menu.plan);
  const shopping: Pipeline["shopping"] = {
    id: "shopping",
    source: menu.id,
    purchases,
    affected: catalog
      .filter(
        (item) =>
          packages(plan.quantities[item.id], item) !==
          packages(confirmed.quantities[item.id], item),
      )
      .map((item) => item.id),
    implications: purchases.map((row) => ({
      id: row.item.id,
      planned: plan.quantities[row.item.id],
      packs: row.packs,
      purchased: row.purchasedQuantity,
      surplus: row.purchasedQuantity - plan.quantities[row.item.id],
      lowerPackThreshold: Math.max(0, (row.packs - 1) * row.item.packageSize),
      reductionForOneLessPack:
        plan.quantities[row.item.id] - Math.max(0, (row.packs - 1) * row.item.packageSize),
      saving: row.item.price,
    })),
    extraPacks:
      purchases.reduce((sum, row) => sum + row.packs, 0) -
      shoppingAssistant(confirmed).reduce((sum, row) => sum + row.packs, 0),
  };
  const total = shopping.purchases.reduce((sum, row) => sum + row.subtotal, 0);
  const budget: Pipeline["budget"] = {
    id: "budget",
    source: shopping.id,
    total,
    overBy: Math.max(0, total - plan.budget),
    drivers: [...shopping.purchases]
      .sort((a, b) => b.subtotal - a.subtotal)
      .slice(0, 2)
      .map((row) => row.item.id),
  };
  return { menu, shopping, budget };
}
export const exampleRequest =
  "Two more friends are joining. Keep the same budget and keep the beef.";
export function friendsExample(): Plan {
  return { ...preferences(initialPlan(), { guests: 8, vegetarians: 1 }), kept: ["beef"] };
}
export function requestDescription(plan: Plan): string {
  return `Plan hotpot for ${plan.guests} guests, including ${plan.vegetarians} vegetarian, within $${plan.budget}.`;
}
export function feedbackFor(
  proposed: Plan,
  confirmed: Plan,
  pipeline = coordinate(proposed, confirmed),
): ConstraintFeedback {
  const violations = proposalViolations(proposed, confirmed);
  return {
    total: pipeline.budget.total,
    limit: confirmed.budget,
    overage: Math.max(0, pipeline.budget.total - confirmed.budget),
    violations: [
      ...violations,
      ...(pipeline.budget.total > confirmed.budget
        ? [
            `Purchases exceed the $${confirmed.budget} limit by $${pipeline.budget.total - confirmed.budget}.`,
          ]
        : []),
    ],
    packageImplications: pipeline.shopping.implications,
    protectedIngredients: confirmed.kept.map((id) => ({ id, minimum: confirmed.quantities[id] })),
    permittedChanges: catalog.map((item) => ({
      id: item.id,
      minimum: confirmed.kept.includes(item.id)
        ? confirmed.quantities[item.id]
        : item.id === "broth" && confirmed.quantities.broth > 0
          ? 1
          : 0,
      maximum:
        confirmed.quantities[item.id] === 0 ||
        (!item.vegetarian && confirmed.guests === confirmed.vegetarians)
          ? 0
          : maxQuantity(item),
    })),
  };
}
export function assessAttempt(
  proposed: Plan,
  confirmed: Plan,
  summary: string,
  previous?: ReviewAttempt,
): ReviewAttempt {
  if (!validRecommendationPlan(proposed) || !validPlan(confirmed))
    throw new Error("Invalid catalog ingredients or quantities.");
  const pipeline = coordinate(proposed, confirmed);
  const feedback = feedbackFor(proposed, confirmed, pipeline);
  return {
    number: previous ? 2 : 1,
    summary,
    pipeline,
    feedback,
    feasible: feedback.violations.length === 0,
    changedFromPrevious: previous
      ? catalog
          .filter(
            (item) =>
              previous.pipeline.menu.plan.quantities[item.id] !== proposed.quantities[item.id],
          )
          .map((item) => item.id)
      : [],
  };
}
export function finishReview(
  attempts: ReviewAttempt[],
  revision: number,
  mode: PlannerMode,
  requestId: string,
  userRequest: string,
): Proposal {
  const latest = attempts.at(-1);
  if (!latest || attempts.length > 2 || (attempts.length === 2 && attempts[0]?.feasible))
    throw new Error("Invalid bounded review record.");
  return {
    revision,
    requestId,
    userRequest,
    mode,
    plan: latest.pipeline.menu.plan,
    pipeline: latest.pipeline,
    alternatives: [],
    summary: latest.summary,
    attempts,
    result: latest.feasible ? "feasible" : "unresolved",
  };
}
// Sample Menu uses the same Shopping/Budget feedback as the live Menu revision.
// It is a transparent rule-based recommendation, not a simulated model call.
export function reviseSampleMenu(confirmed: Plan, previous: ReviewAttempt): Plan {
  const quantities = { ...previous.pipeline.menu.plan.quantities };
  for (const permission of previous.feedback.permittedChanges)
    quantities[permission.id] = Math.max(
      permission.minimum,
      Math.min(permission.maximum, quantities[permission.id]),
    );
  let next: Plan = { ...confirmed, quantities };
  const solids = catalog.filter((item) => item.unit === "g");
  const plantTotal = () =>
    solids
      .filter((item) => item.vegetarian)
      .reduce((sum, item) => sum + next.quantities[item.id], 0);
  const solidTotal = () => solids.reduce((sum, item) => sum + next.quantities[item.id], 0);
  const fill = Math.max(
    0,
    confirmed.guests * 350 - solidTotal(),
    confirmed.vegetarians * 350 - plantTotal(),
  );
  const filler = solids
    .filter((item) => item.vegetarian && confirmed.quantities[item.id] > 0)
    .sort((a, b) => a.price / a.packageSize - b.price / b.packageSize)[0];
  if (fill > 0 && filler)
    next = {
      ...next,
      quantities: {
        ...next.quantities,
        [filler.id]: Math.min(maxQuantity(filler), next.quantities[filler.id] + fill),
      },
    };
  // Each iteration must remove a real purchased pack; at most the starting pack count.
  const bound = shoppingAssistant(next).reduce((sum, row) => sum + row.packs, 0);
  for (let step = 0; step < bound && cost(next) > confirmed.budget; step++) {
    const candidates = previous.feedback.permittedChanges
      .flatMap((permission) => {
        const item = catalog.find((item) => item.id === permission.id)!;
        const reduced = Math.max(
          permission.minimum,
          (packages(next.quantities[item.id], item) - 1) * item.packageSize,
        );
        if (reduced < 0 || reduced >= next.quantities[item.id]) return [];
        const candidate = { ...next, quantities: { ...next.quantities, [item.id]: reduced } };
        const saving = cost(next) - cost(candidate);
        return saving > 0 && proposalError(candidate, confirmed) === null
          ? [{ candidate, saving }]
          : [];
      })
      .sort((a, b) => b.saving - a.saving);
    if (!candidates[0]) break;
    next = candidates[0].candidate;
  }
  return next;
}
export function review(
  plan: Plan,
  revision: number,
  requestId = `sample-${revision}`,
  userRequest = requestDescription(plan),
): Proposal {
  const first = assessAttempt(
    menuAssistant(plan),
    plan,
    "Sample portion rules scale the selected ingredients for your guests and preserve kept minimums.",
  );
  const attempts = [first];
  if (!first.feasible)
    attempts.push(
      assessAttempt(
        reviseSampleMenu(plan, first),
        plan,
        "Sample Menu uses the calculated feedback to reduce whole-pack costs while preserving preferences and kept quantities.",
        first,
      ),
    );
  return finishReview(attempts, revision, "sample", requestId, userRequest);
}
// Kept for structured-output validation callers; the bounded runner uses assessAttempt.
export function buildProposal(
  proposed: Plan,
  plan: Plan,
  revision: number,
  mode: PlannerMode,
  summary: string,
): Proposal {
  const error = proposalError(proposed, plan);
  if (error) throw new Error(error);
  return finishReview(
    [assessAttempt(proposed, plan, summary)],
    revision,
    mode,
    `validation-${revision}`,
    requestDescription(plan),
  );
}
export type PlannerState = {
  plan: Plan;
  revision: number;
  requestId: string | null;
  proposal: Proposal | null;
  history: Plan[];
  message: string;
};
export const initialState = (): PlannerState => ({
  plan: initialPlan(),
  revision: 1,
  requestId: null,
  proposal: null,
  history: [],
  message: "",
});
export function updatePlan(state: PlannerState, plan: Plan, message = ""): PlannerState {
  if (!validPlan(plan))
    return {
      ...state,
      message:
        "Invalid settings. Use whole quantities, valid guests and a budget from $0 to $10,000.",
    };
  return {
    plan,
    revision: state.revision + 1,
    requestId: null,
    proposal: null,
    history: [...state.history, state.plan].slice(-30),
    message,
  };
}
export function acceptProposal(state: PlannerState, plan: Plan): PlannerState {
  if (
    !state.proposal ||
    state.proposal.revision !== state.revision ||
    state.proposal.requestId !== state.requestId ||
    state.proposal.result !== "feasible" ||
    proposalError(plan, state.plan) ||
    cost(plan) > state.plan.budget
  )
    return state;
  // Acceptance must refer to an actual reviewed option, not arbitrary caller-supplied values.
  if (
    ![state.proposal.plan, ...state.proposal.alternatives.map((option) => option.plan)].some(
      (option) => samePlan(option, plan),
    )
  )
    return state;
  return updatePlan(state, plan, "Coordinated proposal applied. Everyone’s on the same page.");
}
export function undo(state: PlannerState): PlannerState {
  const previous = state.history.at(-1);
  return previous
    ? {
        plan: previous,
        revision: state.revision + 1,
        requestId: null,
        proposal: null,
        history: state.history.slice(0, -1),
        message: "Previous dinner plan restored.",
      }
    : state;
}
export function validPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const p = value as Plan;
  return (
    Object.keys(p).sort().join(",") === "budget,guests,kept,quantities,vegetarians" &&
    Number.isInteger(p.guests) &&
    p.guests >= 1 &&
    p.guests <= 30 &&
    Number.isInteger(p.vegetarians) &&
    p.vegetarians >= 0 &&
    p.vegetarians <= p.guests &&
    Number.isFinite(p.budget) &&
    p.budget >= 0 &&
    p.budget <= 10000 &&
    Array.isArray(p.kept) &&
    new Set(p.kept).size === p.kept.length &&
    p.kept.every((id) => catalog.some((item) => item.id === id)) &&
    !!p.quantities &&
    typeof p.quantities === "object" &&
    Object.keys(p.quantities).length === catalog.length &&
    catalog.every(
      (item) =>
        Number.isSafeInteger(p.quantities[item.id]) &&
        p.quantities[item.id] >= 0 &&
        p.quantities[item.id] <= maxQuantity(item),
    ) &&
    p.kept.every((id) => p.quantities[id] > 0)
  );
}
// A model candidate may violate kept minimums; retain it for feedback, never for Apply.
export function validRecommendationPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Plan;
  return (
    Array.isArray(plan.kept) &&
    new Set(plan.kept).size === plan.kept.length &&
    plan.kept.every((id) => catalog.some((item) => item.id === id)) &&
    validPlan({ ...plan, kept: [] })
  );
}
export const maxQuantity = (item: Item) => (item.unit === "set" ? 30 : 30000);
export function samePlan(a: Plan, b: Plan): boolean {
  return (
    a.guests === b.guests &&
    a.vegetarians === b.vegetarians &&
    a.budget === b.budget &&
    a.kept.length === b.kept.length &&
    a.kept.every((id) => b.kept.includes(id)) &&
    catalog.every((item) => a.quantities[item.id] === b.quantities[item.id])
  );
}
export function proposalViolations(proposed: Plan, confirmed: Plan): string[] {
  if (!validRecommendationPlan(proposed) || !validPlan(confirmed))
    return ["The recommendation contains invalid ingredients or quantities."];
  const violations: string[] = [];
  if (
    proposed.guests !== confirmed.guests ||
    proposed.vegetarians !== confirmed.vegetarians ||
    proposed.budget !== confirmed.budget ||
    proposed.kept.length !== confirmed.kept.length ||
    proposed.kept.some((id) => !confirmed.kept.includes(id))
  )
    violations.push("A recommendation cannot change your preferences, budget or kept items.");
  if (confirmed.kept.some((id) => proposed.quantities[id] < confirmed.quantities[id]))
    violations.push(
      "A recommendation cannot reduce a kept quantity. Unlock that item to change it.",
    );
  if (
    catalog.some(
      (item) => confirmed.quantities[item.id] === 0 && proposed.quantities[item.id] !== 0,
    )
  )
    violations.push("A recommendation cannot restore an ingredient you removed.");
  if (proposed.vegetarians === proposed.guests && proposed.quantities.beef > 0)
    violations.push("All guests are vegetarian. Unlock and remove beef, then review again.");
  const solids = catalog.filter((item) => item.unit === "g");
  if (
    solids.reduce((sum, item) => sum + proposed.quantities[item.id], 0) < proposed.guests * 350 ||
    solids
      .filter((item) => item.vegetarian)
      .reduce((sum, item) => sum + proposed.quantities[item.id], 0) <
      proposed.vegetarians * 350
  )
    violations.push(
      "The recommendation has too little food for this group. Restore ingredients or request another review.",
    );
  if (confirmed.quantities.broth > 0 && proposed.quantities.broth === 0)
    violations.push("The recommendation must keep your selected broth.");
  return violations;
}
export function proposalError(proposed: Plan, confirmed: Plan): string | null {
  return proposalViolations(proposed, confirmed)[0] ?? null;
}
