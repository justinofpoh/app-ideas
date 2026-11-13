import { motion } from 'motion/react'
import type { MouseEvent } from 'react'
import { CATEGORY_INK, type Idea } from '@shared/ideas'
import { savedStore } from '../lib/store'
import { spring } from '../lib/motion'
import { BrushTally, effortMarks } from './BrushTally'
import { flyToCollection } from './flyToCollection'

export type Variant = 'feature' | 'wide' | 'tall' | 'plate'

// Rhythm for the grid so the library never reads as identical tiles.
const PATTERN: Variant[] = ['feature', 'plate', 'plate', 'tall', 'plate', 'plate', 'wide', 'plate', 'tall', 'plate', 'plate', 'plate']
export const variantAt = (i: number): Variant => PATTERN[i % PATTERN.length]

interface Props {
  idea: Idea
  variant: Variant
  saved: boolean
  hidden: boolean
  onOpen: (id: string) => void
}

export function IdeaCard({ idea, variant, saved, hidden, onOpen }: Props) {
  const ink = CATEGORY_INK[idea.category]
  // each slip sits at its own slight angle, like cards pinned to a board
  const tilt = ((idea.id.charCodeAt(0) * 7 + idea.id.length * 13) % 9) / 10 - 0.4
  const save = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!saved) flyToCollection(e.currentTarget, ink)
    savedStore.toggle(idea.id)
  }
  return (
    <motion.article
      layout
      layoutId={hidden ? undefined : `card-${idea.id}`}
      className={`card card-${variant}`}
      data-card
      data-saved={saved || undefined}
      style={{ ['--pig' as string]: ink, ['--tilt' as string]: `${tilt}deg`, visibility: hidden ? 'hidden' : undefined }}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
      transition={spring.plate}
    >
      <div className="card-face">
        <button className="card-hit" onClick={() => onOpen(idea.id)} aria-label={`Open ${idea.title}`} />
        <div className="card-top">
          <BrushTally count={effortMarks(idea.effort)} color={variant === 'feature' ? 'var(--card)' : 'var(--vermilion)'} size={variant === 'feature' || variant === 'tall' ? 52 : 38} />
          <button className="save" aria-pressed={saved} onClick={save} aria-label={saved ? `Remove ${idea.title} from collection` : `Save ${idea.title}`}>
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 3.5h12v17l-6-4.2-6 4.2Z" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="card-body">
          <p className="card-cat"><span className="dot" />{idea.category}</p>
          <h3>{idea.title}</h3>
          <p className="card-pitch">{idea.pitch}</p>
          {variant === 'feature' && (
            <>
              <blockquote>{idea.problem}</blockquote>
              <ul className="card-feats">{idea.features.map((f) => <li key={f}>{f}</li>)}</ul>
            </>
          )}
          {variant === 'wide' && <p className="card-job"><span>Job to steal</span> {idea.job}</p>}
          {variant === 'tall' && <p className="card-aud">For {idea.audience.toLowerCase()}</p>}
        </div>
        <div className="card-foot">
          <span>{idea.platforms.join(', ')}</span>
          {idea.ai && <span className="tag">AI</span>}
        </div>
      </div>
    </motion.article>
  )
}
