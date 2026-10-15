// Mutable values shared between DOM animations (anime.js) and the WebGL scene.
// Read every frame inside useFrame, so no React state / re-renders involved.
export const heroState = {
  reveal: 0, // 0 → 1 particles fly in
  pulse: 0, // CTA hover makes the orb "inhale"
};

/** Shapes the companion orb can take; set per anchor via `data-orb="<shape>"`. */
export type OrbShape = "sphere" | "mail" | "bars" | "servers" | "cloud" | "logo";

/** Asks the hero demo to play a scenario (used by the service rows). */
export const DEMO_EVENT = "nubrion:demo";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const motionEnabled = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("anim");
