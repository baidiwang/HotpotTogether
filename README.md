# Screenshot Perfect Match

Implement exactly the screenshot and nothing else

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/a6ac6607-5daa-4222-aa9b-bfd44b523d81).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Hotpot Together workflow

This prototype keeps one confirmed plan and a separate revision-bound proposal.
Manual settings and quantity edits invalidate review; only **Apply plan** accepts
an assistant proposal. Dismiss leaves the plan unchanged. Undo restores a complete
previous plan; Reset cancels pending work and restores the initial sample plan.

- **Menu**: in Sample mode, local portion rules; in Live AI mode, a server-side
  Lovable gateway Chat Completions request returns a strict JSON list of all eight
  catalog IDs and integer quantities, plus a short explanation. Its input includes
  guests, vegetarian guests, the fixed catalog, package prices, removed items,
  kept minimum quantities, and the user's budget.
- **Shopping**: deterministic whole-pack rounding from those recommended quantities.
- **Budget**: deterministic sum of Shopping's package costs and validation of
  guest, kept-item, portion and budget constraints. Failed checks return structured
  feedback to Menu for **one** revision, followed by fresh Shopping and Budget
  calculations. These are distinct interface roles, not three independent
  autonomous AI agents. Prices remain sample USD
  estimates in both modes; there is no live store pricing or checkout.

Both sample and live recommendations must preserve preferences and removed items,
never reduce kept quantities, use only catalog IDs and bounded whole quantities,
and remove beef for an all-vegetarian group. Kept beef conflicts must be resolved
by the user. Shared prototype serving guardrails require at least 350 g of solids
per guest and 350 g of vegetarian solids per vegetarian guest; selected broth
cannot disappear. These are prototype rules, not personalized nutrition advice.
Over-budget originals may be inspected, but cannot be applied. Acceptance also
checks the current revision and membership in the displayed proposal options.

### Backend runtime and request path

This is one full-stack TanStack Start application, not a separate frontend and
API repository. Vite serves the page and the server function on the same local
port. The browser sends a POST to `/_serverFn/<generated-function-id>` on the
page's own origin. The server then calls
`https://ai.gateway.lovable.dev/v1/chat/completions` with its server credential.
No separate frontend backend-URL variable is needed. Function IDs are generated
by the build and must not be hardcoded by another client.

For local Sample mode, use Node 22.12+ and the committed Bun lockfile:

```sh
bun install --frozen-lockfile
bun run dev --host 127.0.0.1
```

The configured default port is 8080. If occupied, Vite selects the next free port;
use the URL printed by Vite. The server must stay running. This command starts
both the UI and its backend; it does not start a separate API service.

If you already have a legitimately provisioned local runtime credential, put it
in the ignored `.env.local` privately, then start using:

```sh
node --env-file=.env.local node_modules/vite/bin/vite.js --host 127.0.0.1
```

Vite does not automatically populate `process.env` with unprefixed `.env` values.
Lovable's managed project key is write-only: its existence in Lovable does NOT
mean it can be copied out or that this local clone has credentials. Do not invent
a key, use a Lovable workspace API key, scrape platform credentials, or ask a user
to paste a key into chat. Without a local credential, use Sample mode locally and
validate live AI in the properly configured Lovable preview environment.

The current build target is Nitro `cloudflare-module`. `bun run build` produces
both `.output/public` (assets) and `.output/server/index.mjs` (Worker backend),
plus `.output/server/wrangler.json`. `bun run preview` uses Wrangler to run that
built Worker locally. Publishing only `.output/public` would omit server
functions. For an independently managed Cloudflare deployment, deploy the Worker
with its generated Wrangler configuration and assets binding, not a static-only
site. Configure Worker runtime variables/secrets in Cloudflare's dashboard under
**Workers & Pages → the deployed Worker → Settings → Variables and Secrets**.
A managed Lovable key is not automatically exported to an independent Worker.

### Enable real AI in Lovable

1. Open the linked [Lovable project](https://lovable.dev/projects/a6ac6607-5daa-4222-aa9b-bfd44b523d81).
   In workspace **Connectors → AI**, verify **Enabled**. The project already has a
   managed `LOVABLE_API_KEY` under **More → Settings → Secrets** as checked on
   November 11, 2026. Lovable creates and manages this per-project key; it is not a
   workspace API key, and stored secret values cannot be viewed. Leave this key
   managed by Lovable; do not replace it with a user-supplied provider key.
2. In that project's **More → Settings → Secrets → Add secret**, add the two
   application runtime configuration values (both were saved in this project during
   the November 11 verification; no credential needs to be pasted):
   - `HOTPOT_AI_ENABLED` = `true`
   - `HOTPOT_AI_MODEL` = `google/gemini-3.8-flash`
3. Sync the current application code to the connected GitHub branch so Lovable
   builds the new server function, then refresh/rebuild the preview. Local
   uncommitted changes are not automatically present in Lovable. Secret changes
   are described by the UI as applying immediately in preview, and require
   publishing for the live app. Verify the actual model ID in the AI activity
   record: a saved configuration change alone is not proof that an existing
   preview instance has switched models.
4. In preview, choose **Live AI mode** and run the complete review/Apply/Undo
   workflow. Check **More → AI** for the actual model request and usage. Only after
   preview verification, publish the current version with **Publish**, then repeat
   the same checks against the live URL. A Git push is not a public publication.

`google/gemini-3.8-flash` and `google/gemini-3.1-flash-lite` are present in the
workspace model catalog inspected on November 11, 2026. Lovable's official
`@lovable.dev/ai-gateway@0.1.11` contracts expose both on the Chat Completions
surface with JSON-schema response formatting. Gemini 3.8 Flash was subsequently verified through real gateway calls and
the complete preview workflow below. Flash Lite remains contract-compatible but
was not proven to be the model used by the running preview: the successful
activity records continued to identify Gemini 3.8 Flash. The broader model list also
contains image, audio, Responses-only and Messages models; presence in that list
alone does not make a model compatible with this endpoint. The app does not
silently select a default model.

References: [Lovable AI](https://docs.lovable.dev/features/ai),
[Secrets](https://docs.lovable.dev/features/secrets),
[Hosting](https://docs.lovable.dev/features/hosting),
[External deployment](https://docs.lovable.dev/tips-tricks/external-deployment-hosting),
[official gateway SDK](https://www.npmjs.com/package/@lovable.dev/ai-gateway).

The published browser requests the same `/_serverFn/…` path on its published
`https://<site>.lovable.app` or custom-domain origin. The upstream gateway address
stays server-side. As checked in this project's Publish dialog on November 11,
2026, the project was **Not published**. No production origin or deployed instance
of the new Menu function has therefore been verified. A local production build
is not evidence of a live deployment.

Live errors (missing setup, access/credit/rate-limit errors, timeout, invalid model
output, network failure) are displayed explicitly. There is a 30-second deadline for each Menu call
(at most two calls per run) and no automatic retry or sample substitution. Users can retry
or explicitly switch to Sample mode. Client edits, Undo, Reset, mode changes and
Cancel abort the pending client request and ignore late results; upstream work may
already have started and still incur usage. Sample-mode plans/history are stored
locally; live-mode edits and all proposals are session-only. Switching back to
Sample mode resumes browser saving of the current plan.

This is a competition prototype without login or a shared database. The server
function is CSRF protected but not authenticated or backed by a distributed quota;
configure hosting access/usage limits for a credential-enabled public demo.

### Bounded collaboration and shared review

The example **Two more friends · start review** shows its starting conditions
in the menu (6 → 8 guests, one vegetarian, $120, beef ≥ 900 g). It starts from
`initialPlan()` (six people, $120 and the original quantities), changes attendance
to eight with one vegetarian, keeps at least 900 g beef, and starts review. It
never applies a recommendation. Undo history retains the previous complete plan.

Each accepted review request carries a unique request ID and plan revision. The
run records the exact Menu candidate, Shopping's whole-pack purchases and surplus,
Budget's total and violations, and any revision changes. A feasible initial
candidate finishes after one attempt. Otherwise the feedback includes the actual
overage, package thresholds and potential pack savings, protected minimums and
permitted changes. Menu may revise once; Shopping and Budget then recalculate from
that exact revision. After two unsuccessful attempts the result is unresolved,
Apply is disabled, and the user chooses whether to change budget, attendance or
kept items. The app never relaxes a constraint itself.

Live mode uses the existing Lovable gateway for both Menu attempts. Sample mode
runs the same dependency and validation path with transparent portion and
package-saving rules, with no model calls or processing delays. Catalog/schema
errors stop the run honestly instead of inventing calculations. If a revision
request fails, the completed initial attempt remains available as an error record;
it cannot be applied. Request cancellation also propagates to the server's
upstream call where the runtime supports disconnect signals.

In review, **Keep another ingredient** (or an ingredient's existing Keep checkbox)
updates only kept constraints, leaves confirmed quantities untouched, increments
the plan revision and invalidates the old proposal. **Revise with this constraint**
starts a new bounded run with a new request ID. Only the latest validated result
matching both identities can be applied. Earlier attempts are expandable; their
figures are labeled as historical, and role selection highlights the current
candidate without switching away from the selected table/list view.

The $120 example does not guarantee a conflict: a real model may propose a
feasible first pass and should stop there. The sample portion rules actually
produce $146, send $26 of overage feedback, and revise to $120 while preserving
900 g beef. Named fixtures in `src/test/fixtures/plans.ts` cover a genuinely tighter
$100 budget (sample $146 → $100) and an unresolved $50 budget (sample $146 → $84).
In the $50 case the kept beef and selected broth alone already cost $56. The
sample search's $84 result is not claimed to be a global optimum.

The review uses a sticky 328–344 px side panel from a 1024 px viewport, including
1440×900 and 1280×800. Only the tabletop art composition scales; type size and the
page are not zoomed down. Below 1024 px, review is a non-modal fixed bottom sheet
with internal scrolling and persistent decision controls. Opening it brings the
food workspace into view, leaving the pot/canvas visible above it. It is never
appended beneath the entire tabletop. Desktop screenshots and layout measurements
were taken at visual viewport scale 1.

### Earlier real-model integration verification — November 11, 2026

The implementation was committed as `de28b47` and pushed to the connected `main`
branch. Lovable's editor showed the GitHub sync and ran the updated full-stack
preview at `https://preview--hotpot-table-together.lovable.app/`. Preview access
may require project authorization; do not share token-bearing preview links.

Observed in the actual browser and Lovable AI activity records:

- The initial Gemini 3.8 Flash request was cancelled at the app's 30-second
  deadline. The gateway recorded 42.1 seconds and a generated response. No plan
  was applied and no sample output was substituted.
- A request with **8 guests / 1 vegetarian** succeeded; Menu retained the original
  quantities. Shopping calculated 14 whole packs and Budget $99.
- A request with **8 guests / 8 vegetarians** succeeded. The activity record
  explicitly identified `chat_completions`, `google/gemini-3.8-flash`, **Success**,
  and **13.2 seconds**. The returned quantities kept the existing plant portions
  and broth and set beef to 0. Shopping derived 11 whole packs and Budget $51.
- Before Apply, the confirmed plan still contained 900 g of beef (3 packs, $48)
  and its total remained $99; the proposal showed removal and a $48 decrease.
- **Apply plan** removed beef from the confirmed shopping list, left 11 packs,
  and showed $69 remaining from the $120 limit. The other package subtotals were
  $8 + $10 + $8 + $5 + $8 + $4 + $8 = $51.
- **Undo** restored 900 g beef, 3 beef packs, $48 beef cost and the original
  complete pre-acceptance plan. The sample catalog remains the pricing source.

The two successful activity records both used Gemini 3.8 Flash. An attempted
Secrets change to Flash Lite did not establish a model switch in the running
instance; the saved configuration was therefore set back to the verified
`google/gemini-3.8-flash`. The 30-second deadline remains a real limitation:
future slow requests can time out and must be retried explicitly.

Separately, the production Cloudflare Worker build was run locally with Wrangler.
A real HTTP page request returned SSR HTML with status 200. A serialized POST to
the generated `/_serverFn/…` endpoint returned status 200 and the expected missing
configuration result in that credential-free local runtime. This proves the
production build includes a working backend, not merely static assets.

**Deployment boundary:** the Lovable project showed **Not published**, and no
Publish action was performed. The remote preview backend and its real gateway
calls are verified; a publicly published production origin and production
Apply/Undo flow remain unverified until publication. Local Live AI also remains
unconfigured because no project credential was exported to this machine.

### Verification

#### Manual entry and three-condition live search

Starting from `4ad4a5d`, the actual browser path was verified at
`https://preview--hotpot-table-together.lovable.app/` (authorization query values
are deliberately omitted). Reset does not change the selected planning mode.
For real calls choose **Planning mode → Live AI mode · Menu recommendations**,
then **Reset → Beef rolls → Keep → Hotpot for 6 → Guests 8 → 0 vegetarian →
Increase vegetarians → close the editor → Review changes → Apply plan → Undo**.
Keep the displayed $120 budget unchanged. The input popovers can be closed by
clicking their own trigger again. The accessible names are `Edit Beef rolls`,
`Edit guests` and `Edit vegetarian guests`; the visible guest/preference labels
show their current values. The shortcut **Try an example → Two more friends ·
start review** prepares that same six-person baseline and starts review in the
selected mode. It does not Apply or promise a particular Live result.

**Review changes** starts a new bounded request using current settings.
**Review plan** starts it when settings match the reviewed snapshot.
**View proposal**, shown in narrow layouts, only focuses the existing proposal;
it does not send a new request. The top Menu, Shopping and Budget controls select
portion, whole-pack and cost views/highlights of the same plan. They do not start
three separate conversations or model calls. **Plan overview** returns to the
neutral table. Pending copy describes the complete bounded review without
claiming an unobserved internal stage; the completed record identifies actual
feedback and revision when they occur.

Keep protects the catalog identity and a quantity **minimum equal to the current
confirmed quantity at review time**, not an exact fixed amount. A recommendation
may increase it; it may not reduce, remove or substitute it. A user can still
manually edit the confirmed quantity; that invalidates review and changes the
minimum used by the next request. Applying a larger kept quantity also makes it
the confirmed minimum for subsequent runs.

This follow-up made exactly **three live requests**, all with the original
server prompt, model integration and deterministic calculations:

| Group | Conditions after increasing attendance | Initial result | Revision |
| --- | --- | --- | --- |
| 1 | 8 guests, 1 vegetarian, $120, beef ≥900 g | 14 packs, $99 | None; first pass valid |
| 2 | 12 guests, 1 vegetarian, $100, beef ≥900 g | 14 packs, $98 | None; first pass valid |
| 3 | 16 guests, 2 vegetarians, $120, beef ≥1,200 g | 17 packs, $120 | None; first pass valid |

For group 2 the budget was set to $100 while attendance was six, then left
unchanged when increasing it to twelve. For group 3 beef was manually set to
1,200 g before Keep and increasing attendance; its confirmed purchases cost $115.
All groups were feasible; no initial model error was forced. **No successful
over-budget → revised-within-budget live case was found within the three-group
limit.** There were no second Menu calls and no Budget feedback payloads sent in
these runs. Testing stopped rather than spending further calls. The earlier
unresolved real revision is a separate result and is not success evidence.

Actual model quantities (grams except the broth set):

| Ingredient | Group 1 | Group 2 | Group 3 |
| --- | ---: | ---: | ---: |
| Napa cabbage | 1,000 | 1,500 | 2,500 |
| Enoki mushrooms | 300 | 150 | 0 |
| Silken tofu | 600 | 600 | 900 |
| Beef rolls | 900 | 900 | 1,200 |
| Lotus root | 300 | 300 | 0 |
| Rice noodles | 500 | 500 | 500 |
| Bok choy | 300 | 300 | 600 |
| Two-way broth | 1 | 1 | 1 |

Confirmed quantities remained unchanged before acceptance. Group 1 Apply changed
Napa 800 → 1,000 g at the same $99 purchase total; Undo restored 800 g. Group 3
Apply changed the confirmed total $115 → $120 and kept beef at 1,200 g; Undo
restored $115 and all earlier quantities. The manual Sample path separately
produced $146 → $120 through its labeled deterministic revision, Apply and Undo.

At `http://127.0.0.1:8081/`, a real browser request in Live mode still returned
**Live Menu is not configured**, stayed in Live mode, left confirmed $99 intact
and did not produce a sample proposal. Lovable's configured preview success is
not local Live success. Sample works locally. Public production remains outside
this verification; no Publish action was taken.

Real group 3 proposal screenshots and layout measurements were captured at
1440×900 and 1280×800, device pixel ratio 1 and visual viewport scale 1. Both
showed the canvas, first-pass status, confirmed/proposed cost and Apply/Dismiss
together, with a 344 px panel. A necessary narrow-layout fix adds decision-footer
clearance so Lovable's fixed preview badge cannot intercept Apply.

The bounded workflow and shared review workspace were committed as `d6b48cf`
and synced to Lovable preview. The new live eight-person / one-vegetarian example
with kept beef and the unchanged $120 limit passed on its **first** Menu attempt:
Napa 1,000 g, enoki 300 g, tofu 600 g, beef 900 g, lotus 300 g, noodles 500 g,
bok choy 600 g and one broth set. Shopping calculated 15 whole packs and Budget
calculated **$103**. The UI correctly reported no revision needed. Apply updated
the confirmed shopping list, and Undo restored Napa 800 g, bok choy 300 g and
the original $99 plan. This was a real Gemini 3.8 Flash call, not a mocked test.

A separate real-model request with eight guests, one vegetarian, the same kept
900 g beef and a **$50** limit completed both bounded attempts in the browser.
The initial recommendation cost **$76**. Its calculated **$26** overage and
package/constraint feedback drove a revision costing **$72**: Napa 1,900 g,
beef 900 g, one broth set and zero for the remaining items. Shopping calculated
eight whole packs (2,000 g purchased Napa, 100 g surplus); Budget calculated
$16 + $48 + $8 = $72, still **$22 over**. The UI reported unresolved after two
attempts, disabled Apply, displayed explicit constraint-adjustment choices and
left confirmed quantities and their $99 total untouched. The record carried a
request ID and plan revision 3. No third call or sample substitution occurred.
An earlier live $50 run was also recorded as two successful Gemini 3.8 Flash
gateway calls under one request ID; the second was labeled `attempt 2` and took
29.3 seconds. The final attempt's calculated feedback is labeled as calculated,
without claiming it was sent for a nonexistent third revision. Real conflict
screenshots were captured at both 1440×900 and 1280×800 with scale 1.

The preview is credential-enabled and its backend is verified. Local Live AI
still has no exported project credential, and public production remains
unpublished/unverified; no Publish action was taken during this change.

Local validation passed **52 tests**, TypeScript and the production build. Changed
files have zero ESLint errors (three existing Fast Refresh export warnings).
The previously documented whole-repository formatting debt remains outside this
change. Sample browser checks also covered keeping enoki during review,
invalidating the previous proposal, rerunning with both kept minimums, Apply and
Undo, and the $50 unresolved conflict with Apply disabled. Desktop review was
measured at 1440×900, 1280×800 and 1024×800 at scale 1; bottom sheets were checked
at 875×1000 and 390×844. Desktop screenshots include a revision/conflict result,
the original circular tabletop and visible decision controls.

```sh
bun run test
bunx tsc --noEmit
bun run build
bun run lint
```

Tests cover sample calculations, structured-output and constraint validation,
server gateway success/error/timeout behavior with a mocked upstream, membership
checks on Apply, and delayed-response invalidation after edits/Undo/Reset/mode
changes/cancellation. Mocked gateway tests do not establish real project access.
