// Small server-rendered pages for the MCP connect and consent steps.
// Styled to match the site: paper, ink and the vermilion "a".
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

const shell = (title: string, body: string) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)} · App Idea Store</title><link rel="icon" href="/favicon.png">
<style>
  :root{--paper:#f2ece2;--card:#fbf8f2;--ink:#241c17;--graphite:#6c6259;--vermilion:#fd461a}
  *{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--paper);color:var(--ink);font:16px/1.5 ui-sans-serif,system-ui,-apple-system,sans-serif;padding:24px}
  main{width:min(440px,100%);background:var(--card);border-radius:8px;padding:32px;box-shadow:0 0 0 1px rgba(36,28,23,.12),0 24px 48px -24px rgba(60,35,15,.4);position:relative}
  main::before{content:"";position:absolute;left:32px;top:0;width:56px;height:6px;border-radius:0 0 3px 3px;background:var(--vermilion)}
  img{width:56px;height:56px;border-radius:14px}
  h1{font-size:28px;line-height:1.1;letter-spacing:-.02em;margin:18px 0 8px}
  p{color:var(--graphite);margin:0 0 16px}
  ul{margin:0 0 22px;padding-left:1.1em;color:var(--ink)}
  .row{display:flex;gap:10px;flex-wrap:wrap}
  button{font:inherit;font-weight:600;height:48px;padding:0 22px;border-radius:999px;border:1px solid rgba(36,28,23,.3);background:var(--card);cursor:pointer;display:inline-flex;align-items:center;gap:10px}
  button.primary{background:var(--ink);color:var(--card);border-color:transparent}
  button:focus-visible{outline:2px solid var(--vermilion);outline-offset:3px}
  .err{color:#b3261e;min-height:1.5em}
</style></head><body><main><img src="/icon-192.png" alt="">${body}</main></body></html>`

const G = `<svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>`

export function connectPage(next: string) {
  return shell('Sign in', `
  <h1>Sign in to connect</h1>
  <p>An app wants to use your App Idea Store account. Sign in first, then you’ll choose whether to allow it.</p>
  <div class="row"><button class="primary" id="g">${G}Continue with Google</button></div>
  <p class="err" id="e" role="alert"></p>
  <script>
    document.getElementById('g').onclick = async () => {
      const e = document.getElementById('e'); e.textContent = ''
      try {
        const r = await fetch('/api/auth/sign-in/social', { method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ provider: 'google', callbackURL: ${JSON.stringify(next)} }) })
        const d = await r.json()
        if (!r.ok || !d.url) throw new Error(d.message || 'Sign-in could not start')
        location.href = d.url
      } catch (err) { e.textContent = err.message + '. Try again.' }
    }
  </script>`)
}

export function consentPage(opts: { clientName: string; redirectHost: string; email: string; handle: string }) {
  return shell('Allow access', `
  <h1>Allow ${esc(opts.clientName)} to use App Idea Store?</h1>
  <p>Signed in as ${esc(opts.email)}. ${esc(opts.clientName)} will be able to:</p>
  <ul>
    <li>Search ideas and read full idea briefs</li>
    <li>See, add and remove your saved ideas</li>
    <li>Run synthesis on your saved ideas</li>
    <li>Read TestFlight signals</li>
  </ul>
  <p>After you allow it, you’ll be sent back to ${esc(opts.redirectHost)}.</p>
  <form method="post" action="/authorize" class="row">
    <input type="hidden" name="handle" value="${esc(opts.handle)}">
    <button class="primary" name="decision" value="allow">Allow</button>
    <button name="decision" value="deny">Don’t allow</button>
  </form>`)
}

export function messagePage(title: string, message: string) {
  return shell(title, `<h1>${esc(title)}</h1><p>${esc(message)}</p>`)
}
