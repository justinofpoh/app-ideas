import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { Billboard, Html, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import gsap from 'gsap'
import { CATEGORIES, CATEGORY_INK, IDEAS, type Category, type Idea } from '@shared/ideas'
import { prefersReducedMotion } from '../lib/motion'

// The idea universe: each category is a loose pile of paper slips floating
// over the page. Hover a pile and it fans apart; open it, then click a slip.

// The piles sit evenly on one flat ring around the headline: equal angles,
// equal height, so the orbit reads as a single calm circle.
const NARROW = typeof window !== 'undefined' && innerWidth < 820
const HOME = NARROW ? new THREE.Vector3(0, 9, 30) : new THREE.Vector3(0, 7.2, 24)
const R = NARROW ? 7 : 10.5
const clusterPos = (k: number) => {
  const a = (k / CATEGORIES.length) * Math.PI * 2
  return new THREE.Vector3(Math.cos(a) * R, 0, Math.sin(a) * R)
}

const slipGeo = new RoundedBoxGeometry(1.75, 0.035, 1.15, 2, 0.04)

// an index card: fresh paper, faint ruling and a pigment brush stroke
function slipTexture(ink: string) {
  const c = document.createElement('canvas')
  c.width = 512; c.height = 340
  const g = c.getContext('2d')!
  g.fillStyle = '#fbf8f2'
  g.fillRect(0, 0, 512, 340)
  g.strokeStyle = 'rgba(80,90,140,0.13)'
  g.lineWidth = 2
  for (let y = 120; y < 340; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke() }
  g.strokeStyle = '#fd461a'; g.globalAlpha = 0.55
  g.beginPath(); g.moveTo(0, 92); g.lineTo(512, 92); g.stroke()
  g.globalAlpha = 1
  // brush stroke: many offset passes give a dry-brush edge
  g.strokeStyle = ink; g.lineCap = 'round'
  for (let k = 0; k < 14; k++) {
    g.globalAlpha = 0.18 + Math.random() * 0.2
    g.lineWidth = 10 + Math.random() * 8
    g.beginPath()
    g.moveTo(40, 52 + k * 0.9)
    g.bezierCurveTo(140, 30 + k, 230, 64 + k * 0.6, 300 + Math.random() * 30, 46 + k * 0.8)
    g.stroke()
  }
  g.globalAlpha = 1
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  return t
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,0.8)')
  grd.addColorStop(0.45, 'rgba(255,255,255,0.22)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

interface SceneProps {
  live: boolean
  headline: [string, string]
  focused: Category | null
  highlight: Category | null
  onFocus: (c: Category | null) => void
  onOpen: (id: string) => void
  onLeaving: () => void
  onReady?: () => void
}

export default function UniverseScene(props: SceneProps) {
  return (
    <Canvas
      frameloop={props.live ? 'always' : 'never'}
      camera={{ position: [0, 9, 44], fov: 38, near: 0.1, far: 200 }}
      dpr={[1, 1.75]}
      flat
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.setClearColor('#f2ece2')}
    >
      <fog attach="fog" args={['#f2ece2', 26, 58]} />
      <ambientLight intensity={1.6} color="#fff6ea" />
      <directionalLight position={[8, 14, 10]} intensity={1.8} color="#fff1e0" />
      <directionalLight position={[-10, 4, -6]} intensity={0.5} color="#c9d2ff" />
      <LiftView />
      <Dust />
      <Headline lines={props.headline} onReady={props.onReady} />
      <World {...props} />
    </Canvas>
  )
}

// Nudge the picture up so the ring sits clear of the buttons at the bottom.
function LiftView() {
  const { camera, size } = useThree()
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera
    cam.setViewOffset(size.width, size.height, 0, size.height * (NARROW ? 0.16 : 0.07), size.width, size.height)
    cam.updateProjectionMatrix()
    return () => { cam.clearViewOffset(); cam.updateProjectionMatrix() }
  }, [camera, size])
  return null
}

// The headline lives in the scene so piles pass in front of and behind it.
function Headline({ lines, onReady }: { lines: [string, string]; onReady?: () => void }) {
  const size = NARROW ? 1.18 : 2.15
  return (
    <Billboard position={[0, 0.9, 0]}>
      <Text font="./fonts/bricolage-800.woff" fontSize={size} lineHeight={0.92} letterSpacing={-0.045} anchorX="center" anchorY="middle" textAlign="center" onSync={onReady}>
        {`${lines[0]}\n${lines[1]}`}
        {/* full ink, unaffected by fog or tone mapping */}
        <meshBasicMaterial color="#241c17" fog={false} toneMapped={false} />
      </Text>
    </Billboard>
  )
}

function Dust() {
  const ref = useRef<THREE.Points>(null)
  const dustTex = useMemo(glowTexture, [])
  const geo = useMemo(() => {
    const n = 1800
    const pos = new Float32Array(n * 3)
    for (let i = 0; i < n; i++) {
      const r = 18 + Math.random() * 26
      const t = Math.random() * Math.PI * 2
      const p = Math.acos(2 * Math.random() - 1)
      pos.set([r * Math.sin(p) * Math.cos(t), r * Math.cos(p) * 0.6, r * Math.sin(p) * Math.sin(t)], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    return g
  }, [])
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.008 })
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial map={dustTex} size={0.12} color="#241c17" transparent opacity={0.5} alphaTest={0.01} sizeAttenuation depthWrite={false} />
    </points>
  )
}

function World({ focused, highlight, onFocus, onOpen, onLeaving }: SceneProps) {
  const touch = useMemo(() => matchMedia('(hover: none)').matches, [])
  const group = useRef<THREE.Group>(null)
  const { camera, controls, pointer } = useThree() as unknown as {
    camera: THREE.PerspectiveCamera
    controls: { target: THREE.Vector3; autoRotate: boolean; update: () => void } | null
    pointer: THREE.Vector2
  }
  const reduced = useMemo(prefersReducedMotion, [])
  const glow = useMemo(glowTexture, [])
  const [hovered, setHovered] = useState<string | null>(null)
  const [hoverCluster, setHoverCluster] = useState<Category | null>(null)
  const busy = useRef(false)

  // intro dolly
  useEffect(() => {
    if (reduced) { camera.position.copy(HOME); return }
    gsap.to(camera.position, { x: HOME.x, y: HOME.y, z: HOME.z, duration: 2.6, ease: 'expo.out', delay: 0.15 })
  }, [camera, reduced])

  // fly to a focused cluster, or back out
  useEffect(() => {
    if (!controls) return
    const k = focused ? CATEGORIES.indexOf(focused) : -1
    const target = k >= 0 ? clusterPos(k) : new THREE.Vector3(0, 0, 0)
    const out = target.clone().setY(0).normalize()
    const camTo = k >= 0 ? target.clone().add(out.multiplyScalar(8.5)).add(new THREE.Vector3(0, 4.2, 0)) : HOME.clone()
    controls.autoRotate = !focused && !reduced
    const d = reduced ? 0 : 1.3
    gsap.to(controls.target, { x: target.x, y: target.y + (k >= 0 ? 1.6 : 0.4), z: target.z, duration: d, ease: 'power3.inOut', onUpdate: () => controls.update() })
    gsap.to(camera.position, { x: camTo.x, y: camTo.y, z: camTo.z, duration: d, ease: 'power3.inOut' })
  }, [focused, controls, camera, reduced])

  // subtle parallax: the world leans toward the pointer
  useFrame(() => {
    const g = group.current
    if (!g || reduced) return
    g.rotation.x += (pointer.y * 0.05 - g.rotation.x) * 0.05
    g.rotation.z += (-pointer.x * 0.03 - g.rotation.z) * 0.05
  })

  const open = (idea: Idea, world: THREE.Vector3) => {
    if (busy.current) return
    busy.current = true
    onLeaving()
    if (controls) controls.autoRotate = false
    const d = reduced ? 0.01 : 0.95
    const dir = world.clone().sub(camera.position).normalize()
    const stop = world.clone().sub(dir.multiplyScalar(2.2))
    gsap.to(controls!.target, { x: world.x, y: world.y, z: world.z, duration: d, ease: 'power3.inOut', onUpdate: () => controls?.update() })
    gsap.to(camera.position, { x: stop.x, y: stop.y, z: stop.z, duration: d, ease: 'power3.inOut', onComplete: () => onOpen(idea.id) })
  }

  return (
    <>
      {/* no zoom so the wheel scrolls the page; no drag on touch so the page still scrolls */}
      <OrbitControls makeDefault enablePan={false} enableZoom={false} enableRotate={!touch} enableDamping dampingFactor={0.06} autoRotate={!reduced} autoRotateSpeed={0.45} minPolarAngle={Math.PI * 0.32} maxPolarAngle={Math.PI * 0.5} target={[0, 0.4, 0]} />
      <group ref={group}>
        {CATEGORIES.map((cat, k) => (
          <Cluster
            key={cat}
            cat={cat}
            pos={clusterPos(k)}
            glow={glow}
            open={focused === cat || hoverCluster === cat || highlight === cat}
            focused={focused === cat}
            dim={!!focused && focused !== cat}
            hovered={hovered}
            setHovered={setHovered}
            onHoverCluster={setHoverCluster}
            onFocus={() => onFocus(focused === cat ? null : cat)}
            onOpen={open}
          />
        ))}
      </group>
    </>
  )
}

interface ClusterProps {
  cat: Category
  pos: THREE.Vector3
  glow: THREE.Texture
  open: boolean
  focused: boolean
  dim: boolean
  hovered: string | null
  setHovered: (id: string | null) => void
  onHoverCluster: (c: Category | null) => void
  onFocus: () => void
  onOpen: (idea: Idea, world: THREE.Vector3) => void
}

function Cluster({ cat, pos, glow, open, focused, dim, hovered, setHovered, onHoverCluster, onFocus, onOpen }: ClusterProps) {
  const ideas = useMemo(() => IDEAS.filter((i) => i.category === cat), [cat])
  const ink = CATEGORY_INK[cat]
  const tex = useMemo(() => slipTexture(ink), [ink])
  const ref = useRef<THREE.Group>(null)
  const sprite = useRef<THREE.Sprite>(null)
  const label = useRef<HTMLButtonElement>(null)
  const spread = useRef(0.12)
  const world = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }, dt) => {
    const target = focused ? 0.4 : open ? 0.24 : 0.12
    spread.current += (target - spread.current) * Math.min(1, dt * 6)
    if (ref.current) {
      // stacks always face the camera in yaw so labels stay readable
      const yaw = Math.atan2(camera.position.x - pos.x, camera.position.z - pos.z)
      ref.current.rotation.y += (yaw - ref.current.rotation.y) * 0.04
    }
    // a pile on the far side of the ring hides its label so it never sits on the headline
    if (label.current && ref.current) {
      ref.current.getWorldPosition(world)
      const behind = world.distanceTo(camera.position) > camera.position.length() + 1.5
      label.current.style.opacity = dim ? '0.3' : behind && !focused ? '0' : '1'
      label.current.style.pointerEvents = behind && !focused ? 'none' : 'auto'
    }
    if (sprite.current) {
      const m = sprite.current.material as THREE.SpriteMaterial
      m.opacity += ((dim ? 0.05 : open ? 0.32 : 0.18) - m.opacity) * 0.08
    }
  })

  const h = (ideas.length - 1) * 0.12
  return (
    <group position={pos}>
      <sprite ref={sprite} scale={[8, 8, 1]} position={[0, h / 2, -0.5]}>
        <spriteMaterial map={glow} color={ink} transparent opacity={0.18} depthWrite={false} />
      </sprite>
      <group ref={ref}>
        {ideas.map((idea, j) => (
          <Plate
            key={idea.id}
            idea={idea}
            index={j}
            top={j === ideas.length - 1}
            count={ideas.length}
            spread={spread}
            tex={tex}
            dim={dim}
            hovered={hovered === idea.id}
            showLabel={focused}
            onOver={(e) => { e.stopPropagation(); setHovered(idea.id); onHoverCluster(cat); document.body.style.cursor = 'pointer' }}
            onOut={() => { setHovered(null); onHoverCluster(null); document.body.style.cursor = '' }}
            onClick={(e) => {
              e.stopPropagation()
              if (!focused) { onFocus(); return }
              const w = new THREE.Vector3()
              e.object.getWorldPosition(w)
              onOpen(idea, w)
            }}
          />
        ))}
        <Html position={[0, -0.9, 0]} center zIndexRange={[20, 0]}>
          <button
            ref={label}
            className="cluster-label"
            onClick={onFocus}
            onPointerEnter={() => onHoverCluster(cat)}
            onPointerLeave={() => onHoverCluster(null)}
          >
            <span className="dot" style={{ background: ink }} />
            {cat}
            <em>{ideas.length}</em>
          </button>
        </Html>
      </group>
    </group>
  )
}

interface PlateProps {
  idea: Idea
  index: number
  top: boolean
  count: number
  spread: React.MutableRefObject<number>
  tex: THREE.Texture
  dim: boolean
  hovered: boolean
  showLabel: boolean
  onOver: (e: ThreeEvent<PointerEvent>) => void
  onOut: () => void
  onClick: (e: ThreeEvent<MouseEvent>) => void
}

function Plate({ idea, index, top, spread, tex, dim, hovered, showLabel, onOver, onOut, onClick }: PlateProps) {
  const mesh = useRef<THREE.Mesh>(null)
  // slips in a pile never line up perfectly
  const jitter = useMemo(() => {
    const r = (n: number) => (Math.sin((index + 1) * n * 12.9898) * 43758.5453) % 1
    return { yaw: r(1.3) * 0.35, x: r(2.1) * 0.12, z: r(3.7) * 0.12 }
  }, [index])
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: tex,
        color: new THREE.Color(top ? '#ffffff' : '#f4efe6'),
        emissive: new THREE.Color('#fd461a'),
        emissiveIntensity: 0,
        roughness: 0.92,
        metalness: 0,
        transparent: true,
        opacity: 1,
      }),
    [tex, top],
  )

  useFrame((_, dt) => {
    const m = mesh.current
    if (!m) return
    const k = Math.min(1, dt * 8)
    const y = index * spread.current
    m.position.y += (y - m.position.y) * k
    m.position.x += ((hovered ? 0.7 : jitter.x) - m.position.x) * k
    m.position.z = jitter.z
    m.rotation.y = jitter.yaw
    mat.emissiveIntensity += ((hovered ? 0.12 : 0) - mat.emissiveIntensity) * k
    mat.opacity += ((dim ? 0.25 : 1) - mat.opacity) * k
  })

  return (
    <mesh ref={mesh} geometry={slipGeo} material={mat} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
      {(hovered || showLabel) && (
        <Html position={[1.15, 0, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[30, 0]}>
          <div className="plate-label" data-hot={hovered || undefined}>
            <strong>{idea.title}</strong>
            {hovered && <span>{idea.pitch}</span>}
          </div>
        </Html>
      )}
    </mesh>
  )
}
