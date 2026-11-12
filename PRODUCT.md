# Hotpot Together

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A host preparing one shared hotpot dinner with friends. This is a single-user
design competition prototype, not a multi-user service or cooking game.

## Product Purpose

Make dinner planning tangible: add a friend, change their preference, place food,
then decide whether to accept an assistant's suggested changes.

## Operating Context

The playable-table experiment begins with six friends and a prepared table.
The next friend defaults to vegetarian, as confirmed by the user. Manual edits
take effect immediately and can be undone. Assistant recommendations are separate
previews until explicitly accepted or dismissed. A shopping drawer reveals
portions, ingredient quantities, whole-package purchases and costs.

## Capabilities and Constraints

- Keep the existing catalog, prices, deterministic package rounding and budget
  checks, Undo, Reset and server-side Lovable Menu integration.
- Menu uses a real model in Live mode. Shopping and Budget are deterministic
  calculations consuming Menu's exact quantities; Budget can return structured
  constraint feedback for one bounded Menu revision.
- Sample mode is explicitly labeled and fully playable without credentials.
- A Must keep mark protects ingredient identity and at least the current selected
  quantity. Recommendations cannot remove, substitute or reduce it. Users can
  unlock or manually edit it. An edit cancels and invalidates older requests.
- Credentials remain server-side. Local Live is currently unconfigured; errors
  must remain visible, with no silent Sample substitution.
- Prices are sample USD estimates. There is no invented inventory, free food,
  real ordering, login or shared database.
- All product copy is English. No timers, levels, character movement or game
  engine. Do not merge this experiment into main.

## Brand Commitments

Retain Hotpot Together's available food cutouts and restrained typography.
The user's NONO MARKET references establish white space, gentle food textures
and light composition; their commerce layout is not a template. The existing
interface is evidence to replace, not a new layout template.

## Evidence on Hand

Eight catalog ingredients, food PNG cutouts in src/assets, existing browser-safe
dinner calculations, validated Menu server workflow, and tests. Earlier real
calls verified the existing interface; they do not verify this new experiment.

## Product Principles

- Manipulate friends and plates instead of filling a planning form.
- Make arithmetic immediate and recommendations visibly optional.
- Put concrete assistant contributions beside affected food.
- Explain conflicts with actual quantities and package costs.

## Accessibility & Inclusion

Every drag action also has a click/keyboard action. Food and preferences have
text labels. Use portions on the table; expose grams and packaging in the drawer.
