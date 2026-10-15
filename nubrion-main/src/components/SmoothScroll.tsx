"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { prefersReducedMotion } from "@/lib/heroState";
import { smooth } from "@/lib/smoothScroll";

/**
 * Slow, eased wheel scrolling so the companion orb and scroll-driven reveals
 * keep pace with the reader. Touch keeps native scrolling; reduced motion opts out.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const lenis = new Lenis({
      lerp: 0.09, // lower = longer glide (Lenis default 0.1)
      wheelMultiplier: 0.9,
      anchors: { duration: 1.3 },
      autoRaf: true,
    });
    smooth.lenis = lenis;
    return () => {
      smooth.lenis = null;
      lenis.destroy();
    };
  }, []);

  return null;
}
