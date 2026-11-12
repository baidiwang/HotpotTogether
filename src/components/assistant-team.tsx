import { ChefHat, ShoppingBag, CircleDollarSign, ChevronDown, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { catalog, quantityLabel, type Pipeline, type Plan, type Proposal } from "@/lib/dinner";
export const assistants = [
  { id: "menu", name: "Menu", icon: ChefHat },
  { id: "shopping", name: "Shopping", icon: ShoppingBag },
  { id: "budget", name: "Budget", icon: CircleDollarSign },
] as const;
export type Assistant = (typeof assistants)[number]["id"];
export const money = (n: number) => `$${Number(n.toFixed(2))}`;
export function AssistantTeam({
  proposal,
  pending,
  applied,
  active,
  onSelect,
}: {
  proposal: Proposal | null;
  pending: boolean;
  applied: boolean;
  active: Assistant | null;
  onSelect: (id: Assistant) => void;
}) {
  return (
    <div className="assistant-team" aria-label="Dinner assistant team">
      {assistants.map(({ id, name, icon: Icon }, i) => (
        <div className="team-member" key={id}>
          {i > 0 && <ArrowRight className="team-dependency" aria-hidden="true" />}
          <Button
            variant="ghost"
            aria-label={`${name} assistant`}
            aria-pressed={active === id}
            onClick={() => onSelect(id)}
          >
            <span className={`assistant-avatar agent-${id}`}>
              <Icon />
            </span>
            <span>
              <strong>{name}</strong>
              <small>
                {pending
                  ? id === "menu"
                    ? "Recommending…"
                    : "Waiting for Menu"
                  : proposal
                    ? "Proposal ready"
                    : applied
                      ? "Applied"
                      : "Ready"}
              </small>
            </span>
          </Button>
        </div>
      ))}
    </div>
  );
}
export function contributionText(
  id: Assistant,
  pipeline: Pipeline,
  confirmed: Plan,
  proposal: Proposal,
) {
  if (id === "menu") {
    const changed = catalog.filter((item) => pipeline.menu.affected.includes(item.id));
    const plant = changed.filter(
      (item) =>
        ["tofu", "enoki"].includes(item.id) &&
        pipeline.menu.plan.quantities[item.id] > confirmed.quantities[item.id],
    );
    const items = (plant.length ? plant : changed)
      .slice(0, 2)
      .map(
        (item) =>
          `${quantityLabel(pipeline.menu.plan.quantities[item.id], item)} ${item.name.toLowerCase()}`,
      );
    return items.length
      ? `Plan ${items.join(" and ")} for ${pipeline.menu.plan.guests} guests.`
      : "Current portions already suit this group.";
  }
  if (id === "shopping")
    return `${pipeline.shopping.purchases.reduce((sum, row) => sum + row.packs, 0)} whole packs${pipeline.shopping.extraPacks === 0 ? "" : ` · ${Math.abs(pipeline.shopping.extraPacks)} ${pipeline.shopping.extraPacks > 0 ? "more" : "fewer"} than confirmed`}.`;
  return pipeline.budget.overBy > 0
    ? `${money(pipeline.budget.total)} in purchases · ${money(pipeline.budget.overBy)} over limit.`
    : `${money(pipeline.budget.total)} in purchases · ${money(pipeline.menu.plan.budget - pipeline.budget.total)} remaining.`;
}
export function JointProposal({
  proposal,
  pipeline,
  confirmed,
  confirmedTotal,
  choice,
  onChoice,
  active,
  onSelect,
  onApply,
  onDismiss,
}: {
  proposal: Proposal;
  pipeline: Pipeline;
  confirmed: Plan;
  confirmedTotal: number;
  choice: number | null;
  onChoice: (n: number | null) => void;
  active: Assistant | null;
  onSelect: (id: Assistant) => void;
  onApply: () => void;
  onDismiss: () => void;
}) {
  const delta = pipeline.budget.total - confirmedTotal;
  return (
    <section
      id="team-proposal"
      tabIndex={-1}
      className="joint-proposal"
      aria-label="Joint proposal"
    >
      <div className="proposal-header">
        <div className="proposal-heading">
          <h2>Team proposal</h2>
          <div className="mini-team">
            {assistants.map(({ id, icon: Icon }) => (
              <span key={id} className={`assistant-avatar agent-${id}`}>
                <Icon />
              </span>
            ))}
          </div>
        </div>
        <p className="approval-status">
          {proposal.mode === "sample" ? "Sample proposal" : "AI Menu proposal"} · needs your
          approval
        </p>
      </div>
      <div className="proposal-content">
        <div className="contribution-list">
          {assistants.map(({ id, name, icon: Icon }) => (
            <div key={id}>
              <Button
                variant="ghost"
                className={`contribution agent-${id}`}
                aria-label={`${name} contribution`}
                aria-expanded={active === id}
                aria-controls={`${id}-calculations`}
                aria-pressed={active === id}
                onClick={() => onSelect(id)}
              >
                <Icon />
                <span>
                  <strong>{name}</strong>
                  <small>
                    {id === "menu"
                      ? proposal.mode === "live"
                        ? choice === null
                          ? "AI ingredient recommendations"
                          : "AI portions + Budget tradeoff"
                        : "Sample portion rules"
                      : id === "shopping"
                        ? "Calculated from Menu’s quantities"
                        : "Calculated from Shopping’s packs"}
                  </small>
                  <span>{contributionText(id, pipeline, confirmed, proposal)}</span>
                </span>
                <ChevronDown />
              </Button>
            </div>
          ))}
        </div>
        {active !== null && (
          <div
            id={`${active}-calculations`}
            className="contribution-calculations"
            tabIndex={0}
            role="region"
            aria-label={`${assistants.find((a) => a.id === active)?.name} calculations`}
          >
            {active === "menu" ? (
              <>
                <p>
                  {choice !== null ? "Menu’s initial recommendation: " : ""}
                  {proposal.summary}
                </p>
                {catalog
                  .filter((item) => pipeline.menu.affected.includes(item.id))
                  .map((item) => (
                    <div key={item.id}>
                      <span>{item.name}</span>
                      <span>
                        {quantityLabel(confirmed.quantities[item.id], item)} →{" "}
                        {quantityLabel(pipeline.menu.plan.quantities[item.id], item)}
                      </span>
                    </div>
                  ))}
              </>
            ) : active === "shopping" ? (
              pipeline.shopping.purchases
                .filter((row) => pipeline.shopping.affected.includes(row.item.id))
                .map((row) => (
                  <div key={row.item.id}>
                    <span>{row.item.name}</span>
                    <span>
                      {row.packs} × {row.item.packageSize}
                      {row.item.unit} = {row.purchasedQuantity}
                      {row.item.unit}
                    </span>
                  </div>
                ))
            ) : (
              pipeline.shopping.purchases
                .filter((row) => pipeline.budget.drivers.includes(row.item.id))
                .map((row) => (
                  <div key={row.item.id}>
                    <span>{row.item.name}</span>
                    <span>
                      {row.packs} × {money(row.item.price)} = {money(row.subtotal)}
                    </span>
                  </div>
                ))
            )}
          </div>
        )}
      </div>
      <div className="proposal-decision">
        <div className="decision-cost">
          <span>
            Confirmed <strong>{money(confirmedTotal)}</strong>
          </span>
          <ArrowRight />
          <span>
            Proposed <strong>{money(pipeline.budget.total)}</strong>
          </span>
        </div>
        <p className="cost-change">
          {delta === 0
            ? "No cost change"
            : `${money(Math.abs(delta))} ${delta > 0 ? "increase" : "decrease"}`}{" "}
          · sample prices
        </p>
        {pipeline.budget.overBy > 0 && (
          <p className="conflict-note">
            {money(pipeline.budget.overBy)} over the {money(confirmed.budget)} limit.
            {!proposal.alternatives.length
              ? " Change budget, guests, or kept items to proceed."
              : " Choose a budget alternative."}
          </p>
        )}
        {proposal.alternatives.length > 0 && (
          <div className="alternative-options">
            <span>Budget’s rule-based alternatives</span>
            <Button
              variant={choice === null ? "secondary" : "ghost"}
              size="sm"
              aria-pressed={choice === null}
              onClick={() => onChoice(null)}
            >
              <span>Original</span>
              <span>{money(proposal.pipeline.budget.total)}</span>
            </Button>
            {proposal.alternatives.map((option, index) => (
              <Button
                key={option.title}
                variant={choice === index ? "secondary" : "ghost"}
                aria-pressed={choice === index}
                size="sm"
                aria-label={`Preview alternative ${index + 1}: ${option.title}`}
                onClick={() => onChoice(index)}
              >
                <span>{option.title}</span>
                <span>{money(option.pipeline.budget.total)}</span>
              </Button>
            ))}
          </div>
        )}
        <div className="proposal-actions">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
          <Button size="sm" disabled={pipeline.budget.overBy > 0} onClick={onApply}>
            Apply plan
            <ArrowRight />
          </Button>
        </div>
      </div>
    </section>
  );
}
