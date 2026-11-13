import { useEffect, useRef, type MouseEvent } from 'react'
import { motion } from 'motion/react'
import { BY_ID, CATEGORY_INK } from '@shared/ideas'
import { related, sharedTraits } from '@shared/similarity'
import { savedStore, useSaved } from '../lib/store'
import { go, href } from '../lib/router'
import { ease, spring, stagger } from '../lib/motion'
import { BrushTally, effortMarks } from '../components/BrushTally'
import { flyToCollection } from '../components/flyToCollection'

const EFFORT_TEXT = { Weekend: 'A weekend build', Month: 'About a month', Quarter: 'A quarter or more' }

export function IdeaDetail({ id }: { id: string }) {
  const idea = BY_ID.get(id)
  const saved = useSaved()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus({ preventScroll: true })
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') go(href.library) }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  if (!idea) {
    return (
      <div className="detail-scrim" role="dialog" aria-label="Idea not found">
        <div className="detail-missing">
          <p>That idea is not in the library.</p>
          <button className="btn btn-solid" onClick={() => go(href.library)}>Back to the library</button>
        </div>
      </div>
    )
  }
  const ink = CATEGORY_INK[idea.category]
  const isSaved = saved.includes(idea.id)
  const rel = related(idea, 4)
  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    if (!isSaved) flyToCollection(e.currentTarget, ink)
    savedStore.toggle(idea.id)
  }
  const item = {
    hidden: { opacity: 0, y: 18 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: ease.lift } },
  }

  return (
    <motion.div
      className="detail-scrim"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      onClick={(e) => { if (e.target === e.currentTarget) go(href.library) }}
      style={{ ['--pig' as string]: ink }}
    >
      <div className="detail" data-lenis-prevent>
        <motion.section layoutId={`card-${idea.id}`} className="detail-plate" transition={spring.plate}>
          <div className="detail-plate-top">
            <BrushTally count={effortMarks(idea.effort)} size={72} />
            <button ref={closeRef} className="close" onClick={() => go(href.library)} aria-label="Close idea">
              <svg width="18" height="18" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </div>
          <p className="card-cat"><span className="dot" />{idea.category}</p>
          <h2 id="detail-title">{idea.title}</h2>
          <p className="detail-pitch">{idea.pitch}</p>
          <div className="detail-actions">
            <button className={`btn ${isSaved ? '' : 'btn-red'}`} onClick={toggle} aria-pressed={isSaved}>
              {isSaved ? 'Saved to your collection' : 'Save idea'}
            </button>
            {isSaved && <a className="btn" href={href.constellation}>See it in your constellation</a>}
          </div>
        </motion.section>

        <motion.div className="detail-body" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: stagger.base, delayChildren: 0.18 } } }}>
          <motion.div variants={item} className="d-block d-problem">
            <h3>The problem</h3>
            <p>{idea.problem}</p>
          </motion.div>
          <motion.div variants={item} className="d-block d-job">
            <h3>Job to steal</h3>
            <p>“{idea.job}”</p>
          </motion.div>
          <motion.div variants={item} className="d-block">
            <h3>Who it’s for</h3>
            <p>{idea.audience}</p>
          </motion.div>
          <motion.div variants={item} className="d-block">
            <h3>Core features</h3>
            <ul className="d-feats">{idea.features.map((f) => <li key={f}>{f}</li>)}</ul>
          </motion.div>
          <motion.dl variants={item} className="d-facts">
            <div><dt>Built with</dt><dd>{idea.tech.join(', ')}</dd></div>
            <div><dt>Platforms</dt><dd>{idea.platforms.join(', ')}</dd></div>
            <div><dt>Build size</dt><dd>{EFFORT_TEXT[idea.effort]}</dd></div>
            <div><dt>Business model</dt><dd>{idea.model}</dd></div>
          </motion.dl>
          <motion.div variants={item} className="d-block d-related">
            <h3>Related ideas</h3>
            <ul>
              {rel.map((r) => {
                const shared = sharedTraits(idea, r)
                return (
                  <li key={r.id}>
                    <a href={href.idea(r.id)} style={{ ['--pig' as string]: CATEGORY_INK[r.category] }}>
                      <BrushTally count={effortMarks(r.effort)} size={30} />
                      <span>
                        <strong>{r.title}</strong>
                        <em>{shared.length ? `Shares ${shared.slice(0, 3).join(', ')}` : 'Similar problem and audience'}</em>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  )
}
