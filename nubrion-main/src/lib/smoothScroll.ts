import type Lenis from "lenis";

// The page-wide Lenis instance, or null when smooth scrolling is off.
export const smooth: { lenis: Lenis | null } = { lenis: null };

/** Glides to an element, falling back to native smooth scrolling. */
export const scrollToEl = (el: HTMLElement | null) => {
  if (!el) return;
  if (smooth.lenis) smooth.lenis.scrollTo(el, { duration: 1.3 });
  else el.scrollIntoView({ behavior: "smooth" });
};
