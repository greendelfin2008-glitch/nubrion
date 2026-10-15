"use client";
/* eslint-disable react-hooks/immutability -- three.js buffers and uniforms are mutated every frame by design */

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { heroState, prefersReducedMotion, type OrbShape } from "@/lib/heroState";
import {
  barsPoints,
  cloudPoints,
  createPointGeometry,
  createPointMaterial,
  envelopePoints,
  glowTexture,
  logoPoints,
  serversPoints,
  spherePoints,
} from "./pointMaterial";

const SHAPES: Record<OrbShape, { make: (n: number) => Float32Array; extent: number; amp: number }> = {
  sphere: { make: spherePoints, extent: 3.9, amp: 0.2 },
  mail: { make: envelopePoints, extent: 4.0, amp: 0.05 },
  bars: { make: barsPoints, extent: 4.3, amp: 0.04 },
  servers: { make: serversPoints, extent: 4.0, amp: 0.04 },
  cloud: { make: cloudPoints, extent: 3.7, amp: 0.06 },
  logo: { make: logoPoints, extent: 4.4, amp: 0.02 },
};
const MORPH_MS = 1500;

/**
 * One particle "companion" for the whole page. It flies to whichever
 * `[data-orb]` anchor is nearest the middle of the viewport and sizes itself to
 * that box. It keeps its current shape while travelling and only morphs into
 * the anchor's shape once it has landed there.
 */
function Orb() {
  const world = useRef<THREE.Group>(null!);
  const tilt = useRef<THREE.Group>(null!);
  const spin = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.Sprite>(null!);
  const pointer = useRef({ x: 0, y: 0, ndcX: 9, ndcY: 9, inside: 0, burst: 0 });
  const follow = useRef({ x: 0, y: 0, s: 0.5, ready: false });
  const morph = useRef<{ shape: OrbShape; start: number }>({ shape: "sphere", start: -99 });
  const anchors = useRef<HTMLElement[]>([]);
  const { gl, size, viewport } = useThree();

  const { mat, geo, tex, targets } = useMemo(() => {
    const count = window.innerWidth < 700 ? 4200 : window.innerWidth < 1600 ? 8000 : 11000;
    const targets = new Map<OrbShape, Float32Array>();
    const target = (s: OrbShape) => {
      if (!targets.has(s)) targets.set(s, SHAPES[s].make(count));
      return targets.get(s)!;
    };
    return {
      mat: createPointMaterial({ size: 26, amp: 0.2 }),
      geo: createPointGeometry(target("sphere")),
      tex: glowTexture(),
      targets: target,
    };
  }, []);

  useEffect(() => {
    const p = pointer.current;
    const onMove = (e: PointerEvent) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.y = (e.clientY / window.innerHeight) * 2 - 1;
      p.ndcX = p.x;
      p.ndcY = -p.y;
      p.inside = e.pointerType === "mouse" ? 1 : 0;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      if (!(e.target as Element).closest("a,button,input,[role=tab]")) p.burst = 1;
    };
    const onLeave = () => (p.inside = 0);
    const collect = () => (anchors.current = [...document.querySelectorAll<HTMLElement>("[data-orb]")]);
    collect();
    const mo = new MutationObserver(collect);
    mo.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      mo.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      mat.dispose();
      geo.dispose();
      tex.dispose();
    };
  }, [mat, geo, tex]);

  /** Freeze the current in-between state as the new start, then aim at `shape`. */
  const retarget = (shape: OrbShape, now: number) => {
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const tgt = geo.attributes.aTarget as THREE.BufferAttribute;
    const rnd = geo.attributes.aRandom as THREE.BufferAttribute;
    const m = mat.uniforms.uMorph.value as number;
    const a = pos.array as Float32Array, b = tgt.array as Float32Array, r = rnd.array as Float32Array;
    for (let i = 0; i < r.length; i++) {
      const x = Math.min(1, Math.max(0, m * 1.5 - r[i] * 0.5));
      const k = x * x * (3 - 2 * x);
      for (let j = i * 3; j < i * 3 + 3; j++) a[j] += (b[j] - a[j]) * k;
    }
    b.set(targets(shape));
    pos.needsUpdate = tgt.needsUpdate = true;
    mat.uniforms.uMorph.value = 0;
    morph.current = { shape, start: now };
  };

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const p = pointer.current;
    const f = follow.current;
    const u = mat.uniforms;

    // ---- pick the anchor closest to the reading line
    const vh = window.innerHeight;
    let best: HTMLElement | null = null;
    let bestRect: DOMRect | null = null;
    let bestD = Infinity;
    for (const el of anchors.current) {
      const r = el.getBoundingClientRect();
      if (!r.width) continue;
      const d = Math.abs(r.top + r.height / 2 - vh * 0.45);
      if (d < bestD) [best, bestRect, bestD] = [el, r, d];
    }

    const wanted = (best?.dataset.orb as OrbShape) || "sphere";
    const reduced = prefersReducedMotion();
    const ppu = size.height / viewport.height;

    // ---- glide toward the anchor (kept on screen while travelling)
    let landed = !bestRect;
    if (bestRect) {
      const cx = bestRect.left + bestRect.width / 2;
      const rawCy = bestRect.top + bestRect.height / 2;
      // tall screens keep the orb in view while it travels; short (landscape) ones let it
      // slip past the edge so it never parks on top of the text
      const [lo, hi] = vh < 560 ? [-vh * 0.25, vh * 1.25] : [vh * 0.1, vh * 0.9];
      const cy = Math.min(Math.max(rawCy, lo), hi);
      const tx = (cx - size.width / 2) / ppu;
      const ty = -(cy - size.height / 2) / ppu;
      const ts = bestRect.width / (SHAPES[morph.current.shape].extent * ppu);
      const k = f.ready && !reduced ? 1 - Math.exp(-dt * 5) : 1;
      f.x += (tx - f.x) * k;
      f.y += (ty - f.y) * k;
      f.s += (ts - f.s) * k;
      f.ready = true;
      // landed = the anchor is really on screen and the orb has (almost) reached it
      const gap = Math.hypot(tx - f.x, ty - f.y) * ppu;
      landed = cy === rawCy && gap < Math.max(36, bestRect.width * 0.12);
    }
    world.current.position.set(f.x, f.y, 0);
    world.current.scale.setScalar(f.s);

    if (wanted in SHAPES && wanted !== morph.current.shape && (landed || reduced)) retarget(wanted, t);
    const shape = morph.current.shape;
    u.uMorph.value = reduced ? 1 : Math.min(1, ((t - morph.current.start) * 1000) / MORPH_MS);

    // ---- uniforms: dim and shrink points for small slots, enlarge them for big ones
    const px = f.s * SHAPES[shape].extent * ppu;
    const small = Math.min(1, Math.max(0.25, px / 420));
    const big = Math.min(1.45, Math.max(1, px / 520));
    p.burst *= Math.exp(-dt * 2.2);
    u.uTime.value = t;
    u.uReveal.value = heroState.reveal;
    u.uPulse.value = heroState.pulse;
    u.uPixelRatio.value = gl.getPixelRatio() * (0.45 + 0.55 * small) * big;
    u.uAlpha.value = 0.4 + 0.6 * small;
    u.uAmp.value += (SHAPES[shape].amp - u.uAmp.value) * Math.min(1, dt * 3);
    u.uMouse.value.set(p.ndcX, p.ndcY);
    u.uHover.value += (p.inside - u.uHover.value) * Math.min(1, dt * 4);
    u.uBurst.value = p.burst;
    u.uAspect.value = size.width / size.height;
    (glow.current.material as THREE.SpriteMaterial).opacity = Math.min(1, heroState.reveal * 1.2) * 0.55 * small;

    // ---- motion: spin while idle, face the viewer when showing something
    if (shape === "sphere") spin.current.rotation.y += dt * 0.09;
    else {
      const rest = Math.round(spin.current.rotation.y / (Math.PI * 2)) * Math.PI * 2 + Math.sin(t * 0.5) * 0.35;
      spin.current.rotation.y += (rest - spin.current.rotation.y) * Math.min(1, dt * 2.5);
    }
    const lean = shape === "sphere" ? 1 : 0.5;
    tilt.current.rotation.y += (p.x * 0.45 * lean - tilt.current.rotation.y) * Math.min(1, dt * 2.5);
    tilt.current.rotation.x += (p.y * 0.3 * lean + Math.sin(t * 0.3) * 0.05 - tilt.current.rotation.x) * Math.min(1, dt * 2.5);
  });

  return (
    <group ref={world}>
      <group ref={tilt}>
        <sprite ref={glow} scale={4.6}>
          <spriteMaterial map={tex} blending={THREE.AdditiveBlending} depthWrite={false} transparent opacity={0} />
        </sprite>
        <group ref={spin}>
          <points geometry={geo} material={mat} frustumCulled={false} />
        </group>
      </group>
    </group>
  );
}

export default function OrbScene() {
  return (
    <div className="pointer-events-none fixed inset-0 z-[5] [&_*]:pointer-events-none" aria-hidden="true">
      <Canvas
        camera={{ fov: 35, position: [0, 0, 8] }}
        dpr={[1, 1.75]}
        style={{ pointerEvents: "none" }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Orb />
      </Canvas>
    </div>
  );
}
