// Every number on the site comes from here, copied from the repo's models/*/metrics.json.
// Change a result in one place; never type a figure into a component.

export const SITE = {
  name: "Halfly",
  tagline: "Big AI. Tiny bill.",
  description:
    "Halfly is an OpenAI-compatible proxy that cuts LLM costs with a router we trained ourselves, a quality dial, self-checking, caching and prompt compression. Free for 14 days, then you pay a share of what it saves you.",
  // TODO: replace with the real inbox before the site goes live (.example is a reserved, non-working domain).
  contactEmail: "hello@halfly.example",
  url: "https://halfly.dev",
} as const;

// Paid only: a free trial, then a share of the money Halfly measurably saves. Change the offer here.
export const PRICING = {
  trialDays: 14,
  feePct: 20, // Pro: share of measured savings (net of Halfly's own quality checks)
  example: { bill: 10_000, withHalfly: 5_000 }, // a month, to explain the fee
} as const;

export const trialHref = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Halfly free trial")}`;
export const salesHref = `mailto:${SITE.contactEmail}?subject=${encodeURIComponent("Halfly Enterprise")}`;

export type RouterRow = { name: string; short?: string; apgr: number; kind: "baseline" | "competitor" | "ours" | "bound" };

// 10,000 held-out prompts (RouteLLM gpt4_dataset). APGR: random = 0.5, higher is better.
export const ROUTER_RESULTS: RouterRow[] = [
  { name: "Random", apgr: 0.498, kind: "baseline" },
  { name: "Prompt length", apgr: 0.621, kind: "baseline" },
  { name: "kNN", apgr: 0.692, kind: "baseline" },
  { name: "Logistic regression", short: "Log. regression", apgr: 0.7, kind: "baseline" },
  { name: "RouteLLM BERT", apgr: 0.722, kind: "competitor" },
  { name: "Halfly", apgr: 0.731, kind: "ours" },
  { name: "Perfect router", apgr: 0.932, kind: "bound" },
];

export const ROUTER_FACTS = {
  ci95: [0.0015, 0.0168] as const,
  winShare: 0.99,
  eceOurs: 0.016,
  eceRouteLLM: 0.303,
  paramsOurs: "33M",
  paramsRouteLLM: "278M",
  latencyMsP50: 47,
  testPrompts: 10_000,
};

// Answer retention at 50% of tokens kept, 200 fresh SQuAD v2 long-context items.
export const COMPRESSOR_RESULTS = [
  { name: "Random word drop", short: "Random drop", keep: 51.0, kind: "baseline" },
  { name: "Truncation", short: undefined, keep: 60.5, kind: "baseline" },
  { name: "LLMLingua-2", short: undefined, keep: 80.0, kind: "competitor" },
  { name: "Halfly", short: undefined, keep: 98.0, kind: "ours" },
] as const;

// Wrong answers among cache hits, held-out hand-written trap pairs (54).
export const CACHE_RESULTS = {
  cosineWrong: 50.0,
  halflyWrong: 0.0,
  hardSetCosineWrong: 44.4,
  hardSetHalflyWrong: 0.2,
};

// Savings modes from the router evaluation (cheap model at 6% of the strong model's price).
export const SAVINGS_MODES = [
  { id: "balanced", label: "Balanced", saving: 0.496, quality: 97.3, note: "80% of the quality gap recovered" },
  { id: "quality", label: "Quality first", saving: 0.251, quality: 99.3, note: "95% of the quality gap recovered" },
] as const;

// ---- v0.2 ----

// Quality dial: ask for a share of answers as good as the strong model's; the router's calibrated scores turn it
// into a routing decision. 5,000 held-out prompts, cheap model at 6% of the strong one's price, before any audits.
export type QualityRow = { target: number; delivered: number; saving: number };
export const QUALITY_DIAL = {
  testPrompts: 5_000,
  cheapPriceShare: 0.06,
  defaultTarget: 95,
  rows: [
    { target: 90, delivered: 91.0, saving: 82 },
    { target: 95, delivered: 96.1, saving: 58 },
    { target: 97, delivered: 98.2, saving: 43 },
    { target: 99, delivered: 99.7, saving: 19 },
  ] satisfies QualityRow[],
  // Traffic slices (code, maths, short, long prompts): within about this many points of the target.
  sliceTolerancePts: 1,
  lowestSlice: { name: "code", prompts: 166, target: 95, delivered: 94.0 },
  // As audits confirm it on your own traffic, it routes more boldly.
  afterAudits: { audits: 1_000, target: 95, savingBefore: 58, savingAfter: 61.7, medianDelivered: 95.5 },
  overrideExample: 0.99,
} as const;

// Shadow audits: a random share of requests is re-asked to the other model and judged.
export const AUDITS = { samplePct: 2, maxPerHour: 30 } as const;

// Budget caps: responses carry a warning header from this share of a cap.
export const BUDGETS = { warnAtPct: 80 } as const;

// Claude prompt caching: repeated input is billed at about this fraction of the normal input price.
export const PROMPT_CACHING = { cachedInputPriceShare: 0.1 } as const;
