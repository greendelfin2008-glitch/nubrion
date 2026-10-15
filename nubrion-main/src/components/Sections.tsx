import FeatureToggle from "./FeatureToggle";
import ServicesList from "./ServicesList";
import Statement from "./motion/Statement";
import { Chat, Pen, Rocket } from "./icons";

const wrap = "mx-auto w-full max-w-[1200px] px-4 sm:px-8 2xl:max-w-[1440px]";

/* ---------------- Co děláme ---------------- */
export function Intro() {
  return (
    <section id="co-delame" className="py-20 lg:py-28">
      <div className={wrap}>
        <div data-reveal className="max-w-[720px]">
          <span className="eyebrow">Co děláme</span>
          <h2 className="mb-5 mt-4 text-h2">AI nasazená tam, kde má reálný dopad</h2>
          <p className="max-w-[36em] text-lead text-muted">
            Neděláme jedno řešení pro všechny. Navrhneme a nasadíme variantu, která sedí vám, ne nám.
          </p>
        </div>
        <FeatureToggle />
      </div>
    </section>
  );
}

/* ---------------- Oblasti ---------------- */
export function Services() {
  return (
    <section id="oblasti" className="pb-20 pt-10 lg:pb-28">
      <div className={wrap}>
        <span data-reveal className="eyebrow">Tři oblasti</span>
        <Statement
          text="Neděláme jedno řešení pro všechny. Podle potřeb firmy vybíráme, kudy vede"
          accent="nejkratší cesta k výsledku."
        />
        <ServicesList />
      </div>
    </section>
  );
}

/* ---------------- Jak to probíhá ---------------- */
const steps = [
  { Icon: Chat, title: "Krátká konzultace", text: "Probereme, jak vám dnes funguje práce s daty, e-maily a schůzkami, a kde se ztrácí nejvíc času." },
  { Icon: Pen, title: "Návrh řešení", text: "Dostanete konkrétní návrh: co nasadit, kde to poběží (lokálně, nebo v cloudu) a co to přinese." },
  { Icon: Rocket, title: "Nasazení a provoz", text: "Řešení zprovozníme, ukážeme vám, jak s ním pracovat, a postaráme se o to, aby dál běželo." },
];

export function Steps() {
  return (
    <section id="prubeh" className="pb-20 pt-10 lg:pb-28">
      <div className={wrap}>
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_220px]">
          <div>
            <span data-reveal className="eyebrow">Jak to probíhá</span>
            <Statement text="Od krátké konzultace přes konkrétní návrh až" accent="k řešení, které ve vaší firmě dál běží." />
          </div>
          <div data-orb="sphere" aria-hidden="true" className="mx-auto aspect-square w-[160px] lg:w-full" />
        </div>

        <ol className="relative mt-16 grid gap-10 md:grid-cols-3 md:gap-6">
          {/* the path the three steps sit on */}
          <span aria-hidden="true" className="absolute left-0 right-0 top-6 hidden h-px bg-[linear-gradient(90deg,var(--color-gold),rgb(217_164_65/.15))] md:block" />
          {steps.map(({ Icon, title, text }, i) => (
            <li key={title} data-reveal className="relative">
              <div data-pop className="relative mb-7 grid h-12 w-12 place-items-center rounded-xl border border-gold-line bg-ink text-gold">
                <Icon className="h-[22px] w-[22px]" />
              </div>
              <small className="text-sm font-semibold text-gold">Krok {i + 1}</small>
              <h3 className="mb-3 mt-1.5 text-h4 font-semibold">{title}</h3>
              <p className="max-w-[34ch] text-body text-muted">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- CTA ---------------- */
export function Cta() {
  return (
    <section id="kontakt" className="pb-24">
      <div className={wrap}>
        <div
          data-reveal
          className="cta-card relative grid items-center gap-10 overflow-hidden rounded-[28px] border border-gold-line px-5 py-14 sm:px-12 sm:py-20 md:grid-cols-[1.25fr_1fr] lg:px-16"
        >
          <div className="relative">
            <h2 className="max-w-[14ch] text-[clamp(2.25rem,1.4rem+2.6vw,4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
              Rozjíždíme první spolupráce.
            </h2>
            <p className="mb-10 mt-6 max-w-[30em] text-lead text-muted">
              Pokud chcete být u toho od začátku, domluvte si konzultaci nebo nám napište.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:info@nubrion.cz?subject=Konzultace" data-magnetic className="btn btn-gold btn-lg cta-glow grow sm:grow-0">
                Rezervovat konzultaci
              </a>
              <a href="mailto:info@nubrion.cz" data-magnetic className="btn btn-ghost btn-lg grow sm:grow-0">
                info@nubrion.cz
              </a>
            </div>
          </div>
          {/* the companion orb lands here as an envelope on its way to the footer logo */}
          <div data-orb="mail" aria-hidden="true" className="order-first mx-auto -mb-4 aspect-square w-[150px] sm:w-[220px] md:order-none md:mb-0 md:w-full md:max-w-[360px]" />
        </div>
      </div>
    </section>
  );
}

/* ---------------- Footer ---------------- */
const footCols = [
  { h: "Navigace", links: [["#co-delame", "Co děláme"], ["#oblasti", "Oblasti"], ["#prubeh", "Jak to probíhá"]] },
  { h: "Oblasti", links: [["#oblasti", "Infrastruktura"], ["#oblasti", "Data a procesy"], ["#oblasti", "Agenda a komunikace"]] },
  { h: "Kontakt", links: [["mailto:info@nubrion.cz", "info@nubrion.cz"], ["#kontakt", "Rezervovat konzultaci"]] },
];

export function Footer() {
  return (
    <footer className="relative border-t border-line bg-ink-deep pb-8 pt-16">
      <div className={wrap}>
        <div className="grid grid-cols-2 gap-8 pb-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="col-span-2 md:col-span-1">
            <a href="#top" className="flex items-center gap-4 font-head text-h4 font-semibold">
              {/* the companion orb settles here and becomes the mark */}
              <span data-orb="logo" aria-hidden="true" className="block h-[84px] w-[84px]" />
              Nubrion
            </a>
            <p className="mt-4 max-w-[300px] text-sm text-muted">
              AI, která ve firmě opravdu běží. Rozjíždíme první spolupráce, ozvěte se.
            </p>
          </div>
          {footCols.map((c) => (
            <div key={c.h} className="flex flex-col text-sm text-muted">
              <h4 className="mb-1 font-body text-sm font-semibold tracking-normal text-text">{c.h}</h4>
              {c.links.map(([href, label]) => (
                <a key={label} href={href} className="py-3 transition-colors hover:text-gold xl:py-1.5">
                  {label}
                </a>
              ))}
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 text-sm text-muted">
          <span>© 2026 Nubrion. Všechna práva vyhrazena.</span>
          <a href="#top" className="-my-3 inline-flex min-h-11 items-center hover:text-gold">Nahoru</a>
        </div>
      </div>
    </footer>
  );
}
