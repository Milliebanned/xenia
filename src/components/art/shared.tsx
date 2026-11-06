"use client";

import { createContext, useContext, useId, type ReactNode } from "react";

export const C = {
  cream: "#f8f2e6",
  cream2: "#efe6d3",
  white: "#fff",
  green: "#2f6b4f",
  sage: "#a9cbb7",
  deep: "#1f4a37",
  butter: "#f2c86b",
  coral: "#e9805f",
  peach: "#fdeadf",
  ink: "#1d2b24",
  skin1: "#e8b58f",
  skin2: "#b97a54",
  skin3: "#f1cdb0",
};

const Ctx = createContext("a");

/** Unique, CSS-safe id per svg instance. */
export function useUid() {
  return "xa" + useId().replace(/[^a-zA-Z0-9]/g, "");
}

/** Deterministic hand-cut polygon: slightly irregular edges. */
export function cut(x: number, y: number, w: number, h: number, seed = 1, j = 3, step = 60) {
  const r = (i: number) => {
    const s = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
    return (s - Math.floor(s)) * 2 - 1;
  };
  const pts: string[] = [];
  let i = 0;
  const add = (px: number, py: number) => pts.push(`${(px + r(i++) * j).toFixed(1)} ${(py + r(i++) * j).toFixed(1)}`);
  const nx = Math.max(1, Math.round(w / step));
  const ny = Math.max(1, Math.round(h / step));
  for (let k = 0; k < nx; k++) add(x + (w * k) / nx, y);
  for (let k = 0; k < ny; k++) add(x + w, y + (h * k) / ny);
  for (let k = 0; k < nx; k++) add(x + w - (w * k) / nx, y + h);
  for (let k = 0; k < ny; k++) add(x, y + h - (h * k) / ny);
  return "M" + pts.join("L") + "Z";
}

/** Rounded paper blob (ellipse-ish with a little wobble). */
export function blob(cx: number, cy: number, rx: number, ry: number, seed = 1, j = 4, n = 14) {
  const pts: string[] = [];
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2;
    const s = Math.sin(seed * 91.7 + k * 17.3) * 43758.5453;
    const w = (s - Math.floor(s)) * 2 - 1;
    pts.push(`${(cx + Math.cos(a) * (rx + w * j)).toFixed(1)} ${(cy + Math.sin(a) * (ry + w * j)).toFixed(1)}`);
  }
  // smooth with quadratic midpoints
  let d = "";
  const P = pts.map((p) => p.split(" ").map(Number));
  for (let k = 0; k < n; k++) {
    const a = P[k];
    const b = P[(k + 1) % n];
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (k === 0) {
      const l = P[n - 1];
      d += `M${((l[0] + a[0]) / 2).toFixed(1)} ${((l[1] + a[1]) / 2).toFixed(1)}`;
    }
    d += `Q${a[0].toFixed(1)} ${a[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + "Z";
}

type SvgProps = {
  uid: string;
  w: number;
  h: number;
  className?: string;
  title?: string;
  fallback: string;
  bg?: string;
  children: ReactNode;
};

export function ArtSvg({ uid, w, h, className, title, fallback, bg = C.cream, children }: SvgProps) {
  const label = title ?? fallback;
  return (
    <Ctx.Provider value={uid}>
      <svg
        role="img"
        aria-label={label}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        className={className}
        style={{ display: "block" }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{label}</title>
        <defs>
          <filter id={`${uid}-sh`} x="-25%" y="-25%" width="150%" height="160%">
            <feDropShadow dx="0" dy="8" stdDeviation="8" floodColor="#1d2b24" floodOpacity=".2" />
          </filter>
          <filter id={`${uid}-sh2`} x="-25%" y="-25%" width="150%" height="160%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#1d2b24" floodOpacity=".26" />
          </filter>
          <filter id={`${uid}-grain`} x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="4" stitchTiles="stitch" />
            <feColorMatrix type="matrix" values="0 0 0 0 .11  0 0 0 0 .17  0 0 0 0 .14  1.6 0 0 0 -.62" />
          </filter>
          <style>{`
            .${uid}-sway{transform-box:fill-box;transform-origin:50% 0;animation:${uid}-sw 7s ease-in-out infinite}
            .${uid}-wig{transform-box:fill-box;transform-origin:50% 50%;animation:${uid}-wg 5s ease-in-out infinite}
            @keyframes ${uid}-sw{0%,100%{transform:rotate(-1.8deg)}50%{transform:rotate(1.8deg)}}
            @keyframes ${uid}-wg{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2.5deg)}}
            @media (prefers-reduced-motion: reduce){.${uid}-sway,.${uid}-wig{animation:none}}
          `}</style>
        </defs>
        <rect width={w} height={h} fill={bg} />
        {children}
        <rect width={w} height={h} filter={`url(#${uid}-grain)`} opacity=".3" style={{ mixBlendMode: "multiply" }} pointerEvents="none" />
      </svg>
    </Ctx.Provider>
  );
}

type PaperProps = {
  d: string;
  fill: string;
  sh?: "sh" | "sh2" | false;
  stroke?: string;
  sw?: number;
  opacity?: number;
  dash?: string;
};

/** A piece of cut paper with a soft shadow. */
export function Paper({ d, fill, sh = "sh", stroke, sw = 0, opacity, dash }: PaperProps) {
  const id = useContext(Ctx);
  return (
    <path
      d={d}
      fill={fill}
      stroke={stroke}
      strokeWidth={sw}
      strokeDasharray={dash}
      strokeLinejoin="round"
      strokeLinecap="round"
      opacity={opacity}
      filter={sh ? `url(#${id}-${sh})` : undefined}
    />
  );
}

/** Dashed stitch line. */
export function Stitch({ d, color = C.cream, w = 3, dash = "2 9", opacity = 0.8 }: { d: string; color?: string; w?: number; dash?: string; opacity?: number }) {
  return <path d={d} fill="none" stroke={color} strokeWidth={w} strokeDasharray={dash} strokeLinecap="round" opacity={opacity} />;
}

/** Translucent washi tape strip. */
export function Tape({ x, y, w = 80, h = 26, rot = -6, wiggle = false, color = C.butter }: { x: number; y: number; w?: number; h?: number; rot?: number; wiggle?: boolean; color?: string }) {
  const id = useContext(Ctx);
  const d = `M0 2 L4 ${h * 0.25} L0 ${h * 0.5} L4 ${h * 0.75} L1 ${h} L${w} ${h - 2} L${w - 4} ${h * 0.7} L${w} ${h * 0.45} L${w - 3} ${h * 0.2} L${w - 1} 0Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <g className={wiggle ? `${id}-wig` : undefined}>
        <path d={d} fill={color} opacity=".82" filter={`url(#${id}-sh2)`} />
        <path d={`M8 ${h / 2} H${w - 8}`} stroke="#fff" strokeOpacity=".55" strokeWidth="2" strokeDasharray="1 7" strokeLinecap="round" />
      </g>
    </g>
  );
}

/** Little leafy sprig. */
export function Sprig({ x, y, s = 1, rot = 0, color = C.green, light = C.sage }: { x: number; y: number; s?: number; rot?: number; color?: string; light?: string }) {
  const leaf = "M0 0 C8 -16 26 -16 34 0 C24 14 8 14 0 0Z";
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <path d="M0 0 C2 -30 -2 -60 4 -92" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d={leaf} fill={color} transform="translate(2 -22) rotate(-35)" />
      <path d={leaf} fill={light} transform="translate(1 -38) rotate(-145) scale(.9)" />
      <path d={leaf} fill={color} transform="translate(2 -56) rotate(-30) scale(.85)" />
      <path d={leaf} fill={light} transform="translate(3 -70) rotate(-150) scale(.75)" />
      <path d={leaf} fill={color} transform="translate(4 -92) rotate(-80) scale(.7)" />
    </g>
  );
}

/** Metal pin / thumbtack. */
export function Pin({ x, y, color = C.coral }: { x: number; y: number; color?: string }) {
  const id = useContext(Ctx);
  return (
    <g filter={`url(#${id}-sh2)`}>
      <circle cx={x} cy={y} r="9" fill={color} />
      <circle cx={x - 2.5} cy={y - 3} r="3" fill="#fff" opacity=".55" />
    </g>
  );
}

/** The small guest card: avatar, two dashed lines, coral strip. Designed in a 200x132 box. */
export function MiniCard({ x, y, w = 200, rot = 0, tape = false, wiggle = false }: { x: number; y: number; w?: number; rot?: number; tape?: boolean; wiggle?: boolean }) {
  const id = useContext(Ctx);
  const s = w / 200;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
      <rect width="200" height="132" rx="12" fill="#fff" filter={`url(#${id}-sh)`} />
      <rect x="5" y="5" width="190" height="122" rx="8" fill="none" stroke={C.sage} strokeWidth="2" strokeDasharray="3 6" strokeLinecap="round" />
      <circle cx="46" cy="42" r="23" fill={C.peach} />
      <circle cx="46" cy="36" r="9" fill={C.skin1} />
      <path d="M30 58 C32 46 60 46 62 58 C54 63 38 63 30 58Z" fill={C.green} />
      <path d="M84 33 H172" stroke={C.green} strokeWidth="5" strokeLinecap="round" strokeDasharray="14 7" opacity=".8" />
      <path d="M84 52 H150" stroke={C.sage} strokeWidth="5" strokeLinecap="round" strokeDasharray="10 7" />
      <path d="M0 0 H176 a4 4 0 0 1 4 4 V22 a4 4 0 0 1 -4 4 H4 a4 4 0 0 1 -4 -4 V4 a4 4 0 0 1 4 -4Z" transform="translate(10 88)" fill={C.coral} />
      <circle cx="26" cy="101" r="4" fill="#fff" opacity=".85" />
      <path d="M42 101 H98" stroke="#fff" strokeOpacity=".85" strokeWidth="4" strokeLinecap="round" strokeDasharray="12 6" />
      <circle cx="170" cy="101" r="4" fill={C.butter} />
      {tape && <Tape x={62} y={-14} w={76} h={26} rot={-3} wiggle={wiggle} />}
    </g>
  );
}

/** Soft sage/peach background shapes, floor etc. are drawn in scenes; this is a small star-ish dot cluster. */
export function Dots({ x, y, color = C.butter }: { x: number; y: number; color?: string }) {
  return (
    <g fill={color}>
      <circle cx={x} cy={y} r="5" />
      <circle cx={x + 18} cy={y + 10} r="3" />
      <circle cx={x - 12} cy={y + 16} r="3.5" />
    </g>
  );
}
