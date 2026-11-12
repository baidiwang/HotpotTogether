import { friendsExample } from "@/lib/dinner";
// Same guests, catalog, quantities and protected beef; only these explicit limits differ.
export const tighterBudgetFixture = () => ({ ...friendsExample(), budget: 100 });
// Kept beef already costs $48 and selected broth $8, before any vegetarian food.
export const unresolvedBudgetFixture = () => ({ ...friendsExample(), budget: 50 });
