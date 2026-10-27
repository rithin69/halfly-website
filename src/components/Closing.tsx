import { PRICING, SITE, trialHref } from "@/lib/data";
import { Halfy } from "./Halfy";
import { Logo } from "./Logo";

const PROVIDERS = ["OpenAI", "Anthropic Claude", "Azure OpenAI", "Groq", "OpenRouter", "Together", "Ollama", "vLLM"];

export function WorksWith() {
  return (
    <section aria-label="Compatible providers" className="mx-auto max-w-6xl px-0 pt-20 text-center sm:px-5">
      <p className="display text-[17px] font-bold text-ink-2">Works in front of the providers you already use</p>
      <div className="marquee mt-6 overflow-hidden">
        <div className="marquee-track flex w-max gap-3">
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1} className="flex shrink-0 gap-3">
              {PROVIDERS.map((p) => (
                <li key={p} className="display flex items-center gap-2 whitespace-nowrap rounded-full border-2 border-pink-100 bg-white px-5 py-2.5 text-[16px] font-bold text-ink">
                  <span aria-hidden="true" className="size-2 rounded-full bg-pink-400" />
                  {p}
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CallToAction() {
  return (
    <section aria-labelledby="cta-title" className="relative overflow-hidden bg-pink-600">
      {/* Big outline Halfys as a pattern, like a brand wallpaper. */}
      <svg aria-hidden="true" className="absolute -right-24 -top-16 h-[520px] w-[520px] opacity-25" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#fff" strokeWidth="6" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#fff" strokeWidth="6" />
        <ellipse cx="76" cy="92" rx="9" ry="12" fill="#fff" />
        <ellipse cx="124" cy="92" rx="9" ry="12" fill="#fff" />
        <path d="M88 118 q 12 12 24 0" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
      </svg>
      <svg aria-hidden="true" className="absolute -bottom-40 left-[30%] h-[380px] w-[380px] opacity-15" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#fff" strokeWidth="7" />
        <line x1="100" y1="20" x2="100" y2="180" stroke="#fff" strokeWidth="7" />
      </svg>

      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-5 py-24 sm:py-28 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <h2 id="cta-title" className="text-[clamp(2.8rem,6.5vw,5.2rem)] font-black leading-[0.95] tracking-[-0.05em] text-white">
            Ready to stop overpaying for AI?
          </h2>
          <p className="display mt-6 max-w-xl text-[1.35rem] font-bold leading-snug text-white">
            Free for {PRICING.trialDays} days. Then you pay {PRICING.feePct}% of what Halfly saves you, and nothing if it saves nothing.
          </p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row">
            <a href={trialHref} className="btn w-full bg-white text-ink shadow-[0_5px_0_var(--berry-dark)] sm:w-auto hover:bg-pink-50 active:shadow-[0_1px_0_var(--berry-dark)]">
              Start free trial
            </a>
            <a href="#pricing" className="btn w-full bg-ink text-white shadow-[0_5px_0_#000] sm:w-auto hover:bg-[#3d1631] active:shadow-[0_1px_0_#000]">
              See pricing
            </a>
          </div>
        </div>
        <div className="flex justify-center lg:justify-end">
          <div className="rounded-[40px] bg-white p-6 shadow-[0_12px_0_var(--berry-dark)]">
            <Halfy pose="happy" className="h-56 w-56 sm:h-64 sm:w-64" title="Halfy, the Halfly mascot, smiling" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <Logo />
          <nav aria-label="Footer">
            <ul className="flex flex-wrap gap-x-3 text-[15.5px] font-medium">
              <li><a className="flex min-h-11 items-center px-2 hover:text-berry" href="#for-you">Get started</a></li>
              <li><a className="flex min-h-11 items-center px-2 hover:text-berry" href="#how">How it works</a></li>
              <li><a className="flex min-h-11 items-center px-2 hover:text-berry" href="#proof">Proof</a></li>
              <li><a className="flex min-h-11 items-center px-2 hover:text-berry" href="#faq">FAQ</a></li>
              <li><a className="flex min-h-11 items-center px-2 hover:text-berry" href="#pricing">Pricing</a></li>
              <li><a className="flex min-h-11 items-center px-2 hover:text-berry" href={`mailto:${SITE.contactEmail}`}>Contact</a></li>
            </ul>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t-2 border-pink-50 pt-6 text-[14px] text-ink-2 sm:flex-row sm:justify-between">
          <p>© 2026 Halfly. All rights reserved.</p>
          <p>Made in London.</p>
        </div>
      </div>
    </footer>
  );
}
