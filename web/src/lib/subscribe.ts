import { useEffect, useState } from 'react'

export type Interest = 'radar' | 'brief' | 'pass' | 'niche'

// Adds an email to the list. Resolves with an error message to show, or null.
export async function subscribe(email: string, interest: Interest, source: string, note?: string): Promise<string | null> {
  try {
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, interest, source, note }),
    })
    if (!(res.headers.get('content-type') || '').includes('application/json')) return 'Sign-up is not available in this preview. Try it on appidea.store.'
    const body = (await res.json()) as { error?: string }
    return res.ok ? null : body.error || 'That did not go through. Try again.'
  } catch {
    return 'That did not go through. Check your connection and try again.'
  }
}

type Config = { briefLink: string | null; passLink: string | null }
let config: Promise<Config> | null = null
const loadConfig = () =>
  (config ??= fetch('/api/config')
    .then((r) => ((r.headers.get('content-type') || '').includes('application/json') ? r.json() : null))
    .then((d) => (d as Config) || { briefLink: null, passLink: null })
    .catch(() => ({ briefLink: null, passLink: null })))

// Where the paid buttons lead. Null until payment links are set on the Worker.
export function useConfig(): Config {
  const [c, setC] = useState<Config>({ briefLink: null, passLink: null })
  useEffect(() => { let on = true; loadConfig().then((v) => on && setC(v)); return () => { on = false } }, [])
  return c
}
