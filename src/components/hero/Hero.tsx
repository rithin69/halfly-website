"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";
import { ROUTER_FACTS, SAVINGS_MODES } from "@/lib/data";
import { Halfy } from "../Halfy";

const MascotStage = dynamic(() => import("./MascotStage"), { ssr: false, loading: () => <StagePoster /> });

/** Shown while the 3D loads, and where WebGL is unavailable: the flat Halfy. */
function StagePoster() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <Halfy pose="happy" className="h-56 w-56 sm:h-72 sm:w-72" />
    </div>
  );
}

class WebGLBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <StagePoster /> : this.props.children;
  }
}

export function Swoosh({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 34" preserveAspectRatio="none" aria-hidden="true" className={`swoosh pointer-events-none absolute ${className}`}>
      <path d="M6 22 C 90 10, 210 6, 394 14" stroke="var(--pink-400)" strokeWidth="9" fill="none" strokeLinecap="round" />
      <path d="M40 29 C 130 20, 250 17, 360 22" stroke="var(--pink-400)" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden pt-32 sm:pt-40">
      <div className="mx-auto max-w-5xl px-5 text-center">
        {/* Two deliberate lines on phones ("Halve your / AI bill."), one line on wide screens. Words rise in. */}
        <h1 id="hero-title" className="text-[clamp(3.6rem,15vw,7.4rem)] font-extrabold leading-[0.92] tracking-[-0.055em] sm:text-[clamp(3.1rem,9.5vw,7.4rem)]">
          <span className="rise inline-block" style={{ animationDelay: "0.05s" }}>
            Halve
          </span>{" "}
          <span className="rise inline-block" style={{ animationDelay: "0.13s" }}>
            your
          </span>
          <br className="sm:hidden" />{" "}
          <span className="rise relative inline-block whitespace-nowrap" style={{ animationDelay: "0.21s" }}>
            AI bill.
            <Swoosh className="-bottom-[0.16em] left-[1%] h-[0.3em] w-[84%]" />
          </span>
        </h1>
        <p className="display mx-auto mt-9 max-w-3xl text-[clamp(1.35rem,2.6vw,1.9rem)] font-bold leading-tight tracking-[-0.025em]">
          The AI router that sends easy prompts to cheap models, and hard ones to your best.
        </p>
        <p className="mx-auto mt-5 max-w-2xl text-[1.12rem] leading-relaxed text-ink-2">
          Change one line of code. Halfy reads every request, picks the cheapest model that can answer it well, and shows
          you what you saved.
        </p>
        <div className="mx-auto mt-10 flex max-w-sm flex-col gap-4 sm:max-w-none sm:flex-row sm:justify-center">
          <a href="#for-you" className="btn btn-pink w-full sm:w-auto">
            Start saving
            <span aria-hidden="true">→</span>
          </a>
          <a href="#proof" className="btn btn-white w-full sm:w-auto">
            See the proof
          </a>
        </div>
        <p className="mt-7 text-[15px] text-ink-2">
          <span className="font-semibold text-ink">~{Math.round(SAVINGS_MODES[0].saving * 100)}% cheaper</span> on{" "}
          {ROUTER_FACTS.testPrompts.toLocaleString("en-GB")} held-out prompts · beats RouteLLM&apos;s router · see your savings free
        </p>
      </div>

      <div className="mx-auto mt-14 max-w-6xl px-3 sm:mt-16 sm:px-5">
        <div className="relative h-[360px] overflow-hidden rounded-[44px] bg-[linear-gradient(180deg,var(--pink-50)_0%,var(--wash)_55%,var(--pink-100)_100%)] ring-2 ring-pink-100 sm:h-[560px]">
          {/* a faint floor so Halfy and the buckets stand on something */}
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-[30%] bg-[linear-gradient(180deg,transparent,rgba(255,148,194,0.18))]" />
          <WebGLBoundary>
            <MascotStage />
          </WebGLBoundary>
          <p className="sr-only">
            Animation: Halfy, a round half-pink half-white mascot, catches incoming requests and throws easy ones into the
            cheap model&apos;s bucket and hard ones into the strong model&apos;s bucket.
          </p>
        </div>
      </div>
    </section>
  );
}
