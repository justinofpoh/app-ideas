import { useSyncExternalStore } from 'react'

// Saved ideas and the signed-in account.
// Signed out: saves live in this browser. Signed in (Google, via the Worker's
// Better Auth): saves sync to the account, and anything saved on this device
// before signing in is merged in on the next load.

export type User = { id: string; name: string; email: string; image: string | null }
type State = {
  saved: string[]
  user: User | null
  plan: 'free' | 'pro'
  // 'absent' when the page runs without the Worker, e.g. a static preview
  backend: 'checking' | 'available' | 'absent'
}

const KEY = 'appidea.saved.v1'
function readLocal(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
function writeLocal(ids: string[]) {
  try { localStorage.setItem(KEY, JSON.stringify(ids)) } catch { /* storage unavailable */ }
}

let state: State = { saved: readLocal(), user: null, plan: 'free', backend: 'checking' }
const listeners = new Set<() => void>()
function set(next: Partial<State>) {
  state = { ...state, ...next }
  if (next.saved) writeLocal(next.saved)
  listeners.forEach((l) => l())
}
const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l) }

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { credentials: 'include', ...init, headers: { 'content-type': 'application/json', ...init?.headers } })
  const type = res.headers.get('content-type') || ''
  if (!type.includes('application/json')) throw new Error('no-backend')
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error || body?.message || `Request failed (${res.status})`)
  return body as T
}

async function boot() {
  try {
    const me = await api<{ user: User | null; plan: 'free' | 'pro' }>('/api/me')
    set({ backend: 'available', user: me.user, plan: me.plan })
    if (me.user) {
      const { ids } = await api<{ ids: string[] }>('/api/saved', { method: 'PUT', body: JSON.stringify({ ids: state.saved }) })
      set({ saved: ids })
    }
  } catch {
    set({ backend: 'absent' })
  }
}
if (typeof window !== 'undefined') boot()

export const savedStore = {
  subscribe,
  get: () => state.saved,
  toggle(id: string) {
    const was = state.saved.includes(id)
    set({ saved: was ? state.saved.filter((x) => x !== id) : [...state.saved, id] })
    if (state.user) {
      api(`/api/saved/${encodeURIComponent(id)}`, { method: was ? 'DELETE' : 'POST' }).catch(() => {
        // put it back the way it was if the server refused
        set({ saved: was ? [...state.saved, id] : state.saved.filter((x) => x !== id) })
      })
    }
  },
  set(ids: string[]) {
    const added = ids.filter((id) => !state.saved.includes(id))
    set({ saved: ids })
    if (state.user && added.length) api('/api/saved', { method: 'PUT', body: JSON.stringify({ ids: added }) }).catch(() => {})
  },
}

export const account = {
  async signIn() {
    const { url } = await api<{ url: string }>('/api/auth/sign-in/social', {
      method: 'POST',
      body: JSON.stringify({ provider: 'google', callbackURL: location.href }),
    })
    location.href = url
  },
  async signOut() {
    await api('/api/auth/sign-out', { method: 'POST', body: '{}' }).catch(() => {})
    set({ user: null, plan: 'free' })
  },
}

export const useSaved = () => useSyncExternalStore(subscribe, () => state.saved)
export const useAccount = () => useSyncExternalStore(subscribe, () => state)
