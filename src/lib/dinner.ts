export type ItemId = 'napa' | 'enoki' | 'tofu' | 'beef' | 'lotus' | 'noodles' | 'bok' | 'broth';
export type Item = { id: ItemId; name: string; unit: string; packageSize: number; price: number; vegetarian: boolean; base: number };
export const catalog: Item[] = [
  { id: 'napa', name: 'Napa cabbage', unit: 'g', packageSize: 500, price: 4, vegetarian: true, base: 800 },
  { id: 'enoki', name: 'Enoki mushrooms', unit: 'g', packageSize: 150, price: 5, vegetarian: true, base: 300 },
  { id: 'tofu', name: 'Silken tofu', unit: 'g', packageSize: 300, price: 4, vegetarian: true, base: 600 },
  { id: 'beef', name: 'Beef rolls', unit: 'g', packageSize: 300, price: 16, vegetarian: false, base: 900 },
  { id: 'lotus', name: 'Lotus root', unit: 'g', packageSize: 300, price: 5, vegetarian: true, base: 300 },
  { id: 'noodles', name: 'Rice noodles', unit: 'g', packageSize: 250, price: 4, vegetarian: true, base: 500 },
  { id: 'bok', name: 'Bok choy', unit: 'g', packageSize: 300, price: 4, vegetarian: true, base: 300 },
  { id: 'broth', name: 'Two-way broth', unit: 'set', packageSize: 1, price: 8, vegetarian: true, base: 1 },
];
export type Plan = { guests: number; vegetarians: number; budget: number; quantities: Record<ItemId, number>; kept: ItemId[] };
export type Purchase = { item: Item; packs: number; purchasedQuantity: number; subtotal: number };
export type Pipeline = {
  menu: { id: 'menu'; plan: Plan; affected: ItemId[] };
  shopping: { id: 'shopping'; source: 'menu'; purchases: Purchase[]; affected: ItemId[]; extraPacks: number };
  budget: { id: 'budget'; source: 'shopping'; total: number; overBy: number; drivers: ItemId[] };
};
export type Alternative = { title: string; explanation: string; plan: Plan; pipeline: Pipeline };
export type Proposal = { revision: number; plan: Plan; pipeline: Pipeline; alternatives: Alternative[] };
export const initialPlan = (): Plan => ({ guests: 6, vegetarians: 0, budget: 120, kept: [], quantities: { napa: 800, enoki: 300, tofu: 600, beef: 900, lotus: 300, noodles: 500, bok: 300, broth: 1 } });
export const packages = (quantity: number, item: Item) => Math.ceil(Math.max(0, quantity) / item.packageSize);
export const cost = (plan: Plan) => catalog.reduce((sum, item) => sum + packages(plan.quantities[item.id], item) * item.price, 0);
export const quantityLabel = (quantity: number, item: Item) => item.unit === 'set' ? `${quantity} broth ${quantity === 1 ? 'set' : 'sets'}` : quantity >= 1000 ? `${Number((quantity / 1000).toFixed(2))} kg` : `${quantity} g`;
export function preferences(plan: Plan, changes: Partial<Pick<Plan, 'guests' | 'vegetarians' | 'budget'>>): Plan {
  const guests = Math.max(1, Math.min(30, Math.floor(changes.guests ?? plan.guests)));
  return { ...plan, ...changes, guests, vegetarians: Math.max(0, Math.min(guests, Math.floor(changes.vegetarians ?? plan.vegetarians))), budget: Math.max(0, changes.budget ?? plan.budget) };
}
// Replaceable, synchronous sample specialists. They never claim to execute live AI.
export function menuAssistant(plan: Plan): Plan {
  const quantities = { ...plan.quantities };
  for (const item of catalog) {
    if (quantities[item.id] === 0) continue;
    const required = item.id === 'broth' ? Math.ceil(plan.guests / 8) : item.id === 'beef' ? Math.ceil((plan.guests - plan.vegetarians) * 150) : Math.ceil((item.base * plan.guests / 6 + (['tofu', 'enoki', 'lotus', 'bok'].includes(item.id) ? plan.vegetarians * 100 : 0)) / 50) * 50;
    quantities[item.id] = plan.kept.includes(item.id) ? Math.max(quantities[item.id], required) : required;
  }
  return { ...plan, quantities };
}
export const shoppingAssistant = (plan: Plan): Purchase[] => catalog.filter(item => plan.quantities[item.id] > 0).map(item => ({ item, packs: packages(plan.quantities[item.id], item), purchasedQuantity: packages(plan.quantities[item.id], item) * item.packageSize, subtotal: packages(plan.quantities[item.id], item) * item.price }));
// Every downstream stage consumes the output above it, including alternative recalculations.
export function coordinate(plan: Plan, confirmed: Plan): Pipeline {
  const menu: Pipeline['menu'] = { id: 'menu', plan, affected: catalog.filter(item => plan.quantities[item.id] !== confirmed.quantities[item.id]).map(item => item.id) };
  const purchases = shoppingAssistant(menu.plan);
  const shopping: Pipeline['shopping'] = { id: 'shopping', source: menu.id, purchases, affected: purchases.filter(row => row.packs !== packages(confirmed.quantities[row.item.id], row.item)).map(row => row.item.id), extraPacks: purchases.reduce((sum, row) => sum + row.packs - packages(confirmed.quantities[row.item.id], row.item), 0) };
  const total = shopping.purchases.reduce((sum, row) => sum + row.subtotal, 0);
  const budget: Pipeline['budget'] = { id: 'budget', source: shopping.id, total, overBy: Math.max(0, total - plan.budget), drivers: [...shopping.purchases].sort((a,b) => b.subtotal - a.subtotal).slice(0,2).map(row => row.item.id) };
  return { menu, shopping, budget };
}
export function budgetAssistant(plan: Plan, purchases = shoppingAssistant(plan)): Omit<Alternative, 'pipeline'>[] {
  if (purchases.reduce((sum,row)=>sum+row.subtotal,0) <= plan.budget || plan.kept.includes('beef') || plan.quantities.beef === 0 || plan.quantities.tofu === 0) return [];
  const options = [
    { title: 'A little less beef, plenty to share', explanation: 'Use two beef packs and keep the generous tofu and vegetable portions.', quantities: { ...plan.quantities, beef: Math.min(plan.quantities.beef, 600) } },
    { title: 'Keep more beef, simplify the vegetables', explanation: 'Use three beef packs, two enoki packs, and one lotus root pack.', quantities: { ...plan.quantities, beef: Math.min(plan.quantities.beef, 900), enoki: Math.min(plan.quantities.enoki, 300), lotus: Math.min(plan.quantities.lotus, 300) } },
  ];
  return options.filter(option => plan.kept.every(id => option.quantities[id] === plan.quantities[id])).map(option => ({ title: option.title, explanation: option.explanation, plan: { ...plan, quantities: option.quantities } })).filter(option => cost(option.plan) <= plan.budget);
}
export function review(plan: Plan, revision: number): Proposal {
  const proposed = menuAssistant(plan);
  const pipeline = coordinate(proposed, plan);
  const alternatives = budgetAssistant(proposed, pipeline.shopping.purchases).map(option => ({ ...option, pipeline: coordinate(option.plan, plan) }));
  return { revision, plan: proposed, pipeline, alternatives };
}
export type PlannerState = { plan: Plan; revision: number; proposal: Proposal | null; history: Plan[]; message: string };
export const initialState = (): PlannerState => ({ plan: initialPlan(), revision: 1, proposal: null, history: [], message: '' });
export function updatePlan(state: PlannerState, plan: Plan, message = ''): PlannerState {
  return { plan, revision: state.revision + 1, proposal: null, history: [...state.history, state.plan].slice(-30), message };
}
export function acceptProposal(state: PlannerState, plan: Plan): PlannerState {
  if (!state.proposal || state.proposal.revision !== state.revision || cost(plan) > plan.budget) return state;
  if (state.plan.kept.some(id => plan.quantities[id] === 0)) return state;
  return updatePlan(state, plan, 'Coordinated proposal applied. Everyone’s on the same page.');
}
export function undo(state: PlannerState): PlannerState {
  const previous = state.history.at(-1);
  return previous ? { plan: previous, revision: state.revision + 1, proposal: null, history: state.history.slice(0, -1), message: 'Previous dinner plan restored.' } : state;
}
export function validPlan(value: unknown): value is Plan {
  if (!value || typeof value !== 'object') return false;
  const p = value as Plan;
  return Number.isInteger(p.guests) && p.guests >= 1 && p.guests <= 30 && Number.isInteger(p.vegetarians) && p.vegetarians >= 0 && p.vegetarians <= p.guests && Number.isFinite(p.budget) && p.budget >= 0 && Array.isArray(p.kept) && p.kept.every(id => catalog.some(item => item.id === id)) && !!p.quantities && catalog.every(item => Number.isFinite(p.quantities[item.id]) && p.quantities[item.id] >= 0);
}