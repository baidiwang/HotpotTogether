import { useState, type DragEvent } from "react";
import {
  ArrowDown,
  Check,
  ChefHat,
  ChevronDown,
  CircleDollarSign,
  Info,
  Leaf,
  LockKeyhole,
  Minus,
  Plus,
  Pin,
  RotateCcw,
  ShoppingBag,
  Soup,
  Undo2,
  UserRound,
  X,
} from "lucide-react";
import {
  TableIllustration as FoodArt,
  FriendIllustration,
  EmptySeatIllustration,
} from "./table-illustration";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "./ui/sheet";
import { usePlayableTable } from "@/hooks/use-playable-table";
import { catalog, coordinate, cost, packages, quantityLabel, type Item } from "@/lib/dinner";
import { plateCount, plateSizes, platesLabel } from "@/lib/plate-portions";
import {
  acceptanceError,
  changedPlates,
  parsePlateDrag,
  type Friend,
  type PlateDrag,
} from "@/lib/playable-table";

type Controller = ReturnType<typeof usePlayableTable>;
const money = (n: number) => `$${Number(n.toFixed(2))}`;
const dragType = "application/x-hotpot-plate";
const signed = (n: number) => (n > 0 ? `+${money(n)}` : n < 0 ? `−${money(-n)}` : "same total");

function FriendSeat({
  friend,
  index,
  table,
}: {
  friend: Friend;
  index: number;
  table: Controller;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={`pt-seat pt-seat-${index} ${friend.vegetarian ? "is-vegetarian" : ""} ${friend.id === 0 ? "is-you" : ""}`}
          aria-label={`Edit ${friend.name}'s preference`}
        >
          <span className="pt-seat-person">
            <FriendIllustration id={friend.id} />
          </span>
          <span className="pt-seat-name">{friend.name}</span>
          {friend.vegetarian && (
            <span className="pt-seat-diet">
              <Leaf /> Vegetarian
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="pt-popover" aria-label={`${friend.name}'s preference`}>
        <strong>A seat for {friend.name}</strong>
        <button
          aria-pressed={!friend.vegetarian}
          onClick={() => table.setVegetarian(friend.id, false)}
        >
          <UserRound /> Eats everything {!friend.vegetarian && <Check />}
        </button>
        <button
          aria-pressed={friend.vegetarian}
          onClick={() => table.setVegetarian(friend.id, true)}
        >
          <Leaf /> Vegetarian {friend.vegetarian && <Check />}
        </button>
        {friend.id !== 0 && (
          <button className="pt-text-action" onClick={() => table.removeFriend(friend.id)}>
            Remove friend
          </button>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FoodReason({ item, table }: { item: Item; table: Controller }) {
  const { plan } = table.snapshot;
  const target = table.offer?.target;
  if (!target) return null;
  const delta = plateCount(target, item.id) - plateCount(plan, item.id);
  const purchaseDelta =
    (packages(target.quantities[item.id], item) - packages(plan.quantities[item.id], item)) *
    item.price;
  const first = table.offer!.source.attempts[0]!;
  const revised = table.offer!.source.attempts.length > 1;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="pt-why" aria-label={`Why change ${item.name}`}>
          <Info />
        </button>
      </PopoverTrigger>
      <PopoverContent className="pt-food-reason">
        <strong>{item.name}, considered together</strong>
        <p>
          <ChefHat />
          <span>
            <b>Menu</b> {table.mode === "sample" ? "Sample recommendation" : "Model recommendation"}
            :{" "}
            {delta > 0
              ? `add ${platesLabel(delta)}`
              : delta < 0
                ? `remove ${platesLabel(-delta)}`
                : `keep ${platesLabel(plateCount(plan, item.id))}`}{" "}
            for this group.
          </span>
        </p>
        <p>
          <ShoppingBag />
          <span>
            <b>Shopping</b> Buying this amount changes purchases by {signed(purchaseDelta)}. Portion
            and packaging details are in the shopping list.
          </span>
        </p>
        <p>
          <CircleDollarSign />
          <span>
            <b>Budget</b>{" "}
            {revised
              ? `The first check was ${money(first.feedback.overage)} over. Menu received calculated feedback and revised once.`
              : "The first check passed; no revision was needed."}{" "}
            {cost(target) > plan.budget
              ? `Your current choices are still ${money(cost(target) - plan.budget)} over.`
              : "Your current suggested table fits the budget."}
          </span>
        </p>
        {plan.kept.includes(item.id) && (
          <p>
            Must keep: assistants cannot remove this food or go below{" "}
            {platesLabel(plateCount(plan, item.id))}. You can edit or unlock it.
          </p>
        )}
      </PopoverContent>
    </Popover>
  );
}

function FoodPlate({
  item,
  table,
  onDrag,
}: {
  item: Item;
  table: Controller;
  onDrag: (event: DragEvent, value: PlateDrag) => void;
}) {
  const [selected, setSelected] = useState(false);
  const { plan } = table.snapshot;
  const count = plateCount(plan, item.id);
  const target = table.offer?.target;
  const delta = target ? plateCount(target, item.id) - count : 0;
  const kept = plan.kept.includes(item.id);
  if (!count && !delta) return null;
  const firstPlan = table.offer?.source.attempts[0]?.pipeline.menu.plan;
  const revisedPlan = table.offer?.source.attempts.length === 2 ? table.offer.source.plan : null;
  const budgetSaving =
    firstPlan && revisedPlan
      ? (packages(firstPlan.quantities[item.id], item) -
          packages(revisedPlan.quantities[item.id], item)) *
        item.price
      : 0;
  return (
    <div
      className={`pt-food pt-food-${item.id} ${delta ? "has-suggestion" : ""} ${selected ? "is-selected" : ""}`}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setSelected(false);
      }}
    >
      {count > 0 && (
        <div
          className="pt-selected-plate"
          role="button"
          tabIndex={0}
          draggable
          onDragStart={(event) => onDrag(event, { id: item.id, from: "table" })}
          aria-label={`${item.name}, ${platesLabel(count)} selected`}
          aria-expanded={selected}
          aria-controls={`pt-controls-${item.id}`}
          onFocus={() => setSelected(true)}
          onClick={() => setSelected(true)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setSelected(true);
            }
          }}
        >
          <div className="pt-porcelain">
            <FoodArt kind={item.id} />
          </div>
          <strong>{item.name}</strong>
          <span className="pt-plate-amount">{platesLabel(count)}</span>
          {kept && (
            <span
              className="pt-kept-marker"
              title={`Must keep: assistants retain at least ${platesLabel(count)}.`}
            >
              <Pin />
              <span className="sr-only">Must keep {count}+</span>
            </span>
          )}
        </div>
      )}
      <div
        className="pt-plate-controls"
        id={`pt-controls-${item.id}`}
        aria-label={`Edit ${item.name}`}
      >
        <button
          aria-label={`Remove one plate of ${item.name}`}
          disabled={!count || (kept && count === 1)}
          onClick={() => table.addPlate(item.id, -1)}
        >
          <Minus />
        </button>
        <button
          aria-label={`Add one plate of ${item.name}`}
          onClick={() => table.addPlate(item.id)}
        >
          <Plus />
        </button>
        <button
          className={kept ? "is-kept" : ""}
          aria-label={`${kept ? "Unmark" : "Mark"} ${item.name} must keep`}
          aria-pressed={kept}
          disabled={!count}
          onClick={() => table.toggleKeep(item.id)}
          title="Assistants keep at least your selected plates. You can still edit them."
        >
          <Pin />
        </button>
      </div>
      {!!delta && (
        <div
          className={`pt-ghost ${delta < 0 ? "is-reduction" : ""} ${!count ? "is-new-food" : ""}`}
        >
          <button
            className="pt-ghost-plate"
            draggable
            onDragStart={(event) =>
              onDrag(event, { id: item.id, from: "suggestion", requestId: table.offer!.requestId })
            }
            onClick={() => table.accept(item.id)}
            aria-label={`Accept ${item.name} suggestion`}
          >
            {!count && (
              <span className="pt-ghost-art">
                <FoodArt kind={item.id} />
              </span>
            )}
            {!count && <strong>{item.name}</strong>}
            <span className="pt-offer-quantity">
              {count} → {count + delta} plates
            </span>
            <span className="pt-offer-use">
              <Check /> Use
            </span>
          </button>
          <button
            className="pt-reject"
            aria-label={`Reject ${item.name} suggestion`}
            onClick={() => table.decline(item.id)}
          >
            <X />
          </button>
          <FoodReason item={item} table={table} />
        </div>
      )}
      {!delta && budgetSaving > 0 && (
        <div className="pt-feedback-why">
          <FoodReason item={item} table={table} />
        </div>
      )}
    </div>
  );
}

function ShoppingDrawer({
  table,
  open,
  onOpenChange,
}: {
  table: Controller;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [preview, setPreview] = useState(false);
  const confirmed = table.snapshot.plan;
  const plan = preview && table.offer ? table.offer.target : confirmed;
  const rows = coordinate(plan, confirmed).shopping.purchases;
  const record = table.record;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="pt-shopping-drawer" overlayClassName="pt-drawer-backdrop">
        <SheetHeader>
          <SheetTitle>For the whole table.</SheetTitle>
          <SheetDescription>
            {confirmed.guests} friends · {confirmed.vegetarians} vegetarian · sample USD prices
          </SheetDescription>
        </SheetHeader>
        {table.offer && (
          <label className="pt-shopping-preview">
            <input
              type="checkbox"
              checked={preview}
              onChange={(event) => setPreview(event.target.checked)}
            />{" "}
            Include unaccepted suggestions
          </label>
        )}
        <div className="pt-shopping-heading">
          <span>{preview && table.offer ? "Suggested purchases" : "Selected purchases"}</span>
          <strong>{money(cost(plan))}</strong>
        </div>
        {rows.length === 0 && <p>No food selected. Add a plate from the ingredient tray.</p>}
        {rows.map((row) => (
          <details className="pt-purchase" key={row.item.id}>
            <summary>
              <FoodArt kind={row.item.id} />
              <span>
                <strong>{row.item.name}</strong>
                <small>{platesLabel(plateCount(plan, row.item.id))}</small>
              </span>
              <span>
                {money(row.subtotal)} <ChevronDown />
              </span>
            </summary>
            <div className="pt-package-detail">
              <p>One plate = {quantityLabel(plateSizes[row.item.id], row.item)}.</p>
              <p>
                Planned {quantityLabel(plan.quantities[row.item.id], row.item)} → buy {row.packs} ×{" "}
                {quantityLabel(row.item.packageSize, row.item)}.
              </p>
              <p>
                {quantityLabel(row.purchasedQuantity, row.item)} purchased ·{" "}
                {quantityLabel(row.purchasedQuantity - plan.quantities[row.item.id], row.item)}{" "}
                surplus.
              </p>
              <p>
                {row.packs} × {money(row.item.price)} = {money(row.subtotal)}.
              </p>
            </div>
          </details>
        ))}
        <div className="pt-shopping-total">
          <span>Purchase total</span>
          <strong>{money(cost(plan))}</strong>
        </div>
        <p className={cost(plan) > plan.budget ? "pt-budget-gap" : "pt-muted"}>
          {cost(plan) > plan.budget
            ? `${money(cost(plan) - plan.budget)} over your ${money(plan.budget)} budget. Choose fewer plates or change the budget.`
            : `${money(plan.budget - cost(plan))} left in your ${money(plan.budget)} budget.`}
        </p>
        {record && (
          <details className="pt-evidence">
            <summary>
              Why these suggestions? <Info />
            </summary>
            <p>
              {record.mode === "sample"
                ? "Sample Menu rules; no model call."
                : "Live Menu recommendation."}{" "}
              Shopping rounds whole packages; Budget checks their costs. Whole portions are rounded
              up before either calculation.
            </p>
            <small>
              Request {record.requestId} · table revision {record.revision}. This is the original
              review before any individual accepts or rejections.
            </small>
            {record.attempts.map((attempt) => (
              <div key={attempt.number}>
                <strong>
                  {attempt.number === 1 ? "First suggestion" : "One revision"}:{" "}
                  {money(attempt.feedback.total)}
                </strong>
                <p>{attempt.summary}</p>
                <p>
                  {attempt.feedback.violations.length
                    ? attempt.feedback.violations.join(" ")
                    : "All checks passed."}
                </p>
                {attempt.number === 1 && record.attempts.length > 1 && (
                  <>
                    <p>
                      Budget sent Menu {money(attempt.feedback.overage)} of actual overage, these
                      package thresholds, and the protected minimums below.
                    </p>
                    {attempt.feedback.packageImplications
                      .filter((row) => row.surplus > 0)
                      .map((row) => (
                        <p key={row.id}>
                          {catalog.find((item) => item.id === row.id)?.name}: {row.planned} planned
                          → {row.purchased} purchased. Reducing to {row.lowerPackThreshold} saves
                          one pack ({money(row.saving)}), if constraints allow.
                        </p>
                      ))}
                    <p>
                      Protected:{" "}
                      {attempt.feedback.protectedIngredients
                        .map(
                          (p) => `${catalog.find((item) => item.id === p.id)?.name} ≥ ${p.minimum}`,
                        )
                        .join(", ") || "none"}
                      . Attendance and budget cannot change.
                    </p>
                  </>
                )}
              </div>
            ))}
          </details>
        )}
        <p className="pt-shopping-footnote">
          Planning quantities, not store inventory. No order is placed.
        </p>
      </SheetContent>
    </Sheet>
  );
}

export function PlayableTable() {
  const table = usePlayableTable();
  const { plan, friends } = table.snapshot;
  const [shopping, setShopping] = useState(false);
  const [dragging, setDragging] = useState<PlateDrag | null>(null);
  const changes = changedPlates(table.offer, plan);
  const suggested = table.offer?.target;
  const selectedTotal = cost(plan);
  const suggestedTotal = suggested ? cost(suggested) : selectedTotal;
  const canPlace = table.offer && !acceptanceError(plan, table.offer);
  const source = table.offer?.source;
  const first = source?.attempts[0];
  const last = source?.attempts.at(-1);
  const leadChange = changes.find((item) => item.id === "tofu") ?? changes[0];
  const leadDelta =
    leadChange && suggested
      ? plateCount(suggested, leadChange.id) - plateCount(plan, leadChange.id)
      : 0;
  const vegetarianFriend = friends.filter((friend) => friend.vegetarian).at(-1);
  const suggestionMessage = leadChange
    ? leadDelta > 0
      ? `Menu suggests ${leadDelta === 1 ? "an extra plate" : `${leadDelta} extra plates`} of ${leadChange.name.toLowerCase()} ${leadChange.id === "tofu" && vegetarianFriend ? `for ${vegetarianFriend.name}` : "for the table"}.`
      : `Menu suggests ${plateCount(plan, leadChange.id)} → ${plateCount(suggested!, leadChange.id)} plates of ${leadChange.name.toLowerCase()}.`
    : "Menu checked the selected table.";
  const startDrag = (event: DragEvent, value: PlateDrag) => {
    event.dataTransfer.setData(dragType, JSON.stringify(value));
    event.dataTransfer.effectAllowed = value.from === "tray" ? "copy" : "move";
    setDragging(value);
  };
  const drop = (event: DragEvent, destination: "table" | "tray") => {
    event.preventDefault();
    const value = parsePlateDrag(event.dataTransfer.getData(dragType));
    setDragging(null);
    if (!value) return;
    if (destination === "table" && value.from === "tray") table.addPlate(value.id);
    if (destination === "tray" && value.from === "table") table.addPlate(value.id, -1);
    if (destination === "table" && value.from === "suggestion")
      table.accept(value.id, value.requestId);
  };
  const addSeat = (
    <button
      className="pt-add-seat"
      onClick={table.addFriend}
      disabled={!table.loaded || friends.length >= 30}
      aria-label="Add a vegetarian friend"
    >
      <span className="pt-empty-chair">
        <EmptySeatIllustration />
        <Plus />
      </span>
      <strong>One more friend?</strong>
      <small>Add a vegetarian seat</small>
    </button>
  );
  return (
    <div className="playable-table" onDragEnd={() => setDragging(null)}>
      <a className="pt-skip" href="#dinner-table">
        Skip to the table
      </a>
      <header className="pt-header">
        <a className="pt-wordmark" href="#dinner-table">
          <Soup /> Hotpot Together
        </a>
        <div className="pt-tools">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="pt-mode" aria-label="Planning mode">
                {table.mode === "sample" ? "Sample mode" : "Live AI mode"}
                <ChevronDown />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => table.setMode("sample")}>
                Sample mode · local recommendations
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => table.setMode("live")}>
                Live AI mode · Menu model
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button
            aria-label="Undo"
            title="Undo"
            disabled={!table.history.length}
            onClick={table.undo}
          >
            <Undo2 />
          </button>
          <button onClick={table.reset}>
            <RotateCcw />
            <span>Reset</span>
          </button>
          <button className="pt-open-shopping" onClick={() => setShopping(true)}>
            <ShoppingBag />
            <span>Shopping list</span>
          </button>
        </div>
      </header>
      <main>
        <div className="pt-intro">
          <div>
            <h1>A table for {friends.length}.</h1>
            <p>Tap a plate to adjust it, or bring one over.</p>
            {friends.length >= 7 && (
              <button
                className="pt-more-friends"
                aria-label="Add a vegetarian friend"
                onClick={table.addFriend}
                disabled={friends.length >= 30}
              >
                <Plus /> Invite another friend
              </button>
            )}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <button className="pt-budget" aria-label="Change budget">
                <span className="pt-budget-label">Selected table</span>
                <span>
                  <strong>{money(selectedTotal)}</strong> / {money(plan.budget)} budget{" "}
                  <ChevronDown />
                </span>
                <small className={selectedTotal > plan.budget ? "pt-budget-gap" : ""}>
                  {selectedTotal > plan.budget
                    ? `${money(selectedTotal - plan.budget)} over budget`
                    : `${money(plan.budget - selectedTotal)} to spare`}
                </small>
              </button>
            </PopoverTrigger>
            <PopoverContent className="pt-popover">
              <label htmlFor="pt-budget-input">Budget for the table ($)</label>
              <input
                id="pt-budget-input"
                type="number"
                min="0"
                max="10000"
                value={plan.budget}
                onChange={(event) => table.setBudget(Number(event.target.value))}
              />
              <p>Purchase costs update as you place food.</p>
            </PopoverContent>
          </Popover>
        </div>
        <section
          id="dinner-table"
          className={`pt-table-stage ${dragging && dragging.from !== "table" ? "pt-drop-ready" : ""}`}
          aria-label="Dinner table drop zone"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = dragging?.from === "tray" ? "copy" : "move";
          }}
          onDrop={(event) => drop(event, "table")}
        >
          <div className="pt-table-surface" aria-hidden="true" />
          <div className="pt-friends" aria-label="Friends at the table">
            {friends.map((friend, index) => (
              <FriendSeat key={friend.id} friend={friend} index={index} table={table} />
            ))}
          </div>
          <div className="pt-pot">
            <Popover>
              <PopoverTrigger asChild>
                <button className="pt-pot-art" aria-label="Edit broth">
                  <FoodArt kind="pot" empty={!plan.quantities.broth} />
                </button>
              </PopoverTrigger>
              <PopoverContent className="pt-popover">
                <strong>Broth for the table</strong>
                <button onClick={() => table.addPlate("broth")}>
                  <Plus /> Add one serving
                </button>
                <button
                  disabled={plan.kept.includes("broth") && plan.quantities.broth === 1}
                  onClick={() => table.addPlate("broth", -1)}
                >
                  <Minus /> Remove one serving
                </button>
                <button
                  aria-pressed={plan.kept.includes("broth")}
                  onClick={() => table.toggleKeep("broth")}
                >
                  <LockKeyhole /> Must keep broth
                </button>
                {plan.vegetarians > 0 && <p>Prepare a separate vegetarian side.</p>}
              </PopoverContent>
            </Popover>
            <strong>
              {plan.quantities.broth ? "Two-way broth" : "A pot waiting to be filled"}
              {plan.kept.includes("broth") && (
                <Pin className="pt-pot-pin" aria-label="Must keep broth" />
              )}
            </strong>
            <span>
              {plan.quantities.broth
                ? `${plateCount(plan, "broth")} ${plateCount(plan, "broth") === 1 ? "serving" : "servings"}`
                : "Add broth from the tray"}
            </span>
            {table.status === "pending" && (
              <span className="pt-working" role="status">
                <ChefHat /> Menu is checking this table. Keep placing food.
              </span>
            )}
            {suggested && suggested.quantities.broth !== plan.quantities.broth && (
              <div className="pt-ghost pt-broth-ghost">
                <button
                  className="pt-ghost-plate"
                  draggable
                  onDragStart={(event) =>
                    startDrag(event, {
                      id: "broth",
                      from: "suggestion",
                      requestId: table.offer!.requestId,
                    })
                  }
                  aria-label="Accept broth suggestion"
                  onClick={() => table.accept("broth")}
                >
                  <span className="pt-offer-quantity">
                    {plateCount(plan, "broth")} → {plateCount(suggested, "broth")} servings
                  </span>
                  <span className="pt-offer-use">
                    <Check /> Use
                  </span>
                </button>
                <button
                  className="pt-reject"
                  aria-label="Reject broth suggestion"
                  onClick={() => table.decline("broth")}
                >
                  <X />
                </button>
                <FoodReason item={catalog.find((item) => item.id === "broth")!} table={table} />
              </div>
            )}
          </div>
          {catalog
            .filter((item) => item.id !== "broth")
            .map((item) => (
              <FoodPlate key={item.id} item={item} table={table} onDrag={startDrag} />
            ))}
          {friends.length < 7 && addSeat}
          <span className="pt-table-caption">
            {dragging && dragging.from !== "table" ? "Drop a plate onto the table" : ""}
          </span>
        </section>
        {friends.length >= 8 && (
          <div className="pt-extra-friends">
            {friends.slice(7).map((friend, i) => (
              <FriendSeat key={friend.id} friend={friend} index={i + 7} table={table} />
            ))}
          </div>
        )}
        {changes.length > 0 && (
          <div className="pt-table-response" aria-label="Suggested table changes">
            <div>
              <p>
                <ChefHat /> {suggestionMessage}
              </p>
              <span className="pt-response-impact">
                Shopping: {signed(suggestedTotal - selectedTotal)} in whole-pack purchases.
                {source && source.attempts.length > 1
                  ? ` Budget asked Menu to save ${money(first!.feedback.overage)}; ${last!.feasible ? "one revision passed" : "a conflict remains after one revision"}.`
                  : ""}
              </span>
              <span className="pt-suggested-cost">
                Suggested table <strong>{money(suggestedTotal)}</strong>
                {suggestedTotal > plan.budget
                  ? ` · ${money(suggestedTotal - plan.budget)} over budget`
                  : ""}
                <span> · {table.mode === "sample" ? "Sample suggestion" : "Live Menu"}</span>
              </span>
            </div>
            <div className="pt-response-choices">
              <button
                className="pt-button-primary"
                disabled={!canPlace}
                onClick={() => table.accept()}
              >
                Use these changes <ArrowDown />
              </button>
              <button onClick={() => table.decline()}>No thanks</button>
            </div>
          </div>
        )}
        {table.error && (
          <div className="pt-error" role="alert">
            <ChefHat />
            <span>{table.error} Your selected plates stayed.</span>
            <button onClick={table.retry}>Retry Menu</button>
            {table.mode === "live" && (
              <button onClick={() => table.setMode("sample")}>Use Sample mode</button>
            )}
          </div>
        )}
        <section
          className={`pt-ingredient-tray ${dragging?.from === "table" ? "pt-drop-ready" : ""}`}
          aria-label="Ingredient tray drop zone"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = "move";
          }}
          onDrop={(event) => drop(event, "tray")}
        >
          <div className="pt-tray-heading">
            <h2>Bring something to the table.</h2>
            <p>
              {dragging?.from === "table"
                ? "Return here to remove one plate. Unmark Must keep before removing the last one."
                : "Drag a plate over, or tap to add."}
            </p>
          </div>
          <div className="pt-tray-foods">
            {catalog.map((item) => (
              <button
                key={item.id}
                className="pt-tray-item"
                draggable
                onDragStart={(event) => startDrag(event, { id: item.id, from: "tray" })}
                onClick={() => table.addPlate(item.id)}
                aria-label={`Add a plate of ${item.name}`}
              >
                <FoodArt kind={item.id} />
                <span>{item.name}</span>
                <span className="pt-tray-plus">
                  <Plus />
                </span>
              </button>
            ))}
          </div>
        </section>
        <div className="pt-footer">
          <p role="status">
            {table.notice ||
              `${friends.length} friends · ${plan.vegetarians} vegetarian · ${table.mode === "sample" ? "Local sample recommendations" : "Live Menu model"}`}
          </p>
          <span>Sample USD prices · No order placed</span>
        </div>
      </main>
      <ShoppingDrawer table={table} open={shopping} onOpenChange={setShopping} />
    </div>
  );
}
