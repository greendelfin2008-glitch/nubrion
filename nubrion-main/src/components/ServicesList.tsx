"use client";

import { useEffect, useRef, useState } from "react";
import { DEMO_EVENT, type OrbShape } from "@/lib/heroState";
import { scrollToEl } from "@/lib/smoothScroll";

const services: { tag: string; demo: string; shape: OrbShape; title: string; text: string }[] = [
  {
    tag: "Infrastruktura",
    demo: "infra",
    shape: "servers",
    title: "Lokálně, nebo v cloudu, podle toho, co váš byznys potřebuje.",
    text: "Citlivá data mohou zůstat na vašich vlastních serverech. Jinde dává smysl škálovatelnost cloudu. Navrhneme a nasadíme variantu, která sedí vám, ne nám.",
  },
  {
    tag: "Data a procesy",
    demo: "data",
    shape: "bars",
    title: "Data, která dávají smysl. Procesy, které netrvají věčnost.",
    text: "Pomůžeme zpřehlednit data a najít místa, kde AI zrychlí výpočty, sníží chybovost a ušetří hodiny ruční práce.",
  },
  {
    tag: "Agenda a komunikace",
    demo: "mail",
    shape: "mail",
    title: "Schůzky, e-maily a kalendář, které se domluví samy.",
    text: "Propojíme AI s poštou, Outlookem a kalendářem tak, aby plánování schůzek a třídění zpráv přestalo být vaše denní starost.",
  },
];

/**
 * Three areas as tall rows. On desktop the companion orb sits in a sticky slot
 * at mid-screen and takes the shape of the row that crosses the middle; on
 * mobile every row has its own small slot.
 */
export default function ServicesList() {
  const [active, setActive] = useState(0);
  const rows = useRef<(HTMLElement | null)[]>([]);

  // the row under the middle of the screen wins, driven purely by scroll
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const line = window.innerHeight / 2;
      let best = 0;
      let bestD = Infinity;
      rows.current.forEach((r, i) => {
        if (!r) return;
        const b = r.getBoundingClientRect();
        const d = b.top <= line && b.bottom >= line ? 0 : Math.min(Math.abs(b.top - line), Math.abs(b.bottom - line));
        if (d < bestD) [best, bestD] = [i, d];
      });
      setActive(best);
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

  const runDemo = (key: string) => {
    window.dispatchEvent(new CustomEvent(DEMO_EVENT, { detail: key }));
    scrollToEl(document.getElementById("top"));
  };

  return (
    <div className="mt-14 grid lg:grid-cols-[1fr_380px] lg:gap-16 2xl:grid-cols-[1fr_440px]">
      <div className="hidden lg:order-last lg:block">
        <div className="sticky top-[calc(50svh-190px)] 2xl:top-[calc(50svh-220px)]">
          <div data-orb={services[active].shape} aria-hidden="true" className="aspect-square w-full" />
        </div>
      </div>

      <div>
        {services.map((s, i) => (
          <article
            key={s.tag}
            ref={(el) => {
              rows.current[i] = el;
            }}
            data-reveal
            className="group relative border-t border-white/10 py-10 last:border-b lg:flex lg:min-h-[60svh] lg:flex-col lg:justify-center lg:py-16"
          >
            <span
              aria-hidden="true"
              className={`absolute left-0 top-[-1px] h-px bg-gold transition-[width] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${active === i ? "w-full" : "w-0"}`}
            />
            <div data-orb={s.shape} aria-hidden="true" className="mx-auto mb-6 aspect-square w-[180px] lg:hidden" />
            <p className={`text-sm font-semibold transition-colors duration-500 ${active === i ? "text-gold" : "text-muted"}`}>{s.tag}</p>
            <h3
              className={`mt-3 max-w-[22ch] text-h3 font-semibold transition-colors duration-500 ${
                active === i ? "text-text" : "text-text/45"
              }`}
            >
              {s.title}
            </h3>
            <p className="mt-4 max-w-[56ch] text-body text-muted">{s.text}</p>
            <button
              type="button"
              onClick={() => runDemo(s.demo)}
              className="mt-6 inline-flex min-h-11 items-center gap-2 self-start rounded-lg border border-gold-line px-4 py-2 text-sm font-semibold text-text transition-colors hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
            >
              <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor"><path d="M4 2.5v11l9-5.5z" /></svg>
              Přehrát ukázku
            </button>
          </article>
        ))}
      </div>
    </div>
  );
}
