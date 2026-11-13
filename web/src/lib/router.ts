import { useSyncExternalStore } from 'react'

// Routes live in plain #names (#library, #constellation, #idea-voice-journal)
// so links survive hosts that only pass simple fragments.
export type Route =
  | { name: 'universe' }
  | { name: 'library' }
  | { name: 'idea'; id: string }
  | { name: 'constellation' }

function parse(): Route {
  const h = location.hash.replace(/^#\/?/, '')
  if (h === 'library') return { name: 'library' }
  if (h === 'constellation') return { name: 'constellation' }
  if (h.startsWith('idea-')) return { name: 'idea', id: h.slice(5) }
  return { name: 'universe' }
}
let current = parse()
const ls = new Set<() => void>()
window.addEventListener('hashchange', () => {
  current = parse()
  ls.forEach((l) => l())
})

// a search typed on the universe is handed to the library here, not in the URL
let pendingQuery = ''
export const takePendingQuery = () => { const q = pendingQuery; pendingQuery = ''; return q }

export const href = {
  universe: '#universe',
  library: '#library',
  constellation: '#constellation',
  idea: (id: string) => `#idea-${id}`,
}
export function go(to: string, query = '') {
  pendingQuery = query
  location.hash = to
}
export const useRoute = () => useSyncExternalStore((l) => { ls.add(l); return () => ls.delete(l) }, () => current)
