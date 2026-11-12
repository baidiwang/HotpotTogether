import {
  assessAttempt,
  catalog,
  finishReview,
  menuAssistant,
  reviseSampleMenu,
  type ItemId,
  type Plan,
} from "./dinner";

// Serving portions, not packages or inventory. Shopping still rounds packages.
export const plateSizes: Record<ItemId, number> = {
  napa: 200,
  enoki: 150,
  tofu: 300,
  beef: 300,
  lotus: 150,
  noodles: 250,
  bok: 150,
  broth: 1,
};
export const plateCount = (plan: Plan, id: ItemId) => plan.quantities[id] / plateSizes[id];
export const platesLabel = (count: number) => `${count} ${count === 1 ? "plate" : "plates"}`;
export function wholePlatePlan(plan: Plan): Plan {
  return {
    ...plan,
    quantities: Object.fromEntries(
      catalog.map((item) => [
        item.id,
        Math.ceil(plan.quantities[item.id] / plateSizes[item.id]) * plateSizes[item.id],
      ]),
    ) as Plan["quantities"],
  };
}
export function plateRounding(plan: Plan) {
  const rounded = wholePlatePlan(plan);
  return catalog.flatMap((item) =>
    rounded.quantities[item.id] === plan.quantities[item.id]
      ? []
      : [
          {
            id: item.id,
            requested: plan.quantities[item.id],
            planned: rounded.quantities[item.id],
          },
        ],
  );
}
export function reviewPlates(plan: Plan, revision: number, requestId: string, userRequest: string) {
  const first = assessAttempt(
    wholePlatePlan(menuAssistant(plan)),
    plan,
    "Sample Menu scales the selected food for the friends, then rounds up to whole plates.",
  );
  const attempts = [first];
  if (!first.feasible)
    attempts.push(
      assessAttempt(
        wholePlatePlan(reviseSampleMenu(plan, first)),
        plan,
        "Sample Menu uses actual package costs and constraint feedback to revise once.",
        first,
      ),
    );
  return finishReview(attempts, revision, "sample", requestId, userRequest);
}
