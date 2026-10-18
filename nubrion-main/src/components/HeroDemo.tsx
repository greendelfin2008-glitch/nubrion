"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEMO_EVENT, prefersReducedMotion, type OrbShape } from "@/lib/heroState";

type Line = { text: string; detail: string };
type Scenario = { key: string; tab: string; shape: OrbShape; task: string; lines: Line[]; result: ReactNode };

const SCENARIOS: Scenario[] = [
  {
    key: "mail",
    tab: "Pošta",
    shape: "mail",
    task: "Vyřiď novou poptávku",
    lines: [
      { text: "Nový e-mail: poptávka od Novák Stavby", detail: "08:42" },
      { text: "Rozpoznáno: 40 ks, dodání do pátku", detail: "0,4 s" },
      { text: "Předáno obchodu s vysokou prioritou", detail: "Jana K." },
      { text: "Volný termín v kalendáři: čt 14:00", detail: "Outlook" },
    ],
    result: (
      <>
        <p className="text-body text-text/90">
          „Dobrý den, děkujeme za poptávku. Nabídku na 40 ks pošleme do čtvrtka. Hodí se vám krátký hovor ve čtvrtek ve 14:00?“
        </p>
        <p className="mt-2 text-sm text-gold">Koncept odpovědi čeká na vaše schválení</p>
      </>
    ),
  },
  {
    key: "data",
    tab: "Data",
    shape: "bars",
    task: "Připrav report z faktur",
    lines: [
      { text: "Načteno 12 480 řádků ze 3 exportů", detail: "CSV, XLSX" },
      { text: "Sjednoceny formáty dat a měn", detail: "38 oprav" },
      { text: "Nalezeno 214 duplicitních položek", detail: "označeno" },
      { text: "Report podle středisek je hotový", detail: "4 s" },
    ],
    result: (
      <div className="grid grid-cols-[56px_1fr_auto] items-center gap-x-3 gap-y-2 text-sm">
        <span className="text-muted">Ručně</span>
        <span className="h-1.5 rounded-full bg-white/15" />
        <span className="text-muted">asi 6 h</span>
        <span className="text-text">S AI</span>
        <span className="h-1.5 w-[3%] min-w-1.5 origin-left animate-[grow_.8s_cubic-bezier(.16,1,.3,1)] rounded-full bg-gold" />
        <span className="text-gold">4 s</span>
      </div>
    ),
  },
  {
    key: "infra",
    tab: "Servery",
    shape: "servers",
    task: "Odpověz z interních dokumentů",
    lines: [
      { text: "Model běží na serveru ve vaší firmě", detail: "lokálně" },
      { text: "Připojeno k ERP a sdílenému disku", detail: "interní síť" },
      { text: "Dotaz: otevřené zakázky nad 500 tis.", detail: "" },
      { text: "Odpověď sestavena z 9 dokumentů", detail: "1,2 s" },
    ],
    result: (
      <p className="flex items-center gap-2 text-body text-text/90">
        <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-gold" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="11" width="16" height="10" rx="2" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" />
        </svg>
        Žádná data neopustila vaši síť.
      </p>
    ),
  },
];

const FIRST = 350;
const GAP = 1600;
const CHAR = 16;
const WORK = 600;
const HOLD = 8000;
const INTRO = 2300;

const resultAt = (s: Scenario) => FIRST + s.lines.length * GAP + 250;
const endAt = (s: Scenario) => resultAt(s) + HOLD;

/** A live "agent console": pick a task and watch it being handled step by step. */
export default function HeroDemo({ onShape }: { onShape: (s: OrbShape) => void }) {
  const [idx, setIdx] = useState(0);
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [auto, setAuto] = useState(true);
  const [still, setStill] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const visible = useRef(true);

  const play = (i: number, byUser: boolean) => {
    setIdx(i);
    setStart(performance.now());
    if (byUser) setAuto(false);
  };

  // first run after the hero intro; reduced motion just shows finished results
  useEffect(() => {
    const reduced = prefersReducedMotion();
    const id = setTimeout(() => {
      setStill(reduced);
      setStart(reduced ? 0 : performance.now());
    }, reduced ? 0 : INTRO);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const onDemo = (e: Event) => {
      const i = SCENARIOS.findIndex((s) => s.key === (e as CustomEvent<string>).detail);
      if (i >= 0) play(i, true);
    };
    window.addEventListener(DEMO_EVENT, onDemo);
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting));
    if (root.current) io.observe(root.current);
    return () => {
      window.removeEventListener(DEMO_EVENT, onDemo);
      io.disconnect();
    };
  }, []);

  useEffect(() => {
    onShape(start === null ? "sphere" : SCENARIOS[idx].shape);
  }, [idx, start, onShape]);

  // clock
  useEffect(() => {
    if (start === null || still) return;
    let raf = 0;
    const tick = () => {
      const t = performance.now();
      if (visible.current) setNow(t);
      if (auto && t - start > endAt(SCENARIOS[idx])) {
        play((idx + 1) % SCENARIOS.length, false);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, idx, auto, still]);

  const s = SCENARIOS[idx];
  const elapsed = start === null ? -1 : still ? Infinity : now - start;
  const done = elapsed > resultAt(s);

  return (
    <div
      ref={root}
      data-hero="demo"
      className="relative w-full rounded-2xl border border-white/10 bg-ink/80 shadow-[0_40px_100px_-30px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl"
    >
      <div role="tablist" aria-label="Ukázky" className="grid grid-cols-3 border-b border-white/10">
        {SCENARIOS.map((sc, i) => {
          const active = i === idx;
          const progress = active && start !== null ? Math.min(1, Math.max(0, elapsed / endAt(sc))) : 0;
          return (
            <button
              key={sc.key}
              role="tab"
              aria-selected={active}
              onClick={() => play(i, true)}
              className={`relative min-h-12 px-3 py-3 text-sm font-medium transition-colors first:rounded-tl-2xl last:rounded-tr-2xl focus-visible:outline-2 focus-visible:outline-gold ${
                active ? "text-text" : "text-muted hover:bg-white/[0.03] hover:text-text"
              }`}
            >
              {sc.tab}
              <span className="absolute inset-x-0 bottom-[-1px] h-px bg-white/0">
                <span
                  className="block h-full origin-left bg-gold"
                  style={{ transform: `scaleX(${active ? (auto && !still ? progress : 1) : 0})` }}
                />
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-4 sm:p-5 2xl:p-7">
        <div className="mb-4 flex items-baseline justify-between gap-3">
          <p className="font-head text-h4 font-semibold">{s.task}</p>
          <span className="inline-flex shrink-0 items-center gap-1.5 text-sm text-muted">
            <i className={`h-1.5 w-1.5 rounded-full ${done ? "bg-text/40" : "animate-[blink_1.2s_infinite] bg-gold"}`} />
            {start === null ? "čeká" : done ? "hotovo" : "pracuje"}
          </span>
        </div>

        <ol className="min-h-[148px] space-y-2 font-mono text-sm lg:min-h-[116px] 2xl:space-y-2.5" aria-live="polite">
          {s.lines.map((l, i) => {
            const t = elapsed - (FIRST + i * GAP);
            if (t < 0) return null;
            const chars = Math.floor(t / CHAR);
            const ok = t > l.text.length * CHAR + WORK;
            return (
              <li key={`${s.key}-${i}`} className="flex items-start gap-2.5">
                <span className="mt-[3px] grid h-3.5 w-3.5 shrink-0 place-items-center">
                  {ok ? (
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-gold" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                  ) : (
                    <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-gold/25 border-t-gold" />
                  )}
                </span>
                <span className={`flex-1 ${ok ? "text-text/85" : "text-text"}`}>
                  {l.text.slice(0, chars)}
                  {chars < l.text.length && <span className="ml-px inline-block h-[1em] w-[6px] translate-y-[2px] bg-gold/80" />}
                </span>
                {l.detail && (
                  <span className={`shrink-0 text-muted transition-opacity duration-500 ${ok ? "opacity-100" : "opacity-0"}`}>{l.detail}</span>
                )}
              </li>
            );
          })}
        </ol>

        <div
          key={`${s.key}-${start}`}
          className={`mt-4 rounded-xl border border-gold-line bg-gold/[0.06] p-3.5 transition-[opacity,transform] duration-700 ease-[cubic-bezier(.16,1,.3,1)] ${done ? "opacity-100" : "translate-y-2 opacity-0"}`}
        >
          {s.result}
        </div>
      </div>
    </div>
  );
}
