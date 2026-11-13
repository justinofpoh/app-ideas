import { IDEAS, type Idea } from './ideas'
import { similarity } from './similarity'

export type Filter = 'For You' | 'iOS' | 'AI' | 'Productivity' | 'Health' | 'Finance' | 'Micro-SaaS' | 'Lifestyle' | 'Education' | 'Utilities' | 'Creativity' | 'Social' | 'Weekend builds'
export type Sort = 'Relevance' | 'Smallest build' | 'A–Z'

export const FILTERS: Filter[] = ['For You', 'iOS', 'AI', 'Productivity', 'Health', 'Finance', 'Micro-SaaS', 'Lifestyle', 'Education', 'Utilities', 'Creativity', 'Social', 'Weekend builds']

const haystack = new Map(
  IDEAS.map((i) => [
    i.id,
    [i.title, i.pitch, i.category, i.audience, i.problem, i.job, ...i.features, ...i.tech, ...i.platforms, i.model]
      .join(' ')
      .toLowerCase(),
  ]),
)

const EFFORT_RANK = { Weekend: 0, Month: 1, Quarter: 2 } as const

export function query(q: string, filter: Filter, sort: Sort, saved: string[]): Idea[] {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean)
  let list = IDEAS.filter((i) => {
    const h = haystack.get(i.id)!
    return terms.every((t) => h.includes(t))
  })
  switch (filter) {
    case 'iOS': list = list.filter((i) => i.platforms.includes('iOS')); break
    case 'AI': list = list.filter((i) => i.ai); break
    case 'Micro-SaaS': list = list.filter((i) => i.microSaas); break
    case 'Weekend builds': list = list.filter((i) => i.effort === 'Weekend'); break
    case 'For You': break
    default: list = list.filter((i) => i.category === filter)
  }
  const savedIdeas = IDEAS.filter((i) => saved.includes(i.id))
  const score = (i: Idea) => {
    let s = 0
    for (const t of terms) if (i.title.toLowerCase().includes(t)) s += 3
    if (filter === 'For You' && savedIdeas.length) {
      s += savedIdeas.reduce((acc, x) => acc + (x.id === i.id ? 0 : similarity(i, x)), 0) / savedIdeas.length * 10
    }
    return s
  }
  if (sort === 'A–Z') return [...list].sort((a, b) => a.title.localeCompare(b.title))
  if (sort === 'Smallest build') return [...list].sort((a, b) => EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort])
  if (filter === 'For You' && savedIdeas.length) {
    // ideas you saved drop to the back; the feed is for discovery
    return [...list].sort((a, b) => Number(saved.includes(a.id)) - Number(saved.includes(b.id)) || score(b) - score(a))
  }
  return terms.length ? [...list].sort((a, b) => score(b) - score(a)) : list
}
