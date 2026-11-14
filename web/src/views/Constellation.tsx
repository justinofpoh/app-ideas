import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import gsap from 'gsap'
import { forceCollide, forceLink, forceManyBody, forceSimulation, forceX, forceY, type Simulation, type SimulationLinkDatum, type SimulationNodeDatum } from 'd3-force'
import { BY_ID, CATEGORY_INK, IDEAS, type Idea } from '@shared/ideas'
import { similarity, sharedTraits } from '@shared/similarity'
import { clusterKey, synthesize, type ClusterMode, type Synthesis } from '@shared/synthesis'
import { savedStore, useSaved } from '../lib/store'
import { go, href } from '../lib/router'
import { ease, prefersReducedMotion, spring } from '../lib/motion'
import { BrushTally, effortMarks } from '../components/BrushTally'
import { flyToCollection } from '../components/flyToCollection'
import './constellation.css'

interface Node extends SimulationNodeDatum { id: string; idea: Idea }
interface Link extends SimulationLinkDatum<Node> { s: number; source: Node | string; target: Node | string }

const SAMPLE = ['voice-journal', 'focus-garden', 'weekly-review-coach', 'breath-break', 'spend-mood', 'micro-coach', 'symptom-diary', 'sleep-debt-bank', 'subscription-radar', 'inbox-weather']
const MODES: { key: ClusterMode; label: string }[] = [
  { key: 'category', label: 'Category' },
  { key: 'problem', label: 'Problem' },
  { key: 'technology', label: 'Technology' },
]

export function Constellation({ onInk }: { onInk: (c: string) => void }) {
  const saved = useSaved()
  const ideas = useMemo(() => saved.map((id) => BY_ID.get(id)).filter(Boolean) as Idea[], [saved])
  const [mode, setMode] = useState<ClusterMode>('category')
  const [selected, setSelected] = useState<string[]>([])
  const [hoverSet, setHoverSet] = useState<Set<string> | null>(null)
  const [synth, setSynth] = useState<Synthesis | null>(null)

  useEffect(() => onInk('#6b3f8e'), [onInk])
  // a new set of saved ideas makes an old synthesis stale
  useEffect(() => { setSynth(null); setSelected((s) => s.filter((id) => saved.includes(id))) }, [saved])

  if (ideas.length < 3) {
    return (
      <main className="page constellation empty-state">
        <div className="cs-empty">
          <img className="cs-mark" src="./icon-192.png" alt="" width="96" height="96" />
          <h1>Your constellation starts at three saved ideas.</h1>
          <p>
            {ideas.length === 0 ? 'Nothing saved yet.' : `You have saved ${ideas.length}.`} Saved ideas appear here as a network, grouped by category, problem or technology, so you can see what connects them.
          </p>
          <div className="cs-empty-actions">
            <a className="btn btn-solid" href={href.library}>Browse the library</a>
            <button className="btn" onClick={() => savedStore.set([...new Set([...saved, ...SAMPLE])])}>Try it with 10 sample ideas</button>
          </div>
        </div>
      </main>
    )
  }

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-2)))

  return (
    <main className="page constellation">
      <section className="cs-stage">
        <header className="cs-head">
          <h1>Your constellation</h1>
          <p>{ideas.length} saved ideas. Lines join ideas that share a category, technology, audience or problem. Click two ideas to see what connects them.</p>
          <div className="seg" role="radiogroup" aria-label="Group ideas by">
            {MODES.map((m) => (
              <button key={m.key} role="radio" aria-checked={mode === m.key} onClick={() => setMode(m.key)}>
                {mode === m.key && <motion.span layoutId="seg-fill" className="seg-fill" transition={spring.plate} />}
                <span>{m.label}</span>
              </button>
            ))}
          </div>
        </header>
        <Graph ideas={ideas} mode={mode} selected={selected} onSelect={toggleSelect} highlight={hoverSet} />
        <AnimatePresence>
          {selected.length > 0 && <Inspector key={selected.join('+')} ids={selected} onClear={() => setSelected([])} />}
        </AnimatePresence>
      </section>

      <aside className="cs-panel" aria-label="Synthesis">
        <SynthesisPanel ideas={ideas} mode={mode} synth={synth} onRun={() => setSynth(synthesize(ideas, mode))} onHoverTheme={setHoverSet} />
      </aside>
    </main>
  )
}

/* ---------------- force graph ---------------- */

function Graph({ ideas, mode, selected, onSelect, highlight }: { ideas: Idea[]; mode: ClusterMode; selected: string[]; onSelect: (id: string) => void; highlight: Set<string> | null }) {
  const wrap = useRef<HTMLDivElement>(null)
  const svg = useRef<SVGSVGElement>(null)
  const sim = useRef<Simulation<Node, Link> | null>(null)
  const nodes = useRef<Node[]>([])
  const [size, setSize] = useState({ w: 800, h: 600 })
  const [hover, setHover] = useState<string | null>(null)
  const reduced = useMemo(prefersReducedMotion, [])

  const links = useMemo(() => {
    const out: Link[] = []
    const seen = new Set<string>()
    ideas.forEach((a) => {
      ideas
        .filter((b) => b !== a)
        .map((b) => ({ b, s: similarity(a, b) }))
        .sort((x, y) => y.s - x.s)
        .slice(0, 3)
        .forEach(({ b, s }) => {
          const key = [a.id, b.id].sort().join('|')
          if (s > 0.12 && !seen.has(key)) { seen.add(key); out.push({ source: a.id, target: b.id, s }) }
        })
    })
    return out
  }, [ideas])

  const groups = useMemo(() => {
    const keys = [...new Set(ideas.map((i) => clusterKey(i, mode)))]
    return keys
  }, [ideas, mode])

  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(wrap.current!)
    return () => ro.disconnect()
  }, [])

  // cluster centres sit on an ellipse; each mode change re-targets the nodes
  const centre = (key: string) => {
    const k = groups.indexOf(key)
    const n = groups.length
    if (n === 1) return { x: size.w / 2, y: size.h / 2 }
    const a = (k / n) * Math.PI * 2 - Math.PI / 2
    return { x: size.w / 2 + Math.cos(a) * size.w * 0.34, y: size.h / 2 + Math.sin(a) * size.h * 0.32 }
  }

  useEffect(() => {
    const prev = new Map(nodes.current.map((n) => [n.id, n]))
    nodes.current = ideas.map((idea) => prev.get(idea.id) || { id: idea.id, idea, x: size.w / 2 + (Math.random() - 0.5) * 60, y: size.h / 2 + (Math.random() - 0.5) * 60 })
    const linkData = links.map((l) => ({ ...l }))
    sim.current?.stop()
    const s = forceSimulation<Node, Link>(nodes.current)
      .force('link', forceLink<Node, Link>(linkData).id((d) => d.id).distance(120).strength((l) => l.s * 0.18))
      .force('charge', forceManyBody().strength(-320))
      .force('collide', forceCollide(52))
      .force('x', forceX<Node>((d) => centre(clusterKey(d.idea, mode)).x).strength(0.3))
      .force('y', forceY<Node>((d) => centre(clusterKey(d.idea, mode)).y).strength(0.3))
      .alphaDecay(0.035)
      .on('tick', () => draw(linkData))
    if (reduced) { s.stop(); for (let i = 0; i < 300; i++) s.tick(); draw(linkData) }
    sim.current = s
    return () => { s.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ideas, links, mode, size.w, size.h])

  const draw = (linkData: Link[]) => {
    const root = svg.current
    if (!root) return
    const pad = 46
    nodes.current.forEach((n) => {
      n.x = Math.max(pad, Math.min(size.w - pad, n.x!))
      n.y = Math.max(pad, Math.min(size.h - pad - 20, n.y!))
      const el = root.querySelector<SVGGElement>(`[data-node="${n.id}"]`)
      el?.setAttribute('transform', `translate(${n.x},${n.y})`)
    })
    linkData.forEach((l) => {
      const a = l.source as Node, b = l.target as Node
      const el = root.querySelector<SVGLineElement>(`[data-link="${a.id}|${b.id}"]`)
      if (el) { el.setAttribute('x1', `${a.x}`); el.setAttribute('y1', `${a.y}`); el.setAttribute('x2', `${b.x}`); el.setAttribute('y2', `${b.y}`) }
    })
    // cluster labels follow the centroid of their members
    groups.forEach((g) => {
      const members = nodes.current.filter((n) => clusterKey(n.idea, mode) === g)
      const el = root.querySelector<SVGTextElement>(`[data-group="${CSS.escape(g)}"]`)
      if (!el || !members.length) return
      const cx = members.reduce((s, n) => s + n.x!, 0) / members.length
      const top = Math.min(...members.map((n) => n.y!))
      el.setAttribute('x', `${cx}`)
      el.setAttribute('y', `${Math.max(24, top - 48)}`)
    })
  }

  // drag a node; a short press counts as a click
  const drag = (e: React.PointerEvent, n: Node) => {
    const start = { x: e.clientX, y: e.clientY }
    let moved = false
    const rect = svg.current!.getBoundingClientRect()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    const move = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 4) moved = true
      if (!moved) return
      n.fx = ev.clientX - rect.left
      n.fy = ev.clientY - rect.top
      sim.current?.alphaTarget(0.25).restart()
    }
    const up = () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
      n.fx = n.fy = null
      sim.current?.alphaTarget(0)
      if (!moved) onSelect(n.id)
    }
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
  }

  const focus = hover || null
  const neighbours = useMemo(() => {
    if (!focus) return null
    const set = new Set([focus])
    links.forEach((l) => {
      if (l.source === focus) set.add(l.target as string)
      if (l.target === focus) set.add(l.source as string)
    })
    return set
  }, [focus, links])
  const lit = highlight || neighbours

  return (
    <div className="graph" ref={wrap}>
      <svg ref={svg} width={size.w} height={size.h} role="group" aria-label="Network of saved ideas">
        <defs>
          <filter id="rough" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" />
            <feDisplacementMap in="SourceGraphic" scale="4" />
          </filter>
        </defs>
        <g className="links">
          {links.map((l) => {
            const a = l.source as string, b = l.target as string
            const on = lit ? lit.has(a) && lit.has(b) : true
            const sel = selected.includes(a) && selected.includes(b)
            return <line key={`${a}|${b}`} data-link={`${a}|${b}`} strokeWidth={0.6 + l.s * 3} data-dim={!on || undefined} data-sel={sel || undefined} />
          })}
        </g>
        <g className="group-labels">
          {groups.map((g) => (
            <motion.text key={`${mode}-${g}`} data-group={g} textAnchor="middle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, ease: ease.lift, delay: 0.25 }}>
              {g}
            </motion.text>
          ))}
        </g>
        <g className="nodes">
          {ideas.map((idea) => {
            const ink = CATEGORY_INK[idea.category]
            const sel = selected.includes(idea.id)
            const dim = lit ? !lit.has(idea.id) : false
            const n = nodes.current.find((x) => x.id === idea.id)
            return (
              <g
                key={idea.id}
                data-node={idea.id}
                className="node"
                data-dim={dim || undefined}
                data-sel={sel || undefined}
                transform={n ? `translate(${n.x},${n.y})` : undefined}
                tabIndex={0}
                role="button"
                aria-pressed={sel}
                aria-label={`${idea.title}, ${idea.category}`}
                onPointerDown={(e) => { const nn = nodes.current.find((x) => x.id === idea.id); if (nn) drag(e, nn) }}
                onPointerEnter={() => setHover(idea.id)}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setHover(idea.id)}
                onBlur={() => setHover(null)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(idea.id) } }}
              >
                {sel && <circle r="30" className="node-ring" filter="url(#rough)" />}
                <rect x="-17" y="-12" width="34" height="24" rx="3" className="node-slip" transform={`rotate(${(idea.title.length % 7) - 3})`} />
                <circle r="5" fill={ink} />
                <text y="32" textAnchor="middle">{idea.title}</text>
              </g>
            )
          })}
        </g>
      </svg>
    </div>
  )
}

/* ---------------- two-idea inspector ---------------- */

function Inspector({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const [a, b] = ids.map((id) => BY_ID.get(id)!)
  return (
    <motion.div
      className="inspector"
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, transition: { duration: 0.16 } }}
      transition={{ duration: 0.28, ease: ease.lift }}
      role="region"
      aria-label="Selected ideas"
    >
      {!b ? (
        <>
          <p className="card-cat" style={{ ['--pig' as string]: CATEGORY_INK[a.category] }}><span className="dot" />{a.category}</p>
          <h2>{a.title}</h2>
          <p>{a.pitch}</p>
          <p className="ins-note">Click a second idea to connect them.</p>
          <div className="ins-actions">
            <a className="btn btn-solid" href={href.idea(a.id)}>Open idea</a>
            <button className="btn" onClick={onClear}>Clear</button>
          </div>
        </>
      ) : (
        <>
          <h2>{a.title} + {b.title}</h2>
          {(() => {
            const shared = sharedTraits(a, b)
            return shared.length ? (
              <p>Both share <strong>{shared.join(', ')}</strong>.</p>
            ) : (
              <p>They share no category or technology. That distance is where unusual combinations come from.</p>
            )
          })()}
          <div className="ins-combo">
            <h3>Possible combination</h3>
            <p>An app for {a.audience.toLowerCase()} that does both jobs: “{lc(a.job)}” and “{lc(b.job)}”.</p>
            <ul>
              <li>{a.features[0]}</li>
              <li>{b.features[0]}</li>
            </ul>
          </div>
          <div className="ins-actions">
            <button className="btn" onClick={onClear}>Clear</button>
          </div>
        </>
      )}
    </motion.div>
  )
}
const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1)

/* ---------------- synthesis ---------------- */

function SynthesisPanel({ ideas, mode, synth, onRun, onHoverTheme }: { ideas: Idea[]; mode: ClusterMode; synth: Synthesis | null; onRun: () => void; onHoverTheme: (s: Set<string> | null) => void }) {
  const root = useRef<HTMLDivElement>(null)
  const [concept, setConcept] = useState(false)
  const saved = useSaved()

  useLayoutEffect(() => {
    setConcept(false)
    if (!synth || prefersReducedMotion() || !root.current) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline()
      tl.from('.sy-reveal', { y: 18, opacity: 0, duration: 0.7, ease: 'expo.out', stagger: 0.07 })
        .from('.sy-bar i', { scaleX: 0, duration: 1, ease: 'expo.out', stagger: 0.08 }, 0.15)
      root.current!.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
        const end = Number(el.dataset.count)
        const o = { v: 0 }
        tl.to(o, { v: end, duration: 1, ease: 'expo.out', onUpdate: () => { el.textContent = `${Math.round(o.v)}%` } }, 0.15)
      })
    }, root)
    return () => ctx.revert()
  }, [synth])

  const modeWord = mode === 'category' ? 'categories' : mode === 'problem' ? 'problems' : 'technologies'

  return (
    <div className="sy" ref={root}>
      {!synth ? (
        <div className="sy-start">
          <h2>Find the pattern in what you saved</h2>
          <p>Synthesis groups your {ideas.length} ideas by {modeWord}, finds the threads they share, and proposes a concept where two of your interests overlap.</p>
          <button className="btn btn-red" onClick={onRun}>Synthesize {ideas.length} ideas</button>
        </div>
      ) : (
        <>
          <p className="sy-reveal sy-kicker">Your synthesis of {ideas.length} ideas, by {modeWord}</p>
          <h2 className="sy-reveal">Your interests cluster around {synth.themes.filter((t) => t.name !== 'Everything else').length} themes</h2>
          <ul className="sy-themes">
            {synth.themes.map((t) => (
              <li
                key={t.name}
                className="sy-reveal"
                onPointerEnter={() => onHoverTheme(new Set(t.ideas.map((i) => i.id)))}
                onPointerLeave={() => onHoverTheme(null)}
              >
                <div className="sy-row"><span>{t.name}</span><b data-count={t.share}>{t.share}%</b></div>
                <div className="sy-bar"><i style={{ width: `${t.share}%` }} /></div>
              </li>
            ))}
          </ul>
          {synth.threads.length > 0 && (
            <div className="sy-reveal sy-threads">
              <h3>Threads running through them</h3>
              <ul>{synth.threads.map((t) => <li key={t.label}>{t.count} of your ideas {t.label}</li>)}</ul>
            </div>
          )}
          {synth.intersection && (
            <div className="sy-reveal sy-cross">
              <h3>Interesting intersection: {synth.intersection.a} and {synth.intersection.b}</h3>
              <p>
                You saved {synth.intersection.bridge.map((i) => i.title).join(', ')}. Together they point to {lc(synth.intersection.concept.pitch)}
              </p>
              <button className="btn btn-red" aria-expanded={concept} onClick={() => setConcept((c) => !c)}>
                {concept ? 'Hide combined concept' : 'Explore combined concept'}
              </button>
              <AnimatePresence initial={false}>
                {concept && (
                  <motion.div className="sy-concept" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3, ease: ease.settle }}>
                    <div className="sy-concept-inner">
                      <h4>{synth.intersection.concept.title}</h4>
                      <dl>
                        <div><dt>For</dt><dd>{synth.intersection.concept.audience}</dd></div>
                        <div><dt>Core features</dt><dd><ul>{synth.intersection.concept.features.map((f) => <li key={f}>{f}</li>)}</ul></dd></div>
                        <div><dt>Built with</dt><dd>{synth.intersection.concept.tech.join(', ')}</dd></div>
                        <div><dt>Made from</dt><dd>{synth.intersection.bridge.map((i, k) => <span key={i.id}>{k > 0 && ', '}<a href={href.idea(i.id)}>{i.title}</a></span>)}</dd></div>
                      </dl>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
          <div className="sy-reveal sy-missed">
            <h3>Close to what you saved</h3>
            <ul>
              {synth.missed.map((i) => (
                <li key={i.id} style={{ ['--pig' as string]: CATEGORY_INK[i.category] }}>
                  <BrushTally count={effortMarks(i.effort)} size={28} />
                  <a href={href.idea(i.id)}>{i.title}</a>
                  <button
                    className="save"
                    aria-pressed={saved.includes(i.id)}
                    aria-label={`Save ${i.title}`}
                    onClick={(e) => { if (!saved.includes(i.id)) flyToCollection(e.currentTarget, CATEGORY_INK[i.category]); savedStore.toggle(i.id) }}
                  >
                    +
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <p className="sy-reveal sy-note">
            Synthesis runs on this device and reads only the structure of your saved ideas. Shares show your own interests, not market demand.
          </p>
          <button className="btn sy-reveal" onClick={onRun}>Run again</button>
        </>
      )}
      <button className="sy-link" onClick={() => go(href.library)}>Add more ideas from the library</button>
    </div>
  )
}

export const _all = IDEAS.length
