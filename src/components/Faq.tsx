import { AUDITS, PRICING } from "@/lib/data";

const gbp = (v: number) => `${PRICING.currency}${v}`;
import { Reveal } from "./Reveal";

const QA = [
  {
    q: "Will my users get worse answers?",
    a: "You decide. Set a quality target, for example 95% of answers as good as your strong model's, and Halfly only uses the cheap model while it can keep that promise. On our benchmark, asking for 95% delivered 96.1% at 58% lower cost. Halfly double-checks a sample of real answers so you can see the quality it actually delivers, and if anything goes wrong with the router, requests go to your strong model.",
  },
  {
    q: "Can I try it without risking anything?",
    a: `Yes, and it is free: no card, no sign-up. Without a paid plan Halfly runs in observe mode: every request still goes to your strong model, so your users see no change, and the dashboard shows what routing would have saved, at what checked quality. When you like the numbers, buy Starter (${gbp(PRICING.starter)} a month), activate your key, and the savings switch on.`,
  },
  {
    q: "Does the double-checking cost money?",
    a: `Yes, a little. Halfly re-asks the other model for about ${AUDITS.samplePct}% of requests, at most ${AUDITS.maxPerHour} an hour, and a judge model scores the answers. That spend is shown on the dashboard and taken off the savings Halfly reports, so the savings you see are already net of it. Audits also pause when a budget cap is reached.`,
  },
  {
    q: "What is the “trained router”?",
    a: "A small machine-learning model we trained on 104,000 real prompts, each labelled by whether a cheaper model answered it well. It reads a prompt in about 47 ms on a normal CPU and predicts the chance the cheap model is good enough. On 10,000 prompts it never saw, it beats RouteLLM's public router.",
  },
  {
    q: "Which providers and models does it work with?",
    a: "Anything that speaks the OpenAI Chat Completions API (OpenAI, Azure OpenAI, Groq, Together, OpenRouter, Ollama, vLLM) plus Anthropic Claude through its official SDK. You pick one cheap and one strong model and set their prices.",
  },
  {
    q: "Do you see or store my prompts?",
    a: "No. Halfly runs on your own servers, so prompts never come to us. By default it does not even write prompt text to its own log; it records only costs and routing decisions. Each API key gets its own cache, so customers never see each other's answers. A paid licence checks in with us about once a day, and it sends only the licence key: no prompts, no usage data.",
  },
  {
    q: "How is this different from RouteLLM or OpenRouter?",
    a: "RouteLLM is research code for routers; Halfly is a ready-to-run proxy with a router that scores higher on the same test, plus caching, prompt compression, fallback and a savings dashboard. OpenRouter is a hosted marketplace for many models; Halfly runs next to your app, on your own servers, in front of whichever providers you already use.",
  },
  {
    q: "How much does it cost?",
    a: `Free to install and try: observe mode, the savings dashboard and budget caps cost nothing. Starter is ${gbp(PRICING.starter)} a month and switches the savings on (routing with the quality dial, exact cache, fallback, dashboard and reports). Pro is ${gbp(PRICING.pro)} a month and adds self-learning, cost and quality per feature, a weekly savings report with budget alerts, and prompt compression. Cancel any time: if you stop paying, your app keeps working and Halfly goes back to free observe mode.`,
  },
  {
    q: "Where do the numbers on this page come from?",
    a: "From held-out test sets the models never saw while training: the RouteLLM gpt4_dataset for routing and SQuAD v2 for compression. We share the raw metrics and the test scripts with any team evaluating Halfly. Your own savings depend on your models and traffic, which is why Halfly logs real costs per request and starts in observe mode.",
  },
];

export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl px-5 pb-28 sm:pb-36">
      <Reveal className="text-center">
        <h2 id="faq-title" className="text-[clamp(2.6rem,6vw,4.4rem)] font-extrabold leading-none">
          Questions?
        </h2>
        <p className="mt-5 text-lg text-ink-2">Straight answers, no small print.</p>
      </Reveal>
      <Reveal className="mt-12 space-y-4">
        {QA.map((item, i) => (
          <details
            key={item.q}
            open={i === 0}
            className="group rounded-[24px] border-2 border-pink-100 bg-white px-6 py-1 shadow-[0_5px_0_var(--pink-100)] open:border-pink-200 open:bg-pink-50/60"
          >
            <summary className="display flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[1.2rem] font-bold text-ink [&::-webkit-details-marker]:hidden">
              {item.q}
              <span
                aria-hidden="true"
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pink-100 text-[1.4rem] leading-none text-berry transition-transform duration-300 group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <p className="pb-5 pr-8 text-[16.5px] leading-relaxed text-ink-2">{item.a}</p>
          </details>
        ))}
      </Reveal>
    </section>
  );
}
