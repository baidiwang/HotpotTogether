import {
  catalog,
  cost,
  initialPlan,
  maxQuantity,
  proposalViolations,
  samePlan,
  validPlan,
  validRecommendationPlan,
  type ItemId,
  type Plan,
  type Proposal,
} from "./dinner";
import { plateCount, plateSizes } from "./plate-portions";

export type Friend = { id: number; name: string; vegetarian: boolean };
export type TableSnapshot = { plan: Plan; friends: Friend[] };
export type TableOffer = { source: Proposal; target: Plan; revision: number; requestId: string };
const names = ["You", "Alex", "Sam", "Jordan", "Taylor", "Riley", "Casey", "Jamie"];
export function initialTable(): TableSnapshot {
  return {
    plan: initialPlan(),
    friends: names.slice(0, 6).map((name, id) => ({ id, name, vegetarian: false })),
  };
}
export function validTable(value: unknown): value is TableSnapshot {
  if (!value || typeof value !== "object") return false;
  const t = value as TableSnapshot;
  return (
    validPlan(t.plan) &&
    catalog.every((item) => Number.isInteger(plateCount(t.plan, item.id))) &&
    Array.isArray(t.friends) &&
    t.friends.length === t.plan.guests &&
    t.friends.filter((f) => f.vegetarian).length === t.plan.vegetarians &&
    new Set(t.friends.map((f) => f.id)).size === t.friends.length &&
    t.friends.every(
      (f) =>
        Number.isSafeInteger(f.id) &&
        f.id >= 0 &&
        typeof f.name === "string" &&
        f.name.length > 0 &&
        f.name.length < 40 &&
        typeof f.vegetarian === "boolean",
    )
  );
}
export function withFriends(snapshot: TableSnapshot, friends: Friend[]): TableSnapshot {
  return {
    friends,
    plan: {
      ...snapshot.plan,
      guests: friends.length,
      vegetarians: friends.filter((f) => f.vegetarian).length,
    },
  };
}
export function addFriend(snapshot: TableSnapshot): TableSnapshot {
  if (snapshot.friends.length >= 30) return snapshot;
  const id = Math.max(...snapshot.friends.map((f) => f.id)) + 1;
  return withFriends(snapshot, [
    ...snapshot.friends,
    { id, name: names[id] ?? `Friend ${id + 1}`, vegetarian: true },
  ]);
}
export function changePlate(snapshot: TableSnapshot, id: ItemId, delta: number): TableSnapshot {
  const item = catalog.find((item) => item.id === id);
  if (!item || !Number.isInteger(delta)) return snapshot;
  const q = Math.max(
    0,
    Math.min(maxQuantity(item), snapshot.plan.quantities[id] + delta * plateSizes[id]),
  );
  if (q === snapshot.plan.quantities[id] || (snapshot.plan.kept.includes(id) && q === 0))
    return snapshot;
  return {
    ...snapshot,
    plan: { ...snapshot.plan, quantities: { ...snapshot.plan.quantities, [id]: q } },
  };
}
export function sameTable(a: TableSnapshot, b: TableSnapshot) {
  return samePlan(a.plan, b.plan) && JSON.stringify(a.friends) === JSON.stringify(b.friends);
}
export function makeOffer(
  source: Proposal,
  snapshot: TableSnapshot,
  revision: number,
  requestId: string,
): TableOffer {
  if (
    source.revision !== revision ||
    source.requestId !== requestId ||
    !validRecommendationPlan(source.plan) ||
    !catalog.every((item) => Number.isInteger(plateCount(source.plan, item.id)))
  )
    throw new Error("The suggestion no longer matches this table.");
  if (
    source.plan.guests !== snapshot.plan.guests ||
    source.plan.vegetarians !== snapshot.plan.vegetarians ||
    source.plan.budget !== snapshot.plan.budget ||
    source.plan.kept.length !== snapshot.plan.kept.length ||
    source.plan.kept.some((id) => !snapshot.plan.kept.includes(id))
  )
    throw new Error("Menu changed a table constraint. No plates were placed.");
  return { source, target: source.plan, revision, requestId };
}
export function changedPlates(offer: TableOffer | null, confirmed: Plan) {
  return offer
    ? catalog.filter((item) => offer.target.quantities[item.id] !== confirmed.quantities[item.id])
    : [];
}
export function acceptanceError(confirmed: Plan, offer: TableOffer, id?: ItemId): string | null {
  const target = id
    ? { ...confirmed, quantities: { ...confirmed.quantities, [id]: offer.target.quantities[id] } }
    : offer.target;
  if (id && !changedPlates(offer, confirmed).some((item) => item.id === id))
    return "That suggestion has already been resolved.";
  const violation = proposalViolations(target, confirmed)[0];
  if (violation) return violation;
  if (cost(target) > confirmed.budget)
    return `This would be $${cost(target) - confirmed.budget} over budget. Remove another plate or adjust the budget first.`;
  return null;
}
export type PlateDrag = { id: ItemId; from: "tray" | "table" | "suggestion"; requestId?: string };
export function parsePlateDrag(value: string): PlateDrag | null {
  try {
    const p = JSON.parse(value) as PlateDrag;
    if (
      !catalog.some((item) => item.id === p.id) ||
      !["tray", "table", "suggestion"].includes(p.from)
    )
      return null;
    if (p.from === "suggestion" && (typeof p.requestId !== "string" || p.requestId.length > 100))
      return null;
    return { id: p.id, from: p.from, ...(p.requestId ? { requestId: p.requestId } : {}) };
  } catch {
    return null;
  }
}
