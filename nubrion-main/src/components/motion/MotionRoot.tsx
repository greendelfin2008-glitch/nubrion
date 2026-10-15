"use client";

import { animate, createScope, remove, spring, stagger, type Scope } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";
import { motionEnabled } from "@/lib/heroState";

/**
 * Declarative motion for server-rendered sections:
 *  data-reveal   – fades/slides in when scrolled into view (batched + staggered)
 *  data-corner   – corner markers pop in with their revealed parent
 *  data-pop      – icon springs in with its revealed parent
 *  data-bob      – gentle endless float
 *  data-magnetic – element is pulled toward the cursor
 *  data-tilt     – 3D tilt + cursor spotlight on hover
 */
export default function MotionRoot({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const scope = useRef<Scope | null>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !motionEnabled()) return;
    (window as unknown as { __motion: boolean }).__motion = true;
    const cleanups: (() => void)[] = [];
    const $$ = <T extends Element = HTMLElement>(s: string, r: ParentNode = el) => [...r.querySelectorAll<T & Element>(s)];

    scope.current = createScope({ root }).add(() => {
      $$("[data-bob]").forEach((g, i) => {
        animate(g, {
          y: [-5, 7],
          rotate: [-1.5, 1.5],
          alternate: true,
          loop: true,
          duration: 2600 + i * 450,
          delay: i * 300,
          ease: "inOutSine",
        });
      });
    });

    // Scroll reveals: anything whose top has crossed 94 % of the viewport is revealed.
    // Checked on scroll rather than with IntersectionObserver, which only reports
    // state changes and so misses elements skipped by a fast jump (End key, scrollbar drag).
    let pending = $$("[data-reveal]");
    let raf = 0;
    const reveal = () => {
      raf = 0;
      const line = window.innerHeight * 0.94;
      const els = pending.filter((t) => t.getBoundingClientRect().top < line);
      if (!els.length) return;
      pending = pending.filter((t) => !els.includes(t));
      animate(els, {
        opacity: [0, 1],
        y: [50, 0],
        scale: [0.97, 1],
        duration: 1500,
        delay: stagger(120),
        ease: "outQuint",
        onComplete: () =>
          els.forEach((t) => {
            t.style.transform = "";
            t.dataset.revealed = "1";
          }),
      });
      els.forEach((t, i) => {
        const corners = $$("[data-corner]", t);
        if (corners.length)
          animate(corners, { scale: [0, 1], rotate: [90, 0], delay: stagger(70, { start: 450 + i * 120 }), duration: 900, ease: "outBack(1.7)" });
        const pop = $$("[data-pop]", t);
        if (pop.length)
          animate(pop, { scale: [0.4, 1], rotate: [-20, 0], delay: 300 + i * 120, ease: spring({ bounce: 0.45, duration: 900 }) });
      });
      if (!pending.length) window.removeEventListener("scroll", onScroll);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(reveal);
    };
    reveal();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    });

    // Pointer-only micro-interactions
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      $$("[data-magnetic]", document).forEach((btn) => {
        const move = (e: MouseEvent) => {
          const r = btn.getBoundingClientRect();
          remove(btn);
          animate(btn, {
            x: (e.clientX - r.left - r.width / 2) * 0.35,
            y: (e.clientY - r.top - r.height / 2) * 0.45,
            duration: 500,
            ease: "outQuart",
          });
        };
        const leave = () => {
          remove(btn);
          animate(btn, { x: 0, y: 0, ease: spring({ bounce: 0.55, duration: 900 }) });
        };
        btn.addEventListener("mousemove", move);
        btn.addEventListener("mouseleave", leave);
        cleanups.push(() => {
          btn.removeEventListener("mousemove", move);
          btn.removeEventListener("mouseleave", leave);
        });
      });

      $$("[data-tilt]").forEach((card) => {
        const move = (e: MouseEvent) => {
          if (!card.dataset.revealed) return;
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width - 0.5;
          const py = (e.clientY - r.top) / r.height - 0.5;
          card.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
          card.style.setProperty("--my", `${(py + 0.5) * 100}%`);
          remove(card);
          animate(card, { rotateY: px * 8, rotateX: -py * 8, y: -6, duration: 700, ease: "outQuart" });
        };
        const leave = () => {
          if (!card.dataset.revealed) return;
          remove(card);
          animate(card, { rotateY: 0, rotateX: 0, y: 0, ease: spring({ bounce: 0.4, duration: 1000 }) });
        };
        card.addEventListener("mousemove", move);
        card.addEventListener("mouseleave", leave);
        cleanups.push(() => {
          card.removeEventListener("mousemove", move);
          card.removeEventListener("mouseleave", leave);
        });
      });
    }

    return () => {
      cleanups.forEach((fn) => fn());
      scope.current?.revert();
    };
  }, []);

  return <div ref={root}>{children}</div>;
}
