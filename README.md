# App Idea Store

A universe of app ideas: explore them in 3D, collect the ones that pull at you, see what connects them, and take them into Claude or Cursor through MCP.

## What's here

| Folder | What it is |
|---|---|
| `web/` | React + Vite site. Three.js / React Three Fiber universe, GSAP + Lenis scroll, Motion for UI, a paper-and-watercolour shader background. |
| `worker/` | Cloudflare Worker (Hono). Google sign-in with Better Auth, accounts and saved ideas in D1 (Drizzle), TestFlight signals from KV, and a remote MCP server with OAuth. Serves `web/dist` as static assets. |
| `shared/` | The idea library and the logic both sides use: search, similarity, synthesis. |

## Stack

- **Cloudflare Workers** for everything server-side, deployed as `appidea-app` next to the live catalog Worker (`appidea-store`). Both share the `appidea-store` D1 database and the `DATA` KV namespace, so the new app reads the catalog's App Store and TestFlight snapshots.
- **Better Auth** for Google sign-in and sessions (cookie, 30 days), stored in D1 through the Drizzle adapter.
- **D1 + Drizzle ORM**: `user`, `session`, `account`, `verification` (Better Auth), `saved_idea`, `entitlement` (plan per user, ready for a payment webhook). Migration: `worker/migrations/0003_accounts.sql`.
- **MCP**: `@cloudflare/workers-oauth-provider` makes the Worker an OAuth 2.1 server (discovery, dynamic client registration, PKCE). `/mcp` is a stateless Streamable HTTP endpoint (`agents` `createMcpHandler` + `@modelcontextprotocol/server`). People connect from Claude, Cursor or any MCP client, sign in with Google, approve the client, and every tool runs as them.

### MCP tools

`search_ideas`, `get_idea`, `list_saved_ideas`, `save_idea`, `remove_saved_idea`, `synthesize_saved_ideas`, `testflight_signals`, plus an `ideas://categories` resource. Saves made through MCP show up on the site and the other way round.

## One-time setup

Google sign-in is already configured in the Google Cloud project **App Idea Store** (`app-idea-store`), with a Web client named **App Idea Store web**. Its redirect URIs:

- `https://appidea-app.justinpohtm.workers.dev/api/auth/callback/google`
- `https://appidea.store/api/auth/callback/google`
- `http://localhost:5173/api/auth/callback/google`

### Deploys

Cloudflare Workers Builds deploys `main` automatically (Worker `appidea-app`):

- Root directory: `worker`
- Build command: `npm ci --prefix ../web && npm run build --prefix ../web && npm ci`
- Deploy command: `npx wrangler d1 migrations apply appidea-store --remote && npx wrangler deploy`

Secrets live on the Worker (Settings > Variables and Secrets): `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `BETTER_AUTH_SECRET` (any long random string). MCP OAuth grants are stored in the KV namespace `appidea-app-oauth`.

To deploy by hand instead: `npm run install:all && npm run deploy`.

The Google consent screen starts in **Testing**: only test users you add under Google Auth Platform > Audience can sign in. Publish the app there when you're ready for everyone (basic profile and email scopes don't need Google verification).

`/blog/*`, `/robots.txt` and `/sitemap.xml` are served from the catalog Worker (`CATALOG_ORIGIN`), which also keeps running the App Store and TestFlight crons that fill the shared KV.

### Moving appidea.store onto this app

Set `BETTER_AUTH_URL` to `https://appidea.store` and add the `appidea.store/*` and `www.appidea.store/*` routes in `worker/wrangler.jsonc`, after removing those two routes from the catalog Worker (and from the catalog's own `wrangler.jsonc`, so a later catalog deploy doesn't take them back). The MCP server's URL becomes `https://appidea.store/mcp`.

## Local development

```bash
cp worker/.dev.vars.example worker/.dev.vars   # fill in the Google client ID and secret
npm run install:all
npm run db:migrate:local --prefix worker
npm run dev:worker                              # Worker on :8787
npm run dev:web                                 # site on :5173, proxies /api, /mcp, /authorize, /connect
```

Test the MCP server with `npx @modelcontextprotocol/inspector` pointed at `http://localhost:5173/mcp`.

## Payments (not wired yet)

`entitlement` holds each user's plan. The plan is to sell Pro and Idea Kits through a merchant of record (Lemon Squeezy, Paddle or Polar), whose webhook writes to this table. `/api/me` already returns `plan`.
