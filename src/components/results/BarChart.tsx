"use client";

import { useId, useState } from "react";

export type Bar = {
  label: string;
  /** Shown on narrow screens instead of a truncated label. */
  short?: string;
  value: number;
  /** ours = the accent hue; everything else is context gray (emphasis chart). */
  kind: "ours" | "competitor" | "baseline" | "bound";
  note?: string;
};

const FILL: Record<Bar["kind"], string> = {
  ours: "var(--pink-600)",
  competitor: "#bfa9b7",
  baseline: "var(--chart-gray)",
  bound: "#f1e8ee",
};

/** Horizontal emphasis bar chart. The axis always starts at zero so small differences are not exaggerated. */
export function BarChart({
  bars,
  max,
  ticks,
  unit,
  valueLabel,
  caption,
  labelHeader = "Method",
  decimals,
}: {
  bars: Bar[];
  max: number;
  ticks: number[];
  /** score: 0.731 (ticks 0.25). percent: 98.0% (ticks 25%). Strings, so a Server Component can pass them. */
  unit: "score" | "percent";
  valueLabel: string;
  caption: string;
  /** Header of the label column in the table view. */
  labelHeader?: string;
  /** Decimal places for values (default: 1 for percent, 3 for score). */
  decimals?: number;
}) {
  const format = (v: number) => (unit === "percent" ? `${v.toFixed(decimals ?? 1)}%` : v.toFixed(decimals ?? 3));
  const formatTick = (v: number) => (unit === "percent" ? `${v}%` : String(v));
  const [active, setActive] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const id = useId();

  return (
    <figure aria-labelledby={`${id}-cap`} className="w-full">
      <figcaption id={`${id}-cap`} className="sr-only">
        {caption}
      </figcaption>

      {table ? (
        <table className="w-full text-left text-[15px]">
          <thead>
            <tr className="border-b border-line text-ink-2">
              <th scope="col" className="py-2 font-medium">{labelHeader}</th>
              <th scope="col" className="py-2 text-right font-medium">{valueLabel}</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {bars.map((b) => (
              <tr key={b.label} className="border-b border-line/70">
                <th scope="row" className={`py-2 font-normal ${b.kind === "ours" ? "font-semibold text-ink" : "text-ink-2"}`}>
                  {b.label}
                </th>
                <td className="py-2 text-right">{format(b.value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="relative" onMouseLeave={() => setActive(null)}>
          {/* Recessive hairline grid, laid out exactly like a bar row so the lines align with the bars. */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex gap-3">
            <span className="w-[38%] shrink-0 sm:w-[32%]" />
            <span className="relative flex-1 pr-[14%]">
              <span className="relative block h-full">
                {ticks.map((t) => (
                  <span key={t} className="absolute inset-y-0 w-px bg-line" style={{ left: `${(t / max) * 100}%` }} />
                ))}
              </span>
            </span>
          </div>

          <ul className="relative space-y-2.5">
            {bars.map((b, i) => {
              const pct = (b.value / max) * 100;
              const on = active === i;
              return (
                <li
                  key={b.label}
                  tabIndex={0}
                  aria-label={`${b.label}: ${format(b.value)}${b.note ? `. ${b.note}` : ""}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  className="group relative flex items-center gap-3 rounded-lg py-1 outline-none"
                >
                  <span
                    className={`w-[38%] shrink-0 truncate pr-2 text-right text-[14px] sm:w-[32%] ${
                      b.kind === "ours" ? "font-semibold text-ink" : "text-ink-2"
                    }`}
                  >
                    {b.short ? (
                      <>
                        <span className="sm:hidden">{b.short}</span>
                        <span className="hidden sm:inline">{b.label}</span>
                      </>
                    ) : (
                      b.label
                    )}
                  </span>
                  <span className="relative h-[22px] flex-1 pr-[14%]">
                    <span className="relative block h-full">
                      <span
                        className="absolute inset-y-0 left-0 rounded-r-[4px] transition-[filter] duration-200"
                        style={{
                          width: `${pct}%`,
                          background: FILL[b.kind],
                          filter: active !== null && !on ? "saturate(0.6) opacity(0.55)" : "none",
                        }}
                      />
                      <span
                        className={`absolute top-1/2 ml-1.5 -translate-y-1/2 rounded bg-white px-1 text-[13px] tabular-nums ${
                          b.kind === "ours" ? "font-semibold text-ink" : "text-ink-2"
                        }`}
                        style={{ left: `${pct}%` }}
                      >
                        {format(b.value)}
                      </span>
                    </span>
                    {on && b.note && (
                      <span
                        role="tooltip"
                        className="absolute bottom-full left-0 z-10 mb-2 w-max max-w-[260px] rounded-xl border border-line bg-white px-3 py-2 text-[13px] leading-snug text-ink-2 shadow-[0_12px_32px_-12px_rgba(30,20,32,0.25)]"
                      >
                        <span className="block font-semibold text-ink">
                          {b.label} · {format(b.value)}
                        </span>
                        {b.note}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>

          <div aria-hidden="true" className="mt-3 flex gap-3 text-[13px] tabular-nums text-ink-2">
            <span className="w-[38%] shrink-0 sm:w-[32%]" />
            <span className="relative h-4 flex-1 pr-[14%]">
              <span className="relative block h-full">
                {ticks.map((t) => (
                  <span key={t} className="absolute -translate-x-1/2" style={{ left: `${(t / max) * 100}%` }}>
                    {formatTick(t)}
                  </span>
                ))}
              </span>
            </span>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setTable((v) => !v)}
        className="mt-4 inline-flex min-h-11 items-center text-[14px] font-medium text-berry underline decoration-pink-300 underline-offset-4 hover:decoration-berry"
      >
        {table ? "Show as chart" : "Show as table"}
      </button>
    </figure>
  );
}
