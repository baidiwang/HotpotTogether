---
name: Hotpot Together
description: A softly illustrated shared table for directly planning one hotpot dinner.
colors:
  paper: "#fcfcfa"
  ink: "#34362f"
  muted: "#686c60"
  line: "#e4e3db"
  tomato: "#a94e39"
  leaf: "#486c45"
  cream: "#fffefa"
  control-active: "#e8eddf"
  kept-soft: "#eef1e7"
  offer-soft: "#edf0e6d9"
  quiet-hover: "#ede9df"
  budget-gap: "#9b3e2c"
  portal-ink: "#30332e"
  portal-muted: "#63675f"
  portal-line: "#dfe2d9"
  portal-leaf: "#376744"
typography:
  display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 400
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    letterSpacing: "0"
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
  food-name:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.5
  numeral:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.15
rounded:
  field: "4px"
  offer: "5px"
  action: "6px"
  floating-controls: "9px"
  circle: "50%"
spacing:
  tight: "4px"
  compact: "8px"
  regular: "12px"
  inset: "14px"
  section: "16px"
  popover: "18px"
  separated: "24px"
  roomy: "28px"
components:
  button-primary:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.cream}"
    typography: "{typography.label}"
    rounded: "{rounded.action}"
    padding: "10px 14px"
  button-quantity:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.circle}"
    width: "34px"
    height: "34px"
  button-quantity-hover:
    backgroundColor: "{colors.control-active}"
    textColor: "{colors.leaf}"
  kept-marker:
    backgroundColor: "{colors.kept-soft}"
    textColor: "{colors.leaf}"
    rounded: "{rounded.circle}"
    width: "24px"
    height: "24px"
  suggestion-strip:
    backgroundColor: "{colors.offer-soft}"
    textColor: "{colors.leaf}"
    rounded: "{rounded.offer}"
    padding: "3px 5px"
  budget-field:
    textColor: "{colors.portal-ink}"
    rounded: "{rounded.field}"
    padding: "8px"
    width: "100%"
  toolbar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "70px"
  preference-popover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.portal-ink}"
    rounded: "{rounded.action}"
    padding: "18px"
    width: "250px"
  purchase-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.portal-ink}"
    typography: "{typography.label}"
---

# Design System: Hotpot Together

## Overview

**Creative North Star: "A Quiet Place-Setting Ritual"**

A shared meal is the visual world: softly painted food, a warm steaming pot, recognizable fictional friends and one empty chair. Pastel gouache and airbrush textures provide fine grain, softly imperfect edges and natural volume. Generous near-white space and quiet Instrument Sans leave the illustrations room to breathe. Controls appear beside the object they change.

The user's NONO MARKET direction governs material, whitespace and typographic restraint. The artwork is cohesive illustration: food already sits on painted porcelain, portraits have individual faces and the pot has warm volume. The interface uses Tomato for commitment and Leaf for dietary, protected and suggested states. It retains the directly editable table experiment and its separate, explicit recommendation preview.

**Key Characteristics:**

- Soft pastel illustration on true transparent alpha.
- Named portraits, a warm central pot and loosely arranged place settings.
- Quiet sentence-case labels, open space and thin functional separators.
- Object-adjacent controls and explicit current-to-proposed quantities.

Ground truth is `src/routes/index.tsx`, `src/components/playable-table.tsx`, `src/components/table-illustration.tsx` and the complete final cascade in `src/playable.css`. Instrument Sans and shared portal primitives come from `src/styles.css` and `src/components/ui/`. The code-led Operate study remains candidate 3, seed `08831c8d365aaa57`; there is no newly approved comp or quality-bar image. The surface brief records the user's subsequent literal illustration direction and this final composition. The latest finish review resolved its two reported findings and returned a ship disposition; that is its review scope.

## Colors

Warm paper and botanical ink support the pastel artwork. The frontmatter owns the actual CSS colors; painted coral, butter, sage and lavender belong to the raster artwork rather than additional UI tokens.

### Primary

- **Tomato:** The acceptance action, wordmark icon, text caret and explicit focus outline. Use it for a committed action and keyboard location.

### Secondary

- **Leaf:** Vegetarian words and icons, protected-food marks, suggestion controls and remaining-budget feedback.
- **Control active / Kept soft:** Pale botanical fills distinguish a control's selected state and the persistent pin marker.
- **Offer soft:** A lightly translucent backing for an unaccepted quantity strip. **Quiet hover** is the separate reject/reason hover fill.

### Neutral

- **Paper:** The canvas, popovers and shopping drawer.
- **Ink:** Confirmed names, quantities and primary copy. **Muted** supports secondary instructions and units.
- **Line:** Header, tray and footer-region boundaries. **Cream** is the primary button's text.
- **Portal ink / Portal muted / Portal line / Portal leaf:** The existing, slightly different literal colors on preferences, reasons and the shopping drawer. These describe the current portal implementation; new table content uses the scoped table palette.
- **Budget gap:** Actual over-budget amounts and the visible request error.

### Named Rules

**The Meaningful Accent Rule.** Pair dietary, protected and suggested color with words or an SVG icon; acceptance and selected prices must remain explicit.

**The Painted Color Rule.** Let the illustration carry the broad pastel range. Add interface color only for a readable state or action.

The table's six scoped custom properties are authoritative for new table content. Legacy root OKLCH variables still serve shared components and the former interface; they do not replace this table palette. Portals sit outside the table scope, so their paper, ink and font assignments must stay explicit.

## Typography

Instrument Sans remains the single interface family. The shared CSS role tokens,
not component-specific or viewport-specific sizes, are authoritative:

| Role | Size | Usage |
| --- | --- | --- |
| Title | 26px | Page and drawer headings |
| Body | 16px | Prose, primary actions, three collaboration rows |
| Label | 14px | Ingredient/person names, portions, secondary actions |
| Auxiliary | 13px | Mode notes, supporting labels; minimum text size |
| Amount | 32px | Selected purchase total |

The existing wordmark retains its 20px brand treatment. Body leading is 1.5;
object labels use 1.45. The same scale applies on phones without page scaling.
Collaboration paragraphs cap at 70ch and wrap with min-width:0. Main muted ink is
#575d50 on paper. The prior compact 11–12px annotation sizes are superseded.

Menu explains adjustments against the current guest/preferences context; Shopping
recomputes whole packs and incremental price against selected food; Budget labels
original first/revised totals separately from the remaining offer and current kept
minimums. Estimates are explicitly unaccepted, with Sample/Live provenance visible.


## Layout

`html` reserves a stable scrollbar gutter. The desktop table canvas uses horizontal gutters (42px), a header height (70px), introduction and tray widths capped at (1180px), and a stage capped at (1200px). The stage is (574px) tall. Response content caps at (1040px); extra friends wrap beneath the stage within (1080px). The frontmatter captures the reused spacing vocabulary, not an artificial requirement that every position be a scale multiple.

The first three portraits sit across the top rim at (25%, 50%, 75%); side seats sit at (6%, 94%), and the two lower seats at (22%, 78%). Food and the pot occupy the interior. At desktop size, food wrappers are (174px) wide and their artwork region is (160px × 96px); the pot is (230px × 220px). The pale radial pool merely joins the place settings; it has no drawn tabletop outline. Friends beyond seven appear in the separate wrapping row.

Between (761px) and (1100px), gutters become (28px), portraits become (76px), and the lower portraits move to (14%, 86%) to retain separation from the lower foods. Food wrappers become (158px), artwork regions (144px × 94px), and the pot (210px square).

At (760px) and below, gutters become (18px), the header wraps into two rows, and the table remains a portrait ring around a vertically spaced food arrangement. The stage is (1000px) tall: three portraits across the top, side portraits/chair beside the pot region, food pairs below, then the lower portraits. The response stacks vertically. The ingredient tray becomes a horizontal scroller with (104px) items and visible add controls. All portraits remain table positions; there is no horizontal friends strip.

At (480px) and below, gutters become (14px) and the stage becomes (1120px). Portraits are (66px square), food wrappers (160px), painted plate regions (140px × 94px), and the pot region (186px × 185px). The first food pair starts at (140px), the pot at (310px), subsequent food pairs at (560px, 750px), the final vegetable at (930px), and lower portraits at (1005px). This deliberate vertical space keeps actions and suggested quantities from colliding. The screen scrolls to the response and tray.

The shopping drawer remains a right-hand surface, width `min(460px, 100vw)`, with independent vertical scrolling. Padding is (30px 28px) on desktop and (28px 20px) on mobile. Popovers cap at `calc(100vw - 24px)`.

Verification uses `.impeccable/review/illustrated/desktop.jpg`, `user-960.jpg`, `user-660.jpg`, `mobile.jpg`, `mobile-actions.jpg` and `user-660-actions.jpg`. `viewport-measurements.json` records CSS viewports (1440 × 900), (960 × 1000), (660 × 1090) and (390 × 844), DPR (1) and scale (1). Their client and document widths match at (1425px, 945px, 645px, 375px). The native phone viewport and action captures are the width proof: full-page screenshot export can reflow or crop the right scrollbar gutter (15px).

## Elevation & Depth

Natural depth lives in the PNGs: softly rounded food, painted porcelain rims, grain, diffuse daylight and restrained lavender contact shading. CSS neither paints replacement food nor blurs photography into the style. The table itself has a quiet warm radial wash, with stops `#f6efe2`, `#f8f3e9`, `#faf8f1` and transparent paper. It uses no hard perimeter or cast shadow.

### Shadow Vocabulary

- **Floating plate controls** (`0 4px 14px #5a463315`): Only the compact revealed action bar, on translucent paper (`#fcfcfaf5`).
- **Shared popover / drawer:** Existing Tailwind `shadow-md` / `shadow-lg` from the installed UI primitives. Preserve their ambient role; their generated values remain owned by the build.
- **Drawer scrim** (`#554a3629`): A warm translucent veil over the recognizable table.

### Named Rules

**The Painted Depth Rule.** Keep the illustration's soft volume intact. Use interface elevation only to separate floating controls, popovers and the drawer.

With reduced motion disabled, a suggestion arrives over (220ms) using `cubic-bezier(0.16, 1, 0.3, 1)`, opacity (0.55 → 1) and vertical movement (4px → 0). Plate-control visibility changes over (130ms ease-out). There is no food blur animation. The shared drawer retains its existing opening/closing durations (500ms / 300ms).

## Shapes

Soft, imperfect physical silhouettes belong to the illustrations. Food includes its painted plate; the artwork wrapper adds no CSS porcelain disk, rim or shadow. Portraits are unframed busts rather than circle badges. Preserve transparent padding so complete objects and steam remain visible with `object-fit: contain`.

Functional controls use modest corners: fields, offer strips, primary actions and floating control bars use the frontmatter radii. Small quantity and pin controls are circular. Hairline separators organize the header, tray and shopping purchases; open areas remain open.

## Components

### Buttons

The primary **Use these changes** action is compact Tomato with Cream text, frontmatter padding, minimum height (40px), radius (6px) and a downward SVG. **No thanks** remains plain. Avoid invented hover lifts or scale changes. Disabled table buttons use opacity (0.42) and a not-allowed cursor.

A plate's minus, plus and pin controls appear on hover, focus within or explicit plate click. Each action is (34px square), arranged with gap (4px) inside the translucent floating bar. Hover and selected pin use the botanical control fill. Leaving the focused plate closes its selected control state. A separate persistent pin marker remains visible after the control bar hides.

Playable buttons, preference/reason buttons, selected plates and shopping summaries receive a visible Tomato focus outline (2px, offset 4px). Every drag operation has a click/keyboard equivalent. The skip link appears on focus and targets the table.

### Seats and dietary marks

Each seat is a named, fictional portrait. Only vegetarian seats show the Leaf dietary caption; **Eats everything** appears inside the preference popover rather than repeating around the rim. The selected preference includes a check SVG. The empty coral chair says **One more friend?** and explicitly adds a vegetarian seat. After seven friends, a short invitation near the heading adds more; additional portraits reuse the seven-image set by stable friend ID.

### Cards / Containers

The signature container is a place setting: painted plate and food, name and selected amount, then local actions or an optional quantity strip. There is no general dashboard-card treatment to inherit. Preference and explanation popovers are the compact floating containers, while the shopping drawer groups rows with separators.

### Inputs / Fields

The budget field lives in a labeled popover (250px wide, padding 18px). Its border uses Portal line, inset (8px), radius (4px) and a full-width native number input. The reason popover is (305px) wide with (12px / 1.6) explanations. Both retain shared portal borders, modest corners and ambient elevation. Portal text overrides at the end of the stylesheet take precedence over the earlier (11px–12px) preference defaults.

### Navigation

A wordmark and quiet tool row contain Sample/Live mode, Undo, Reset and Shopping list. Shopping is separated with one left divider. The mobile tools use a full-width four-column grid; mode remains at the start. There is no role-tab navigation.

### Suggested quantity

A suggestion states the actual selected and proposed amount (`2 → 3 plates`) beside **Use**, with independent Reject and Why SVG buttons. It is not an unexplained extra plate. A new ingredient also shows its name and a translucent copy of the same PNG (opacity 0.4); it is never a geometric stand-in. Broth changes belong beside the pot and use servings.

The response derives its Menu sentence from a real changed food and friend, then states Shopping's whole-pack price impact, Budget's revision result and the separate suggested-table total. **Selected table** always names the confirmed total above. Batch acceptance applies remaining valid changes; individual acceptance and rejection remain local. Why opens actual Menu, Shopping and Budget evidence. These are state-derived explanations rather than timed decorative assistant labels.

Menu calls a model only in Live mode. Sample is explicitly labeled and fully playable. Shopping and Budget always calculate deterministically from Menu's exact quantities. Local Live remains unconfigured: preserve its visible error, Retry Menu and explicit switch to Sample. Manual edits are immediate, support Undo and invalidate stale offers. Must keep protects ingredient identity and at least the selected quantity from assistants.

### Shopping purchase row

Expandable rows show the same illustrated thumbnail, name, selected plate amount and purchase subtotal. Expansion reveals portions, ingredient quantity, whole packs, purchased surplus and actual arithmetic. Unaccepted suggestions enter this drawer only through its preview checkbox.

One plate represents Napa (200g), enoki (150g), tofu (300g), beef (300g), lotus (150g), noodles (250g) or bok choy (150g); broth uses one serving. These are portions rather than package sizes. Preserve the existing catalog calculations and sample USD pricing; do not invent nutrition, stock or ordering.

### Illustration assets and provenance

`src/components/table-illustration.tsx` exclusively supplies this route's artwork from `src/assets/illustrated/`: seven food-on-plate PNGs, a steaming pot, an empty pot, seven distinctive fictional portraits and an empty coral chair (17 assets). Broth thumbnails intentionally reuse the pot. Friend images are indexed by stable ID modulo seven, so removing a different friend does not change a surviving friend's portrait.

The assets were created with the built-in `image_gen` tool on (2026-11-12), on true transparent alpha. `src/assets/illustrated/prompts.json` preserves every exact prompt and generation filename. The earlier nine repository PNGs remain legacy assets and are not imported by this route; the former SVG empty-pot fallback is not this route's empty state. Decorative images have empty alternative text and are hidden from assistive technology because adjacent labels and controls supply their names.

## Do's and Don'ts

### Do:

- **Do** use the cohesive transparent pastel illustrations with fine grain, soft edges and natural volume.
- **Do** preserve generous paper space and quiet Instrument Sans typography.
- **Do** keep plate and friend controls beside the object they change.
- **Do** distinguish selected amounts, proposed amounts and their separate prices in words.
- **Do** keep a protected pin visible after plate controls close.
- **Do** preserve keyboard focus, click alternatives to dragging and vertically spaced mobile positions.
- **Do** derive assistant explanations, portions and purchase costs from shared state and calculations.

### Don't:

- **Don't** substitute photos, CSS photo blur, crisp geometric food SVGs or generic avatar icons for this illustration set.
- **Don't** add CSS plates beneath artwork that already includes painted porcelain.
- **Don't** restore the old form, role tabs and review-card composition as this table's template.
- **Don't** treat NONO MARKET's commerce layout as the application's composition.
- **Don't** present unaccepted suggestions or their prices as confirmed table choices.
- **Don't** describe Shopping or Budget as model calls, imply local Live is configured, or silently replace a failed Live request with Sample.
- **Don't** add nutrition claims, stock, checkout, game timers, levels or character movement.

Not canonized or repaired by this documentation pass: the inherited root palette and slightly different portal colors remain contextual implementation differences, not a second universal theme. Compact (11px) annotations are observations, not a universal minimum-size recommendation. This record does not expand the finish review beyond its two resolved findings. The user subsequently confirmed complete drag/drop works. The typography pass preserves all drag handlers and does not reimplement them.
