# Hotpot Together

**A playful tabletop for human–agent collaboration.**

Arrange a hotpot dinner by adding friends and moving food. Coordinated assistants suggest changes to the menu, calculate purchases, and check the budget—all around the same shared meal.

## Demo

**Add the public demo or video URL here before submitting.**

[Source repository](https://github.com/baidiwang/HotpotTogether)

## The problem

Hosting a small dinner means balancing guest preferences, enough food, package sizes, and spending. These decisions affect one another. A new vegetarian guest can change the menu, which changes the shopping list and total cost.

A host should be able to shape the dinner without managing separate conversations or calculating grams.

## The experience

Hotpot Together turns the plan into an illustrated tabletop. Guests sit around the pot; food is represented as plates.

- Add a vegetarian friend to the gathering.
- Drag a plate onto the table, or tap to add it.
- Adjust portions directly on a dish.
- Pin a favorite to protect its minimum quantity from suggested reductions.
- Accept or reject suggestions beside the affected food.
- Open the shopping list to see purchases and costs.
- Undo changes when you want to try another arrangement.

Current selections stay distinct from pending suggestions. Adding a friend requests recommendations; those recommendations do not silently replace the host’s chosen dishes.

## How the roles coordinate

| Role | Contribution |
| --- | --- |
| Menu | Suggests dishes and portions based on guests, preferences, and protected food. |
| Shopping | Converts portions into whole-package purchases. |
| Budget | Checks purchase costs against the limit and returns constraints for a bounded Menu revision. |

The roles work from one shared state. Their feedback explains the food changes, purchase impact, and budget result near the tabletop. The user guides the result through the meal itself.

## One complete journey

Start with six friends and a $120 budget. Invite Casey, who is vegetarian. Review the suggested plates on the table, reject a reduction in beef, and pin the existing three beef plates. Accept the remaining changes, inspect the shopping list, and undo to compare arrangements.

In the tested Sample flow, selected purchases move from $99 to $103 after accepting tofu, then to $116 after accepting the remaining changes. Undo returns the selections to $103 and $99. Protected beef stays at three plates: 900 g, three purchase packs, $48.

These are illustrative results for this scenario, not promised outcomes for every edit or mode.

## Design rationale

**Target user:** someone hosting a small group dinner.

**Shared outcome:** people and assistants work on one visible meal instead of separate task screens.

**Direct manipulation:** friends, plates, and pins express guest changes, food choices, and constraints.

**Legible consequences:** suggestions appear beside dishes, while purchasing and budget feedback explain downstream effects.

**User control:** reversible edits, explicit suggestion acceptance, protected quantities, and Undo keep the host in control.

The visual direction uses soft food and character illustrations to make the workspace feel like a gathering.

## Prototype scope

This submission demonstrates the interaction in explicitly labeled **Sample mode**. Menu recommendations are simulated; Shopping and Budget use deterministic calculations. This is a simulated multi-role collaboration experience, not three independently autonomous model agents.

The code also retains a server-side Menu model integration. Live operation requires server configuration and is not the demonstrated mode of this submission. Missing Live configuration produces an explicit error rather than silently returning Sample results.

Prices and package sizes are illustrative. This is a planning prototype: no orders, payments, or messages are sent.

## Development

The playable version is on the `experiment/playable-table` branch. Use Node.js 22.12 or later and Bun.

```bash
bun install
bun run dev --host 127.0.0.1 --port 8081
```

Open the local URL printed by the development server. A localhost URL is for development and cannot serve as a public submission demo.

For optional Live setup, see the [server configuration appendix](#appendix-server-configuration) and `.env.example`. Credentials must stay server-side and must not be committed.

## Credits

Designed and built independently by **Baidi Wang** for the FIG AI Design Makeathon 2026, Track 1.

Initial prototyping in Lovable; interaction development and refinement with Codex. Visual references informed the illustration direction. The repository contains generated illustration assets and their generation notes.

---

## Appendix: Server configuration

The following runtime and configuration notes are retained from the existing
repository documentation. Project settings, model catalog observations and
publication status dated November 11, 2026 are historical verification records,
not a new deployment check. Pushing `experiment/playable-table` does not merge it
into Lovable's connected `main` branch, update a verified preview, or publish a
public demo. The submission above demonstrates Sample mode.

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
4. In preview, choose **Live AI mode** and run the current suggestion/acceptance/Undo
   workflow. Check **More → AI** for the actual model request and usage. Only after
   preview verification, publish the current version with **Publish**, then repeat
   the same checks against the live URL. A Git push is not a public publication.

`google/gemini-3.8-flash` and `google/gemini-3.1-flash-lite` are present in the
workspace model catalog inspected on November 11, 2026. Lovable's official
`@lovable.dev/ai-gateway@0.1.11` contracts expose both on the Chat Completions
surface with JSON-schema response formatting. Gemini 3.8 Flash was subsequently verified through real gateway calls and
the earlier preview workflow. Flash Lite remains contract-compatible but
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
or explicitly switch to Sample mode. Client edits, Undo, Reset, mode changes abort the pending client request and ignore late results; upstream work may
already have started and still incur usage. Sample-mode plans/history are stored
locally; live-mode edits and all proposals are session-only. Switching back to
Sample mode resumes browser saving of the current plan.

This is a competition prototype without login or a shared database. The server
function is CSRF protected but not authenticated or backed by a distributed quota;
configure hosting access/usage limits for a credential-enabled public demo.
