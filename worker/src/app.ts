import { Hono } from 'hono'
import { createAuth, getUser } from './auth'
import { addSaved, getPlan, listSaved, readBetas, removeSaved } from './store'
import { connectPage, consentPage, messagePage } from './pages'
import type { Env, McpProps } from './env'

export const app = new Hono<{ Bindings: Env }>()

/* ---------- auth (Better Auth: Google sign-in, sessions) ---------- */
app.on(['GET', 'POST'], '/api/auth/*', (c) => createAuth(c.env).handler(c.req.raw))

/* ---------- account ---------- */
app.get('/api/me', async (c) => {
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) return c.json({ user: null, plan: 'free' })
  return c.json({ user: { id: user.id, name: user.name, email: user.email, image: user.image }, plan: await getPlan(c.env, user.id) })
})

app.get('/api/saved', async (c) => {
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) return c.json({ error: 'Sign in to sync saved ideas' }, 401)
  return c.json({ ids: await listSaved(c.env, user.id) })
})

// Merge ideas saved on this device before sign-in; returns the full saved list.
app.put('/api/saved', async (c) => {
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) return c.json({ error: 'Sign in to sync saved ideas' }, 401)
  const body = await c.req.json<{ ids?: unknown }>().catch(() => ({ ids: [] as unknown }))
  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string').slice(0, 500) : []
  await addSaved(c.env, user.id, ids)
  return c.json({ ids: await listSaved(c.env, user.id) })
})

app.post('/api/saved/:id', async (c) => {
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) return c.json({ error: 'Sign in to sync saved ideas' }, 401)
  await addSaved(c.env, user.id, [c.req.param('id')])
  return c.json({ ok: true })
})

app.delete('/api/saved/:id', async (c) => {
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) return c.json({ error: 'Sign in to sync saved ideas' }, 401)
  await removeSaved(c.env, user.id, c.req.param('id'))
  return c.json({ ok: true })
})

/* ---------- signals ---------- */
app.get('/api/signals/testflight', async (c) => {
  const { generatedAt, apps } = await readBetas(c.env)
  const open = apps.filter((a) => a.status === 'open')
  return c.json(
    { generatedAt, total: apps.length, open: open.length, sample: open.slice(0, 60).map((a) => ({ name: a.name, platforms: a.platforms })) },
    200,
    { 'cache-control': 'public, max-age=300' },
  )
})

/* ---------- MCP authorization (OAuth 2.1 for Claude, Cursor and other MCP clients) ---------- */
// 1. Not signed in: send the person to sign in with Google, then back here.
// 2. Signed in: show a consent page bound to this browser.
// 3. Allow: issue the grant for this user; the MCP server then runs as them.
app.get('/authorize', async (c) => {
  const authReq = await c.env.OAUTH_PROVIDER.parseAuthRequest(c.req.raw)
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) {
    const url = new URL(c.req.url)
    return c.redirect(`/connect?next=${encodeURIComponent(url.pathname + url.search)}`)
  }
  const about = await c.env.OAUTH_PROVIDER.describeConsent(authReq)
  const { handle, headers } = await c.env.OAUTH_PROVIDER.beginConsent(authReq)
  const html = consentPage({ clientName: about.clientName || 'This app', redirectHost: new URL(about.redirectUri).host, email: user.email, handle })
  headers.set('content-type', 'text/html; charset=utf-8')
  return new Response(html, { headers })
})

app.post('/authorize', async (c) => {
  const form = await c.req.formData()
  const handle = String(form.get('handle') || '')
  if (form.get('decision') !== 'allow') {
    const denied = await c.env.OAUTH_PROVIDER.denyConsent(c.req.raw, handle)
    return new Response(null, { status: 302, headers: denied.headers })
  }
  const user = await getUser(c.env, c.req.raw.headers)
  if (!user) return c.html(messagePage('Signed out', 'Your session ended. Start the connection again from your app.'), 401)
  const approved = await c.env.OAUTH_PROVIDER.approveConsent(c.req.raw, handle)
  const props: McpProps = { userId: user.id, email: user.email, name: user.name }
  const { redirectTo } = await c.env.OAUTH_PROVIDER.completeAuthorization({
    request: approved.request,
    userId: user.id,
    metadata: { label: user.email },
    scope: approved.request.scope,
    props,
  })
  approved.headers.set('location', redirectTo)
  return new Response(null, { status: 302, headers: approved.headers })
})

app.get('/connect', (c) => {
  const next = c.req.query('next') || '/'
  // only ever return to the authorize step on this site
  const safe = next.startsWith('/authorize?') ? next : '/'
  return c.html(connectPage(safe))
})

/* ---------- blog and SEO files still live on the catalog Worker ---------- */
const fromCatalog = (c: { req: { url: string; raw: Request }; env: Env }) => {
  const url = new URL(c.req.url)
  return fetch(new Request(`${c.env.CATALOG_ORIGIN}${url.pathname}${url.search}`, { headers: c.req.raw.headers }))
}
app.get('/blog', (c) => c.redirect('/blog/', 301))
app.get('/blog/*', (c) => fromCatalog(c))
app.get('/robots.txt', (c) => fromCatalog(c))
app.get('/sitemap.xml', (c) => fromCatalog(c))

/* ---------- everything else is the web app ---------- */
app.notFound((c) => (c.req.path.startsWith('/api/') ? c.json({ error: 'Not found' }, 404) : c.env.ASSETS.fetch(c.req.raw)))
app.onError((err, c) => {
  console.error(JSON.stringify({ message: 'unhandled', error: String(err), path: c.req.path }))
  return c.json({ error: 'Something went wrong' }, 500)
})
