"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts a stat like "98%", "19×", "$0" or "47 ms" up from zero when it scrolls into view.
 * The final text is rendered on the server and reserves the space, so nothing jumps and no-JS visitors see it.
 */
export function CountUp({ value, duration = 1100 }: { value: string; duration?: number }) {
  const m = /^(\D*)([\d.,]+)(.*)$/.exec(value);
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!m || !el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const [, pre, num, post] = m;
    const target = Number(num.replace(/,/g, ""));
    const decimals = num.includes(".") ? num.split(".")[1].length : 0;
    if (!target) return;
    let raf = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const k = Math.min((now - start) / duration, 1);
          const eased = 1 - (1 - k) ** 3;
          setShown(`${pre}${(target * eased).toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}${post}`);
          if (k < 1) raf = requestAnimationFrame(tick);
        };
        setShown(`${pre}0${post}`);
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
    // The parsed parts are derived from `value`; re-run only when it changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return (
    <span ref={ref} className="relative inline-block">
      <span className="invisible">{value}</span>
      <span className="absolute inset-0" aria-hidden="true">
        {shown}
      </span>
      <span className="sr-only">{value}</span>
    </span>
  );
}
