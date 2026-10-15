import * as THREE from "three";

const noiseGLSL = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;

/**
 * Soft additive points that morph from `position` to `aTarget` (uMorph 0 → 1,
 * staggered per point), "breathe" via simplex noise and get pushed away from
 * the cursor in screen space.
 */
export function createPointMaterial({ size, amp }: { size: number; amp: number }) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uPixelRatio: { value: 1 },
      uSize: { value: size },
      uAmp: { value: amp },
      uAlpha: { value: 1 },
      uPulse: { value: 0 },
      uMorph: { value: 1 },
      uMouse: { value: new THREE.Vector2(9, 9) },
      uHover: { value: 0 },
      uBurst: { value: 0 },
      uAspect: { value: 1 },
      uColorA: { value: new THREE.Color("#d9a441") },
      uColorB: { value: new THREE.Color("#fff1cf") },
    },
    vertexShader: /* glsl */ `
      uniform float uTime, uReveal, uPixelRatio, uSize, uAmp, uPulse, uMorph, uHover, uBurst, uAspect;
      uniform vec2 uMouse;
      attribute float aRandom;
      attribute vec3 aTarget;
      varying float vNoise; varying float vAlpha; varying float vGlow;
      ${noiseGLSL}
      void main(){
        // staggered morph with a mid-flight bloom outwards
        float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.5 - aRandom * 0.5, 0.0, 1.0));
        vec3 base = mix(position, aTarget, m);
        vec3 dir = normalize(base + vec3(1e-4));
        base += dir * sin(m * 3.14159) * (0.3 + aRandom * 0.9);

        float n = snoise(base * 0.9 + vec3(uTime * 0.22));
        float n2 = snoise(base * 2.4 - vec3(uTime * 0.15)) * 0.35;
        vec3 p = base + dir * (n + n2) * uAmp * (1.0 + uPulse);

        // intro: points gather from a wide cloud
        float r = clamp(uReveal * 1.35 - aRandom * 0.35, 0.0, 1.0);
        r = 1.0 - pow(1.0 - r, 3.0);
        p = mix(p * 2.6 + dir * aRandom, p, r);

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vec4 clip = projectionMatrix * mv;
        vec2 dv = (clip.xy / clip.w - uMouse) * vec2(uAspect, 1.0);
        float radius = 0.13 + uBurst * 0.4;
        float f = smoothstep(radius, 0.0, length(dv)) * max(uHover, uBurst);
        mv.xy += normalize(dv + vec2(1e-5)) * f * (0.3 + uBurst * 0.9) * (0.6 + aRandom);
        mv.z += f * (0.4 + aRandom * 0.8);

        vNoise = n;
        vGlow = f;
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPixelRatio * (0.55 + aRandom * 0.9) * (1.0 + f * 0.8) / -mv.z;
        vAlpha = r * (0.35 + 0.65 * smoothstep(-0.4, 0.8, n));
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA, uColorB; uniform float uAlpha;
      varying float vNoise; varying float vAlpha; varying float vGlow;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        if (d > 0.5) discard;
        float s = pow(1.0 - d * 2.0, 1.8);
        vec3 col = mix(uColorA, uColorB, clamp(smoothstep(0.25, 0.95, vNoise) + vGlow, 0.0, 1.0));
        gl_FragColor = vec4(col, s * (vAlpha + vGlow * 0.6) * uAlpha);
      }`,
  });
}

export function createPointGeometry(positions: Float32Array) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions.slice(), 3));
  geo.setAttribute("aTarget", new THREE.BufferAttribute(positions.slice(), 3));
  const rnd = new Float32Array(positions.length / 3).map(() => Math.random());
  geo.setAttribute("aRandom", new THREE.BufferAttribute(rnd, 1));
  return geo;
}

/* ---------- Morph targets: every generator returns exactly `count` points ---------- */

type V3 = [number, number, number];
type Seg = [V3, V3];

const rand = (s: number) => (Math.random() - 0.5) * s;
const jitter = (p: V3, s: number): V3 => [p[0] + rand(s), p[1] + rand(s), p[2] + rand(s)];
const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

/** Points along line segments, weighted by length. */
function onSegments(segs: Seg[], count: number, jit = 0.03) {
  const lens = segs.map(([a, b]) => Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
  const total = lens.reduce((x, y) => x + y, 0);
  return Array.from({ length: count }, (): V3 => {
    let r = Math.random() * total;
    let k = 0;
    while (r > lens[k] && k < segs.length - 1) r -= lens[k++];
    return jitter(lerp3(segs[k][0], segs[k][1], Math.random()), jit);
  });
}

function boxEdges([cx, cy, cz]: V3, [w, h, d]: V3): Seg[] {
  const x = [cx - w / 2, cx + w / 2], y = [cy - h / 2, cy + h / 2], z = [cz - d / 2, cz + d / 2];
  const c = (i: number, j: number, k: number): V3 => [x[i], y[j], z[k]];
  return [
    [c(0, 0, 0), c(1, 0, 0)], [c(0, 1, 0), c(1, 1, 0)], [c(0, 0, 1), c(1, 0, 1)], [c(0, 1, 1), c(1, 1, 1)],
    [c(0, 0, 0), c(0, 1, 0)], [c(1, 0, 0), c(1, 1, 0)], [c(0, 0, 1), c(0, 1, 1)], [c(1, 0, 1), c(1, 1, 1)],
    [c(0, 0, 0), c(0, 0, 1)], [c(1, 0, 0), c(1, 0, 1)], [c(0, 1, 0), c(0, 1, 1)], [c(1, 1, 0), c(1, 1, 1)],
  ];
}

/** Uniform points inside box volumes, spread by volume. */
function inBoxes(boxes: { c: V3; s: V3 }[], count: number) {
  const vols = boxes.map(({ s }) => s[0] * s[1] * s[2]);
  const total = vols.reduce((a, b) => a + b, 0);
  return Array.from({ length: count }, (): V3 => {
    let r = Math.random() * total;
    let k = 0;
    while (r > vols[k] && k < boxes.length - 1) r -= vols[k++];
    const { c, s } = boxes[k];
    return [c[0] + rand(s[0]), c[1] + rand(s[1]), c[2] + rand(s[2])];
  });
}

const pack = (pts: V3[]) => new Float32Array(pts.flat());

export function spherePoints(count: number, radius = 1.5) {
  const golden = Math.PI * (3 - Math.sqrt(5));
  return pack(
    Array.from({ length: count }, (_, i): V3 => {
      const y = 1 - (i / (count - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = golden * i;
      return [Math.cos(th) * r * radius, y * radius, Math.sin(th) * r * radius];
    }),
  );
}

/** An envelope: frame, flap and a soft paper fill. */
export function envelopePoints(count: number) {
  const w = 1.6, h = 1.05;
  const tl: V3 = [-w, h, 0], tr: V3 = [w, h, 0], bl: V3 = [-w, -h, 0], br: V3 = [w, -h, 0], mid: V3 = [0, -0.15, 0.1];
  const lines = onSegments(
    [[tl, tr], [tr, br], [br, bl], [bl, tl], [tl, mid], [mid, tr], [bl, [-0.5, 0.2, 0.05]], [br, [0.5, 0.2, 0.05]]],
    Math.floor(count * 0.72),
    0.05,
  );
  return pack([...lines, ...inBoxes([{ c: [0, 0, 0], s: [w * 2, h * 2, 0.25] }], count - lines.length)]);
}

/** A 3D bar chart rising left to right, with a baseline. */
export function barsPoints(count: number) {
  const boxes = [0.85, 1.3, 1.05, 1.85, 2.6].map((hgt, i) => ({ c: [-1.36 + i * 0.68, -1.3 + hgt / 2, 0] as V3, s: [0.42, hgt, 0.42] as V3 }));
  const segs: Seg[] = boxes.flatMap(({ c, s }) => boxEdges(c, s));
  segs.push([[-1.75, -1.3, 0.4], [1.75, -1.3, 0.4]]);
  const lines = onSegments(segs, Math.floor(count * 0.72), 0.035);
  return pack([...lines, ...inBoxes(boxes, count - lines.length)]);
}

/** Three stacked server units with status lights. */
export function serversPoints(count: number) {
  const units = [0.88, 0, -0.88].map((y) => ({ c: [0, y, 0] as V3, s: [2.8, 0.62, 1.5] as V3 }));
  const lines = onSegments(units.flatMap(({ c, s }) => boxEdges(c, s)), Math.floor(count * 0.55), 0.03);
  const leds = Array.from({ length: Math.floor(count * 0.12) }, (_, i): V3 =>
    jitter([-1.1 + Math.floor(Math.random() * 3) * 0.2, units[i % 3].c[1], 0.78], 0.06),
  );
  const vents = onSegments(units.map(({ c }): Seg => [[0.05, c[1], 0.76], [1.2, c[1], 0.76]]), Math.floor(count * 0.1), 0.02);
  const rest = count - lines.length - leds.length - vents.length;
  return pack([...lines, ...leds, ...vents, ...inBoxes(units, rest)]);
}

/** A cloud silhouette: outer arcs of three circles over a flat base. */
export function cloudPoints(count: number) {
  const circles: [number, number, number][] = [[-0.85, -0.15, 0.72], [0.05, 0.3, 1.0], [0.95, -0.2, 0.66]];
  const base = -0.86;
  const inside = (x: number, y: number, skip: number) =>
    circles.some(([cx, cy, r], k) => k !== skip && Math.hypot(x - cx, y - cy) < r - 0.01);
  const outline: V3[] = [];
  const nOutline = Math.floor(count * 0.55);
  while (outline.length < nOutline) {
    const k = Math.floor(Math.random() * 3);
    const [cx, cy, r] = circles[k];
    const a = Math.random() * Math.PI * 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (y >= base && !inside(x, y, k)) outline.push(jitter([x, y, 0], 0.05));
  }
  const baseLine = onSegments([[[-0.85, base, 0], [0.95, base, 0]]], Math.floor(count * 0.1), 0.05);
  const fill: V3[] = [];
  while (fill.length < count - outline.length - baseLine.length) {
    const x = rand(3.4), y = rand(2.6);
    if (y >= base && inside(x, y, -1)) fill.push([x, y, rand(0.6)]);
  }
  return pack([...outline, ...baseLine, ...fill]);
}

/** The Nubrion mark: rounded square with an N, same geometry as the SVG logo. */
export function logoPoints(count: number) {
  const s = 1.6, rc = 0.48;
  const segs: Seg[] = [
    [[-s + rc, s, 0], [s - rc, s, 0]], [[-s + rc, -s, 0], [s - rc, -s, 0]],
    [[-s, -s + rc, 0], [-s, s - rc, 0]], [[s, -s + rc, 0], [s, s - rc, 0]],
  ];
  const corners: [number, number, number][] = [[s - rc, s - rc, 0], [-s + rc, s - rc, Math.PI / 2], [-s + rc, -s + rc, Math.PI], [s - rc, -s + rc, -Math.PI / 2]];
  corners.forEach(([cx, cy, a0]) => {
    for (let i = 0; i < 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2), b = a0 + ((i + 1) / 6) * (Math.PI / 2);
      segs.push([[cx + Math.cos(a) * rc, cy + Math.sin(a) * rc, 0], [cx + Math.cos(b) * rc, cy + Math.sin(b) * rc, 0]]);
    }
  });
  const frame = onSegments(segs, Math.floor(count * 0.4), 0.05);
  const n = 0.64;
  const letter = onSegments([[[-n, -n, 0], [-n, n, 0]], [[-n, n, 0], [n, -n, 0]], [[n, -n, 0], [n, n, 0]]], count - frame.length, 0.09);
  return pack([...frame, ...letter]);
}

export function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,225,160,0.9)");
  grd.addColorStop(0.25, "rgba(217,164,65,0.45)");
  grd.addColorStop(0.6, "rgba(217,164,65,0.08)");
  grd.addColorStop(1, "rgba(217,164,65,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}
