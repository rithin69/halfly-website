/** The Halfly mark: Halfy's face, half pink and half white. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <clipPath id="logo-left">
        <rect x="0" y="0" width="20" height="40" />
      </clipPath>
      <circle cx="20" cy="20" r="16.5" fill="#fff" />
      <circle cx="20" cy="20" r="16.5" fill="var(--pink-400)" clipPath="url(#logo-left)" />
      <circle cx="20" cy="20" r="16.5" fill="none" stroke="var(--ink)" strokeWidth="3" />
      <line x1="20" y1="3.5" x2="20" y2="36.5" stroke="var(--ink)" strokeWidth="3" />
      <ellipse cx="14.5" cy="18" rx="2.2" ry="2.8" fill="var(--ink)" />
      <ellipse cx="25.5" cy="18" rx="2.2" ry="2.8" fill="var(--ink)" />
      <path d="M17 24.2 q 3 3 6 0" stroke="var(--ink)" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark />
      <span className={`display text-[1.6rem] font-extrabold tracking-[-0.045em] ${light ? "text-white" : "text-ink"}`}>halfly</span>
    </span>
  );
}
