import { PRICING, SAVINGS_MODES, paysForItself, proHref, salesHref, startHref, starterHref, timesOver } from "@/lib/data";
import { Halfy } from "./Halfy";
import { Reveal } from "./Reveal";

const usd = (v: number) => "$" + Math.round(v).toLocaleString("en-US");
const gbp = (v: number) => `${PRICING.currency}${v}`;

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
  badge,
  featured = false,
}: {
  name: string;
  price: string;
  unit: string;
  blurb: string;
  points: React.ReactNode[];
  cta: string;
  href: string;
  badge?: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-[32px] border-2 bg-white p-7 sm:p-8 ${
        featured ? "border-pink-400 shadow-[0_10px_0_var(--pink-400)]" : "border-pink-100 shadow-[0_8px_0_var(--pink-100)]"
      }`}
    >
      {badge && (
        <p className="display absolute -top-4 left-7 rounded-full bg-ink px-4 py-1 text-[14px] font-bold text-white">{badge}</p>
      )}
      <h3 className="text-[1.5rem] font-extrabold">{name}</h3>
      <p className="mt-4 flex items-baseline gap-2">
        <span className={`display text-[3.4rem] font-extrabold leading-none tracking-[-0.04em] ${featured ? "text-pink-600" : "text-ink"}`}>
          {price}
        </span>
        <span className="text-[15px] font-medium text-ink-2">{unit}</span>
      </p>
      <p className="display mt-4 text-[1.2rem] font-bold leading-snug text-ink">{blurb}</p>
      <ul className="mb-8 mt-6 space-y-3 text-[15px] leading-snug text-ink">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3">
            <Tick />
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <a href={href} className={`btn mt-auto w-full ${featured ? "btn-pink" : "btn-white"}`}>
        {cta}
      </a>
    </div>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded-md bg-pink-50 px-1.5 py-0.5 font-mono text-[14px] text-berry">{children}</code>
);

/** The three plans, side by side. Used on the home page and on /start#plans. */
export function PlanCards({ freeHref = startHref }: { freeHref?: string }) {
  return (
    <>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Plan
          name="Free"
          price={gbp(PRICING.free)}
          unit="forever"
          blurb="See what you would save, on your own traffic."
          points={[
            "Installs in minutes. No card, no sign‑up",
            "Observe mode: every request still goes to your strong model, so your users see no change",
            "Dashboard shows what routing would save, and at what checked quality",
            "Budget caps on your AI spend",
          ]}
          cta="Start free"
          href={freeHref}
        />
        <Plan
          featured
          badge="Switch the savings on"
          name="Starter"
          price={gbp(PRICING.starter)}
          unit="a month"
          blurb="Turn the savings you saw into real ones."
          points={[
            "Routing with the quality dial: easy prompts to the cheap model, hard ones to your best",
            "Exact cache: repeat questions are answered for free",
            "Fallback to the other model on errors and rate limits",
            <>
              Budget caps, savings dashboard and <Code>halfly report</Code>
            </>,
          ]}
          cta="Buy Starter"
          href={starterHref}
        />
        <Plan
          name="Pro"
          price={gbp(PRICING.pro)}
          unit="a month"
          blurb="Savings that keep growing as Halfly learns."
          points={[
            "Everything in Starter",
            <>
              Self-learning: <Code>halfly learn</Code> tunes routing on your own checked traffic
            </>,
            "Cost per feature of your app, with quality per feature",
            "Weekly Slack-style savings report and budget alerts",
            "Prompt compression for long prompts",
          ]}
          cta="Buy Pro"
          href={proHref}
        />
      </div>
      <div className="mx-auto mt-12 max-w-3xl text-center">
        <p className="display text-[1.2rem] font-bold leading-snug text-ink">
          Cancel any time. If you stop paying, your app keeps working: Halfly simply goes back to free observe mode.
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Halfly runs on your servers, so your prompts never reach us. Prices in pounds, per month.{" "}
          <a href={salesHref} className="whitespace-nowrap font-semibold text-berry underline decoration-2 underline-offset-4 hover:text-berry-dark">
            Bigger team? Talk to us.
          </a>
        </p>
      </div>
    </>
  );
}

export function Pricing() {
  const mode = SAVINGS_MODES[0];
  const bill = PRICING.exampleBillUsd;
  const saved = bill * mode.saving;
  const starterUsd = PRICING.starter * PRICING.usdPerGbp;

  return (
    <section id="pricing" aria-labelledby="pricing-title" className="bg-wash py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 id="pricing-title" className="text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]">
              See your savings free.
              <br />
              <span className="text-pink-600">Unlock them for {gbp(PRICING.starter)}.</span>
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
              Install Halfly free and it watches your real traffic: your users see no change, and your dashboard counts
              what routing would save you, at what checked quality. Like the number? Switch it on for {gbp(PRICING.starter)} a
              month.
            </p>
          </div>
          <Halfy pose="happy" className="hidden h-36 w-36 md:block" />
        </Reveal>

        <Reveal className="mt-16">
          <PlanCards />
        </Reveal>

        <Reveal className="mt-14 rounded-[32px] border-2 border-pink-100 bg-white p-6 shadow-[0_8px_0_var(--pink-100)] sm:p-8">
          <h3 className="text-[1.4rem] font-extrabold">Does {gbp(PRICING.starter)} pay off? Here is the maths.</h3>
          <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Your AI bill", usd(bill), "a month, in US dollars"],
              ["Benchmark saving", `~${usd(saved)}`, `a month (${Math.round(mode.saving * 100)}% less)`],
              ["Halfly Starter", gbp(PRICING.starter), `a month (about $${starterUsd.toFixed(2)})`],
              ["Pays for itself", `${timesOver(paysForItself(saved))}`, "over, every month"],
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
          <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[14px] leading-relaxed text-ink-2">
              Example month using our {mode.label} benchmark ({mode.quality}% of prompts still at strong-model quality; cheap
              model at 6% of the strong one&apos;s price). AI bills are in dollars and our prices in pounds, so we convert at
              about ${PRICING.usdPerGbp.toFixed(2)} per £1. Your own number shows up in the free dashboard before you pay
              anything.
            </p>
            <a href={startHref} className="btn btn-pink shrink-0">
              See your number free <span aria-hidden="true">→</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
