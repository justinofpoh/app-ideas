#!/usr/bin/env node
// Collects the receipts for each opening from Apple's public feeds:
//   - iTunes Search API: the apps that rank for the niche's search term
//   - customer reviews RSS: the most recent reviews of the top three
// Low-star reviews (1-2 stars) are counted by complaint theme with plain keyword
// matching (English only), so every number can be re-checked by hand. Review
// text is read for counting and never stored. Writes shared/openings.data.json.
//
//   node scripts/receipts.mjs            all niches
//   node scripts/receipts.mjs focus-timers
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = new URL('..', import.meta.url)
const STORE = 'us'
const THEMES = [
  ['Price and paywalls', /\b(price|pricey|expensive|cost|paywall|pay ?wall|too much|overpriced|premium|pay for|money grab|free version)\b/i],
  ['Subscriptions and billing', /\b(subscription|subscribe|charged|charge|billing|refund|cancel|trial|renew)/i],
  ['Bugs and crashes', /\b(crash|crashes|crashing|bug|buggy|glitch|freez|broken|doesn.?t work|not working|won.?t open|stopped working)/i],
  ['Sync and lost data', /\b(sync|syncing|lost (all|my)|data loss|deleted|disappeared|backup|restore|icloud)/i],
  ['Ads', /\b(ads?|advert|advertis\w+|pop.?ups?)\b/i],
  ['Notifications and reminders', /\b(notification|reminder|alert|alarm)s?\b/i],
  ['Hard to use', /\b(confusing|complicated|hard to (use|figure)|clunky|not intuitive|unintuitive|too many steps)/i],
  ['Missing Apple Watch or widgets', /\b(apple watch|watch app|widget|complication)s?\b/i],
  ['Accounts and sign-in', /\b(account|log ?in|sign ?in|sign ?up|password|email required)\b/i],
  ['Privacy', /\b(privacy|tracking|data collection|sell(s|ing)? (my )?data)\b/i],
]

const get = async (url) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'appidea.store receipts' } })
      if (res.ok) return await res.json()
      if (res.status === 404) return null
    } catch { /* retry */ }
    await new Promise((r) => setTimeout(r, 800 * (attempt + 1)))
  }
  return null
}
const label = (v) => (v && typeof v === 'object' ? v.label : v)

async function reviews(appId) {
  const out = []
  for (const page of [1, 2]) {
    const d = await get(`https://itunes.apple.com/${STORE}/rss/customerreviews/page=${page}/id=${appId}/sortby=mostrecent/json`)
    const entries = d?.feed?.entry
    const list = Array.isArray(entries) ? entries : entries ? [entries] : []
    for (const e of list) {
      const rating = Number(label(e['im:rating']))
      if (!rating) continue // the app's own entry in older feed shapes
      out.push({ rating, text: `${label(e.title) || ''}. ${label(e.content) || ''}` })
    }
    if (list.length < 40) break
  }
  return out
}

async function collect(niche) {
  const s = await get(`https://itunes.apple.com/search?term=${encodeURIComponent(niche.term)}&entity=software&country=${STORE}&limit=12`)
  const apps = (s?.results || []).filter((a) => a.trackId && a.userRatingCount > 0).sort((a, b) => b.userRatingCount - a.userRatingCount).slice(0, 5)
  if (!apps.length) return null
  const incumbents = apps.map((a) => ({
    id: a.trackId,
    name: a.trackName,
    seller: a.sellerName || '',
    rating: typeof a.averageUserRating === 'number' ? Math.round(a.averageUserRating * 10) / 10 : null,
    ratings: a.userRatingCount || 0,
    price: a.formattedPrice || (a.price === 0 ? 'Free' : ''),
    updated: a.currentVersionReleaseDate || '',
    released: a.releaseDate || '',
    url: (a.trackViewUrl || '').split('?')[0],
  }))
  let read = 0
  const low = []
  for (const app of incumbents.slice(0, 3)) {
    const rs = await reviews(app.id)
    read += rs.length
    for (const r of rs) if (r.rating <= 2) low.push(r)
  }
  const themes = THEMES.map(([theme, re]) => {
    return { theme, count: low.filter((r) => re.test(r.text)).length }
  }).filter((t) => t.count > 0).sort((a, b) => b.count - a.count)
  return { collectedAt: new Date().toISOString(), store: STORE, incumbents, reviewsRead: read, lowStar: low.length, themes }
}

const niches = JSON.parse(await readFile(new URL('shared/niches.json', root), 'utf8'))
const file = new URL('shared/openings.data.json', root)
const current = JSON.parse(await readFile(file, 'utf8').catch(() => '{"openings":{}}'))
const only = process.argv.slice(2)
let ok = 0
for (const n of niches) {
  if (only.length && !only.includes(n.slug)) continue
  process.stdout.write(`${n.slug}: `)
  const r = await collect(n)
  if (r) { current.openings[n.slug] = r; ok++; console.log(`${r.incumbents.length} apps, ${r.reviewsRead} reviews, ${r.lowStar} low-star`) }
  else console.log('no data (kept what was there)')
}
if (ok) { current.generatedAt = new Date().toISOString(); await writeFile(file, `${JSON.stringify(current, null, 1)}\n`) }
console.log(ok ? `Wrote ${fileURLToPath(file)}` : 'Nothing collected. Check the network connection.')
