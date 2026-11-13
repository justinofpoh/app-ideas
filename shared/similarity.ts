import { IDEAS, type Idea } from './ideas'

const tokens = (i: Idea) =>
  new Set([
    `c:${i.category}`,
    ...i.tech.map((t) => `t:${t}`),
    ...i.platforms.map((p) => `p:${p}`),
    `m:${i.model}`,
    ...words(i.audience).map((w) => `a:${w}`),
    ...words(i.problem + ' ' + i.job).map((w) => `w:${w}`),
  ])

const STOP = new Set('the a an and or of to for in on my me i is it that with you your what at by from be are not this how get make let help without before'.split(' '))
function words(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w))
}

const TOKENS = new Map(IDEAS.map((i) => [i.id, tokens(i)]))

export function similarity(a: Idea, b: Idea): number {
  const ta = TOKENS.get(a.id)!
  const tb = TOKENS.get(b.id)!
  let shared = 0
  let weight = 0
  for (const t of ta) {
    if (tb.has(t)) {
      const w = t.startsWith('c:') ? 3 : t.startsWith('t:') ? 2 : t.startsWith('w:') || t.startsWith('a:') ? 1.5 : 0.5
      shared += w
    }
  }
  weight = Math.sqrt(ta.size * tb.size)
  return shared / weight
}

export function related(idea: Idea, n = 4): Idea[] {
  return IDEAS.filter((i) => i.id !== idea.id)
    .map((i) => ({ i, s: similarity(idea, i) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, n)
    .map((x) => x.i)
}

export function sharedTraits(a: Idea, b: Idea): string[] {
  const out: string[] = []
  if (a.category === b.category) out.push(a.category)
  a.tech.forEach((t) => b.tech.includes(t) && out.push(t))
  if (a.model === b.model) out.push(a.model)
  return out
}
