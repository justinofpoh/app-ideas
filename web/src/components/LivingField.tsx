import { useEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/motion'

// Paper with a slow watercolour wash behind the library and constellation.
// Raw WebGL, one draw call at 40% resolution. The pigment eases toward the
// category being explored and blooms a little where the pointer rests.
const FRAG = `
precision mediump float;
uniform vec2 uRes; uniform float uTime; uniform vec2 uPointer; uniform vec3 uInk;
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }
void main(){
  vec2 uv = gl_FragCoord.xy / uRes; vec2 p = uv; p.x *= uRes.x/uRes.y;
  float t = uTime*.02;
  vec2 q = vec2(fbm(p*1.4+t), fbm(p*1.4-t+4.2));
  float wash = fbm(p*1.1 + q*1.6);
  vec2 m = uPointer; m.x *= uRes.x/uRes.y;
  float bloom = smoothstep(.6, 0., distance(p, m + (q-.5)*.25));
  vec3 paper = vec3(.949,.925,.886);
  // pigment pools at the edges of the wash, like dried watercolour
  float edge = smoothstep(.52,.58,wash) - smoothstep(.58,.75,wash);
  float body = smoothstep(.5,.85,wash);
  float amt = body*.10 + edge*.07 + bloom*.08*(.5+wash);
  vec3 col = mix(paper, uInk, amt);
  float grain = hash(gl_FragCoord.xy*1.7) - .5;
  col += grain*.018;
  gl_FragColor = vec4(col, 1.);
}`
const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a,0.,1.); }`

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

export function LivingField({ ink }: { ink: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const target = useRef(hex(ink))
  target.current = hex(ink)

  useEffect(() => {
    const canvas = ref.current!
    const gl = canvas.getContext('webgl', { antialias: false, alpha: false })
    if (!gl) return
    const sh = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s }
    const prog = gl.createProgram()!
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog)
    gl.useProgram(prog)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    const u = (n: string) => gl.getUniformLocation(prog, n)
    const uRes = u('uRes'), uTime = u('uTime'), uPointer = u('uPointer'), uInk = u('uInk')

    const scale = 0.4
    const resize = () => {
      canvas.width = Math.max(2, Math.floor(innerWidth * scale))
      canvas.height = Math.max(2, Math.floor(innerHeight * scale))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    resize()
    addEventListener('resize', resize)
    const pointer = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 }
    const onMove = (e: PointerEvent) => { pointer.tx = e.clientX / innerWidth; pointer.ty = 1 - e.clientY / innerHeight }
    addEventListener('pointermove', onMove)

    const c = [...target.current]
    let raf = 0
    const start = performance.now()
    const still = prefersReducedMotion()
    const frame = (now: number) => {
      for (let i = 0; i < 3; i++) c[i] += (target.current[i] - c[i]) * 0.03
      pointer.x += (pointer.tx - pointer.x) * 0.04
      pointer.y += (pointer.ty - pointer.y) * 0.04
      gl.uniform2f(uRes, canvas.width, canvas.height)
      gl.uniform1f(uTime, still ? 20 : (now - start) / 1000)
      gl.uniform2f(uPointer, pointer.x, pointer.y)
      gl.uniform3f(uInk, c[0], c[1], c[2])
      gl.drawArrays(gl.TRIANGLES, 0, 3)
      if (!document.hidden) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    const onVis = () => { if (!document.hidden) { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame) } }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      cancelAnimationFrame(raf)
      removeEventListener('resize', resize)
      removeEventListener('pointermove', onMove)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return <canvas ref={ref} className="living-field" aria-hidden="true" />
}
