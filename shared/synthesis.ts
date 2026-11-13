import { IDEAS, type Idea, type Category } from './ideas'
import { similarity } from './similarity'

// Pattern synthesis that runs on the device. It reads the structure of the
// saved ideas (category, tech, audience, problem, job) and finds themes and
// intersections. An LLM pass can replace `combinedConcept` later.

export type ClusterMode = 'category' | 'problem' | 'technology'

const PROBLEM_THEMES: [string, string[]][] = [
  ['Forgetting things', ['forget', 'forgot', 'lost', 'lose', 'find', 'remember', 'missed', 'expire', 'vanish', 'disappear']],
  ['Time and focus', ['focus', 'time', 'meeting', 'day', 'week', 'tasks', 'calendar', 'busy', 'hours', 'slow']],
  ['Money leaks', ['pay', 'price', 'bill', 'spend', 'charge', 'tax', 'budget', 'money', 'cost', 'gift']],
  ['Body and mind', ['sleep', 'health', 'posture', 'breathe', 'tense', 'physio', 'dose', 'feel', 'mood', 'water', 'food']],
  ['Learning that sticks', ['learn', 'teach', 'lesson', 'revise', 'words', 'reading', 'skills', 'courses', 'better']],
  ['Staying connected', ['friend', 'group', 'family', 'people', 'guests', 'club', 'together', 'someone', 'miss']],
  ['Making things', ['draw', 'write', 'design', 'shoot', 'melody', 'icon', 'palette', 'thumbnail', 'inspiration']],
]

export function problemTheme(i: Idea): string {
  const text = `${i.problem} ${i.job}`.toLowerCase()
  let best = 'Time and focus'
  let bestScore = 0
  for (const [name, kws] of PROBLEM_THEMES) {
    const s = kws.reduce((acc, k) => acc + (text.includes(k) ? 1 : 0), 0)
    if (s > bestScore) { best = name; bestScore = s }
  }
  return best
}

const TECH_GROUPS: [string, string[]][] = [
  ['Seeing (camera + vision)', ['Vision', 'Camera', 'Spatial']],
  ['Language (LLM + speech)', ['LLM', 'Speech']],
  ['Body data (Health + Watch)', ['HealthKit', 'Apple Watch']],
  ['Glanceable (widgets + live)', ['Widgets', 'Live Activities', 'Notifications']],
  ['Place (maps + location)', ['MapKit', 'Location', 'NFC']],
  ['Money rails', ['Payments', 'Open Banking']],
  ['Sync and automation', ['CloudKit', 'Sync', 'Shortcuts', 'Calendar', 'Web', 'On-device AI']],
]
export function techGroup(i: Idea): string {
  for (const [name, techs] of TECH_GROUPS) if (techs.includes(i.tech[0])) return name
  return 'Sync and automation'
}

export function clusterKey(i: Idea, mode: ClusterMode): string {
  if (mode === 'category') return i.category
  if (mode === 'problem') return problemTheme(i)
  return techGroup(i)
}

export interface Synthesis {
  themes: { name: string; share: number; ideas: Idea[] }[]
  threads: { label: string; count: number }[]
  intersection: {
    a: string
    b: string
    bridge: Idea[]
    concept: { title: string; pitch: string; features: string[]; tech: string[]; audience: string }
  } | null
  missed: Idea[]
}

const tally = <T,>(xs: T[]) => {
  const m = new Map<T, number>()
  xs.forEach((x) => m.set(x, (m.get(x) || 0) + 1))
  return [...m.entries()].sort((a, b) => b[1] - a[1])
}

export function synthesize(saved: Idea[], mode: ClusterMode = 'category'): Synthesis | null {
  if (saved.length < 3) return null
  const groups = new Map<string, Idea[]>()
  saved.forEach((i) => {
    const k = clusterKey(i, mode)
    groups.set(k, [...(groups.get(k) || []), i])
  })
  const sorted = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)
  const top = sorted.slice(0, 3)
  const rest = sorted.slice(3).flatMap(([, v]) => v)
  const themes = top.map(([name, ideas]) => ({ name, ideas, share: 0 }))
  if (rest.length) themes.push({ name: 'Everything else', ideas: rest, share: 0 })
  // shares that add to exactly 100
  let acc = 0
  themes.forEach((t, idx) => {
    const s = idx === themes.length - 1 ? 100 - acc : Math.round((t.ideas.length / saved.length) * 100)
    t.share = s
    acc += s
  })

  const threads = [
    ...tally(saved.flatMap((i) => i.tech)).filter(([, n]) => n >= 2).slice(0, 4).map(([t, n]) => ({ label: `use ${t}`, count: n })),
    ...tally(saved.map((i) => i.effort)).filter(([, n]) => n >= 2).slice(0, 1).map(([t, n]) => ({ label: `are ${t.toLowerCase()}-sized builds`, count: n })),
    ...tally(saved.map((i) => i.model)).filter(([, n]) => n >= 2).slice(0, 1).map(([t, n]) => ({ label: `earn as ${t.toLowerCase()}`, count: n })),
  ]

  // Intersection: the pair of themes whose ideas are most alike across the gap.
  let intersection: Synthesis['intersection'] = null
  if (sorted.length >= 2) {
    let best = { score: -1, a: '', b: '', pair: [] as Idea[] }
    for (let x = 0; x < Math.min(sorted.length, 3); x++)
      for (let y = x + 1; y < Math.min(sorted.length, 3); y++) {
        const [na, ia] = sorted[x]
        const [nb, ib] = sorted[y]
        for (const p of ia)
          for (const q of ib) {
            // favour pairs drawn from your biggest themes
            const s = similarity(p, q) + (ia.length + ib.length) * 0.06
            if (s > best.score) best = { score: s, a: na, b: nb, pair: [p, q] }
          }
      }
    const [p, q] = best.pair
    const third = saved
      .filter((i) => i !== p && i !== q)
      .sort((m, n) => similarity(n, p) + similarity(n, q) - similarity(m, p) - similarity(m, q))[0]
    const bridge = [p, q, third].filter(Boolean) as Idea[]
    const tech = tally(bridge.flatMap((i) => i.tech)).slice(0, 3).map(([t]) => t)
    const audience = p.audience === q.audience ? p.audience : `${p.audience.toLowerCase()} who are also ${q.audience.toLowerCase()}`
    intersection = {
      a: best.a,
      b: best.b,
      bridge,
      concept: {
        title: `${firstWord(p.title)} ${lastWord(q.title)}`,
        pitch: `One product that does two jobs you saved separately: “${lower(p.job)}” and “${lower(q.job)}”.`,
        features: [p.features[0], q.features[0], third ? third.features[0] : q.features[1]],
        tech,
        audience: cap(audience),
      },
    }
  }

  const savedIds = new Set(saved.map((i) => i.id))
  const missed = IDEAS.filter((i) => !savedIds.has(i.id))
    .map((i) => ({ i, s: saved.reduce((a, x) => a + similarity(i, x), 0) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.i)

  return { themes, threads, intersection, missed }
}

const firstWord = (s: string) => s.split(' ')[0]
const lastWord = (s: string) => s.split(' ').slice(-1)[0]
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

export type { Category }
