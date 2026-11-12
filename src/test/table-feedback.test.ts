import { expect, it } from "vitest";
import { initialTable, addFriend } from "@/lib/playable-table";
import { reviewPlates } from "@/lib/plate-portions";
import { tableFeedback, tablePortions } from "@/lib/table-feedback";

it("keeps original revision evidence separate from the current remaining choices", () => {
  const { plan } = addFriend(initialTable());
  plan.kept = ["beef"];
  const source = reviewPlates(plan, 2, "feedback-test", "Keep beef.");
  const initial = tableFeedback(plan, source.plan, source);
  expect(initial.budget).toContain("First $121 ($1 over); revised to $116");
  expect(initial.budget).toContain("Keeps beef rolls ≥ 3 plates");
  expect(initial.shopping).toContain("+$17");
  const partiallyAccepted = { ...plan, quantities: { ...plan.quantities, tofu: 900 } };
  const partial = tableFeedback(partiallyAccepted, source.plan, source);
  expect(partial.shopping).toContain("+$13");
  expect(partial.menu).not.toContain("silken tofu");
  const rejectedLotus = { ...source.plan, quantities: { ...source.plan.quantities, lotus: 300 } };
  const rejected = tableFeedback(partiallyAccepted, rejectedLotus, source);
  expect(rejected.shopping).toContain("+$8");
  expect(rejected.budget).toContain("Current suggestion $111 / $120");
  expect(rejected.budget).toContain("revised to $116");
});

it("reports remaining overage after a rejection instead of carrying forward a passed check", () => {
  const { plan } = addFriend(initialTable());
  const source = reviewPlates(plan, 2, "overage-test", "Prepare dinner.");
  const target = { ...source.plan, quantities: { ...source.plan.quantities, beef: 900 } };
  expect(tableFeedback(plan, target, source).budget).toContain(
    "Current suggestion $121 / $120: $1 over budget",
  );
});

it("uses broth sets in both singular and plural while preserving food plate labels", () => {
  const { plan } = initialTable();
  expect(tablePortions(plan, "broth")).toBe("1 broth set");
  expect(tablePortions({ ...plan, quantities: { ...plan.quantities, broth: 2 } }, "broth")).toBe(
    "2 broth sets",
  );
  expect(tablePortions(plan, "beef")).toBe("3 plates");
});
