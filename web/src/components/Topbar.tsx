import { motion } from 'motion/react'
import { useRoute, href } from '../lib/router'
import { useSaved } from '../lib/store'
import { spring } from '../lib/motion'
import { AccountButton } from './AccountButton'

const LINKS = [
  { href: href.universe, label: 'Universe', match: ['universe'] },
  { href: href.library, label: 'Library', match: ['library', 'idea'] },
  { href: href.constellation, label: 'Constellation', match: ['constellation'] },
]

export function Topbar() {
  const route = useRoute()
  const saved = useSaved()
  return (
    <header className="topbar">
      <a className="brand" href={href.universe}>
        <img src="./icon-192.png" alt="" />
        <span>App Idea Store</span>
      </a>
      <nav className="nav" aria-label="Main">
        {LINKS.map((l) => {
          const active = l.match.includes(route.name)
          return (
            <a key={l.href} href={l.href} aria-current={active ? 'page' : undefined}>
              {active && <motion.span layoutId="nav-pill" className="nav-pill" transition={spring.plate} />}
              {l.label}
              {l.label === 'Constellation' && saved.length > 0 && (
                <motion.span key={saved.length} className="count" id="saved-count" initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={spring.plate}>
                  {saved.length}
                </motion.span>
              )}
            </a>
          )
        })}
      </nav>
      <AccountButton />
    </header>
  )
}
