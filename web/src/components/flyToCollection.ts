import gsap from 'gsap'
import { prefersReducedMotion } from '../lib/motion'

// Saving an idea sends a small paper slip from the button into the collection count.
export function flyToCollection(from: HTMLElement, ink: string) {
  if (prefersReducedMotion()) return
  const target = document.querySelector('a[href={href.constellation}]')
  if (!target) return
  const a = from.getBoundingClientRect()
  const b = target.getBoundingClientRect()
  const el = document.createElement('div')
  el.className = 'flying-slip'
  el.style.setProperty('--pig', ink)
  document.body.appendChild(el)
  const x0 = a.left + a.width / 2 - 14
  const y0 = a.top + a.height / 2 - 14
  const x1 = b.right - 26
  const y1 = b.top + b.height / 2 - 14
  gsap.set(el, { x: x0, y: y0, rotate: -8, scale: 1 })
  const tl = gsap.timeline({ onComplete: () => el.remove() })
  tl.to(el, { x: x1, rotate: 14, duration: 0.75, ease: 'power2.inOut' }, 0)
    .to(el, { y: Math.min(y0, y1) - 120, duration: 0.36, ease: 'power2.out' }, 0)
    .to(el, { y: y1, duration: 0.39, ease: 'power2.in' }, 0.36)
    .to(el, { scale: 0.4, opacity: 0, duration: 0.18, ease: 'power2.in' }, 0.6)
}
