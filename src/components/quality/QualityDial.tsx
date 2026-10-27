"use client";

import { useId, useState } from "react";
import { QUALITY_DIAL } from "@/lib/data";
import { Halfy, type HalfyPose } from "../Halfy";
import { BarChart, type Bar } from "../results/BarChart";

const ROWS = QUALITY_DIAL.rows;
type Target = (typeof ROWS)[number]["target"];

const POSE: Record<Target, HalfyPose> = { 90: "happy", 95: "default", 97: "focused", 99: "focused" };

/* The gauge spans 88-100% left to right, so tick spacing is proportional to the real targets. */
const G_MIN = 88;
const G_MAX = 100;
const angleOf = (t: number) => 180 - ((t - G_MIN) / (G_MAX - G_MIN)) * 180;
const polar = (deg: number, r: number) => {
  const a = (deg * Math.PI) / 180;
  return { x: 130 + r * Math.cos(a), y: 128 - r * Math.sin(a) };
};

/** A playful, decorative gauge: the needle swings to the chosen target. The real control is the radio group.
 * Tick labels hide on phones, where they would render below 13px (the buttons above already show the values). */
function Gauge({ target }: { target: Target }) {
  const arcStart = polar(180, 88);
  const arcEnd = polar(0, 88);
  return (
    <svg viewBox="0 0 260 150" className="h-auto w-full max-w-[270px]" aria-hidden="true">
      <path
        d={`M ${arcStart.x} ${arcStart.y} A 88 88 0 0 1 ${arcEnd.x} ${arcEnd.y}`}
        fill="none"
        stroke="var(--pink-100)"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {ROWS.map((r) => {
        const p = polar(angleOf(r.target), 88);
        const l = polar(angleOf(r.target), 115);
        const on = r.target === target;
        return (
          <g key={r.target}>
            <circle cx={p.x} cy={p.y} r={on ? 9 : 6} fill={on ? "var(--pink-600)" : "#fff"} stroke="var(--ink)" strokeWidth="3" />
            <text
              x={l.x}
              y={l.y + 5}
              textAnchor="middle"
              fontSize="15"
              className="hidden sm:inline"
              fontWeight={on ? 800 : 600}
              fontFamily="var(--font-gabarito)"
              fill={on ? "var(--ink)" : "var(--ink-2)"}
            >
              {r.target}%
            </text>
          </g>
        );
      })}
      <g style={{ transform: `rotate(${90 - angleOf(target)}deg)`, transformOrigin: "130px 128px", transition: "transform 0.5s cubic-bezier(0.34, 1.4, 0.64, 1)" }}>
        <path d="M 130 128 L 130 62" stroke="var(--ink)" strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* knob: half pink, half white, like Halfy */}
      <path d="M 130 112 A 16 16 0 0 0 130 144 Z" fill="var(--pink-400)" />
      <path d="M 130 112 A 16 16 0 0 1 130 144 Z" fill="#fff" />
      <circle cx="130" cy="128" r="16" fill="none" stroke="var(--ink)" strokeWidth="4" />
    </svg>
  );
}

function Tile({ label, value, sub, accent = false }: { label: string; value: string; sub: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col rounded-[22px] p-2.5 sm:p-4 ${accent ? "bg-pink-600 text-white shadow-[0_5px_0_var(--berry-dark)]" : "bg-pink-50"}`}>
      <p className={`text-[13px] font-semibold leading-tight sm:text-[14px] ${accent ? "text-white" : "text-ink-2"}`}>{label}</p>
      <p className="display mt-1.5 text-[clamp(1.5rem,6.2vw,2.6rem)] font-extrabold leading-none tracking-[-0.04em]">{value}</p>
      <p className={`mt-1.5 text-[13px] leading-snug ${accent ? "text-white" : "text-ink-2"}`}>{sub}</p>
    </div>
  );
}

export function QualityDial() {
  const [target, setTarget] = useState<Target>(QUALITY_DIAL.defaultTarget);
  const row = ROWS.find((r) => r.target === target) ?? ROWS[1];
  const name = useId();
  const over = (row.delivered - row.target).toFixed(1);

  const bars: Bar[] = ROWS.map((r) => ({
    label: `Ask ${r.target}% · get ${r.delivered.toFixed(1)}%`,
    short: `${r.target}% → ${r.delivered.toFixed(1)}%`,
    value: r.saving,
    kind: r.target === target ? "ours" : "baseline",
    note: `Asked for at least ${r.target}%, delivered ${r.delivered.toFixed(1)}%. Cost ${r.saving}% lower than always using the strong model.`,
  }));

  return (
    <div className="grid grid-cols-1 gap-6 rounded-[32px] border-2 border-pink-100 bg-white p-5 shadow-[0_8px_0_var(--pink-100)] sm:p-8 lg:grid-cols-[1fr_1.05fr] lg:gap-10">
      <div>
        <fieldset>
          <legend className="display text-[1.35rem] font-extrabold leading-tight text-ink">Pick a quality target</legend>
          <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-2">
            The share of answers that must be as good as your strong model&apos;s.
          </p>
          <div className="mt-5 grid grid-cols-4 gap-2.5 sm:gap-3">
            {ROWS.map((r) => (
              <label key={r.target} className="relative cursor-pointer">
                <input
                  type="radio"
                  name={name}
                  value={r.target}
                  checked={target === r.target}
                  onChange={() => setTarget(r.target)}
                  className="peer sr-only"
                />
                <span className="display flex min-h-14 items-center justify-center rounded-[18px] bg-white text-[clamp(1.15rem,4.6vw,1.45rem)] font-extrabold text-ink shadow-[inset_0_0_0_2px_var(--pink-100),0_5px_0_var(--pink-200)] transition-[transform,box-shadow,background-color] duration-150 hover:bg-pink-50 peer-checked:translate-y-1 peer-checked:bg-pink-600 peer-checked:text-white peer-checked:shadow-[0_1px_0_var(--berry-dark)] peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-[3px] peer-focus-visible:outline-pink-600 peer-focus-visible:outline-solid">
                  {r.target}%
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <p className="sr-only" aria-live="polite">
          {`Target ${row.target}%: Halfly delivered ${row.delivered.toFixed(1)}% and cut cost by ${row.saving}%.`}
        </p>
        <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
          <Tile label="You ask for" value={`${row.target}%`} sub="of answers" />
          <Tile label="You get" value={`${row.delivered.toFixed(1)}%`} sub={`+${over} pts`} />
          <Tile label="You save" value={`${row.saving}%`} sub="off the bill" accent />
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] bg-ink">
          <pre className="overflow-x-auto px-5 py-4 font-mono text-[14px] leading-[1.8] text-white/90">
            <code>
              <span className="text-[#a58aa0]"># halfly.yaml</span>
              {"\n"}router:{"\n"}
              {"  "}quality_target: <span className="font-semibold text-pink-300">{(row.target / 100).toFixed(2)}</span>
            </code>
          </pre>
        </div>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
          <span className="display font-extrabold text-ink">How it works.</span> For each prompt, the router estimates
          the chance a cheap answer is good enough, and those estimates are honest. Halfly picks the cut-off that meets
          your target, then keeps checking itself with audits.
        </p>
      </div>

      <div className="flex flex-col">
        <div className="flex items-end justify-center gap-2 rounded-[24px] bg-pink-50 px-4 pb-4 pt-6">
          <Gauge target={target} />
          <Halfy pose={POSE[target]} className="-ml-4 h-24 w-24 shrink-0 sm:h-28 sm:w-28" />
        </div>
        <h3 className="mt-6 text-[1.35rem] font-extrabold leading-tight">Cost saved at each target</h3>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">
          {QUALITY_DIAL.testPrompts.toLocaleString("en-GB")} held-out prompts, cheap model priced at{" "}
          {Math.round(QUALITY_DIAL.cheapPriceShare * 100)}% of the strong one, before any audits. Higher quality, smaller
          saving.
        </p>
        <div className="mt-6">
          <BarChart
            bars={bars}
            max={100}
            ticks={[0, 50, 100]}
            unit="percent"
            decimals={0}
            valueLabel="Cost saved"
            labelHeader="Target → delivered"
            caption={`Bar chart of cost saved at each quality target. ${ROWS.map(
              (r) => `Target ${r.target}%: delivered ${r.delivered.toFixed(1)}%, saved ${r.saving}%.`,
            ).join(" ")}`}
          />
        </div>
      </div>
    </div>
  );
}
