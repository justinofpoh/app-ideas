import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { CATEGORIES, CATEGORY_INK, IDEAS, type Category } from '@shared/ideas'
import { go, href } from '../lib/router'
import { hasWebGL, prefersReducedMotion } from '../lib/motion'
import { account, useAccount } from '../lib/store'
import { BrushTally } from '../components/BrushTally'
import seedBetas from '../data/betas.json'
import './universe.css'

gsap.registerPlugin(ScrollTrigger)
const UniverseScene = lazy(() => import('../three/UniverseScene'))

type Signals = { generatedAt: string; total: number; open: number; names: string[] }
const seed: Signals = {
  generatedAt: seedBetas.generatedAt,
  total: seedBetas.total,
  open: seedBetas.open,
  names: seedBetas.apps.filter((a) => a.status === 'open').map((a) => a.name),
}

export function Universe() {
  const webgl = useMemo(hasWebGL, [])
  const reduced = useMemo(prefersReducedMotion, [])
  const [focused, setFocused] = useState<Category | null>(null)
  const [live, setLive] = useState(true)
  const [q, setQ] = useState('')
  const [signals, setSignals] = useState(seed)
  const { backend, user } = useAccount()
  const root = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)

  // live TestFlight numbers when the Worker is there; the bundled snapshot otherwise
  useEffect(() => {
    if (backend !== 'available') return
    fetch('/api/signals/testflight')
      .then((r) => r.json())
      .then((d: { generatedAt: string; total: number; open: number; sample: { name: string }[] }) => {
        if (d.total) setSignals({ generatedAt: d.generatedAt, total: d.total, open: d.open, names: d.sample.map((s) => s.name) })
      })
      .catch(() => {})
  }, [backend])

  // the 3D scene only renders while the hero is on screen
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.02 })
    if (hero.current) io.observe(hero.current)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setFocused(null) }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  // smooth scroll + one entrance + section reveals as they arrive
  useLayoutEffect(() => {
    if (reduced) return
    const lenis = new Lenis({ lerp: 0.1 })
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (t: number) => lenis.raf(t * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)
    const ctx = gsap.context(() => {
      gsap.from('.l-hero-foot > *', { y: 28, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08, delay: 1.1 })
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el.children, {
          y: 48, opacity: 0, duration: 1, ease: 'expo.out', stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 80%' },
        })
      })
      gsap.from('.l-count', {
        textContent: 0, duration: 1.6, ease: 'expo.out', snap: { textContent: 1 },
        scrollTrigger: { trigger: '.l-signals', start: 'top 75%' },
      })
    }, root)
    return () => { ctx.revert(); gsap.ticker.remove(tick); lenis.destroy() }
  }, [reduced])

  const leaving = () => gsap.to('.l-hero-foot', { opacity: 0, duration: 0.4, ease: 'power2.out' })
  const updated = signals.generatedAt ? new Date(signals.generatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : ''
  const rowA = signals.names.slice(0, 30)
  const rowB = signals.names.slice(30, 60)

  return (
    <div className="landing" ref={root}>
      {/* ---------- hero ---------- */}
      <section className="l-hero" ref={hero} aria-labelledby="l-title">
        <h1 id="l-title" className="sr-only">Find the app worth building.</h1>
        {webgl ? (
          <Suspense fallback={<div className="l-canvas" />}>
            <div className="l-canvas">
              <UniverseScene
                live={live}
                headline={['Find the app', 'worth building.']}
                focused={focused}
                highlight={null}
                onFocus={setFocused}
                onOpen={(id) => go(href.idea(id))}
                onLeaving={leaving}
              />
            </div>
          </Suspense>
        ) : (
          <p className="l-flat-title" aria-hidden="true">Find the app<br />worth building.</p>
        )}

        <div className="l-hero-foot">
          {focused ? (
            <div className="l-focus">
              <p><span className="dot" style={{ background: CATEGORY_INK[focused] }} /> {focused}: click a slip to read it.</p>
              <button className="btn" onClick={() => setFocused(null)}>Back to every pile</button>
            </div>
          ) : (
            <>
              <p className="l-lede">{IDEAS.length} app ideas, each with the evidence behind it.</p>
              <form className="l-actions" role="search" onSubmit={(e) => { e.preventDefault(); go(href.library, q) }}>
                <a className="btn btn-red l-cta" href={href.library}>Explore ideas</a>
                <div className="search">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                  <label className="sr-only" htmlFor="l-search">Search ideas</label>
                  <input id="l-search" placeholder="Search a problem, like receipts" value={q} onChange={(e) => setQ(e.target.value)} />
                </div>
              </form>
              {webgl && <p className="l-hint hand">{matchMedia('(hover: none)').matches ? 'tap a pile' : 'drag to spin, click a pile'}</p>}
            </>
          )}
        </div>
      </section>

      {/* ---------- signals ---------- */}
      <section className="l-signals" aria-labelledby="l-signals-title">
        <div className="l-wrap" data-reveal>
          <h2 id="l-signals-title">
            <span className="l-count">{signals.open}</span>
            <span>TestFlight betas are open right now.</span>
          </h2>
          <p>See what people are building before it reaches the App Store. Checked hourly from public TestFlight links{updated && `, last on ${updated}`}.</p>
        </div>
        <div className="l-marquee" aria-hidden="true">
          {[rowA, rowB].map((row, k) => (
            <div key={k} className={`l-row ${k ? 'l-row-rev' : ''}`}>
              {[...row, ...row].map((n, i) => <span key={i}>{n}</span>)}
            </div>
          ))}
        </div>
      </section>

      {/* ---------- how it works ---------- */}
      <section className="l-steps" aria-labelledby="l-steps-title">
        <div className="l-wrap">
          <h2 id="l-steps-title" className="l-h2" data-reveal><span>From scroll to shipped.</span></h2>
          <ol className="l-step-list" data-reveal>
            <li><span className="l-step-n">1</span><h3>Explore</h3><p>Browse piles of ideas by problem, audience and tech.</p></li>
            <li><span className="l-step-n">2</span><h3>Collect</h3><p>Save the ones that pull at you. They follow your account.</p></li>
            <li><span className="l-step-n">3</span><h3>Connect</h3><p>See what your saves have in common and where two meet.</p></li>
            <li><span className="l-step-n">4</span><h3>Build</h3><p>Take the brief into Claude or Cursor and start.</p></li>
          </ol>
        </div>
      </section>

      {/* ---------- MCP ---------- */}
      <section className="l-mcp" aria-labelledby="l-mcp-title">
        <div className="l-wrap l-mcp-grid">
          <div data-reveal>
            <h2 id="l-mcp-title" className="l-h2"><span>Your ideas, inside Claude.</span></h2>
            <p className="l-body">Connect App Idea Store to Claude, Cursor or any MCP client. Search ideas, pull full briefs and synthesize your saves without leaving the chat.</p>
            {user ? (
              <a className="btn" href={href.library}>Copy your connector link from the account menu</a>
            ) : (
              <button className="btn btn-solid" onClick={() => (backend === 'available' ? account.signIn() : go(href.library))}>
                {backend === 'available' ? 'Sign in to connect' : 'Explore ideas first'}
              </button>
            )}
          </div>
          <figure className="l-chat" data-reveal aria-label="Example conversation">
            <figcaption>Example</figcaption>
            <p className="l-chat-you">Which of my saved ideas could share one codebase?</p>
            <p className="l-chat-tool"><code>synthesize_saved_ideas</code> App Idea Store</p>
            <p className="l-chat-ai">Your saves cluster around Health (60%). Voice Journal and Spend Mood both tag how you feel, so one on-device mood model could power both.</p>
          </figure>
        </div>
      </section>

      {/* ---------- pricing ---------- */}
      <section className="l-pricing" aria-labelledby="l-pricing-title">
        <div className="l-wrap">
          <h2 id="l-pricing-title" className="l-h2" data-reveal><span>Start free.</span></h2>
          <div className="l-plans" data-reveal>
            <article className="l-plan">
              <h3>Free</h3>
              <p className="l-price">$0</p>
              <ul><li>The whole idea library</li><li>Save and sync ideas</li><li>Constellation and synthesis</li></ul>
              <a className="btn" href={href.library}>Start exploring</a>
            </article>
            <article className="l-plan l-plan-pro">
              <h3>Pro</h3>
              <p className="l-price">$12<small>/month</small></p>
              <ul><li>Signal alerts in your niches</li><li>Full evidence on every idea</li><li>MCP access for Claude and Cursor</li></ul>
              <button className="btn" disabled>Coming soon</button>
            </article>
            <article className="l-plan">
              <h3>Idea Kit</h3>
              <p className="l-price">$19<small>/kit</small></p>
              <ul><li>One idea, fully researched</li><li>SwiftUI starter project</li><li>App Store listing draft</li></ul>
              <button className="btn" disabled>Coming soon</button>
            </article>
          </div>
        </div>
      </section>

      {/* ---------- end ---------- */}
      <section className="l-end">
        <div className="l-wrap" data-reveal>
          <p className="l-end-title">Find yours.</p>
          <a className="btn btn-red l-cta" href={href.library}>Explore {IDEAS.length} ideas</a>
          <ul className="l-cats">
            {CATEGORIES.map((c) => (
              <li key={c}><BrushTally count={1} color={CATEGORY_INK[c]} size={22} />{c}</li>
            ))}
          </ul>
        </div>
        <footer className="l-foot">App Idea Store. Not affiliated with Apple. TestFlight data from public join links.</footer>
      </section>
    </div>
  )
}
