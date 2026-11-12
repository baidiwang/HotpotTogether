import {
  catalog,
  cost,
  feedbackFor,
  packages,
  type Plan,
  type Proposal,
  type ItemId,
} from "./dinner";
import { plateCount } from "./plate-portions";

const money = (n: number) => `$${Number(n.toFixed(2))}`;
export const tablePortions = (plan: Plan, id: ItemId) => {
  const n = plateCount(plan, id);
  return `${n} ${id === "broth" ? `broth set${n === 1 ? "" : "s"}` : `plate${n === 1 ? "" : "s"}`}`;
};

// Presentation only: recompute from the remaining offer, never from stale display totals.
export function tableFeedback(selected: Plan, target: Plan, source: Proposal) {
  const changed = catalog.filter((i) => target.quantities[i.id] !== selected.quantities[i.id]);
  const lead = changed.find((i) => i.id === "tofu") ?? changed[0];
  const group = `${selected.guests} friends${selected.vegetarians ? ` (${selected.vegetarians} vegetarian)` : ""}`;
  const menu = lead
    ? `Balance food for ${group}: ${lead.name.toLowerCase()} ${tablePortions(selected, lead.id)} → ${tablePortions(target, lead.id)}${changed.length > 1 ? `; ${changed.length - 1} other food adjustments` : ""}.`
    : `The selected food already matches the recommendation for ${group}.`;
  const packs = (p: Plan) => catalog.reduce((n, i) => n + packages(p.quantities[i.id], i), 0);
  const packDelta = packs(target) - packs(selected);
  const delta = cost(target) - cost(selected);
  const shopping = `${packs(target)} whole packs (${packDelta >= 0 ? "+" : ""}${packDelta}); ${delta >= 0 ? "+" : "−"}${money(Math.abs(delta))} versus the selected table.`;
  const first = source.attempts[0];
  const last = source.attempts.at(-1);
  const history =
    source.attempts.length > 1 && first && first.feedback.overage > 0 && last
      ? `First ${money(first.feedback.total)} (${money(first.feedback.overage)} over); revised to ${money(last.feedback.total)}. `
      : "";
  const current = feedbackFor(target, selected);
  const result =
    current.overage > 0
      ? `${money(current.overage)} over budget`
      : `${money(selected.budget - current.total)} left`;
  const kept = selected.kept
    .map(
      (id) =>
        `${catalog.find((i) => i.id === id)!.name.toLowerCase()} ≥ ${tablePortions(selected, id)}`,
    )
    .join(", ");
  const protectedValid = selected.kept.every(
    (id) => target.quantities[id] >= selected.quantities[id],
  );
  const budget = `${history}Current suggestion ${money(current.total)} / ${money(selected.budget)}: ${result}.${kept ? ` ${protectedValid ? "Keeps" : "Must retain"} ${kept}.` : ""}${current.violations.some((v) => !v.startsWith("Purchases exceed")) ? " Food constraints still need attention." : ""}`;
  return { menu, shopping, budget };
}
