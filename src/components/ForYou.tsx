"use client";

import { useId, useState } from "react";
import { PRICING, SAVINGS_MODES } from "@/lib/data";
import { Reveal } from "./Reveal";

type Who = "developer" | "founder";

export function ForYou() {
  const [who, setWho] = useState<Who>("developer");
  return (
    <section id="for-you" aria-labelledby="for-you-title" className="mx-auto max-w-6xl px-5 pb-10 pt-28 sm:pt-36">
      <Reveal className="text-center">
        <h2 id="for-you-title" className="text-[clamp(2.4rem,5vw,3.6rem)] font-extrabold leading-none text-ink">
          I&apos;m a…
        </h2>
        <div role="tablist" aria-label="Who are you?" className="mt-3 flex flex-wrap items-baseline justify-center gap-x-8">
          {(["developer", "founder"] as const).map((w) => (
            <button
              key={w}
              role="tab"
              type="button"
              id={`tab-${w}`}
              aria-selected={who === w}
              aria-controls={`panel-${w}`}
              onClick={() => setWho(w)}
              className={`display relative pb-2 text-[clamp(3.2rem,9vw,7rem)] font-black capitalize leading-[1.05] tracking-[-0.055em] transition-colors ${
                who === w ? "text-pink-600" : "text-pink-200 hover:text-pink-300"
              }`}
            >
              {w}
              <span
                aria-hidden="true"
                className={`absolute inset-x-1 bottom-0 h-[6px] rounded-full bg-pink-600 transition-transform duration-300 ${who === w ? "scale-x-100" : "scale-x-0"}`}
              />
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-14">
        {who === "developer" ? (
          <div role="tabpanel" id="panel-developer" aria-labelledby="tab-developer">
            <DeveloperPanel />
          </div>
        ) : (
          <div role="tabpanel" id="panel-founder" aria-labelledby="tab-founder">
            <FounderPanel />
          </div>
        )}
      </div>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-lg border-2 border-pink-200 bg-pink-50 px-2.5 py-1 text-[13px] font-bold uppercase tracking-[0.08em] text-berry">
      {children}
    </span>
  );
}

/* ---------------- Developer ---------------- */

type Line = { text: string; changed?: boolean };
const BEFORE: Line[] = [
  { text: "from openai import OpenAI" },
  { text: "" },
  { text: "client = OpenAI()" },
  { text: "" },
  { text: "reply = client.chat.completions.create(" },
  { text: '    model="gpt-4o",' },
  { text: '    messages=[{"role": "user", "content": question}],' },
  { text: ")" },
];
const AFTER: Line[] = [
  { text: "from openai import OpenAI" },
  { text: "" },
  { text: 'client = OpenAI(base_url="http://localhost:8000/v1")', changed: true },
  { text: "" },
  { text: "reply = client.chat.completions.create(" },
  { text: '    model="halfly-auto",', changed: true },
  { text: '    messages=[{"role": "user", "content": question}],' },
  { text: ")" },
];
const STEPS = [
  { cmd: "pip install halfly", note: "Access comes with your free trial" },
  { cmd: "halfly init", note: "Pick your cheap and strong models" },
  { cmd: "halfly serve", note: "Proxy on :8000 · dashboard on /dashboard" },
];

function highlight(src: string) {
  const parts: React.ReactNode[] = [];
  const re = /("[^"]*"|'[^']*'|#.*$|\b(?:from|import|def|return|for|in|if|else|None|True|False)\b)/g;
  let last = 0;
  let k = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) parts.push(src.slice(last, m.index));
    const tok = m[0];
    const cls = tok.startsWith("#") ? "text-[#a58aa0]" : /^["']/.test(tok) ? "text-[#ffaccf]" : "text-[#ff7fb5] font-semibold";
    parts.push(
      <span key={k++} className={cls}>
        {tok}
      </span>,
    );
    last = m.index + tok.length;
  }
  if (last < src.length) parts.push(src.slice(last));
  return parts;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  async function copy(text: string, key: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1600);
    } catch {
      /* clipboard blocked: nothing to do */
    }
  }
  return { copied, copy };
}

function DeveloperPanel() {
  const [after, setAfter] = useState(true);
  const { copied, copy } = useCopy();
  const lines = after ? AFTER : BEFORE;
  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.15fr]">
      <div>
        <Tag>For developers</Tag>
        <h3 className="mt-5 text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.02]">Change one line. Keep everything else.</h3>
        <p className="mt-5 text-lg leading-relaxed text-ink-2">
          Halfly speaks the OpenAI API, so your SDK, streaming and tool calls keep working. It routes to OpenAI, Anthropic
          Claude, Azure, Groq, OpenRouter, Ollama, or anything OpenAI-compatible.
        </p>
        <ol className="mt-9 space-y-3.5">
          {STEPS.map((s, i) => (
            <li key={s.cmd} className="flex items-start gap-4">
              <span className="display mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-[17px] font-extrabold text-berry">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => copy(s.cmd, s.cmd)}
                  aria-label={`Copy command: ${s.cmd}`}
                  className="group flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-pink-100 bg-white px-4 py-3 text-left font-mono text-[14px] transition hover:border-pink-300"
                >
                  <span className="truncate">
                    <span className="text-pink-600">$ </span>
                    {s.cmd}
                  </span>
                  <span className="shrink-0 text-[13px] font-sans font-semibold text-ink-2 group-hover:text-berry" aria-live="polite">
                    {copied === s.cmd ? "Copied!" : "Copy"}
                  </span>
                </button>
                <p className="mt-1.5 pl-1 text-[14px] text-ink-2">{s.note}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="overflow-hidden rounded-[32px] bg-ink shadow-[0_12px_0_var(--pink-200)]">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <div className="flex rounded-2xl bg-white/10 p-1">
            {[false, true].map((a) => (
              <button
                key={String(a)}
                type="button"
                aria-pressed={after === a}
                onClick={() => setAfter(a)}
                className={`display min-h-11 rounded-xl px-4 text-[15px] font-bold transition ${after === a ? "bg-white text-ink" : "text-white/75 hover:text-white"}`}
              >
                {a ? "With Halfly" : "Before"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => copy(lines.map((l) => l.text).join("\n"), "code")}
            className="min-h-11 rounded-xl px-3 text-[14px] font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {copied === "code" ? "Copied!" : "Copy code"}
          </button>
        </div>
        <pre className="overflow-x-auto pb-5 pt-1 font-mono text-[14px] leading-[1.9] text-white/90">
          <code>
            {lines.map((l, i) => (
              <span key={i} className={`block px-5 ${l.changed ? "bg-pink-400/20 shadow-[inset_4px_0_0_var(--pink-400)]" : ""}`}>
                <span className="mr-5 inline-block w-4 select-none text-right text-white/30">{i + 1}</span>
                {l.text ? highlight(l.text) : " "}
              </span>
            ))}
          </code>
        </pre>
        <div className="border-t border-white/10 px-5 py-4 font-mono text-[13px] leading-6 text-white/60">
          <span className="text-white/40"># every response says what happened</span>
          <br />
          x-halfly-tier: <span className="text-pink-300">weak</span> · x-halfly-cache: <span className="text-pink-300">miss</span>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Founder ---------------- */

const MIN = 100;
const MAX = 200_000;
const toValue = (s: number) => Math.round(Math.exp(Math.log(MIN) + (s / 1000) * (Math.log(MAX) - Math.log(MIN))) / 10) * 10;
const toSlider = (v: number) => ((Math.log(v) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN))) * 1000;
const money = (v: number) => (v >= 10_000 ? `$${Math.round(v / 1000).toLocaleString("en-US")}k` : `$${Math.round(v).toLocaleString("en-US")}`);

function FounderPanel() {
  const [bill, setBill] = useState(5000);
  const [modeId, setModeId] = useState<(typeof SAVINGS_MODES)[number]["id"]>("balanced");
  const mode = SAVINGS_MODES.find((m) => m.id === modeId)!;
  const monthly = bill * mode.saving;
  const keep = monthly * (1 - PRICING.feePct / 100);
  const sliderId = useId();

  return (
    <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[1fr_1.15fr]">
      <div>
        <Tag>For founders</Tag>
        <h3 className="mt-5 text-[clamp(2.2rem,4.5vw,3.4rem)] font-extrabold leading-[1.02]">Your AI margin, back.</h3>
        <p className="mt-5 text-lg leading-relaxed text-ink-2">
          Most of your users&apos; questions are easy. Stop paying top price for them. Pick your monthly AI bill to see what
          the benchmark savings would mean for you.
        </p>

        <div className="mt-9 rounded-[28px] border-2 border-pink-100 bg-white p-6 sm:p-7">
          <div role="radiogroup" aria-label="Routing mode" className="inline-flex rounded-2xl bg-pink-50 p-1">
            {SAVINGS_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={modeId === m.id}
                onClick={() => setModeId(m.id)}
                className={`display min-h-11 rounded-xl px-4 text-[15px] font-bold transition ${
                  modeId === m.id ? "bg-white text-ink shadow-[0_2px_0_var(--pink-200)]" : "text-ink-2 hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-7 flex items-baseline justify-between">
            <label htmlFor={sliderId} className="text-[15px] font-medium text-ink-2">
              Monthly AI bill
            </label>
            <span className="display text-2xl font-extrabold">{money(bill)}</span>
          </div>
          <input
            id={sliderId}
            type="range"
            min={0}
            max={1000}
            value={toSlider(bill)}
            onChange={(e) => setBill(toValue(Number(e.target.value)))}
            aria-valuetext={`${money(bill)} per month`}
            className="mt-4 h-3 w-full cursor-pointer appearance-none rounded-full bg-pink-100 accent-[var(--pink-600)]"
          />
          <div className="mt-7 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-pink-50 p-4">
              <p className="text-sm font-medium text-ink-2">Saved / month</p>
              <p className="display mt-1 text-[clamp(2rem,4vw,2.8rem)] font-extrabold leading-none" aria-live="polite">
                {money(monthly)}
              </p>
            </div>
            <div className="rounded-2xl bg-pink-600 p-4 text-white">
              <p className="text-sm font-medium text-white/85">You keep / year</p>
              <p className="display mt-1 text-[clamp(2rem,4vw,2.8rem)] font-extrabold leading-none">{money(keep * 12)}</p>
            </div>
          </div>
          <p className="mt-5 text-[14px] leading-relaxed text-ink-2">
            <span className="font-semibold text-ink">{Math.round(mode.saving * 100)}% lower cost</span> with {mode.quality}% of
            prompts still answered at strong-model quality. &ldquo;You keep&rdquo; is after Halfly&apos;s {PRICING.feePct}% share of
            the saving. Benchmark estimate (cheap model at 6% of the strong one&apos;s price); your real numbers show up in the
            dashboard.
          </p>
        </div>
      </div>
      <DashboardMock />
    </div>
  );
}

/** A faithful sketch of Halfly's built-in dashboard, with example numbers. */
function DashboardMock() {
  // Example month, consistent with the "Balanced" benchmark result (~50% saved).
  const base = [0, 310, 650, 990, 1300, 1660, 2010, 2390, 2770, 3150, 3520, 3900, 4290, 4700, 5100, 5520, 5950, 6380, 6800, 7230, 7690, 8140, 8600, 9100, 9640];
  const ours = base.map((v) => v * 0.504);
  const W = 520;
  const H = 170;
  const max = 10_000;
  const pts = (arr: number[]) => arr.map((v, i) => `${((i / (arr.length - 1)) * W).toFixed(1)},${(H - (v / max) * H).toFixed(1)}`).join(" ");

  return (
    <figure className="overflow-hidden rounded-[32px] border-2 border-pink-100 bg-white shadow-[0_12px_0_var(--pink-100)]">
      <div className="flex items-center gap-2 border-b-2 border-pink-50 px-5 py-3.5">
        <span className="size-3 rounded-full bg-pink-200" />
        <span className="size-3 rounded-full bg-pink-100" />
        <span className="size-3 rounded-full bg-pink-50" />
        <span className="ml-3 rounded-lg bg-pink-50 px-3 py-1 font-mono text-[13px] text-ink-2">localhost:8000/dashboard</span>
      </div>
      <div className="p-5 sm:p-7">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Saved", "$4,780", "50% less"],
            ["Spent", "$4,860", "was $9,640"],
            ["Requests", "182k", "this month"],
            ["Cache hits", "6.1%", "free answers"],
          ].map(([label, value, sub], i) => (
            <div key={label} className={`rounded-2xl p-3.5 ${i === 0 ? "bg-pink-600 text-white" : "bg-pink-50"}`}>
              <p className={`text-[13px] font-medium ${i === 0 ? "text-white/85" : "text-ink-2"}`}>{label}</p>
              <p className="display mt-0.5 text-[1.55rem] font-extrabold leading-tight">{value}</p>
              <p className={`text-[13px] ${i === 0 ? "text-white/80" : "text-ink-2"}`}>{sub}</p>
            </div>
          ))}
        </div>
        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink-2">
            <span className="flex items-center gap-2">
              <span className="h-[3px] w-5 rounded-full bg-[#c9b3c1]" /> Cost without Halfly
            </span>
            <span className="flex items-center gap-2">
              <span className="h-[3px] w-5 rounded-full bg-pink-600" /> Cost with Halfly
            </span>
          </div>
          <svg viewBox={`0 0 ${W} ${H + 4}`} className="mt-3 w-full" role="img" aria-label="Example: cumulative cost this month, $9,640 without Halfly versus $4,860 with Halfly">
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} stroke="var(--pink-50)" strokeWidth="1.5" />
            ))}
            <polygon points={`0,${H} ${pts(ours)} ${W},${H}`} fill="var(--pink-400)" fillOpacity="0.12" />
            <polyline points={pts(base)} fill="none" stroke="#c9b3c1" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <polyline points={pts(ours)} fill="none" stroke="var(--pink-600)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
            <line x1="0" x2={W} y1={H} y2={H} stroke="var(--pink-100)" strokeWidth="2" />
          </svg>
        </div>
        <div className="mt-6">
          <p className="text-[13px] font-medium text-ink-2">Where requests went</p>
          <div className="mt-2 flex h-4 gap-[3px] overflow-hidden rounded-full">
            <span className="h-full rounded-l-full bg-pink-600" style={{ width: "61%" }} />
            <span className="h-full bg-ink" style={{ width: "33%" }} />
            <span className="h-full rounded-r-full bg-pink-200" style={{ width: "6%" }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-ink-2">
            <span>
              <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-pink-600" /> Cheap model 61%
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-ink" /> Strong model 33%
            </span>
            <span>
              <span className="mr-1.5 inline-block size-2.5 rounded-sm bg-pink-200" /> Cache 6%
            </span>
          </div>
        </div>
      </div>
      <figcaption className="border-t-2 border-pink-50 px-5 py-3 text-[13px] text-ink-2 sm:px-7">
        Illustration of the built-in dashboard with example numbers.
      </figcaption>
    </figure>
  );
}
