import {
  ChefHat,
  ShoppingBag,
  CircleDollarSign,
  ChevronDown,
  ArrowRight,
  LockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  catalog,
  quantityLabel,
  type Pipeline,
  type Plan,
  type Proposal,
  type PlannerMode,
  type ItemId,
  type ReviewAttempt,
} from "@/lib/dinner";
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
                    ? "Reviewing…"
                    : "Checks each attempt"
                  : proposal
                    ? proposal.result === "feasible"
                      ? "Review complete"
                      : "Conflict unresolved"
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
export function contributionText(id: Assistant, pipeline: Pipeline, confirmed: Plan) {
  if (id === "menu") {
    const changed = catalog.filter((item) => pipeline.menu.affected.includes(item.id));
    if (!changed.length) return "Selected quantities are unchanged.";
    return (
      changed
        .slice(0, 2)
        .map((item) =>
          pipeline.menu.plan.quantities[item.id] === 0
            ? `Remove ${item.name.toLowerCase()}`
            : `${item.name}: ${quantityLabel(pipeline.menu.plan.quantities[item.id], item)}`,
        )
        .join(" · ") + (changed.length > 2 ? ` · ${changed.length - 2} more changes` : "")
    );
  }
  if (id === "shopping") {
    const packs = pipeline.shopping.purchases.reduce((sum, row) => sum + row.packs, 0);
    const surplus = pipeline.shopping.implications
      .filter((row) => catalog.find((item) => item.id === row.id)?.unit === "g")
      .reduce((sum, row) => sum + row.surplus, 0);
    return `${packs} whole packs · ${surplus} g package surplus.`;
  }
  return `${money(pipeline.budget.total)} in purchases · ${pipeline.budget.overBy > 0 ? `${money(pipeline.budget.overBy)} over ${money(confirmed.budget)}` : `${money(confirmed.budget - pipeline.budget.total)} remaining`}.`;
}
function AttemptRecord({ attempt }: { attempt: ReviewAttempt }) {
  return (
    <div className="attempt-record">
      <p>
        <strong>Menu:</strong> {attempt.summary}
      </p>
      <p>
        <strong>Shopping:</strong>{" "}
        {attempt.pipeline.shopping.purchases.reduce((sum, row) => sum + row.packs, 0)} whole packs
        from those quantities.
      </p>
      <p>
        <strong>Budget:</strong> {money(attempt.feedback.total)} / {money(attempt.feedback.limit)} ·{" "}
        {attempt.feasible ? "Within budget and constraints" : attempt.feedback.violations.join(" ")}
      </p>
      <div className="attempt-quantities">
        {catalog.map((item) => {
          const row = attempt.pipeline.shopping.purchases.find((row) => row.item.id === item.id);
          return (
            <div key={item.id}>
              <span>
                {item.name} · {quantityLabel(attempt.pipeline.menu.plan.quantities[item.id], item)}
              </span>
              <span>
                {row?.packs ?? 0} packs · {money(row?.subtotal ?? 0)}
              </span>
            </div>
          );
        })}
      </div>
      {attempt.feedback.violations.length > 0 && (
        <>
          <strong>Calculated constraint feedback</strong>
          <p>
            {money(attempt.feedback.overage)} actual overage. Protected:{" "}
            {attempt.feedback.protectedIngredients.length
              ? attempt.feedback.protectedIngredients
                  .map((row) => `${row.id} ≥ ${row.minimum}`)
                  .join(", ")
              : "none"}
            . Attendance and budget cannot change.
          </p>
          <div className="feedback-packages">
            {attempt.feedback.packageImplications
              .filter((row) => row.surplus > 0)
              .map((row) => (
                <p key={row.id}>
                  {catalog.find((item) => item.id === row.id)?.name}: {row.planned} planned →{" "}
                  {row.purchased} purchased; reduce to {row.lowerPackThreshold} for one fewer pack (
                  {money(row.saving)}), only if constraints allow.
                </p>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
export function JointProposal({
  proposal,
  confirmed,
  revision,
  requestId,
  confirmedTotal,
  mode,
  pending,
  error,
  userRequest,
  notice,
  lastRun,
  failedAttempts,
  active,
  onSelect,
  onApply,
  onDismiss,
  onRevise,
  onKeep,
  onBudget,
  onGuests,
}: {
  proposal: Proposal | null;
  confirmed: Plan;
  revision: number;
  requestId: string | null;
  confirmedTotal: number;
  mode: PlannerMode;
  pending: boolean;
  error: string | null;
  userRequest: string;
  notice: string;
  lastRun: Proposal | null;
  failedAttempts: ReviewAttempt[];
  active: Assistant | null;
  onSelect: (id: Assistant) => void;
  onApply: () => void;
  onDismiss: () => void;
  onRevise: () => void;
  onKeep: (id: ItemId, kept: boolean) => void;
  onBudget: (budget: number) => void;
  onGuests: () => void;
}) {
  const latest = proposal?.attempts.at(-1);
  const pipeline = proposal?.pipeline;
  const current = !!proposal && proposal.revision === revision && proposal.requestId === requestId;
  const canApply = current && proposal.result === "feasible" && !pending && !error;
  const previous = proposal?.attempts[0];
  return (
    <section
      id="team-proposal"
      tabIndex={-1}
      className="joint-proposal"
      aria-label="Collaboration review"
    >
      <div className="proposal-header">
        <div className="proposal-heading">
          <h2>Review together</h2>
          <span className="review-source">
            {mode === "sample" ? "Sample rules" : "Live Menu AI"}
          </span>
        </div>
        <p className="approval-status">
          {pending
            ? "Review in progress"
            : error
              ? "Review failed"
              : notice
                ? "Revision needed"
                : proposal?.result === "unresolved"
                  ? "Conflict unresolved"
                  : "Needs your approval"}
        </p>
      </div>
      <div className="proposal-content">
        <p className="current-request">{userRequest}</p>
        <p className="review-kept">
          <LockKeyhole size={12} />{" "}
          {confirmed.kept.length
            ? confirmed.kept
                .map((id) => {
                  const item = catalog.find((item) => item.id === id)!;
                  return `${item.name} ≥ ${quantityLabel(confirmed.quantities[id], item)}`;
                })
                .join(" · ")
            : "No ingredients kept"}
        </p>
        <div className="contribution-list">
          {assistants.map(({ id, name, icon: Icon }) => (
            <div key={id}>
              <Button
                variant="ghost"
                className={`contribution agent-${id}`}
                aria-label={`${name} contribution`}
                aria-expanded={active === id}
                aria-pressed={active === id}
                onClick={() => onSelect(id)}
              >
                <Icon />
                <span>
                  <strong>
                    {name}
                    <small>
                      {id === "menu"
                        ? mode === "sample"
                          ? "Sample recommendation"
                          : "Model recommendation"
                        : id === "shopping"
                          ? "Whole-pack calculation"
                          : "Constraint check"}
                    </small>
                  </strong>
                  <span>
                    {pipeline
                      ? contributionText(id, pipeline, confirmed)
                      : pending
                        ? id === "menu"
                          ? "Menu review running; one feedback revision if checks fail."
                          : id === "shopping"
                            ? "Whole-pack rounding follows each Menu attempt."
                            : "Each attempt is checked; constraint feedback returns to Menu if needed."
                        : error
                          ? "No validated result from this request."
                          : "Constraints changed; review again."}
                  </span>
                </span>
                <ChevronDown />
              </Button>
              {active === id && pipeline && (
                <div
                  className="contribution-calculations"
                  role="region"
                  aria-label={`${name} calculations`}
                  tabIndex={0}
                >
                  {id === "menu" ? (
                    <>
                      <p>{latest?.summary}</p>
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
                  ) : id === "shopping" ? (
                    catalog
                      .filter((item) => pipeline.shopping.affected.includes(item.id))
                      .map((item) => {
                        const row = pipeline.shopping.purchases.find(
                          (row) => row.item.id === item.id,
                        );
                        return (
                          <div key={item.id}>
                            <span>{item.name}</span>
                            <span>
                              {pipeline.menu.plan.quantities[item.id]}
                              {item.unit} → {row?.packs ?? 0} × {item.packageSize}
                              {item.unit}
                              {row
                                ? ` · ${row.purchasedQuantity - pipeline.menu.plan.quantities[item.id]}${item.unit} extra`
                                : ""}
                            </span>
                          </div>
                        );
                      })
                  ) : (
                    <>
                      <p>
                        {latest?.feedback.violations.length
                          ? latest.feedback.violations.join(" ")
                          : "All catalog, preference, kept-item and budget checks passed."}
                      </p>
                      {pipeline.shopping.purchases.map((row) => (
                        <div key={row.item.id}>
                          <span>{row.item.name}</span>
                          <span>
                            {row.packs} × {money(row.item.price)} = {money(row.subtotal)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        {proposal && latest && (
          <div className="revision-explanation">
            {proposal.attempts.length === 1 ? (
              <p>
                First attempt{" "}
                {latest.feasible ? "passed every check. No revision needed." : "did not pass."}
              </p>
            ) : (
              <p>
                <strong>Menu received constraint feedback and revised once.</strong>{" "}
                {previous && previous.feedback.overage > 0
                  ? `${money(previous.feedback.overage)} over budget → ${money(latest.feedback.overage)} over.`
                  : "Constraint feedback was checked again."}{" "}
                Changed{" "}
                {latest.changedFromPrevious.length
                  ? latest.changedFromPrevious
                      .map((id) => catalog.find((item) => item.id === id)?.name.toLowerCase())
                      .join(", ")
                  : "no quantities"}
                .{" "}
                {latest.feasible
                  ? "All checks now pass."
                  : "No valid plan found after two attempts."}
              </p>
            )}
          </div>
        )}
        {notice && (
          <p className="revision-explanation" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="conflict-note" role="alert">
            {error} No plan was applied.
          </p>
        )}
        <details id="review-kept-editor" className="keep-editor">
          <summary>Keep another ingredient</summary>
          <div>
            {catalog
              .filter((item) => confirmed.quantities[item.id] > 0)
              .map((item) => (
                <label key={item.id}>
                  <input
                    type="checkbox"
                    aria-label={`Keep ${item.name} during review`}
                    checked={confirmed.kept.includes(item.id)}
                    onChange={(event) => onKeep(item.id, event.target.checked)}
                  />
                  {item.name}
                </label>
              ))}
          </div>
        </details>
        {proposal && proposal.attempts.length > 1 && (
          <details className="attempt-history">
            <summary>
              Initial attempt · {money(proposal.attempts[0]!.feedback.total)} · revision needed
            </summary>
            <AttemptRecord attempt={proposal.attempts[0]!} />
          </details>
        )}
        {failedAttempts.map((attempt) => (
          <details className="attempt-history" key={attempt.number}>
            <summary>
              Completed attempt {attempt.number} before error · {money(attempt.feedback.total)}
            </summary>
            <AttemptRecord attempt={attempt} />
          </details>
        ))}
        {!proposal && lastRun && (
          <details className="attempt-history">
            <summary>Previous review · outdated</summary>
            <p>
              Request {lastRun.requestId} · plan revision {lastRun.revision}. These quantities are
              not an actionable proposal.
            </p>
            {lastRun.attempts.map((attempt) => (
              <AttemptRecord key={attempt.number} attempt={attempt} />
            ))}
          </details>
        )}
        {proposal && (
          <details className="attempt-history">
            <summary>
              Current run record · {proposal.attempts.length}{" "}
              {proposal.attempts.length === 1 ? "attempt" : "attempts"}
            </summary>
            <p>
              Request {proposal.requestId} · plan revision {proposal.revision}
            </p>
            <AttemptRecord attempt={latest!} />
            <p>
              Result: {proposal.result === "feasible" ? "Feasible plan" : "Unresolved conflict"}.
              Confirmed quantities remain unchanged until Apply.
            </p>
          </details>
        )}
      </div>
      <div className="proposal-decision">
        <div className="decision-cost">
          <span>
            Confirmed<strong>{money(confirmedTotal)}</strong>
          </span>
          <ArrowRight />
          <span>
            {pipeline ? "Proposed" : "Awaiting review"}
            <strong>{pipeline ? money(pipeline.budget.total) : "—"}</strong>
          </span>
        </div>
        {proposal && (
          <p className={`review-result ${canApply ? "is-feasible" : "is-conflict"}`} role="status">
            {canApply
              ? "Within budget · all constraints checked"
              : latest?.feedback.violations.join(" ")}
          </p>
        )}
        {proposal?.result === "unresolved" && (
          <div className="constraint-choices">
            <span>Which constraint would you like to relax?</span>
            {proposal.pipeline.budget.total > confirmed.budget && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onBudget(proposal.pipeline.budget.total)}
              >
                Set limit to {money(proposal.pipeline.budget.total)}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onGuests}>
              Change attendance
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const editor = document.getElementById("review-kept-editor");
                if (editor instanceof HTMLDetailsElement) {
                  editor.open = true;
                  editor.scrollIntoView({ block: "nearest" });
                }
              }}
            >
              Change kept items
            </Button>
          </div>
        )}
        <div className="proposal-actions">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Dismiss
          </Button>
          {!proposal && !pending ? (
            <Button size="sm" onClick={onRevise}>
              {notice ? "Revise with this constraint" : "Retry review"}
              <ArrowRight />
            </Button>
          ) : (
            <Button size="sm" disabled={!canApply} onClick={onApply}>
              Apply plan
              <ArrowRight />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
