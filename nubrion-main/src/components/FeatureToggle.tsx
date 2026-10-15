"use client";

import { animate, createTimeline, remove, spring } from "animejs";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motionEnabled } from "@/lib/heroState";

const modes = {
  local: {
    label: "Lokálně",
    text: "Citlivá data mohou zůstat na vašich vlastních serverech. Nic neopouští vaši síť a AI přesto pracuje naplno.",
  },
  cloud: {
    label: "V cloudu",
    text: "Jinde dává smysl škálovatelnost cloudu. Výkon roste s vámi a o provoz se postaráme my.",
  },
} as const;
type Mode = keyof typeof modes;

export default function FeatureToggle() {
  const [mode, setMode] = useState<Mode>("local");
  const [text, setText] = useState<string>(modes.local.text);
  const btns = useRef<Record<Mode, HTMLButtonElement | null>>({ local: null, cloud: null });
  const ind = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLParagraphElement>(null);
  const first = useRef(true);

  // indicator follows the active tab (spring on change, instant on first paint / resize)
  useLayoutEffect(() => {
    const place = (instant: boolean) => {
      const b = btns.current[mode];
      if (!b || !ind.current) return;
      const props = { left: b.offsetLeft, width: b.offsetWidth };
      if (instant || !motionEnabled()) {
        ind.current.style.left = `${props.left}px`;
        ind.current.style.width = `${props.width}px`;
      } else {
        animate(ind.current, { ...props, ease: spring({ bounce: 0.3, duration: 650 }) });
      }
    };
    place(first.current);
    first.current = false;
    const onResize = () => place(true);
    document.fonts?.ready.then(() => place(true));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [mode]);

  useEffect(() => {
    const targets = [ind.current, textRef.current].filter(Boolean) as Element[];
    return () => {
      remove(targets);
    };
  }, []);

  const switchTo = (next: Mode) => {
    if (next === mode) return;
    setMode(next);
    if (!motionEnabled()) {
      setText(modes[next].text);
      return;
    }
    remove(textRef.current!);
    createTimeline()
      .add(textRef.current!, { opacity: 0, y: -8, duration: 250, ease: "inQuad", onComplete: () => setText(modes[next].text) })
      .add(textRef.current!, { opacity: [0, 1], y: [10, 0], duration: 600, ease: "outQuart" });
  };

  return (
    <div
      data-reveal
      className="relative mt-16 grid items-center gap-10 overflow-hidden rounded-[26px] border border-line bg-surface p-6 sm:p-10 md:grid-cols-[1.2fr_1fr] lg:p-14"
    >
      <div className="relative">
        <span className="eyebrow">Na míru, ne podle šablony</span>
        <h3 className="mb-4 mt-5 text-h3">Vaše data tam, kde je chcete mít.</h3>
        <p ref={textRef} className="min-h-[3.3em] max-w-[30em] text-body text-muted">
          {text}
        </p>
        <div role="tablist" className="relative mt-7 inline-flex rounded-xl border border-line bg-ink p-[5px]">
          <span ref={ind} className="absolute bottom-[5px] left-[5px] top-[5px] rounded-lg bg-gold" />
          {(Object.keys(modes) as Mode[]).map((m) => (
            <button
              key={m}
              ref={(b) => {
                btns.current[m] = b;
              }}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchTo(m)}
              className={`relative z-10 min-h-11 rounded-lg px-[18px] py-3 text-sm font-semibold transition-colors duration-300 ${
                mode === m ? "text-ink" : "text-muted hover:text-text"
              }`}
            >
              {modes[m].label}
            </button>
          ))}
        </div>
      </div>

      {/* the companion orb drops in here: server rack or cloud */}
      <div aria-hidden="true" className="relative order-first aspect-square w-full max-w-[240px] justify-self-center md:order-none lg:max-w-[340px]">
        <div className="absolute inset-[6%] rounded-[48px] border border-gold-line bg-[radial-gradient(closest-side,rgb(217_164_65/.12),transparent),linear-gradient(145deg,#232c3b,#141a23)] shadow-[0_40px_80px_rgba(0,0,0,.45),inset_0_1px_0_rgba(255,255,255,.06)]" />
        <div data-orb={mode === "local" ? "servers" : "cloud"} className="absolute inset-[16%]" />
      </div>
    </div>
  );
}
