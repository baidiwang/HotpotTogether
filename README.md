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
- **Budget**: deterministic sum of Shopping's package costs. If needed, two
  rule-based tradeoffs are recalculated through the same pipeline and shown only
  when they respect constraints and fit the budget. These are distinct interface
  roles, not three independent autonomous AI agents. Prices remain sample USD
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
   application runtime configuration values (no credential needs to be pasted):
   - `HOTPOT_AI_ENABLED` = `true`
   - `HOTPOT_AI_MODEL` = `google/gemini-3.8-flash`
3. Sync the current application code to the connected GitHub branch so Lovable
   builds the new server function, then refresh/rebuild the preview. Local
   uncommitted changes are not automatically present in Lovable. Secret changes
   apply immediately in preview, and require publishing for the live app.
4. In preview, choose **Live AI mode** and run the complete review/Apply/Undo
   workflow. Check **More → AI** for the actual model request and usage. Only after
   preview verification, publish the current version with **Publish**, then repeat
   the same checks against the live URL. A Git push is not a public publication.

`google/gemini-3.8-flash` and `google/gemini-3.1-flash-lite` are present in the
workspace model catalog inspected on November 11, 2026. Lovable's official
`@lovable.dev/ai-gateway@0.1.11` contracts expose both on the Chat Completions
surface with JSON-schema response formatting. These are contract-compatible
candidates; a successful real call with this application's schema is still
required to call either one end-to-end verified. The broader model list also
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
output, network failure) are displayed explicitly. There is a 30-second server
request deadline and no automatic retry or sample substitution. Users can retry
or explicitly switch to Sample mode. Client edits, Undo, Reset, mode changes and
Cancel abort the pending client request and ignore late results; upstream work may
already have started and still incur usage. Sample-mode plans/history are stored
locally; live-mode edits and all proposals are session-only. Switching back to
Sample mode resumes browser saving of the current plan.

This is a competition prototype without login or a shared database. The server
function is CSRF protected but not authenticated or backed by a distributed quota;
configure hosting access/usage limits for a credential-enabled public demo.

### Verification

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
