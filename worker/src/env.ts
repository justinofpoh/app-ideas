import type { OAuthHelpers } from '@cloudflare/workers-oauth-provider'

export interface Env {
  DB: D1Database
  DATA: KVNamespace // App Store snapshots written by the catalog Worker's cron (read-only here)
  OAUTH_KV: KVNamespace // MCP OAuth grants and tokens
  ASSETS: Fetcher
  BETTER_AUTH_URL: string
  CATALOG_ORIGIN: string
  // Stripe payment links; empty until they exist, and the site collects emails instead
  PAYMENT_LINK_BRIEF?: string
  PAYMENT_LINK_PASS?: string
  BETTER_AUTH_SECRET: string
  GOOGLE_CLIENT_ID: string
  GOOGLE_CLIENT_SECRET: string
  OAUTH_PROVIDER: OAuthHelpers // injected by OAuthProvider
}

// What an MCP access token carries about the person who approved it.
export type McpProps = { userId: string; email: string; name: string }
