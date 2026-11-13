import { useCallback, useEffect, useRef, useState } from 'react'
import { MotionConfig } from 'motion/react'
import gsap from 'gsap'
import { useRoute, type Route } from './lib/router'
import { prefersReducedMotion } from './lib/motion'
import { Topbar } from './components/Topbar'
import { LivingField } from './components/LivingField'
import { Universe } from './views/Universe'
import { Library } from './views/Library'
import { Constellation } from './views/Constellation'

const view = (r: Route) => (r.name === 'idea' ? 'library' : r.name)

export function App() {
  const route = useRoute()
  const [ink, setInk] = useState('#fd461a')
  const onInk = useCallback((c: string) => setInk(c), [])
  const [shown, setShown] = useState(view(route))
  const shownRef = useRef(shown)
  const wipe = useRef<HTMLDivElement>(null)
  const swap = (v: ReturnType<typeof view>) => { shownRef.current = v; setShown(v); scrollTo(0, 0) }

  // between top-level views a sheet of paper slides across, the view swaps
  // underneath it, and the sheet slides away
  useEffect(() => {
    const next = view(route)
    if (next === shownRef.current) return
    if (prefersReducedMotion() || !wipe.current) { swap(next); return }
    const tl = gsap.timeline()
    tl.fromTo(wipe.current, { xPercent: 105, autoAlpha: 1 }, { xPercent: 0, duration: 0.42, ease: 'power3.inOut' })
      .add(() => swap(next))
      .to(wipe.current, { xPercent: -105, duration: 0.5, ease: 'power3.inOut', delay: 0.06 })
      .set(wipe.current, { autoAlpha: 0 })
    return () => { tl.progress(1) }
  }, [route])

  return (
    <MotionConfig reducedMotion="user">
      <Topbar />
      {shown !== 'universe' && <LivingField ink={ink} />}
      <div id="main">
        {shown === 'universe' && <Universe />}
        {shown === 'library' && <Library onInk={onInk} />}
        {shown === 'constellation' && <Constellation onInk={onInk} />}
      </div>
      <div className="wipe" ref={wipe} aria-hidden="true"><img src="./icon-192.png" alt="" /></div>
    </MotionConfig>
  )
}
