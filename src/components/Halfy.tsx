import type { ReactNode } from "react";

export type HalfyPose = "default" | "happy" | "focused" | "sleep" | "squeeze";

/**
 * Halfy, the Halfly mascot: a round buddy that is literally half pink, half white, like the logo.
 * Flat SVG version (the hero uses the 3D one). Extra props are drawn in the same 200x200 space via `children`.
 */
export function Halfy({
  pose = "default",
  className,
  title,
  children,
}: {
  pose?: HalfyPose;
  className?: string;
  title?: string;
  children?: ReactNode;
}) {
  const squeeze = pose === "squeeze";
  // Squeezed Halfy is wider and shorter, anchored on the feet.
  const body = squeeze ? { cx: 100, cy: 116, rx: 82, ry: 58 } : { cx: 100, cy: 104, rx: 70, ry: 70 };
  const eyeY = squeeze ? 108 : 96;
  const look = pose === "focused" ? 6 : 0;

  return (
    <svg viewBox="0 0 200 200" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <defs>
        <clipPath id={`halfy-left-${pose}`}>
          <rect x="0" y="0" width="100" height="200" />
        </clipPath>
      </defs>

      {/* shadow */}
      <ellipse cx="100" cy="184" rx={squeeze ? 70 : 52} ry="7" fill="var(--pink-100)" />

      {/* feet */}
      <rect x="72" y="166" width="22" height="13" rx="6.5" fill="var(--ink)" />
      <rect x="106" y="166" width="22" height="13" rx="6.5" fill="var(--ink)" />

      {/* body: white, then the pink half clipped on top, then outline and seam */}
      <ellipse {...body} fill="#fff" />
      <ellipse {...body} fill="var(--pink-400)" clipPath={`url(#halfy-left-${pose})`} />
      <ellipse {...body} fill="none" stroke="var(--ink)" strokeWidth="5" />
      <line x1="100" y1={body.cy - body.ry} x2="100" y2={body.cy + body.ry} stroke="var(--ink)" strokeWidth="5" />

      {/* shine on the pink half */}
      <path d={`M ${body.cx - body.rx * 0.62} ${body.cy - body.ry * 0.35} q 10 -26 34 -34`} stroke="#fff" strokeOpacity="0.75" strokeWidth="6" fill="none" strokeLinecap="round" />

      {/* cheeks */}
      <ellipse cx="66" cy={eyeY + 24} rx="10" ry="6" fill="#fff" fillOpacity="0.45" />
      <ellipse cx="134" cy={eyeY + 24} rx="10" ry="6" fill="var(--pink-300)" fillOpacity="0.7" />

      {/* eyes */}
      {pose === "happy" || pose === "sleep" ? (
        <>
          <path
            d={pose === "happy" ? `M 70 ${eyeY + 4} q 9 -12 18 0` : `M 70 ${eyeY} q 9 7 18 0`}
            stroke="var(--ink)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={pose === "happy" ? `M 112 ${eyeY + 4} q 9 -12 18 0` : `M 112 ${eyeY} q 9 7 18 0`}
            stroke="var(--ink)"
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
          />
        </>
      ) : squeeze ? (
        <>
          <path d={`M 70 ${eyeY - 7} l 14 7 l -14 7`} stroke="var(--ink)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d={`M 130 ${eyeY - 7} l -14 7 l 14 7`} stroke="var(--ink)" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      ) : (
        <>
          <ellipse cx={79 + look} cy={eyeY} rx="9" ry="11.5" fill="var(--ink)" />
          <ellipse cx={121 + look} cy={eyeY} rx="9" ry="11.5" fill="var(--ink)" />
          <circle cx={82 + look} cy={eyeY - 4} r="3.2" fill="#fff" />
          <circle cx={124 + look} cy={eyeY - 4} r="3.2" fill="#fff" />
        </>
      )}

      {/* mouth */}
      {pose === "sleep" ? (
        <ellipse cx="100" cy={eyeY + 26} rx="5" ry="4" fill="var(--ink)" />
      ) : squeeze ? (
        <path d={`M 90 ${eyeY + 24} h 20`} stroke="var(--ink)" strokeWidth="5" strokeLinecap="round" />
      ) : (
        <path d={`M 89 ${eyeY + 20} q 11 ${pose === "happy" ? 15 : 11} 22 0`} stroke="var(--ink)" strokeWidth="5" fill="none" strokeLinecap="round" />
      )}

      {children}
    </svg>
  );
}
