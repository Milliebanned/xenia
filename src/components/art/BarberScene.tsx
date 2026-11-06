"use client";

import { ArtSvg, C, MiniCard, Paper, Sprig, Stitch, Tape, blob, cut, useUid } from "./shared";

export function BarberScene({ className, title }: { className?: string; title?: string }) {
  const uid = useUid();
  return (
    <ArtSvg uid={uid} w={960} h={1200} className={className} title={title} fallback="A barber chair in front of a round mirror, with a shelf holding a comb, scissors and a guest card">
      {/* wall + wainscot */}
      <Paper d={cut(0, 0, 960, 760, 2, 0, 400)} fill={C.cream} sh={false} />
      <Paper d={blob(140, 300, 120, 120, 8, 6)} fill={C.peach} sh={false} />
      <Paper d={cut(-10, 740, 980, 280, 3, 3, 120)} fill={C.sage} sh="sh" />
      <Stitch d="M20 790 H940" color="#fff" />
      <Paper d={cut(-10, 1010, 980, 210, 5, 3, 120)} fill={C.cream2} sh={false} />
      <Stitch d="M40 1100 H920" color={C.green} dash="2 10" opacity={0.35} />

      {/* pendant lamp */}
      <g className={`${uid}-sway`}>
        <path d="M480 0 V210" stroke={C.ink} strokeWidth="4" />
        <circle cx="480" cy="330" r="150" fill={C.butter} opacity=".16" />
        <Paper d="M400 300 C400 230 560 230 560 300 Z" fill={C.butter} sh="sh2" />
        <Paper d="M470 210 H490 V232 H470Z" fill={C.deep} sh={false} />
        <circle cx="480" cy="302" r="16" fill="#fff" opacity=".9" />
      </g>

      {/* round mirror */}
      <Paper d={blob(320, 520, 178, 178, 4, 2.5, 22)} fill={C.green} />
      <circle cx="320" cy="520" r="150" fill="#fdf9ef" />
      <circle cx="320" cy="520" r="150" fill="none" stroke={C.deep} strokeWidth="6" opacity=".35" />
      <path d="M215 470 L300 385 M215 520 L350 385" stroke="#fff" strokeWidth="18" strokeLinecap="round" opacity=".85" />
      <path d="M260 640 q60 20 120 -10" stroke={C.sage} strokeWidth="8" fill="none" strokeLinecap="round" opacity=".6" />
      <Stitch d="M320 358 A162 162 0 1 1 319 358" color={C.cream} w={3} />

      {/* shelf */}
      <Paper d={cut(600, 548, 310, 24, 6, 2)} fill={C.butter} />
      <Paper d="M630 572 V620 H650 V572Z M860 572 V620 H880 V572Z" fill={C.deep} sh={false} />
      <MiniCard x={690} y={410} w={170} rot={4} />
      <Tape x={742} y={398} w={62} h={22} rot={-3} wiggle />
      {/* comb */}
      <g transform="translate(626 520) rotate(-3)" filter={`url(#${uid}-sh2)`}>
        <rect width="86" height="18" rx="8" fill={C.coral} />
        {Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={5 + i * 8} y="16" width="3.5" height="14" rx="1.5" fill={C.coral} />
        ))}
      </g>
      {/* scissors */}
      <g transform="translate(790 466) rotate(14)" filter={`url(#${uid}-sh2)`}>
        <path d="M30 0 L56 62 M56 0 L30 62" stroke={C.cream2} strokeWidth="9" strokeLinecap="round" />
        <path d="M30 0 L56 62 M56 0 L30 62" stroke="#c9c1ad" strokeWidth="2" strokeLinecap="round" />
        <circle cx="26" cy="74" r="12" fill="none" stroke={C.green} strokeWidth="7" />
        <circle cx="60" cy="74" r="12" fill="none" stroke={C.green} strokeWidth="7" />
        <circle cx="43" cy="34" r="4" fill={C.ink} />
      </g>
      {/* bottle */}
      <Paper d="M886 548 V500 q0 -8 8 -8 q8 0 8 8 V548Z" fill={C.sage} sh="sh2" />
      <rect x="890" y="478" width="8" height="14" rx="2" fill={C.deep} />
      <Sprig x={612} y={548} s={0.45} rot={-8} />

      {/* barber chair */}
      <Paper d="M400 1040 h210 q14 0 14 14 v6 q0 14 -14 14 h-210 q-14 0 -14 -14 v-6 q0 -14 14 -14Z" fill={C.deep} />
      <Paper d="M470 960 h70 v90 h-70Z" fill={C.green} sh="sh2" />
      <Paper d="M520 960 l30 10 v80 l-30 -10Z" fill={C.deep} sh={false} opacity={0.4} />
      <Paper d="M368 700 q0 -34 34 -34 h130 q34 0 34 34 V900 H368Z" fill={C.coral} />
      <Paper d="M410 650 q0 -24 24 -24 h70 q24 0 24 24 v30 h-118Z" fill="#f09677" />
      <Stitch d="M392 740 V880 M642 740 V880" color={C.peach} w={3} />
      <Paper d="M340 880 h330 q16 0 16 16 v52 q0 16 -16 16 h-330 q-16 0 -16 -16 v-52 q0 -16 16 -16Z" fill={C.coral} />
      <Stitch d="M346 926 H664" color={C.peach} w={3} />
      <Paper d="M300 840 h50 v90 q0 16 -16 16 h-18 q-16 0 -16 -16Z" fill={C.green} sh="sh2" />
      <Paper d="M660 840 h50 v90 q0 16 -16 16 h-18 q-16 0 -16 -16Z" fill={C.green} sh="sh2" />
      <Paper d="M470 560 h70 v20 h-70Z" fill="none" sh={false} />

      {/* towel on mirror + plants */}
      <Sprig x={150} y={1060} s={1.0} rot={-4} />
      <Sprig x={190} y={1062} s={0.75} rot={10} color={C.deep} />
      <Paper d="M110 1060 h100 l-12 70 h-76Z" fill={C.butter} sh="sh2" />
      <Tape x={730} y={1110} w={90} rot={-8} color={C.coral} />
    </ArtSvg>
  );
}
