"use client";

import { useEffect, useRef } from "react";

/** Big statement whose words light up one by one as you scroll through it. */
export default function Statement({ text, accent }: { text: string; accent: string }) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const words = [...el.querySelectorAll<HTMLSpanElement>(".w")];
    let raf = 0;
    const update = () => {
      raf = 0;
      const vh = window.innerHeight;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.35)));
      const n = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("on", i < n));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  const render = (s: string, isAccent: boolean) =>
    s.split(" ").map((w, i) => (
      <span key={`${isAccent}-${i}`}>
        <span className={`w${isAccent ? " accent" : ""}`}>{w}</span>{" "}
      </span>
    ));

  return (
    <p
      ref={ref}
      className="statement mt-6 text-balance max-w-[1000px] font-head text-h2 leading-[1.18]"
    >
      {render(text, false)}
      {render(accent, true)}
    </p>
  );
}
