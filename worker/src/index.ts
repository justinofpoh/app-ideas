import OAuthProvider from '@cloudflare/workers-oauth-provider'
import { app } from './app'
import { mcpApiHandler } from './mcp'
import type { Env } from './env'

// The OAuth provider wraps the whole Worker: /mcp needs a token issued after
// the person signs in with Google and approves the client; every other path
// goes to the Hono app (site, API, Better Auth, consent pages).
// It is built from BETTER_AUTH_URL because the resource metadata must name the
// exact public MCP URL (workers.dev now, appidea.store after cut-over).
let cached: { origin: string; provider: OAuthProvider<Env> } | null = null

function provider(env: Env) {
  const origin = new URL(env.BETTER_AUTH_URL).origin
  if (cached?.origin === origin) return cached.provider
  const p = new OAuthProvider<Env>({
    apiRoute: '/mcp',
    apiHandler: mcpApiHandler,
    defaultHandler: app,
    authorizeEndpoint: '/authorize',
    tokenEndpoint: '/token',
    clientRegistrationEndpoint: '/register',
    scopesSupported: ['ideas'],
    resourceMetadata: {
      resource: `${origin}/mcp`,
      authorization_servers: [origin],
      scopes_supported: ['ideas'],
      resource_name: 'App Idea Store',
    },
  })
  cached = { origin, provider: p }
  return p
}

export default {
  fetch(request, env, ctx) {
    return provider(env).fetch(request, env, ctx)
  },
} satisfies ExportedHandler<Env>
