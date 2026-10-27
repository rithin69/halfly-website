import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Footer } from "@/components/Closing";
import { CodeBlock, CodeTabs, type CodeLine } from "@/components/CodeBlock";
import { Halfy } from "@/components/Halfy";
import { Nav } from "@/components/Nav";
import { PlanCards } from "@/components/Pricing";
import { Reveal } from "@/components/Reveal";
import { PRICING, SITE, proHref, starterHref } from "@/lib/data";

export const metadata: Metadata = {
  title: `Get started free | ${SITE.name}`,
  description:
    "Install Halfly in minutes, free: no card, no sign-up. It watches your real traffic and shows what routing would save, then you switch the savings on from £5 a month.",
  alternates: { canonical: "/start" },
};

const PYTHON: CodeLine[] = [
  { text: "from openai import OpenAI" },
  { text: "" },
  { text: 'client = OpenAI(base_url="http://localhost:8000/v1")', changed: true },
  { text: "" },
  { text: "reply = client.chat.completions.create(" },
  { text: '    model="halfly-auto",', changed: true },
  { text: '    messages=[{"role": "user", "content": question}],' },
  { text: ")" },
];

const JS: CodeLine[] = [
  { text: 'import OpenAI from "openai";' },
  { text: "" },
  { text: 'const client = new OpenAI({ baseURL: "http://localhost:8000/v1" });', changed: true },
  { text: "" },
  { text: "const reply = await client.chat.completions.create({" },
  { text: '  model: "halfly-auto",', changed: true },
  { text: '  messages: [{ role: "user", content: question }],' },
  { text: "});" },
];

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded-md bg-pink-50 px-1.5 py-0.5 font-mono text-[0.92em] text-berry">{children}</code>
);

const gbp = (v: number) => `${PRICING.currency}${v}`;

type Step = { title: string; body: ReactNode; code?: ReactNode };

const STEPS: Step[] = [
  {
    title: "Install Halfly",
    body: (
      <>
        One command. <strong className="font-semibold text-ink">Requires Python 3.10+.</strong>
      </>
    ),
    code: <CodeBlock code="pip install halfly" label="Terminal" shell />,
  },
  {
    title: "Create your config",
    body: (
      <>
        <Code>halfly init</Code> writes <Code>halfly.yaml</Code>. Pick your strong model (the one you use today) and a cheap
        one, and set their prices in US dollars per million tokens: they drive every savings number Halfly reports.
      </>
    ),
    code: <CodeBlock code="halfly init" label="Terminal" shell />,
  },
  {
    title: "Add your provider key",
    body: (
      <>
        Put it in a <Code>.env</Code> file next to <Code>halfly.yaml</Code> (Halfly loads it), or set it in your environment.
        On OpenAI or another provider? Use the key name from <Code>halfly.yaml</Code>, such as <Code>OPENAI_API_KEY</Code>.
        Your keys stay on your machine.
      </>
    ),
    code: <CodeBlock code="ANTHROPIC_API_KEY=sk-ant-..." label=".env" />,
  },
  {
    title: "Start the proxy",
    body: (
      <>
        Halfly now listens on <Code>http://localhost:8000</Code>, in front of your providers.
      </>
    ),
    code: <CodeBlock code="halfly serve" label="Terminal" shell />,
  },
  {
    title: "Point your app at Halfly",
    body: (
      <>
        Change the base URL to <Code>http://localhost:8000/v1</Code> and ask for the model <Code>halfly-auto</Code>. Your
        SDK, streaming and tool calls keep working.
      </>
    ),
    code: (
      <CodeTabs
        tabs={[
          { id: "py", label: "Python", file: "app.py", code: PYTHON },
          { id: "js", label: "JavaScript", file: "app.js", code: JS },
        ]}
      />
    ),
  },
  {
    title: "Watch the “would save” number grow",
    body: (
      <>
        Open{" "}
        <a
          href="http://localhost:8000/dashboard"
          className="font-mono font-semibold text-berry underline decoration-2 underline-offset-4 hover:text-berry-dark"
        >
          localhost:8000/dashboard
        </a>
        . On the free plan Halfly runs in observe mode: every request still goes to your strong model, so your users see no
        change, while the dashboard counts what routing would save you, and at what checked quality.
      </>
    ),
  },
  {
    title: "Switch the savings on",
    body: (
      <>
        Like the number? Buy Starter ({gbp(PRICING.starter)} a month) or Pro ({gbp(PRICING.pro)} a month). After checkout you
        get your licence key on screen: activate it, restart <Code>halfly serve</Code>, and routing switches on. If you ever
        stop paying, Halfly goes back to observe mode and your app keeps working.
      </>
    ),
    code: (
      <div className="space-y-4">
        <CodeBlock code={"halfly licence activate <key>\nhalfly serve"} label="Terminal" shell />
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={starterHref} className="btn btn-pink w-full sm:w-auto">
            Buy Starter · {gbp(PRICING.starter)}/mo
          </a>
          <a href={proHref} className="btn btn-white w-full sm:w-auto">
            Buy Pro · {gbp(PRICING.pro)}/mo
          </a>
        </div>
      </div>
    ),
  },
];

export default function StartPage() {
  return (
    <>
      <Nav />
      <main id="main">
        <section aria-labelledby="start-title" className="mx-auto max-w-4xl px-5 pb-16 pt-32 sm:pt-40">
          <Reveal className="grid grid-cols-1 items-center gap-8 md:grid-cols-[1fr_auto]">
            <div>
              <p className="inline-block rounded-lg border-2 border-pink-200 bg-pink-50 px-2.5 py-1 text-[13px] font-bold uppercase tracking-[0.08em] text-berry">
                Free · no card · no sign-up
              </p>
              <h1 id="start-title" className="mt-5 text-[clamp(2.8rem,8vw,5rem)] font-extrabold leading-[0.95] tracking-[-0.05em]">
                Get started <span className="text-pink-600">free.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
                Install Halfly in minutes. It watches your real traffic and shows what you would save, before you pay a
                penny. When you like the number, switch it on for {gbp(PRICING.starter)} a month.
              </p>
            </div>
            <Halfy pose="focused" className="mx-auto hidden h-40 w-40 md:block" />
          </Reveal>

          <ol className="mt-14 space-y-6">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className="grid grid-cols-1 gap-4 rounded-[32px] border-2 border-pink-100 bg-white p-5 shadow-[0_8px_0_var(--pink-100)] sm:grid-cols-[auto_minmax(0,1fr)] sm:gap-6 sm:p-8"
              >
                <span
                  aria-hidden="true"
                  className="display flex size-11 items-center justify-center rounded-2xl bg-pink-100 text-[1.3rem] font-extrabold text-berry"
                >
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <h2 className="text-[clamp(1.5rem,3.2vw,1.9rem)] font-extrabold leading-tight">
                    <span className="sr-only">Step {i + 1}: </span>
                    {s.title}
                  </h2>
                  <p className="mt-2 text-[16.5px] leading-relaxed text-ink-2">{s.body}</p>
                  {s.code && <div className="mt-5">{s.code}</div>}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="plans" aria-labelledby="plans-title" className="bg-wash py-24 sm:py-28">
          <div className="mx-auto max-w-6xl px-5">
            <Reveal className="mb-14 text-center">
              <h2 id="plans-title" className="text-[clamp(2.4rem,5.5vw,4rem)] font-extrabold leading-[0.98]">
                Like the number?
                <br />
                <span className="text-pink-600">Switch it on.</span>
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-2">
                Start free, then pick a plan when your dashboard shows the saving is worth it.
              </p>
            </Reveal>
            <PlanCards freeHref="#main" />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
