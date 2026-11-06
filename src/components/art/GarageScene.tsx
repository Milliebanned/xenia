"use client";

import { ArtSvg, C, MiniCard, Paper, Pin, Sprig, Stitch, Tape, blob, cut, useUid } from "./shared";

export function GarageScene({ className, title }: { className?: string; title?: string }) {
  const uid = useUid();
  return (
    <ArtSvg uid={uid} w={960} h={1200} className={className} title={title} fallback="A small rounded car raised on a lift, with a wrench, oil can, tyre stack and a guest card pinned to a board">
      <Paper d={blob(790, 250, 110, 110, 3, 6)} fill={C.peach} sh={false} />
      {/* pegboard */}
      <Paper d={cut(70, 80, 470, 250, 3, 3)} fill={C.cream2} />
      {Array.from({ length: 9 }).map((_, r) =>
        Array.from({ length: 16 }).map((_, c) => <circle key={`${r}-${c}`} cx={100 + c * 28} cy={104 + r * 25} r="2.6" fill={C.ink} opacity=".16" />)
      )}
      <MiniCard x={290} y={120} w={190} rot={3} />
      <Pin x={385} y={126} />
      {/* wrench on board */}
      <g filter={`url(#${uid}-sh2)`} transform="translate(120 140) rotate(-12)">
        <rect x="0" y="-9" width="130" height="18" rx="9" fill={C.green} />
        <path d="M130 -24 a24 24 0 1 1 0 48 a24 24 0 0 1 0 -48 M130 -9 h28 v18 h-28Z" fill={C.green} fillRule="evenodd" />
        <circle cx="6" cy="0" r="5" fill={C.cream} />
      </g>
      <Paper d="M112 240 h46 v14 h-46Z" fill={C.coral} sh="sh2" />
      <Paper d="M176 232 h26 v40 h-26Z" fill={C.butter} sh="sh2" />

      {/* floor */}
      <Paper d={cut(-10, 1000, 980, 220, 5, 3, 120)} fill={C.deep} sh="sh" />
      <Stitch d="M30 1085 H930" color={C.butter} w={4} dash="22 16" opacity={0.8} />

      {/* lift posts */}
      <Paper d={cut(168, 380, 44, 624, 4, 1.5, 200)} fill={C.green} />
      <Paper d={cut(748, 380, 44, 624, 5, 1.5, 200)} fill={C.green} />
      <Paper d="M150 990 h80 v22 h-80Z M730 990 h80 v22 h-80Z" fill={C.deep} sh="sh2" />
      <Stitch d="M190 400 V980 M770 400 V980" color={C.sage} w={3} dash="2 12" />
      {/* lift arms */}
      <Paper d={cut(190, 692, 580, 26, 6, 2, 150)} fill={C.butter} />
      <Stitch d="M200 705 H760" color={C.coral} w={4} dash="14 14" />

      {/* car */}
      <g>
        <ellipse cx="480" cy="760" rx="240" ry="14" fill={C.ink} opacity=".1" />
        <Paper d="M250 640 q0 -50 50 -58 l70 -90 q24 -24 60 -24 h90 q46 0 70 30 l50 76 q70 6 70 56 v10 q0 20 -20 20 H270 q-20 0 -20 -20Z" fill={C.coral} />
        <path d="M370 592 l56 -72 q10 -12 28 -12 h70 q22 0 34 18 l34 66Z" fill={C.sage} />
        <path d="M512 508 V592" stroke={C.coral} strokeWidth="10" />
        <path d="M398 565 q40 -40 70 -40" stroke="#fff" strokeWidth="9" strokeLinecap="round" fill="none" opacity=".7" />
        <path d="M262 640 h436" stroke="#fff" strokeOpacity=".5" strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
        <rect x="264" y="610" width="26" height="16" rx="6" fill={C.butter} />
        <path d="M680 610 h28 v16 h-20 q-8 0 -8 -8Z" fill={C.peach} />
        <path d="M560 636 h60" stroke={C.deep} strokeWidth="6" strokeLinecap="round" opacity=".4" />
        {[360, 600].map((cx) => (
          <g key={cx} filter={`url(#${uid}-sh2)`}>
            <circle cx={cx} cy="684" r="46" fill={C.ink} />
            <circle cx={cx} cy="684" r="22" fill={C.cream2} />
            <circle cx={cx} cy="684" r="7" fill={C.ink} opacity=".5" />
          </g>
        ))}
      </g>

      {/* tyre stack */}
      {[0, 1, 2].map((i) => (
        <g key={i} filter={`url(#${uid}-sh2)`}>
          <rect x="80" y={900 - i * 66 + 40} width="190" height="64" rx="30" fill={C.ink} />
          <rect x="108" y={900 - i * 66 + 56} width="134" height="32" rx="16" fill={C.deep} />
        </g>
      ))}
      <ellipse cx="175" cy="774" rx="62" ry="10" fill={C.sage} />
      <ellipse cx="175" cy="774" rx="22" ry="4" fill={C.ink} opacity=".5" />

      {/* oil can */}
      <g transform="translate(700 840)" filter={`url(#${uid}-sh)`}>
        <rect x="0" y="40" width="120" height="124" rx="16" fill={C.butter} />
        <rect x="0" y="82" width="120" height="30" fill={C.coral} />
        <path d="M120 70 q64 -20 90 -80 l-14 -8 q-26 50 -76 62Z" fill={C.butter} />
        <path d="M44 40 V22 q0 -10 10 -10 h14 q10 0 10 10 V40Z" fill={C.deep} />
        <path d="M18 60 q40 -10 84 0" stroke="#fff" strokeOpacity=".6" strokeWidth="6" strokeLinecap="round" fill="none" />
        <circle cx="60" cy="97" r="9" fill="#fff" opacity=".85" />
      </g>
      <Sprig x={330} y={1010} s={0.8} rot={-6} />
      <Tape x={420} y={92} w={80} rot={-5} color={C.coral} wiggle />
    </ArtSvg>
  );
}
