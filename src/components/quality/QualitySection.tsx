import type { ReactNode } from "react";
import { AUDITS, BUDGETS, PROMPT_CACHING, QUALITY_DIAL } from "@/lib/data";
import { Halfy } from "../Halfy";
import { Reveal } from "../Reveal";
import { QualityDial } from "./QualityDial";

/* ---------- small flat icons, drawn like the How-it-works art: ink outlines, pink fills ---------- */

const S = { stroke: "var(--ink)", strokeWidth: 3.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const ICONS: Record<string, ReactNode> = {
  observe: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <path d="M4 24 C 12 11, 36 11, 44 24 C 36 37, 12 37, 4 24 Z" fill="#fff" {...S} />
      <circle cx="24" cy="24" r="8" fill="var(--pink-400)" {...S} />
      <circle cx="26.5" cy="21.5" r="2.2" fill="#fff" />
    </svg>
  ),
  audits: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <path d="M31 31 L43 43" {...S} strokeWidth={6} />
      <circle cx="20" cy="20" r="15" fill="#fff" {...S} />
      <path d="M13 20.5 L18 25.5 L27.5 15" fill="none" {...S} stroke="var(--pink-600)" strokeWidth={4.5} />
    </svg>
  ),
  budget: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <path d="M24 4 L41 10 V 23 C 41 33, 33 40, 24 44 C 15 40, 7 33, 7 23 V 10 Z" fill="var(--pink-400)" {...S} />
      <text x="24" y="31" textAnchor="middle" fontSize="20" fontWeight="800" fontFamily="var(--font-gabarito)" fill="#fff">
        $
      </text>
    </svg>
  ),
  learn: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <path d="M38 17 A 15 15 0 0 0 10 17" fill="none" {...S} />
      <path d="M10 31 A 15 15 0 0 0 38 31" fill="none" {...S} />
      <path d="M10 9 V 17 H 18" fill="none" {...S} />
      <path d="M38 39 V 31 H 30" fill="none" {...S} />
      <path d="M24 17 L26.2 21.8 L31 24 L26.2 26.2 L24 31 L21.8 26.2 L17 24 L21.8 21.8 Z" fill="var(--pink-400)" stroke="var(--ink)" strokeWidth={2.5} strokeLinejoin="round" />
    </svg>
  ),
  caching: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <rect x="9" y="5" width="30" height="38" rx="5" fill="#fff" {...S} />
      <path d="M26 5 V 21 L 31 17 L 36 21 V 5" fill="var(--pink-400)" {...S} strokeWidth={3} />
      <path d="M15 27 H 33 M15 34 H 27" fill="none" {...S} stroke="var(--chart-gray)" strokeWidth={4} />
    </svg>
  ),
  tags: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <path d="M6 8 H 24 L 42 26 L 26 42 L 6 22 Z" fill="var(--pink-400)" {...S} />
      <circle cx="15" cy="17" r="3.5" fill="#fff" {...S} strokeWidth={3} />
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 48 48" className="size-10" aria-hidden="true">
      <path d="M6 10 Q 6 6 10 6 H 38 Q 42 6 42 10 V 30 Q 42 34 38 34 H 20 L 11 42 V 34 H 10 Q 6 34 6 30 Z" fill="#fff" {...S} />
      <text x="24" y="27" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="var(--font-gabarito)" fill="var(--pink-600)">
        $
      </text>
    </svg>
  ),
};

type Feature = { id: string; kicker: string; title: string; body: string; code: string };

const cachedShare = `1/${Math.round(1 / PROMPT_CACHING.cachedInputPriceShare)}`;

const FEATURES: Feature[] = [
  {
    id: "observe",
    kicker: "Try it risk-free",
    title: "Watch first. Switch later.",
    body: "Turn on observe mode. Every request still goes to your strong model, so nothing changes for your users. Halfly reports what routing would have saved, and at what checked quality. Like the numbers? Flip one setting.",
    code: "mode: observe",
  },
  {
    id: "audits",
    kicker: "Checks its own work",
    title: "It double-checks itself.",
    body: `For a random ${AUDITS.samplePct}% of requests (at most ${AUDITS.maxPerHour} an hour), Halfly quietly asks the other model too. A judge model compares the two answers. Your dashboard shows the measured quality, with a confidence range. Audit costs are shown and taken off your savings. No prompt text is stored.`,
    code: `sample_rate: ${(AUDITS.samplePct / 100).toFixed(2)}`,
  },
  {
    id: "budget",
    kicker: "Never a surprise bill",
    title: "Hard caps on spend.",
    body: `Set a daily or monthly dollar cap for each API key. From ${BUDGETS.warnAtPct}% of the cap, responses carry a warning header. At the cap, you choose: keep serving with the cheap model, or refuse with a 429.`,
    code: "on_exceed: weak",
  },
  {
    id: "learn",
    kicker: "Learns your traffic",
    title: "Gets to know your users.",
    body: "Retrain the router on your own checked requests. Halfly keeps the new router only if it beats the current one on held-out audits. If it doesn't, nothing changes.",
    code: "$ halfly learn",
  },
  {
    id: "caching",
    kicker: "Bonus for Claude",
    title: "Prompt caching, done for you.",
    body: `If your app sets no cache markers, Halfly marks the system prompt and earlier turns for Anthropic's prompt caching. Repeated input then costs about ${cachedShare} of the normal price. It only counts in your savings when Halfly added it.`,
    code: "auto_cache: true",
  },
  {
    id: "tags",
    kicker: "Cost per feature",
    title: "See where the money goes.",
    body: "Tag each request with the part of your product that sent it. The dashboard shows what every feature costs and saves, and each one can have its own quality level: relaxed for small talk, strict for anything legal.",
    code: '"halfly": {"tag": "support-chat"}',
  },
  {
    id: "chat",
    kicker: "Savings in your team chat",
    title: "A weekly win, delivered.",
    body: "Every week Halfly posts what it saved you, and at what checked quality, to Slack or any chat that takes a webhook. If a budget gets close to its cap, you hear about it straight away.",
    code: "HALFLY_WEBHOOK_URL=…",
  },
];

/* 6-column grid on desktop: two wide cards, three narrow ones, then two wide. */
const SPAN = ["lg:col-span-3", "lg:col-span-3", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-3",
  "md:col-span-2 lg:col-span-3"];

function FeatureCard({ f }: { f: Feature }) {
  return (
    <article className="flex h-full flex-col rounded-[32px] border-2 border-pink-100 bg-white p-6 shadow-[0_8px_0_var(--pink-100)] sm:p-7">
      <div className="flex items-center gap-4">
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-pink-50">{ICONS[f.id]}</span>
        <p className="display text-[14px] font-extrabold uppercase tracking-[0.1em] text-berry">{f.kicker}</p>
      </div>
      <h4 className="display mt-5 text-[1.5rem] font-extrabold leading-tight">{f.title}</h4>
      <p className="mt-2.5 flex-1 text-[16px] leading-relaxed text-ink-2">{f.body}</p>
      <code className="mt-5 self-start rounded-xl border-2 border-pink-100 bg-pink-50 px-3 py-1.5 font-mono text-[13.5px] text-ink">
        {f.code}
      </code>
    </article>
  );
}

function Fact({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-[26px] border-2 border-dashed border-pink-300 bg-white p-5 sm:p-6">
      <p className="display text-[18px] font-extrabold leading-snug text-ink">{title}</p>
      <p className="mt-1.5 text-[15px] leading-relaxed text-ink-2">{children}</p>
    </div>
  );
}

export function QualitySection() {
  const { lowestSlice: low, afterAudits: aa } = QUALITY_DIAL;
  return (
    <section id="quality" aria-labelledby="quality-title" className="mx-auto max-w-6xl px-5 pt-28 sm:pt-40">
      <Reveal className="mx-auto max-w-3xl text-center">
        <span className="inline-block rounded-lg border-2 border-pink-200 bg-pink-50 px-2.5 py-1 text-[13px] font-bold uppercase tracking-[0.08em] text-berry">
          New
        </span>
        <h2 id="quality-title" className="mt-5 text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]">
          Set the quality.
          <br />
          <span className="text-pink-600">Halfly hits it.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          No thresholds to tune. Say how good answers must be, and Halfly works out the routing. Its router&apos;s scores
          are honest, so &ldquo;95% sure&rdquo; really means about 95%.
        </p>
      </Reveal>

      <Reveal className="mt-14">
        <QualityDial />
      </Reveal>

      <Reveal className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Fact title="Holds on every kind of prompt">
          On code, maths, short and long prompts it stayed within about {QUALITY_DIAL.sliceTolerancePts} point of the target.
          Lowest: {low.delivered.toFixed(1)}% on {low.prompts} {low.name} prompts at a {low.target}% target.
        </Fact>
        <Fact title="Gets bolder as it learns">
          It starts careful. Once audits confirm it on your traffic, it routes more boldly: after{" "}
          {aa.audits.toLocaleString("en-GB")} audits, a {aa.target}% target saves {aa.savingAfter}% instead of{" "}
          {aa.savingBefore}% (median quality {aa.medianDelivered}%).
        </Fact>
        <Fact title="Change it per request">
          One call that must be perfect? Send{" "}
          <code className="whitespace-nowrap rounded-md bg-pink-50 px-1.5 py-0.5 font-mono text-[13.5px] text-ink">
            {`"halfly": {"quality": ${QUALITY_DIAL.overrideExample}}`}
          </code>{" "}
          with it.
        </Fact>
      </Reveal>

      <Reveal className="mt-24 grid grid-cols-1 items-end gap-6 sm:mt-28 md:grid-cols-[1fr_auto]">
        <div>
          <h3 className="text-[clamp(2rem,4.5vw,3.2rem)] font-extrabold leading-[1.02]">
            Safe to switch on. <span className="text-pink-600">Safe to leave on.</span>
          </h3>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-2">
            Seven more new things, so saving money never means losing sleep.
          </p>
        </div>
        <Halfy pose="sleep" className="hidden h-28 w-28 md:block" />
      </Reveal>

      <ul className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-6">
        {FEATURES.map((f, i) => (
          <li key={f.id} className={SPAN[i]}>
            <Reveal delay={(i % 3) * 0.06} className="h-full">
              <FeatureCard f={f} />
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
