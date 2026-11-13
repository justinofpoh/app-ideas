// Build size as brush tally marks, in the hand of the original "a":
// one stroke = a weekend build, two = about a month, three = a quarter.
const STROKE = (x: number, tilt: number) =>
  `M${x} ${8 + tilt} C${x + 4} ${5 + tilt} ${x + 7} ${8 + tilt} ${x + 7.5} ${13 + tilt}
   L${x + 9} ${37} C${x + 9.4} ${41} ${x + 4.6} ${42.5} ${x + 3.4} ${38.6}
   L${x - 1.6} ${14 + tilt} C${x - 2.6} ${10 + tilt} ${x - 1.8} ${8.6 + tilt} ${x} ${8 + tilt}Z`

export function BrushTally({ count, color = 'var(--vermilion)', size = 40 }: { count: 1 | 2 | 3; color?: string; size?: number }) {
  const xs = [0, 1, 2].slice(0, count).map((k) => 10 + k * 11)
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" className="tally">
      {xs.map((x, k) => (
        <path key={k} d={STROKE(x, k % 2 ? 1.5 : 0)} fill={color} />
      ))}
    </svg>
  )
}

export const effortMarks = (e: 'Weekend' | 'Month' | 'Quarter') => (e === 'Weekend' ? 1 : e === 'Month' ? 2 : 3) as 1 | 2 | 3
