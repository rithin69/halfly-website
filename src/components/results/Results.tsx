import { CACHE_RESULTS, COMPRESSOR_RESULTS, ROUTER_FACTS, ROUTER_RESULTS, SAVINGS_MODES } from "@/lib/data";
import { CountUp } from "../CountUp";
import { Halfy } from "../Halfy";
import { Reveal } from "../Reveal";
import { BarChart, type Bar } from "./BarChart";

const ROUTER_NOTES: Record<string, string> = {
  Random: "Coin flip. Any router must beat 0.50.",
  "Prompt length": "Longer prompt, stronger model.",
  kNN: "Copies the outcome of the 64 most similar training prompts.",
  "Logistic regression": "Linear model on the same embeddings.",
  "RouteLLM BERT": "The best public router you can run without an API key (278M parameters).",
  Halfly: "Our router: bge-small embeddings + 12 prompt features + a small MLP (33M parameters).",
  "Perfect router": "Knows every answer in advance. The ceiling.",
};

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[32px] border-2 border-pink-100 bg-white p-6 shadow-[0_8px_0_var(--pink-100)] sm:p-8 ${className}`}>{children}</div>;
}

function Stat({ value, label, children }: { value: string; label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border-2 border-pink-100 bg-white p-5 shadow-[0_6px_0_var(--pink-100)]">
      <p className="display text-[2.4rem] font-extrabold leading-none tracking-[-0.04em] text-pink-600">
        <CountUp value={value} />
      </p>
      <p className="display mt-2 text-[17px] font-bold leading-snug text-ink">{label}</p>
      <p className="mt-1.5 text-[14px] leading-snug text-ink-2">{children}</p>
    </div>
  );
}

export function Results() {
  const routerBars: Bar[] = ROUTER_RESULTS.map((r) => ({ label: r.name, short: r.short, value: r.apgr, kind: r.kind, note: ROUTER_NOTES[r.name] }));
  const compressorBars: Bar[] = COMPRESSOR_RESULTS.map((r) => ({
    label: r.name,
    short: r.short,
    value: r.keep,
    kind: r.kind,
    note:
      r.name === "Halfly"
        ? "LLMLingua-2 plus a question-aware boost that protects sentences sharing words with the question."
        : r.name === "LLMLingua-2"
          ? "Microsoft's token-classification compressor (our faithful re-implementation)."
          : undefined,
  }));
  const calibrationX = Math.round(ROUTER_FACTS.eceRouteLLM / ROUTER_FACTS.eceOurs);

  return (
    <section id="proof" aria-labelledby="proof-title" className="mx-auto max-w-6xl px-5 py-28 sm:py-36">
      <Reveal className="grid grid-cols-1 items-end gap-8 md:grid-cols-[1fr_auto]">
        <div>
          <h2 id="proof-title" className="text-[clamp(2.6rem,6vw,4.6rem)] font-extrabold leading-[0.98]">
            Don&apos;t trust us.
            <br />
            <span className="text-pink-600">Check the numbers.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
            Every result below comes from test data the models never saw while training. We share the raw metrics and the test
            scripts with any team evaluating Halfly.
          </p>
        </div>
        <Halfy pose="focused" className="hidden h-36 w-36 md:block" />
      </Reveal>

      <Reveal className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <h3 className="text-[1.6rem] font-extrabold leading-tight">The router beats RouteLLM</h3>
          <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">
            Average quality gap recovered (APGR) across every budget, on {ROUTER_FACTS.testPrompts.toLocaleString("en-GB")}{" "}
            held-out prompts. Higher is better.
          </p>
          <div className="mt-8">
            <BarChart
              bars={routerBars}
              max={1}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              unit="score"
              valueLabel="APGR"
              caption="Bar chart of APGR by router. Halfly 0.731, RouteLLM BERT 0.722, logistic regression 0.700, kNN 0.692, prompt length 0.621, random 0.498, perfect router 0.932."
            />
          </div>
        </Card>
        <div className="grid grid-cols-2 content-start gap-4">
          <Stat value={`${Math.round(ROUTER_FACTS.winShare * 100)}%`} label="of re-tests won vs RouteLLM">
            2,000 bootstrap resamples · lead +{ROUTER_FACTS.ci95[0]} to +{ROUTER_FACTS.ci95[1]} (95% CI)
          </Stat>
          <Stat value={`${calibrationX}×`} label="more honest scores">
            Calibration error {ROUTER_FACTS.eceOurs} vs {ROUTER_FACTS.eceRouteLLM}: &ldquo;90% sure&rdquo; means ~90%
          </Stat>
          <Stat value="8×" label="smaller model">
            {ROUTER_FACTS.paramsOurs} vs {ROUTER_FACTS.paramsRouteLLM} parameters
          </Stat>
          <Stat value={`${ROUTER_FACTS.latencyMsP50}ms`} label="to decide">
            Median, 2 CPU threads, no GPU
          </Stat>
          <div className="col-span-2 rounded-[26px] bg-pink-600 p-6 text-white shadow-[0_6px_0_var(--berry-dark)]">
            <p className="display text-[15px] font-extrabold uppercase tracking-[0.1em] text-pink-100">In plain words</p>
            <p className="mt-2 text-[17px] leading-relaxed">
              With a cheap model at 6% of the strong model&apos;s price, the bill drops about{" "}
              <strong className="display text-[1.3em] font-extrabold">{Math.round(SAVINGS_MODES[0].saving * 100)}%</strong> while{" "}
              {SAVINGS_MODES[0].quality}% of prompts still get strong-model quality. Playing it safer: about{" "}
              <strong className="display text-[1.3em] font-extrabold">{Math.round(SAVINGS_MODES[1].saving * 100)}%</strong> off at{" "}
              {SAVINGS_MODES[1].quality}%.
            </p>
          </div>
        </div>
      </Reveal>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <Card className="h-full">
            <h3 className="text-[1.6rem] font-extrabold leading-tight">Half the tokens, the answer still there</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">
              Share of long prompts (≈2,900 tokens) that still contain the answer after cutting them to half their tokens.
              200 fresh SQuAD v2 items.
            </p>
            <div className="mt-8">
              <BarChart
                bars={compressorBars}
                max={100}
                ticks={[0, 25, 50, 75, 100]}
                unit="percent"
                valueLabel="Answers kept"
                caption="Bar chart of answers kept at half the tokens. Halfly 98.0%, LLMLingua-2 80.0%, truncation 60.5%, random word drop 51.0%."
              />
            </div>
            <p className="mt-6 text-[14px] leading-relaxed text-ink-2">
              Trade-off: about 1 second per 1,000 tokens on a CPU, so it is off by default and meant for long documents.
            </p>
          </Card>
        </Reveal>
        <Reveal delay={0.08}>
          <Card className="flex h-full flex-col">
            <h3 className="text-[1.6rem] font-extrabold leading-tight">A cache that refuses to guess</h3>
            <p className="mt-2 text-[15.5px] leading-relaxed text-ink-2">
              Wrong answers served on 54 hand-written trap pairs, like &ldquo;sort ascending&rdquo; vs &ldquo;sort
              descending&rdquo;.
            </p>
            <dl className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-[22px] bg-[#f6eff3] p-5">
                <dt className="text-[14px] font-medium text-ink-2">Similarity matching</dt>
                <dd className="display mt-1 text-[3.2rem] font-extrabold leading-none tracking-[-0.04em]">
                  <CountUp value={`${CACHE_RESULTS.cosineWrong}%`} />
                </dd>
                <dd className="mt-1 text-[13px] text-ink-2">the usual approach</dd>
              </div>
              <div className="rounded-[22px] bg-pink-50 p-5 ring-2 ring-pink-200">
                <dt className="text-[14px] font-medium text-ink-2">Halfly verifier</dt>
                <dd className="display mt-1 text-[3.2rem] font-extrabold leading-none tracking-[-0.04em] text-pink-600">{CACHE_RESULTS.halflyWrong}%</dd>
                <dd className="mt-1 text-[13px] text-ink-2">rule guard + NLI model</dd>
              </div>
            </dl>
            <p className="mt-6 text-[14px] leading-relaxed text-ink-2">
              Honest note: it is cautious and catches only about a quarter of true rewordings, so &ldquo;same meaning&rdquo;
              caching ships switched off. Exact-match caching is always on.
            </p>
          </Card>
        </Reveal>
      </div>

      <p className="mt-10 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">
        Router labels: a GPT-4 judge scored the cheap model&apos;s answer (Mixtral) against GPT-4&apos;s; a prompt counts as
        &ldquo;fine on the cheap model&rdquo; at 4/5 or above (86.5% of prompts). Data: RouteLLM gpt4_dataset (Apache-2.0),
        SQuAD v2 (CC BY-SA 4.0). Your own model pair will differ, so Halfly logs your real savings per request.
      </p>
    </section>
  );
}
