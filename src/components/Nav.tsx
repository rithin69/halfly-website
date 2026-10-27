"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Halfy } from "./Halfy";
import { Logo } from "./Logo";

const LINKS = [
  { href: "/start", label: "Get started" },
  { href: "/#how", label: "How it works" },
  { href: "/#proof", label: "Proof" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Phone menu: close on Escape, and stop the page scrolling behind it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
      <nav
        aria-label="Main"
        className={`relative mx-auto flex max-w-6xl items-center justify-between rounded-[22px] border-2 border-pink-100 bg-white/95 px-3 py-2 backdrop-blur transition-shadow duration-300 sm:px-4 sm:py-2.5 ${
          scrolled || open ? "shadow-[0_10px_30px_-14px_rgba(181,34,104,0.35)]" : ""
        }`}
      >
        <Link href="/#top" aria-label="Halfly home" className="flex min-h-11 items-center rounded-xl px-1" onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <Link href={l.href} className="flex min-h-11 items-center rounded-xl px-4 text-[15.5px] font-medium text-ink transition hover:bg-pink-50 hover:text-berry">
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-2">
          <Link href="/start" className="btn btn-pink hidden min-h-11 px-5 py-2.5 text-[1rem] shadow-[0_4px_0_var(--berry-dark)] sm:inline-flex">
            Start free
          </Link>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex size-11 items-center justify-center rounded-xl bg-pink-50 text-ink transition hover:bg-pink-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
              <path
                d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h10"}
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                fill="none"
              />
            </svg>
          </button>
        </div>

        {open && (
          <div
            id="mobile-menu"
            className="absolute inset-x-0 top-[calc(100%+10px)] overflow-hidden rounded-[26px] border-2 border-pink-100 bg-white p-3 shadow-[0_24px_60px_-20px_rgba(181,34,104,0.45)] lg:hidden"
          >
            <ul>
              {LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="display flex min-h-14 items-center justify-between rounded-2xl px-4 text-[1.5rem] font-extrabold tracking-[-0.03em] text-ink transition active:bg-pink-50 hover:bg-pink-50"
                  >
                    {l.label}
                    <span aria-hidden="true" className="text-pink-600">→</span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-pink-50 p-3">
              <Halfy pose="happy" className="size-14 shrink-0" />
              <Link href="/start" onClick={() => setOpen(false)} className="btn btn-pink w-full">
                Start free
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
