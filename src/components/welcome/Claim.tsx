"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CodeBlock, useCopied } from "@/components/CodeBlock";
import { Halfy, type HalfyPose } from "@/components/Halfy";
import { SITE, supportHref } from "@/lib/data";

type Licence = { key: string; plan: string; email?: string; exp?: number };
type State =
  | { kind: "loading" }
  | { kind: "ok"; licence: Licence }
  | { kind: "unpaid"; message?: string }
  | { kind: "invalid"; message?: string }
  | { kind: "failed" };

const PLAN_NAMES: Record<string, string> = { starter: "Starter", pro: "Pro" };
const planName = (p: string) => PLAN_NAMES[p] ?? p.charAt(0).toUpperCase() + p.slice(1);

/** Asks the backend for the licence key that belongs to a finished Stripe Checkout session. */
async function claim(sessionId: string, signal: AbortSignal): Promise<State> {
  let res: Response;
  try {
    res = await fetch(`/api/licence/claim?session_id=${encodeURIComponent(sessionId)}`, {
      headers: { accept: "application/json" },
      cache: "no-store",
      signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    return { kind: "failed" };
  }
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* not JSON (for example an HTML error page) */
  }
  const data = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const error = typeof data.error === "string" ? data.error : undefined;
  if (res.ok && typeof data.key === "string" && data.key && typeof data.plan === "string") {
    return {
      kind: "ok",
      licence: {
        key: data.key,
        plan: data.plan,
        email: typeof data.email === "string" ? data.email : undefined,
        exp: typeof data.exp === "number" ? data.exp : undefined,
      },
    };
  }
  if (res.status === 402) return { kind: "unpaid", message: error };
  if (res.status === 400) return { kind: "invalid", message: error };
  return { kind: "failed" };
}

export function Claim() {
  const sessionId = useSearchParams().get("session_id")?.trim() ?? "";
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!sessionId) return;
    const ctrl = new AbortController();
    claim(sessionId, ctrl.signal).then(setState, () => {
      /* aborted: a newer attempt or the page closing replaced this one */
    });
    return () => ctrl.abort();
  }, [sessionId, attempt]);

  const retry = () => {
    setState({ kind: "loading" });
    setAttempt((a) => a + 1);
  };

  if (!sessionId) {
    return (
      <Panel pose="default" title="We couldn't find your checkout">
        <p>
          This page opens straight after you pay, with your checkout details in the link. If you have paid but landed here
          without them, email us your Stripe receipt and we will send your licence key.
        </p>
        <Actions>
          <SupportButton />
          <a href="/start#plans" className="btn btn-white w-full sm:w-auto">
            See the plans
          </a>
        </Actions>
      </Panel>
    );
  }

  switch (state.kind) {
    case "loading":
      return <Loading />;
    case "ok":
      return <Success licence={state.licence} />;
    case "unpaid":
      return (
        <Panel pose="sleep" title="Your payment isn't complete yet">
          <p>
            Stripe hasn&apos;t confirmed this payment, so there is no licence key yet. If you have just paid, give it a
            moment and try again. Still stuck? Email us your Stripe receipt and we will sort it out.
          </p>
          {state.message && <ServerSays message={state.message} />}
          <Actions>
            <button type="button" onClick={retry} className="btn btn-pink w-full sm:w-auto">
              Try again
            </button>
            <SupportButton secondary />
          </Actions>
        </Panel>
      );
    case "invalid":
      return (
        <Panel pose="default" title="That checkout link doesn't look right">
          <p>
            We couldn&apos;t match this link to a checkout. Please open the page again from the button Stripe showed after
            payment, or email us your Stripe receipt and we will send your licence key.
          </p>
          {state.message && <ServerSays message={state.message} />}
          <Actions>
            <SupportButton />
          </Actions>
        </Panel>
      );
    default:
      return (
        <Panel pose="default" title="We couldn't fetch your licence key">
          <p>
            Something went wrong between your browser and our server. Your payment is safe. Try again in a moment, and if
            it keeps happening, email us your Stripe receipt and we will send your key by hand.
          </p>
          <Actions>
            <button type="button" onClick={retry} className="btn btn-pink w-full sm:w-auto">
              Try again
            </button>
            <SupportButton secondary />
          </Actions>
        </Panel>
      );
  }
}

/* ---------------- pieces ---------------- */

export function Loading() {
  return (
    <div role="status" className="flex flex-col items-center py-10 text-center">
      <Halfy pose="focused" className="h-32 w-32" />
      <div aria-hidden="true" className="mt-6 size-10 animate-spin rounded-full border-4 border-pink-100 border-t-pink-600" />
      <p className="display mt-5 text-[1.4rem] font-bold">Getting your licence key…</p>
      <p className="mt-2 text-[15px] text-ink-2">Checking your payment with Stripe. This takes a few seconds.</p>
    </div>
  );
}

function Panel({ pose, title, children }: { pose: HalfyPose; title: string; children: ReactNode }) {
  return (
    <div role="alert" className="rounded-[32px] border-2 border-pink-100 bg-white p-6 shadow-[0_8px_0_var(--pink-100)] sm:p-10">
      <div className="flex flex-col items-start gap-6 sm:flex-row">
        <Halfy pose={pose} className="size-24 shrink-0" />
        <div className="min-w-0 space-y-4 text-[16.5px] leading-relaxed text-ink-2">
          <h1 className="text-[clamp(1.7rem,4vw,2.3rem)] font-extrabold leading-tight text-ink">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-3 pt-2 sm:flex-row">{children}</div>;
}

function ServerSays({ message }: { message: string }) {
  return (
    <p className="rounded-2xl bg-pink-50 px-4 py-3 text-[14px]">
      <span className="font-semibold text-ink">Details: </span>
      {message}
    </p>
  );
}

function SupportButton({ secondary = false }: { secondary?: boolean }) {
  return (
    <a href={supportHref} className={`btn w-full sm:w-auto ${secondary ? "btn-white" : "btn-pink"}`}>
      Email {SITE.contactEmail}
    </a>
  );
}

function Success({ licence }: { licence: Licence }) {
  const { copied, copy } = useCopied();
  const plan = planName(licence.plan);
  const until = licence.exp
    ? new Date(licence.exp * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <Halfy pose="happy" className="h-32 w-32" />
        <h1 className="mt-5 text-[clamp(2.4rem,7vw,4rem)] font-extrabold leading-[0.98] tracking-[-0.05em]">
          Welcome to Halfly <span className="text-pink-600">{plan}</span>!
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-2">
          Your payment went through. Here is your licence key: three commands and your savings are switched on.
        </p>
      </div>

      <section aria-labelledby="key-title" className="rounded-[32px] border-2 border-pink-400 bg-white p-5 shadow-[0_10px_0_var(--pink-400)] sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 id="key-title" className="text-[1.4rem] font-extrabold">
            Your licence key
          </h2>
          <p className="text-[15px] text-ink-2">
            Plan: <span className="font-semibold text-ink">{plan}</span>
            {licence.email ? (
              <>
                {" "}
                · <span className="break-all">{licence.email}</span>
              </>
            ) : null}
          </p>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <output
            aria-label="Licence key"
            className="block min-w-0 flex-1 select-all break-all rounded-2xl bg-pink-50 px-4 py-3.5 font-mono text-[14px] leading-relaxed text-ink ring-2 ring-pink-100"
          >
            {licence.key}
          </output>
          <button type="button" onClick={() => copy(licence.key)} className="btn btn-pink shrink-0">
            <span aria-live="polite">{copied ? "Copied!" : "Copy key"}</span>
          </button>
        </div>
        <p className="mt-4 text-[14px] leading-relaxed text-ink-2">
          Keep it private, like a password. It renews itself while your subscription is active
          {until ? <> (this copy is valid until {until})</> : null}. Lost it? Email{" "}
          <a href={supportHref} className="font-semibold text-berry underline decoration-2 underline-offset-4">
            {SITE.contactEmail}
          </a>
          .
        </p>
      </section>

      <section aria-labelledby="activate-title" className="rounded-[32px] border-2 border-pink-100 bg-white p-5 shadow-[0_8px_0_var(--pink-100)] sm:p-8">
        <h2 id="activate-title" className="text-[1.4rem] font-extrabold">
          Switch it on
        </h2>
        <ol className="mt-5 space-y-5">
          {[
            { title: "Install or update Halfly", code: "pip install halfly", label: "Terminal" },
            { title: "Activate your key", code: `halfly licence activate ${licence.key}`, label: "Terminal" },
            { title: "Restart the proxy", code: "halfly serve", label: "Terminal" },
          ].map((s, i) => (
            <li key={s.title} className="grid grid-cols-[auto_minmax(0,1fr)] gap-4">
              <span
                aria-hidden="true"
                className="display flex size-9 items-center justify-center rounded-xl bg-pink-100 text-[17px] font-extrabold text-berry"
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                <h3 className="display text-[1.15rem] font-bold leading-9">{s.title}</h3>
                <div className="mt-2">
                  <CodeBlock code={s.code} label={s.label} shell wrap />
                </div>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-6 text-[15px] leading-relaxed text-ink-2">
          Stop <span className="font-mono text-ink">halfly serve</span> (Ctrl+C) and start it again so it picks up the key.
          Then open <span className="font-mono text-ink">localhost:8000/dashboard</span>: routing is on and the savings are
          real.
        </p>
      </section>
    </div>
  );
}
