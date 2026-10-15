"use client";

import { animate, createScope, createTimeline, spring, type Scope } from "animejs";
import { useCallback, useEffect, useRef, useState } from "react";
import HeroDemo from "./HeroDemo";
import { heroState, motionEnabled, prefersReducedMotion, type OrbShape } from "@/lib/heroState";

const HEADLINE = "AI, která ve firmě opravdu běží";
// where the typed headline breaks (index after which a line ends)
const BREAKS = [9, 18];

/** [start, end) of each headline line, split at BREAKS. */
const lines = (s: string) =>
  [0, ...BREAKS.map((b) => b + 1), s.length + 1].slice(0, -1).map((from, i, a) => [from, (a[i + 1] ?? s.length + 1) - 1] as const);

export default function Hero() {
  const root = useRef<HTMLElement>(null);
  const scope = useRef<Scope | null>(null);
  const [typed, setTyped] = useState(HEADLINE.length);
  const [shape, setShape] = useState<OrbShape>("sphere");
  const onShape = useCallback((s: OrbShape) => setShape(s), []);

  useEffect(() => {
    if (!motionEnabled()) {
      heroState.reveal = 1;
      return;
    }
    (window as unknown as { __motion: boolean }).__motion = true;

    // the headline types itself, like the console next to it
    let n = 0;
    let typer: ReturnType<typeof setInterval> | undefined;
    const startTyping = setTimeout(() => {
      setTyped(0);
      typer = setInterval(() => {
        setTyped(++n);
        if (n >= HEADLINE.length) clearInterval(typer);
      }, 42);
    }, 380);

    scope.current = createScope({ root }).add(() => {
      animate(heroState, { reveal: [0, 1], duration: 3200, delay: 200, ease: "outQuart" });
      createTimeline({ defaults: { ease: "outExpo" } })
        .add('[data-hero="badge"]', { opacity: [0, 1], x: [-16, 0], duration: 1000 }, 200)
        .add('[data-hero="title"]', { opacity: [0, 1], duration: 300 }, 400)
        .add('[data-hero="lead"]', { opacity: [0, 1], y: [16, 0], duration: 1200 }, 1500)
        .add('[data-hero="actions"]', { opacity: [0, 1], y: [16, 0], duration: 1200 }, 1650)
        .add('[data-hero="demo"]', { opacity: [0, 1], y: [30, 0], ease: spring({ bounce: 0.2, duration: 1000 }) }, 1300)
        .add('[data-hero="hint"]', { opacity: [0, 1], duration: 1000 }, 2600);
    });

    return () => {
      clearTimeout(startTyping);
      clearInterval(typer);
      scope.current?.revert();
    };
  }, []);

  const inhale = (on: boolean) => {
    if (prefersReducedMotion()) return;
    animate(heroState, on
      ? { pulse: 0.9, duration: 900, ease: "outQuart" }
      : { pulse: 0, ease: spring({ bounce: 0.5, duration: 1200 }) });
  };

  return (
    <section ref={root} id="top" className="relative isolate overflow-hidden lg:min-h-svh">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(45% 55% at 72% 40%, rgb(217 164 65 / .12), transparent 70%)," +
            "linear-gradient(180deg, #1b2330 0%, #10151c 85%)",
        }}
      />

      <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-4 pb-16 pt-24 sm:px-8 sm:pt-28 lg:min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10 lg:py-20 2xl:max-w-[1600px] 2xl:gap-16">
        <div>
          <span data-hero="badge" className="inline-flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-[pulse-dot_2s_infinite] rounded-full bg-gold shadow-[0_0_0_4px_rgb(217_164_65/0.14)]" />
            Nubrion právě vzniká
          </span>

          <h1
            data-hero="title"
            aria-label={HEADLINE}
            className="mb-8 mt-6 text-display font-semibold"
          >
            <span aria-hidden="true">
              {lines(HEADLINE).map(([from, to], i) => (
                <span key={i} className="block whitespace-nowrap">
                  {HEADLINE.slice(from, Math.min(to, typed))}
                  {typed >= from && typed <= to && (
                    <span className="relative">
                      <span className="absolute left-[0.06em] top-[0.1em] h-[0.8em] w-[0.09em] animate-[blink_1.1s_steps(1)_infinite] bg-gold" />
                    </span>
                  )}
                  <span className="opacity-0">{HEADLINE.slice(Math.max(from, Math.min(to, typed)), to)}</span>
                </span>
              ))}
            </span>
          </h1>

          <p data-hero="lead" className="max-w-[34ch] text-lead text-[#c4cad4]">
            Budujeme systém, který pomáhá firmám nasadit AI tam, kde má reálný dopad, ne jen v prezentaci.
          </p>

          <div data-hero="actions" className="mt-9 flex flex-wrap gap-3 2xl:mt-11">
            <a
              href="#kontakt"
              data-magnetic
              onMouseEnter={() => inhale(true)}
              onMouseLeave={() => inhale(false)}
              className="btn btn-gold grow sm:grow-0"
            >
              Rezervovat konzultaci
            </a>
            <a href="#co-delame" data-magnetic className="btn btn-ghost grow sm:grow-0">
              Co děláme
            </a>
          </div>
        </div>

        {/* the live part: the companion orb does the work, the console logs it */}
        <div className="relative flex flex-col items-center">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[38%] -z-10 aspect-square w-[130%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(217_164_65/.2),rgb(217_164_65/.05)_55%,transparent)]"
          />
          <div data-orb={shape} aria-hidden="true" className="aspect-square w-full max-w-[min(300px,62svh)] sm:max-w-[min(400px,62svh)] lg:max-w-[min(440px,42svh)] 2xl:max-w-[min(600px,46svh)]" />
          <div className="relative z-10 -mt-6 w-full max-w-[560px] lg:-mt-12 2xl:-mt-16 2xl:max-w-[620px]">
            <HeroDemo onShape={onShape} />
          </div>
          <p data-hero="hint" className="mt-3 hidden text-center text-sm text-muted/70 lg:block [@media(max-height:860px)]:lg:hidden">
            Pohněte kurzorem přes částice. Kliknutím je rozvíříte.
          </p>
        </div>
      </div>
    </section>
  );
}
