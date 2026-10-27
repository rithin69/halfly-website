"use client";

import { useEffect, useRef, useState } from "react";

/** Copy text to the clipboard; `copied` is true for a moment afterwards. */
export function useCopied() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);
  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked: the text is still selectable */
    }
  }
  return { copied, copy };
}

export type CodeLine = { text: string; changed?: boolean };

/**
 * A dark code panel with a Copy button. `shell` puts a "$ " prompt before each line (not copied).
 * Long lines scroll inside the panel, never the page.
 */
export function CodeBlock({
  code,
  label,
  shell = false,
  wrap = false,
  copyText,
}: {
  code: string | CodeLine[];
  label: string;
  shell?: boolean;
  /** Wrap long lines (for example a licence key) instead of scrolling them sideways. */
  wrap?: boolean;
  /** What the Copy button copies, if not the code itself. */
  copyText?: string;
}) {
  const { copied, copy } = useCopied();
  const lines: CodeLine[] = typeof code === "string" ? code.split("\n").map((text) => ({ text })) : code;
  const plain = copyText ?? lines.map((l) => l.text).join("\n");
  return (
    <div className="min-w-0 overflow-hidden rounded-[22px] bg-ink shadow-[0_6px_0_var(--pink-200)]">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 py-1 pl-5 pr-2">
        <span className="font-mono text-[13px] text-white/70">{label}</span>
        <button
          type="button"
          onClick={() => copy(plain)}
          className="min-h-11 rounded-xl px-3 text-[14px] font-semibold text-white/80 transition hover:bg-white/10 hover:text-white"
        >
          <span aria-live="polite">{copied ? "Copied!" : "Copy"}</span>
          <span className="sr-only"> {label}</span>
        </button>
      </div>
      <pre className={`py-4 font-mono text-[14px] leading-[1.8] text-white/90 ${wrap ? "whitespace-pre-wrap break-all" : "overflow-x-auto"}`}>
        <code>
          {lines.map((l, i) => (
            <span key={i} className={`block px-5 ${l.changed ? "bg-pink-400/20 shadow-[inset_4px_0_0_var(--pink-400)]" : ""}`}>
              {shell && l.text && (
                <span className="select-none text-pink-300" aria-hidden="true">
                  ${" "}
                </span>
              )}
              {l.text || " "}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

/** Code panels for several languages, with tabs to switch between them. */
export function CodeTabs({ tabs }: { tabs: { id: string; label: string; file: string; code: CodeLine[] }[] }) {
  const [active, setActive] = useState(tabs[0].id);
  const tab = tabs.find((t) => t.id === active) ?? tabs[0];
  return (
    <div>
      <div role="group" aria-label="Language" className="mb-3 inline-flex rounded-2xl bg-pink-50 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={t.id === active}
            onClick={() => setActive(t.id)}
            className={`display min-h-11 rounded-xl px-4 text-[15px] font-bold transition ${
              t.id === active ? "bg-white text-ink shadow-[0_2px_0_var(--pink-200)]" : "text-ink-2 hover:text-ink"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <CodeBlock code={tab.code} label={tab.file} />
    </div>
  );
}
