import { ROUTER_FACTS } from "@/lib/data";
import { CountUp } from "./CountUp";
import { Halfy } from "./Halfy";
import { Reveal } from "./Reveal";

function Bucket({ tone, label }: { tone: "pink" | "ink"; label: string }) {
  const fill = tone === "pink" ? "var(--pink-400)" : "#fff";
  return (
    <svg viewBox="0 0 80 90" className="h-20 w-auto" aria-hidden="true">
      <path d="M8 22 L16 82 Q17 86 21 86 L59 86 Q63 86 64 82 L72 22 Z" fill={fill} stroke="var(--ink)" strokeWidth="4" strokeLinejoin="round" />
      <ellipse cx="40" cy="22" rx="32" ry="8" fill={tone === "pink" ? "#ff94c2" : "var(--pink-50)"} stroke="var(--ink)" strokeWidth="4" />
      <text x="40" y="64" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="var(--font-gabarito)" fill="var(--ink)">
        {label}
      </text>
    </svg>
  );
}

function Pill({ tone }: { tone: "pink" | "berry" | "white" }) {
  const fill = tone === "pink" ? "var(--pink-400)" : tone === "berry" ? "var(--berry-dark)" : "#fff";
  return (
    <svg viewBox="0 0 48 22" className="h-5 w-auto" aria-hidden="true">
      <rect x="2" y="2" width="44" height="18" rx="9" fill={fill} stroke="var(--ink)" strokeWidth="3" />
    </svg>
  );
}

const STEPS = [
  {
    n: "1",
    title: "Halfy reads every request",
    body: "A small model we trained predicts whether a cheap model will answer well. Easy questions go cheap. Hard ones go to your best model.",
    stat: `${ROUTER_FACTS.latencyMsP50} ms`,
    statLabel: "to decide, on a plain CPU",
    art: (
      <div className="flex items-end justify-center gap-1">
        <div className="flex flex-col items-center gap-2">
          <Pill tone="pink" />
          <Bucket tone="pink" label="$" />
        </div>
        <Halfy pose="focused" className="h-32 w-32" />
        <div className="flex flex-col items-center gap-2">
          <Pill tone="berry" />
          <Bucket tone="ink" label="$$$$" />
        </div>
      </div>
    ),
  },
  {
    n: "2",
    title: "Repeats are free",
    body: "Asked the exact same thing before? Halfy answers from memory, instantly, at no cost. Each customer's cache is private to them.",
    stat: "$0",
    statLabel: "for every repeated request",
    art: (
      <div className="relative flex w-full items-end justify-center">
        <Halfy pose="happy" className="h-32 w-32" />
        <span className="display absolute right-3 top-0 whitespace-nowrap sm:right-auto sm:left-1/2 sm:ml-10 rounded-2xl rounded-bl-sm border-[3px] border-ink bg-white px-3 py-1.5 text-[15px] font-extrabold text-ink">
          Know this one!
        </span>
      </div>
    ),
  },
  {
    n: "3",
    title: "Long documents get trimmed",
    body: "Halfly keeps the sentences your question needs and drops the filler. Code, numbers, links and the question itself are never touched.",
    stat: "98%",
    statLabel: "of answers kept at half the tokens",
    art: (
      <div className="flex items-end justify-center gap-3">
        <svg viewBox="0 0 60 80" className="h-20 w-auto" aria-hidden="true">
          <rect x="4" y="4" width="52" height="72" rx="8" fill="#fff" stroke="var(--ink)" strokeWidth="4" />
          {[18, 30, 42, 54].map((y, i) => (
            <rect key={y} x="13" y={y} width={i === 2 ? 34 : 28 + (i % 2) * 6} height="6" rx="3" fill={i === 2 ? "var(--pink-400)" : "var(--chart-gray)"} />
          ))}
        </svg>
        <Halfy pose="squeeze" className="h-32 w-32" />
        <svg viewBox="0 0 60 80" className="h-20 w-auto" aria-hidden="true">
          <rect x="4" y="30" width="52" height="46" rx="8" fill="#fff" stroke="var(--ink)" strokeWidth="4" />
          <rect x="13" y="44" width="34" height="6" rx="3" fill="var(--pink-400)" />
          <rect x="13" y="56" width="22" height="6" rx="3" fill="var(--chart-gray)" />
        </svg>
      </div>
    ),
  },
];

function Wave({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true" className={className}>
      <path d="M0 64 C 240 8, 480 8, 720 36 S 1200 64, 1440 16 L1440 64 Z" fill="var(--wash)" />
    </svg>
  );
}

export function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="relative mt-16 bg-wash py-24 sm:mt-24 sm:py-32">
      <Wave className="absolute inset-x-0 bottom-full h-10 w-full sm:h-16" />
      <Wave className="absolute inset-x-0 top-full h-10 w-full rotate-180 sm:h-16" />
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 id="how-title" className="text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]">
            Meet Halfy. <span className="text-pink-600">Your AI&apos;s accountant.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Three habits, one goal: never pay top price for an answer a cheaper model could give just as well.
          </p>
        </Reveal>

        <ol className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.n}>
              <Reveal delay={i * 0.08} className="h-full">
                <div className="flex h-full flex-col rounded-[32px] border-2 border-pink-100 bg-white p-7 shadow-[0_8px_0_var(--pink-100)]">
                  <div className="flex h-44 items-end justify-center rounded-[24px] bg-pink-50 pb-4">{s.art}</div>
                  <p className="display mt-7 text-[15px] font-extrabold uppercase tracking-[0.1em] text-berry">Step {s.n}</p>
                  <h3 className="mt-1.5 text-[1.75rem] font-extrabold leading-tight">{s.title}</h3>
                  <p className="mt-3 flex-1 text-[16.5px] leading-relaxed text-ink-2">{s.body}</p>
                  <div className="mt-6 flex items-baseline gap-3 rounded-2xl bg-pink-50 px-4 py-3">
                    <span className="display text-[1.9rem] font-extrabold leading-none text-pink-600">
                      <CountUp value={s.stat} />
                    </span>
                    <span className="text-[14px] text-ink-2">{s.statLabel}</span>
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>

        <Reveal>
          <div className="mx-auto mt-10 flex max-w-4xl flex-col items-center gap-4 rounded-[28px] border-2 border-dashed border-pink-300 bg-white px-6 py-5 text-center sm:flex-row sm:text-left">
            <Halfy pose="default" className="h-16 w-16 shrink-0" />
            <p className="text-[16.5px] leading-relaxed text-ink-2">
              <span className="display font-extrabold text-ink">Safety first.</span> If a model is down or busy, Halfy tries the
              other one. If anything about the router fails, requests go to your strong model, so quality never drops
              silently.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
