import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import { schema } from './db/schema'
import type { Env } from './env'

// Env bindings only exist per request on Workers, so auth is built per request.
export function createAuth(env: Env) {
  const db = drizzle(env.DB, { schema })
  return betterAuth({
    baseURL: env.BETTER_AUTH_URL,
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: { user: schema.user, session: schema.session, account: schema.account, verification: schema.verification },
    }),
    socialProviders: {
      google: {
        clientId: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        prompt: 'select_account',
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30,
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    trustedOrigins: [env.BETTER_AUTH_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  })
}

export async function getUser(env: Env, headers: Headers) {
  const res = await createAuth(env).api.getSession({ headers })
  return res?.user ?? null
}
