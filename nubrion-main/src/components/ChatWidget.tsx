"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Chat } from "./icons";

type Msg = { id: number; from: "bot" | "user"; text: string; failed?: boolean };

const GREETING = "Dobrý den! Jsem asistent Nubrionu. Zeptejte se na cokoli, nebo si domluvte konzultaci.";
const SESSION_KEY = "nb-chat-session";

function getSessionId(): string {
  const fresh = () =>
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `s-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) return saved;
    const id = fresh();
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return fresh();
  }
}

/** Floating chat bubble that talks to the n8n AI workflow through /api/chat. */
export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, from: "bot", text: GREETING }]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const session = useRef<string>("");
  const nextId = useRef(1);
  const list = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    session.current = getSessionId();
  }, []);

  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const push = (from: Msg["from"], text: string, failed = false) =>
    setMsgs((m) => [...m, { id: nextId.current++, from, text, failed }]);

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    push("user", text);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: session.current || getSessionId() }),
      });
      const data = (await res.json()) as { reply?: string; error?: string; ok?: boolean };
      push("bot", data.reply ?? data.error ?? "Něco se pokazilo.", !data.reply || data.ok === false);
    } catch {
      push("bot", "Spojení se nepovedlo. Zkontrolujte připojení a zkuste to znovu.", true);
    } finally {
      setBusy(false);
      input.current?.focus();
    }
  }

  return (
    <>
      <div
        role="dialog"
        aria-label="Chat s asistentem Nubrion"
        aria-hidden={!open}
        className={`fixed inset-x-3 bottom-[88px] z-[60] flex h-[min(560px,calc(100dvh-120px))] flex-col overflow-hidden rounded-2xl border border-white/10 bg-ink/95 shadow-[0_40px_100px_-30px_rgba(0,0,0,.9),inset_0_1px_0_rgba(255,255,255,.05)] backdrop-blur-xl transition-[opacity,transform] duration-300 ease-[cubic-bezier(.16,1,.3,1)] sm:inset-x-auto sm:right-6 sm:bottom-24 sm:w-[380px] ${
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-head text-base font-semibold">Asistent Nubrion</p>
            <p className="flex items-center gap-1.5 text-sm text-muted">
              <i className="h-1.5 w-1.5 rounded-full bg-gold" /> AI, odpovídá hned
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Zavřít chat"
            tabIndex={open ? 0 : -1}
            className="grid h-10 w-10 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-text focus-visible:outline-2 focus-visible:outline-gold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div ref={list} data-lenis-prevent className="flex flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain px-4 py-4" aria-live="polite">
          {msgs.map((m) => (
            <p
              key={m.id}
              className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[15px] leading-relaxed ${
                m.from === "user"
                  ? "self-end rounded-br-md bg-gold text-ink"
                  : m.failed
                    ? "self-start rounded-bl-md border border-gold-line bg-gold-soft text-text/90"
                    : "self-start rounded-bl-md bg-surface text-text/90"
              }`}
            >
              {m.text}
            </p>
          ))}
          {busy && (
            <p className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-surface px-4 py-3.5" aria-label="Asistent píše">
              {[0, 150, 300].map((d) => (
                <i key={d} className="h-1.5 w-1.5 animate-[blink_1s_infinite] rounded-full bg-gold" style={{ animationDelay: `${d}ms` }} />
              ))}
            </p>
          )}
        </div>

        <form onSubmit={send} className="flex items-center gap-2 border-t border-white/10 p-3">
          <input
            ref={input}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={1000}
            placeholder="Napište zprávu…"
            aria-label="Zpráva"
            autoComplete="off"
            tabIndex={open ? 0 : -1}
            className="min-h-11 flex-1 rounded-xl border border-white/10 bg-ink-deep px-3.5 text-base text-text placeholder:text-dim focus:border-gold-line focus:outline-none"
          />
          <button
            type="submit"
            disabled={busy || !draft.trim()}
            aria-label="Odeslat"
            tabIndex={open ? 0 : -1}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gold text-ink transition-colors hover:bg-gold-light disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Zavřít chat" : "Otevřít chat s asistentem"}
        aria-expanded={open}
        className="cta-glow fixed right-4 bottom-4 z-[60] grid h-14 w-14 place-items-center rounded-full bg-gold text-ink hover:bg-gold-light focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-gold sm:right-6 sm:bottom-6"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <Chat className="h-6 w-6" />
        )}
      </button>
    </>
  );
}
