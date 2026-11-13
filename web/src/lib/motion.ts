// Motion tokens. Plates lift fast and settle slowly, like something light
// being picked up and put back down.
export const ease = {
  lift: [0.16, 1, 0.3, 1] as const, // expo-out: things arriving
  settle: [0.65, 0, 0.35, 1] as const, // in-out: things moving between places
  drop: [0.7, 0, 0.84, 0] as const, // expo-in: things leaving
  gsapLift: 'expo.out',
  gsapSettle: 'power3.inOut',
}
export const dur = { tap: 0.16, ui: 0.32, move: 0.6, scene: 1.1 }
export const stagger = { tight: 0.025, base: 0.045, loose: 0.09 }
export const spring = {
  plate: { type: 'spring' as const, stiffness: 380, damping: 34, mass: 0.9 },
  soft: { type: 'spring' as const, stiffness: 160, damping: 22 },
}

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
