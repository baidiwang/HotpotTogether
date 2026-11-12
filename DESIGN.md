---
name: Hotpot Together
description: A quiet, directly editable table for planning one shared hotpot dinner.
colors:
  paper: "#fcfcfa"
  ink: "#30332e"
  muted: "#63675f"
  line: "#dfe2d9"
  tomato: "#b94431"
  leaf: "#376744"
  table: "#f0f2e9"
  porcelain: "#fffefa"
  white: "#ffffff"
  vegetarian-soft: "#e8eee1"
  control-hover: "#e2e7d9"
  kept-soft: "#e2e9da"
  ghost-line: "#64825b"
  budget-gap: "#a13e2c"
typography:
  display:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "clamp(28px, 3vw, 42px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 400
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 400
  body:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    letterSpacing: "0"
  label:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 400
  food-name:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  caption:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.4
  numeral:
    fontFamily: "Instrument Sans, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 400
rounded:
  annotation: "3px"
  field: "4px"
  control: "6px"
  ellipse: "50%"
spacing:
  tight: "4px"
  close: "6px"
  compact: "8px"
  regular: "12px"
  section: "16px"
  inset: "18px"
  roomy: "20px"
  separated: "24px"
  wide: "28px"
  canvas: "48px"
components:
  button-primary:
    backgroundColor: "{colors.tomato}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "8px 12px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.ellipse}"
    width: "27px"
    height: "26px"
  button-quiet-hover:
    backgroundColor: "{colors.control-hover}"
  button-kept:
    backgroundColor: "{colors.kept-soft}"
    textColor: "{colors.leaf}"
    rounded: "{rounded.ellipse}"
  budget-field:
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "8px"
    width: "100%"
  toolbar:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    height: "76px"
  seat-vegetarian:
    backgroundColor: "{colors.vegetarian-soft}"
    textColor: "{colors.leaf}"
    rounded: "{rounded.ellipse}"
    width: "36px"
    height: "36px"
  porcelain-plate:
    backgroundColor: "{colors.porcelain}"
    rounded: "{rounded.ellipse}"
    width: "116px"
    height: "66px"
  ghost-plate:
    backgroundColor: "#f5f8eea6"
    textColor: "{colors.leaf}"
    rounded: "{rounded.ellipse}"
    width: "64px"
    height: "42px"
  purchase-row:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
---

# Design System: Hotpot Together

## Overview

**Creative North Star: "A Quiet Place-Setting Ritual"**

The built playable table makes dinner planning feel like arranging a shared meal: soft food cutouts sit on pale porcelain, friends have named seats, and controls stay beside the object they change. Space, restrained Instrument Sans and a light paper ground carry the hierarchy. Tomato marks the main acceptance action; leaf green carries dietary and protected-food meaning.

The user's NONO MARKET references establish generous white space, soft food texture and reserved typography. Their commerce composition is not a layout template. The previous form, role tabs and review card are the confirmed visual anti-reference for this replacement. This document records the implemented playable surface; the surface contract retains its particular composition and interaction story.

**Key Characteristics:**
- Object-adjacent controls and short English labels.
- Solid selected food and translucent, explicitly optional suggestions.
- Quiet boundaries, pale material layers and restrained color.
- One reused type family and unchanged repository food artwork.

Evidence: `src/playable.css` (including its final responsive and finish-review overrides), `src/components/playable-table.tsx`, `src/styles.css`, `src/lib/plate-portions.ts`, `PRODUCT.md`, and `.impeccable/surfaces/src-routes-index-tsx.md`. The chosen study is candidate 3, seed `08831c8d365aaa57`; this was code-led Operate work with no approved comp or quality-bar image. The finish verdict covers the reviewer's four resolved fixes, not a general certification of every state.

## Colors

A nearly white, slightly botanical neutral field lets the existing food assets supply most of the chroma. Frontmatter values are normative; descriptive names below explain application.

### Primary
- **Tomato:** Acceptance button, wordmark mark, text caret and playable focus outline. Use it to identify a committed action rather than decorate containers.

### Secondary
- **Leaf:** Vegetarian seats, Must keep, available budget and suggestion explanations. Vegetarian soft and kept soft distinguish the relevant states without tinting the whole interface.

### Neutral
- **Paper:** Playable canvas, drawer and small floating controls.
- **Ink:** Main copy and confirmed quantities.
- **Muted:** Supporting explanations, units and secondary tool labels.
- **Line:** Hairline dividers in the header, tray, response and shopping list.
- **Table:** The pale oval underneath food; it is a spatial grouping, not a generic panel color.
- **Porcelain:** Plate surfaces. **White** is the acceptance button's text.
- **Control hover:** Small quantity-control hover fill. **Ghost line** outlines pending plates. **Budget gap** marks an actual purchase overage.

### Named Rules
**The Meaningful Accent Rule.** Use Tomato for commitment and Leaf for dietary, protected and suggested states; retain text or an icon so color is never the only signal.

The scoped playable variables in `src/playable.css` are the source of these tokens. Older OKLCH variables remain in `src/styles.css` for shared primitives, portal defaults and the empty-pot SVG. They are not an alternative palette for new playable-table surfaces. Portaled content needs its own explicit paper, ink and type assignments because it sits outside the scoped canvas.

## Typography

**Display Font:** Instrument Sans, with system-ui and sans-serif fallback.
**Body Font:** The same Instrument Sans stack.

**Character:** Familiar, quiet and lightly weighted. The existing root loads weights 400, 500 and 600 through Google Fonts; the playable surface primarily uses regular and medium. Do not introduce another display face.

### Hierarchy
- **Display:** The invitation, using the fluid frontmatter role. At the mobile breakpoint it becomes (26px), retaining its tight line height and tracking.
- **Headline:** The shopping drawer title; its tighter tracking separates it from ordinary form content.
- **Title:** The ingredient-tray question. The wordmark is a separate medium-weight identity treatment (20px desktop; 19px mobile).
- **Body:** Short invitations and general copy; explanatory reason and drawer paragraphs use a more open line height (1.6).
- **Label:** Actions, preference choices and response copy. Food names use the medium food-name role; they become (11px) in the mobile table.
- **Caption:** Amounts and supporting details; several seat, tray and provenance annotations range from (10px) to (12px) by context.
- **Numeral:** The selected purchase cost uses tabular figures; it becomes (25px) on mobile. Drawer purchase totals use (27px).

### Named Rules
**The Quiet Hierarchy Rule.** Build hierarchy with size, spacing and regular-to-medium weight; keep labels in natural sentence case and keep the interface English.

Some mobile annotations in the implementation are (9px–10px). These are compact-state observations, not a recommended minimum text size for future screens.

## Layout

The desktop canvas has horizontal gutters (48px), reduced to (28px) at (1100px) and (18px) at (760px). Header height is (76px). Invitation and tray containers cap at (1240px), the table stage at (1120px), and the response at (1060px). The main spacing rhythm is captured in the frontmatter; this is an observed vocabulary rather than a requirement that every measurement be a scale multiple.

Above (760px), table objects use stable relative positions on an oval. The final stage height is `clamp(400px, calc(100dvh - 460px), 500px)`. Six seats sit outside the left and right edges, a seventh sits above, and additional friends appear in a wrapping row below the stage. Food controls and pending plates occupy their own object space. The tray uses eight equal columns.

At (760px) and below, the header wraps and the table becomes a three-column grid: a horizontally scrollable friends strip, an add-seat row when present, paired food around the central pot, then the table caption. All friends stay in the strip and the extra desktop row is hidden. New friends scroll into view. The tray becomes four columns. Response actions wrap underneath their explanation. Mobile quantity controls grow to (30px square), and suggestion reject/reason controls to (28px square).

The right shopping drawer is `min(460px, 100vw)` wide with its own vertical scrolling. It uses padding (30px 28px) on desktop and (28px 20px) on mobile. It stays a side drawer on mobile rather than becoming a different sheet design.

Measured captures distinguish outer viewport from CSS content width: (1440 × 900) rendered at (1425px) client/document width; (960 × 900) at (945px); and (390 × 844) at (375px), all DPR 1 and scale 1. In each measured state document width equals client width. The record is `.impeccable/review/viewport-measurements.json`.

## Elevation & Depth

Depth comes from pale tonal layers, fine material borders and faint ambient contact shadows. The table and plate shadows describe physical objects; they are not hard offset graphic effects. The shopping overlay uses a translucent botanical scrim, keeping the table recognizable beneath the drawer. Shared Radix popovers and the drawer retain their existing utility shadows.

### Shadow Vocabulary
- **Table contact** (`0 9px 28px #25352205`): The oval's faint separation from paper.
- **Porcelain contact** (`0 5px 9px #38442a09`): A small plate's soft contact with the table.
- **Shared floating UI:** Existing `shadow-md` and `shadow-lg` utilities in popover, menu and sheet primitives. Their generated values remain owned by the installed Tailwind build.

### Named Rules
**The Material Depth Rule.** Give food and porcelain a soft contact cue; keep separators and empty space responsible for interface grouping.

Pending plates arrive with a brief blur-and-opacity reveal (240ms, `cubic-bezier(0.16, 1, 0.3, 1)`) only when reduced motion is not requested. The shared drawer uses its existing opening and closing timings (500ms and 300ms). There is no continuous simulation or game motion.

## Shapes

The physical language is elliptical: table, porcelain, pending plates and small round object controls. Desktop porcelain is the frontmatter size; mobile porcelain is (80px × 48px). A fine inset elliptical line reinforces its rim. Pending plates use a dashed border and a small rotation (6deg), plus translucent food (opacity 0.43), so they remain distinct from selected food.

Rectangular controls stay modestly rounded: fields use the field radius and acceptance/tray surfaces use the control radius. Annotation backgrounds use the smaller annotation radius. Keep hairline dividers between functional regions instead of enclosing every region in a card.

## Components

### Buttons
The primary acceptance action is a compact Tomato control with white text, the frontmatter padding, a minimum height (38px), and a small directional SVG. Its sibling decline action remains plain. Table quantity buttons are quiet circles; hover adds the control-hover fill, while Must keep uses kept-soft with Leaf and a lock icon. Disabled playable buttons have opacity (0.4) and a not-allowed cursor.

Playable and popover buttons use a visible Tomato focus outline (2px, offset 4px). Source button hover treatments are restrained; the primary action does not acquire an invented lift or scale effect. Every drag operation also has a native button action.

### Seats and dietary marks
Named seat buttons contain a circular person or leaf mark with a preference label underneath. Vegetarian state changes both icon and words, plus a green-tinted material treatment. The add-seat affordance uses a dashed round mark and directly says that the new seat is vegetarian. Preference popovers show the selected choice with a check SVG.

### Cards / Containers
The signature container is the **place setting**, not a dashboard card: food art above an elliptical plate, name and plate count below, controls immediately beside it. The table and shopping list use open composition with thin boundaries. Do not derive a generic rectangular card system from this screen's oval stage.

### Inputs / Fields
The budget field sits inside a compact popover (250px wide, padding 18px). It has the frontmatter inset and radius, a hairline border, and a visible label. The reason popover is wider (305px) with readable (12px / 1.6) explanations. Shared portal primitives own borders, white surfaces and their existing focus behavior; preserve these when reusing the controls.

### Navigation
The header is a wordmark plus a compact tool row: Sample/Live mode, Undo, Reset and Shopping list. Shopping gets a left divider; secondary controls stay plain. At mobile widths the tools occupy a full wrapped row, with mode aligned to the start. The skip link appears on keyboard focus and leads to the table.

### Suggested plate
A translucent plate is an unaccepted alternative. Its separate native button accepts that ingredient, while nearby reject and reason buttons remain independently operable. The global acceptance action places all remaining valid suggestions. The quantity change stays next to the affected food; a broth suggestion belongs to the pot. Brief Menu, Shopping and Budget callouts explain concrete work, then disappear after (6500ms); the reason popover remains available.

Menu invokes a model only in Live mode. Sample is explicitly labeled and fully playable; Shopping and Budget always calculate deterministically from exact quantities. Local Live is currently unconfigured. Keep its visible error, Retry Menu and explicit switch to Sample; do not imply an available live service or silently replace a failed request. Manual edits apply immediately, support Undo, and invalidate stale offers. Must keep protects ingredient identity and at least the selected quantity from assistants.

### Shopping purchase row
Each expandable row has food art, a name, plate count and purchase subtotal. Expanding reveals the conversion from portions to quantities, whole packs, surplus and actual purchase arithmetic. Pending suggestions enter the drawer only through the explicit preview checkbox. Row dividers, not individual cards, organize the list.

One plate means Napa (200g), enoki (150g), tofu (300g), beef (300g), lotus (150g), noodles (250g), bok choy (150g); broth uses one serving. These are serving units, not package sizes or inventory. The UI keeps portions on the table and grams/packages in the drawer; prices remain sample USD and no order is placed.

### Food artwork and provenance
Reuse the nine unchanged PNG cutouts imported by `src/components/food-art.tsx`: beef, bok choy, broth, enoki, lotus, Napa, noodles, pot and tofu. All are existing repository assets from checkpoint `dd37953`; no raster was generated, edited or replaced during this table implementation. Their earlier creator, generator and license history are not established by the available repository evidence. `.impeccable/design.json` records each repository path and Git blob identity for traceability. The empty-pot state retains the existing code-native SVG fallback and its inherited root color variables. Decorative cutouts have empty alternative text because their adjacent controls and labels name the food.

Visual verification artifacts are `../outputs/playable-table-1440x900.jpg`, `../outputs/playable-table-960x900.jpg`, `../outputs/playable-table-390.jpg`, `../outputs/playable-shopping.jpg` and `../outputs/playable-broth-preview.jpg`. These are implementation captures, not external reference images or additional food assets.

## Do's and Don'ts

### Do:
- **Do** keep controls beside the friend, plate or pot they change.
- **Do** preserve the distinction between solid selected food and translucent unaccepted suggestions.
- **Do** reuse Instrument Sans and the existing food cutouts.
- **Do** pair dietary, protected and suggestion color with explicit words or SVG icons.
- **Do** preserve visible focus, keyboard/click alternatives to dragging, and the mobile friends strip.
- **Do** derive portions, package costs and assistant explanations from the shared calculations.

### Don't:
- **Don't** restore the previous form, role-tab and review-card composition as the table's template.
- **Don't** treat NONO MARKET's commerce layout as the application's layout template.
- **Don't** present an unaccepted plate or preview cost as part of the confirmed table.
- **Don't** describe deterministic Shopping or Budget calculations as separate model calls.
- **Don't** imply Live is configured locally or silently switch a failed Live request to Sample.
- **Don't** add game timers, levels, character movement, checkout or invented stock.

Not canonized: the older root palette, shared primitive defaults, and compact (9px–10px) annotations remain implementation observations rather than new universal rules. This documentation pass does not repair those inherited differences or expand the finish review beyond its four resolved findings.
