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
  };
  budget: { id: "budget"; source: "shopping"; total: number; overBy: number; drivers: ItemId[] };
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
export function budgetAssistant(
  plan: Plan,
  purchases = shoppingAssistant(plan),
): Omit<Alternative, "pipeline">[] {
  if (
    purchases.reduce((sum, row) => sum + row.subtotal, 0) <= plan.budget ||
    plan.kept.includes("beef") ||
    plan.quantities.beef === 0 ||
    plan.quantities.tofu === 0
  )
    return [];
  const options = [
    {
      title: "Less beef",
      explanation: "Use two beef packs and keep the generous tofu and vegetable portions.",
      quantities: { ...plan.quantities, beef: Math.min(plan.quantities.beef, 600) },
    },
    {
      title: "Simpler vegetables",
      explanation: "Use three beef packs, two enoki packs, and one lotus root pack.",
      quantities: {
        ...plan.quantities,
        beef: Math.min(plan.quantities.beef, 900),
        enoki: Math.min(plan.quantities.enoki, 300),
        lotus: Math.min(plan.quantities.lotus, 300),
      },
    },
  ];
  return options
    .filter((option) => plan.kept.every((id) => option.quantities[id] === plan.quantities[id]))
    .map((option) => ({
      title: option.title,
      explanation: option.explanation,
      plan: { ...plan, quantities: option.quantities },
    }))
    .filter(
      (option) => cost(option.plan) <= plan.budget && proposalError(option.plan, plan) === null,
    );
}
// A single path builds both sample and live proposals. Shopping and Budget are calculations.
export function buildProposal(
  proposed: Plan,
  plan: Plan,
  revision: number,
  mode: PlannerMode,
  summary: string,
): Proposal {
  const error = proposalError(proposed, plan);
  if (error) throw new Error(error);
  const pipeline = coordinate(proposed, plan);
  const alternatives = budgetAssistant(proposed, pipeline.shopping.purchases)
    .filter((option) => proposalError(option.plan, plan) === null)
    .map((option) => ({ ...option, pipeline: coordinate(option.plan, plan) }));
  return { revision, plan: proposed, pipeline, alternatives, mode, summary };
}
export function review(plan: Plan, revision: number): Proposal {
  return buildProposal(
    menuAssistant(plan),
    plan,
    revision,
    "sample",
    "Sample portions based on your guest settings.",
  );
}
export type PlannerState = {
  plan: Plan;
  revision: number;
  proposal: Proposal | null;
  history: Plan[];
  message: string;
};
export const initialState = (): PlannerState => ({
  plan: initialPlan(),
  revision: 1,
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
    proposal: null,
    history: [...state.history, state.plan].slice(-30),
    message,
  };
}
export function acceptProposal(state: PlannerState, plan: Plan): PlannerState {
  if (
    !state.proposal ||
    state.proposal.revision !== state.revision ||
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
export function proposalError(proposed: Plan, confirmed: Plan): string | null {
  if (!validPlan(proposed) || !validPlan(confirmed))
    return "The recommendation contains invalid ingredients or quantities.";
  if (
    proposed.guests !== confirmed.guests ||
    proposed.vegetarians !== confirmed.vegetarians ||
    proposed.budget !== confirmed.budget ||
    proposed.kept.length !== confirmed.kept.length ||
    proposed.kept.some((id) => !confirmed.kept.includes(id))
  )
    return "A recommendation cannot change your preferences, budget or kept items.";
  if (confirmed.kept.some((id) => proposed.quantities[id] < confirmed.quantities[id]))
    return "A recommendation cannot reduce a kept quantity. Unlock that item to change it.";
  if (
    catalog.some(
      (item) => confirmed.quantities[item.id] === 0 && proposed.quantities[item.id] !== 0,
    )
  )
    return "A recommendation cannot restore an ingredient you removed.";
  if (proposed.vegetarians === proposed.guests && proposed.quantities.beef > 0)
    return "All guests are vegetarian. Unlock and remove beef, then review again.";
  // Prototype serving guardrails, shared with the model prompt and all budget alternatives.
  const solids = catalog.filter((item) => item.unit === "g");
  if (
    solids.reduce((sum, item) => sum + proposed.quantities[item.id], 0) < proposed.guests * 350 ||
    solids
      .filter((item) => item.vegetarian)
      .reduce((sum, item) => sum + proposed.quantities[item.id], 0) <
      proposed.vegetarians * 350
  )
    return "The recommendation has too little food for this group. Restore ingredients or request another review.";
  if (confirmed.quantities.broth > 0 && proposed.quantities.broth === 0)
    return "The recommendation must keep your selected broth.";
  return null;
}
