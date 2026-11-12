import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { PlayableTable } from "@/components/playable-table";
import { addFriend, initialTable } from "@/lib/playable-table";
vi.mock("@/lib/menu.functions", () => ({ reviewWithMenu: vi.fn() }));
beforeEach(() => localStorage.clear());
afterEach(cleanup);

it("wires tray/table drops to the same immediate plate edits as the buttons", async () => {
  render(<PlayableTable />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Add a vegetarian friend" })).toBeEnabled(),
  );
  const table = screen.getByRole("region", { name: "Dinner table drop zone" });
  const tray = screen.getByRole("region", { name: "Ingredient tray drop zone" });
  const transfer = (from: string, id = "tofu") => ({ getData: () => JSON.stringify({ id, from }) });
  fireEvent.drop(table, { dataTransfer: transfer("tray") });
  expect(screen.getByLabelText("Silken tofu, 3 plates selected")).toBeInTheDocument();
  fireEvent.drop(tray, { dataTransfer: transfer("table") });
  expect(screen.getByLabelText("Silken tofu, 2 plates selected")).toBeInTheDocument();
  fireEvent.drop(table, { dataTransfer: transfer("tray", "unknown") });
  expect(screen.getByLabelText("Silken tofu, 2 plates selected")).toBeInTheDocument();
});

it("offers broth individually with preview, explanation, acceptance and rejection", async () => {
  const snapshot = addFriend(addFriend(addFriend(initialTable())));
  snapshot.plan.budget = 200;
  localStorage.setItem("hotpot-playable-table-v1", JSON.stringify({ snapshot, history: [] }));
  render(<PlayableTable />);
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Add a vegetarian friend" })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: "Add a plate of Silken tofu" }));
  await screen.findByRole("button", { name: "Accept broth suggestion" });
  expect(screen.getByRole("button", { name: "Why change Two-way broth" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reject broth suggestion" }));
  expect(screen.queryByRole("button", { name: "Accept broth suggestion" })).not.toBeInTheDocument();
  expect(screen.getByText("1 serving")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Add a plate of Napa cabbage" }));
  await screen.findByRole("button", { name: "Accept broth suggestion" });
  fireEvent.click(screen.getByRole("button", { name: "Accept broth suggestion" }));
  expect(screen.getByText("2 servings")).toBeInTheDocument();
});
