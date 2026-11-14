import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, LayoutGroup, motion } from 'motion/react'
import Lenis from 'lenis'
import { CATEGORY_INK, IDEAS, type Category } from '@shared/ideas'
import { FILTERS, nearest, query, type Filter, type Sort } from '@shared/search'
import { useSaved } from '../lib/store'
import { go, href, takePendingQuery, useRoute } from '../lib/router'
import { prefersReducedMotion, spring } from '../lib/motion'
import { IdeaCard, variantAt } from '../components/IdeaCard'
import { IdeaDetail } from './IdeaDetail'
import { BrushTally } from '../components/BrushTally'
import { EmailCapture } from '../components/EmailCapture'
import './library.css'

export function Library({ onInk }: { onInk: (c: string) => void }) {
  const route = useRoute()
  const saved = useSaved()
  const [q, setQ] = useState(takePendingQuery)
  const [filter, setFilter] = useState<Filter>('For You')
  const [sort, setSort] = useState<Sort>('Relevance')
  const grid = useRef<HTMLDivElement>(null)
  const openId = route.name === 'idea' ? route.id : null

  const results = useMemo(() => query(q, filter, sort, saved), [q, filter, sort, saved])

  // background tint follows the category being explored
  useEffect(() => {
    const cat = (Object.keys(CATEGORY_INK) as Category[]).includes(filter as Category) ? (filter as Category) : null
    onInk(cat ? CATEGORY_INK[cat] : '#fd461a')
  }, [filter, onInk])

  // smooth scrolling, paused while the detail sheet is open
  const lenis = useRef<Lenis | null>(null)
  useEffect(() => {
    if (prefersReducedMotion()) return
    const l = new Lenis({ lerp: 0.11, smoothWheel: true })
    lenis.current = l
    let raf = 0
    const loop = (t: number) => { l.raf(t); raf = requestAnimationFrame(loop) }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); l.destroy() }
  }, [])
  useEffect(() => {
    if (openId) { lenis.current?.stop(); document.documentElement.style.overflow = 'hidden' }
    else { lenis.current?.start(); document.documentElement.style.overflow = '' }
  }, [openId])

  // cursor proximity: cards near the pointer brighten their edge, the one
  // under it tilts toward the pointer
  useEffect(() => {
    const el = grid.current
    if (!el || matchMedia('(hover: none)').matches) return
    let raf = 0
    let px = -1e4, py = -1e4
    const update = () => {
      raf = 0
      el.querySelectorAll<HTMLElement>('[data-card]').forEach((card) => {
        const r = card.getBoundingClientRect()
        if (r.bottom < -200 || r.top > innerHeight + 200) return
        const dx = Math.max(r.left - px, 0, px - r.right)
        const dy = Math.max(r.top - py, 0, py - r.bottom)
        const d = Math.hypot(dx, dy)
        const prox = Math.max(0, 1 - d / 240)
        const face = card.firstElementChild as HTMLElement
        face.style.setProperty('--prox', prox.toFixed(3))
        face.style.setProperty('--mx', `${((px - r.left) / r.width) * 100}%`)
        face.style.setProperty('--my', `${((py - r.top) / r.height) * 100}%`)
        const inside = d === 0
        const rx = inside ? (((py - r.top) / r.height) - 0.5) * -7 : 0
        const ry = inside ? (((px - r.left) / r.width) - 0.5) * 9 : 0
        face.style.setProperty('--rx', `${rx.toFixed(2)}deg`)
        face.style.setProperty('--ry', `${ry.toFixed(2)}deg`)
      })
    }
    const onMove = (e: PointerEvent) => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(update) }
    const onLeave = () => { px = py = -1e4; if (!raf) raf = requestAnimationFrame(update) }
    addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    addEventListener('scroll', onLeave, { passive: true })
    return () => { removeEventListener('pointermove', onMove); el.removeEventListener('pointerleave', onLeave); removeEventListener('scroll', onLeave) }
  }, [])

  const close = useMemo(() => (results.length ? [] : nearest(q, 4)), [results.length, q])
  const label = q.trim() ? `match “${q.trim()}”` : filter === 'For You' ? (saved.length ? 'ranked by what you saved' : 'in the whole library') : `in ${filter}`

  return (
    <LayoutGroup>
      <main className="page library">
        <header className="lib-head">
          <h1>
            <span className="lib-count">{results.length}</span>
            <span className="lib-of">ideas {label}</span>
          </h1>
          <div className="lib-tools">
            <div className="search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <label className="sr-only" htmlFor="lib-search">Search ideas</label>
              <input id="lib-search" type="search" placeholder={`Search ${IDEAS.length} ideas by problem, audience or tech`} value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <label className="sort">
              <span className="sr-only">Sort</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                <option>Relevance</option>
                <option>Smallest build</option>
                <option>A–Z</option>
              </select>
            </label>
          </div>
          <div className="chips" role="toolbar" aria-label="Filter ideas">
            {FILTERS.map((f) => (
              <button key={f} className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
                {filter === f && <motion.span layoutId="chip-fill" className="chip-fill" transition={spring.plate} />}
                <span>{f}</span>
              </button>
            ))}
          </div>
          <p className="lib-key">
            <BrushTally count={1} size={24} /> weekend build
            <BrushTally count={2} size={24} /> about a month
            <BrushTally count={3} size={24} /> a quarter
          </p>
        </header>

        <div className="grid" ref={grid} aria-live="polite">
          <AnimatePresence mode="popLayout">
            {results.map((idea, i) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                variant={variantAt(i)}
                saved={saved.includes(idea.id)}
                hidden={openId === idea.id}
                onOpen={(id) => go(href.idea(id))}
              />
            ))}
          </AnimatePresence>
          {results.length === 0 && (
            <div className="empty">
              <p>No ideas match “{q}” {filter !== 'For You' && <>in {filter}</>}.</p>
              {close.length > 0 && (
                <div className="empty-near">
                  <p>Closest in the library:</p>
                  <ul>{close.map((i) => <li key={i.id}><a href={href.idea(i.id)}>{i.title}</a><span>{i.pitch}</span></li>)}</ul>
                </div>
              )}
              {q.trim() && (
                <div className="empty-ask">
                  <p>Want this niche researched? Leave your email and we will tell you when it is.</p>
                  <EmailCapture interest="niche" source="search" note={q.trim()} cta="Request it" done="Noted. We will email you if we cover it." />
                </div>
              )}
              <button className="btn" onClick={() => { setQ(''); setFilter('For You') }}>Clear search and filters</button>
            </div>
          )}
        </div>
      </main>
      <AnimatePresence>{openId && <IdeaDetail key={openId} id={openId} />}</AnimatePresence>
    </LayoutGroup>
  )
}
