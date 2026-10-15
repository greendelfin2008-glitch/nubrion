"use client";

import { animate, stagger } from "animejs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Logo } from "./icons";
import { motionEnabled } from "@/lib/heroState";
import { smooth } from "@/lib/smoothScroll";

const links = [
  { href: "#co-delame", label: "Co děláme" },
  { href: "#oblasti", label: "Oblasti" },
  { href: "#prubeh", label: "Jak to probíhá" },
  { href: "#kontakt", label: "Kontakt" },
];

/**
 * Plain top bar: hides while you read downwards, comes back when you scroll up,
 * marks the section you're in and shows reading progress along its bottom edge.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const bar = useRef<HTMLSpanElement>(null);
  const marker = useRef<HTMLSpanElement>(null);
  const linkEls = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const update = () => {
      raf = 0;
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
      setScrolled(y > 24);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 480);
        last = y;
      }
      // active section = last one whose top passed 40 % of the viewport
      const line = window.innerHeight * 0.4;
      let a = -1;
      links.forEach((l, i) => {
        const el = document.querySelector(l.href);
        if (el && el.getBoundingClientRect().top < line) a = i;
      });
      setActive(a);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // gold marker slides under the active link
  useLayoutEffect(() => {
    const m = marker.current;
    const el = linkEls.current[active];
    if (!m) return;
    if (!el) {
      m.style.opacity = "0";
      return;
    }
    m.style.opacity = "1";
    m.style.width = `${el.offsetWidth - 24}px`;
    m.style.transform = `translateX(${el.offsetLeft + 12}px)`;
  }, [active]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) smooth.lenis?.stop();
    else smooth.lenis?.start();
    if (open && motionEnabled())
      animate("[data-mobile-link]", { opacity: [0, 1], y: [24, 0], delay: stagger(60, { start: 80 }), duration: 700, ease: "outExpo" });
  }, [open]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-[cubic-bezier(.16,1,.3,1)] ${
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      } ${
        open ? "border-b border-transparent bg-ink" : scrolled ? "border-b border-white/[0.07] bg-ink/85 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-[1320px] items-center 2xl:max-w-[1600px] gap-8 px-4 sm:px-8">
        <a href="#top" className="mr-auto flex h-11 items-center gap-2.5 font-head text-xl font-semibold tracking-tight" onClick={() => setOpen(false)}>
          <Logo className="h-7 w-7" />
          Nubrion
        </a>

        <div className="relative hidden items-center lg:flex">
          {links.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              ref={(el) => {
                linkEls.current[i] = el;
              }}
              aria-current={active === i ? "location" : undefined}
              className={`px-3 py-3 text-sm transition-colors duration-300 ${active === i ? "text-text" : "text-muted hover:text-text"}`}
            >
              {l.label}
            </a>
          ))}
          <span
            ref={marker}
            aria-hidden="true"
            className="absolute bottom-0 left-0 h-[2px] rounded-full bg-gold opacity-0 transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(.16,1,.3,1)]"
          />
        </div>

        <a href="#kontakt" className="hidden rounded-lg bg-text px-4 py-3 text-sm font-semibold text-ink transition-colors hover:bg-gold lg:inline-block">
          Rezervovat konzultaci
        </a>

        <button
          type="button"
          aria-label={open ? "Zavřít menu" : "Otevřít menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="relative -mr-2 grid h-11 w-11 place-items-center lg:hidden"
        >
          <span className={`absolute h-[1.5px] w-5 bg-text transition-transform duration-300 ${open ? "rotate-45" : "-translate-y-[4px]"}`} />
          <span className={`absolute h-[1.5px] w-5 bg-text transition-transform duration-300 ${open ? "-rotate-45" : "translate-y-[4px]"}`} />
        </button>
      </nav>

      {/* reading progress */}
      <span aria-hidden="true" className="absolute inset-x-0 bottom-[-1px] h-px overflow-hidden">
        <span ref={bar} className="block h-full origin-left scale-x-0 bg-gold/70" />
      </span>

      {open && (
        <div className="flex h-[calc(100svh-64px)] flex-col justify-between gap-6 overflow-y-auto px-4 pb-8 pt-6 sm:px-8 lg:hidden">
          <div className="flex flex-col">
            {links.map((l, i) => (
              <a
                key={l.href}
                href={l.href}
                data-mobile-link
                onClick={() => setOpen(false)}
                className={`border-b border-white/[0.07] py-4 font-head text-h2 font-semibold ${active === i ? "text-gold" : "text-text"}`}
              >
                {l.label}
              </a>
            ))}
          </div>
          <a href="#kontakt" data-mobile-link onClick={() => setOpen(false)} className="btn btn-gold justify-center">
            Rezervovat konzultaci
          </a>
        </div>
      )}
    </header>
  );
}
