// Openings: App Store niches worth a closer look, each backed by receipts
// collected from Apple's public search and review feeds by scripts/receipts.mjs.
// Nothing here is estimated: if a niche has no receipts yet, the page says so.
import niches from './niches.json'
import data from './openings.data.json'
import { BY_ID, type Category, type Idea } from './ideas'

export interface Incumbent {
  id: number
  name: string
  seller: string
  rating: number | null
  ratings: number
  price: string
  updated: string
  released: string
  url: string
}
export interface Theme {
  theme: string
  count: number
}
export interface Receipts {
  collectedAt: string
  store: string
  incumbents: Incumbent[]
  reviewsRead: number
  lowStar: number
  themes: Theme[]
}
export interface Opening {
  slug: string
  title: string
  term: string
  category: Category
  job: string
  read: string
  ideas: Idea[]
  receipts: Receipts | null
}

const collected = (data as { openings: Record<string, Receipts> }).openings
export const RECEIPTS_AT = (data as { generatedAt: string | null }).generatedAt

export const OPENINGS: Opening[] = (niches as Array<Omit<Opening, 'ideas' | 'receipts' | 'category'> & { category: string; ideas: string[] }>).map((n) => ({
  ...n,
  category: n.category as Category,
  ideas: n.ideas.map((id) => BY_ID.get(id)).filter((i): i is Idea => !!i),
  receipts: collected[n.slug] || null,
}))
export const OPENING_BY_SLUG = new Map(OPENINGS.map((o) => [o.slug, o]))
export const openingsForIdea = (id: string) => OPENINGS.filter((o) => o.ideas.some((i) => i.id === id))
