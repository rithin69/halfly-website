import { PRICING, salesHref, trialHref } from "@/lib/data";
import { Halfy } from "./Halfy";
import { Reveal } from "./Reveal";

const usd = (v: number) => "$" + v.toLocaleString("en-US");

function Tick() {
  return (
    <svg viewBox="0 0 20 20" className="mt-[3px] size-5 shrink-0" aria-hidden="true">
      <circle cx="10" cy="10" r="9" fill="var(--pink-100)" />
      <path d="M6 10.5l2.6 2.6L14 7.6" stroke="var(--pink-600)" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Plan({
  name,
  price,
  unit,
  blurb,
  points,
  cta,
  href,
  featured = false,
}: {
  name: string;
  price: string;
  unit: string;
  blurb: string;
  points: string[];
  cta: string;
  href: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-[32px] border-2 bg-white p-7 sm:p-8 ${
        featured ? "border-pink-400 shadow-[0_10px_0_var(--pink-400)]" : "border-pink-100 shadow-[0_8px_0_var(--pink-100)]"
      }`}
    >
      {featured && (
        <p className="display absolute -top-4 left-7 rounded-full bg-ink px-4 py-1 text-[14px] font-bold text-white">
          Most teams
        </p>
      )}
      <h3 className="text-[1.5rem] font-extrabold">{name}</h3>
      <p className="mt-4 flex items-baseline gap-2">
        <span className={`display text-[3.4rem] font-extrabold leading-none tracking-[-0.04em] ${featured ? "text-pink-600" : "text-ink"}`}>
          {price}
        </span>
        <span className="text-[15px] font-medium text-ink-2">{unit}</span>
      </p>
      <p className="mt-4 text-[15.5px] leading-relaxed text-ink-2">{blurb}</p>
      <ul className="mt-6 space-y-3 text-[15px] leading-snug text-ink">
        {points.map((p) => (
          <li key={p} className="flex gap-3">
            <Tick />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <a href={href} className={`btn mt-8 w-full ${featured ? "btn-pink" : "btn-white"}`}>
        {cta}
      </a>
    </div>
  );
}

export function Pricing() {
  const { bill, withHalfly } = PRICING.example;
  const saved = bill - withHalfly;
  const fee = (saved * PRICING.feePct) / 100;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="bg-wash py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="pricing-title" className="text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]">
              Pay only when you save.
              <br />
              <span className="text-pink-600">No savings, no bill.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
              Try everything free for {PRICING.trialDays} days. After that, Halfly takes {PRICING.feePct}% of the money it saves
              you, and you keep the rest. If it saves nothing, you pay nothing.
            </p>
          </div>
          <Halfy pose="happy" className="hidden h-36 w-36 md:block" />
        </Reveal>

        <Reveal className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <Plan
            name="Free trial"
            price="$0"
            unit={`for ${PRICING.trialDays} days`}
            blurb="See your own savings before you change anything."
            points={[
              "Everything in Pro",
              "Starts in observe mode: your users see no change",
              "Your dashboard shows what you would save, and at what checked quality",
            ]}
            cta="Start free trial"
            href={trialHref}
          />
          <Plan
            featured
            name="Pro"
            price={`${PRICING.feePct}%`}
            unit="of what Halfly saves you"
            blurb="Billed monthly from Halfly's own savings log. Cancel any time."
            points={[
              "Quality dial, self-checking and budget caps",
              "Learns your traffic and gets cheaper over time",
              "Caching, compression and Claude prompt caching",
              "Runs on your servers: your prompts never reach us",
            ]}
            cta="Start free trial"
            href={trialHref}
          />
          <Plan
            name="Enterprise"
            price="Custom"
            unit="per year"
            blurb="For teams with big AI bills or strict security rules."
            points={[
              "We train the router on your traffic for you",
              "A flat yearly price instead of a share",
              "Priority support and help with setup",
              "Help with your security review",
            ]}
            cta="Talk to us"
            href={salesHref}
          />
        </Reveal>

        <Reveal className="mt-14 rounded-[32px] border-2 border-pink-100 bg-white p-6 shadow-[0_8px_0_var(--pink-100)] sm:p-8">
          <h3 className="text-[1.4rem] font-extrabold">How the {PRICING.feePct}% works</h3>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Without Halfly", usd(bill), "your AI bill"],
              ["With Halfly", usd(withHalfly), "after routing and caching"],
              [`Halfly's ${PRICING.feePct}%`, usd(fee), "of the saving"],
              ["You keep", usd(saved - fee), "every month"],
            ].map(([label, value, note], i) => (
              <div key={label} className={`rounded-[22px] p-4 sm:p-5 ${i === 3 ? "bg-pink-50 ring-2 ring-pink-200" : "bg-[#f6eff3]"}`}>
                <dt className="text-[14px] font-medium text-ink-2">{label}</dt>
                <dd className={`display mt-1 text-[clamp(1.8rem,3.5vw,2.6rem)] font-extrabold leading-none tracking-[-0.03em] ${i === 3 ? "text-pink-600" : ""}`}>
                  {value}
                </dd>
                <dd className="mt-1 text-[13px] text-ink-2">{note}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-[14px] leading-relaxed text-ink-2">
            Example month. Savings come from Halfly&apos;s per-request log: what each request cost, against the same request
            on your strong model, minus what Halfly spent on its own quality checks. You can export every line.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
