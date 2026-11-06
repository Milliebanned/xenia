"use client";

import { ArtSvg, C, MiniCard, Paper, Pin, Sprig, Stitch, Tape, blob, cut, useUid } from "./shared";

function Spool({ x, y, thread, s = 1 }: { x: number; y: number; thread: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <Paper d="M0 0 h74 v12 H0Z M0 76 h74 v12 H0Z" fill={C.cream2} sh="sh2" />
      <Paper d="M8 12 h58 v64 H8Z" fill={thread} sh={false} />
      <path d="M8 26 h58 M8 40 h58 M8 54 h58 M8 68 h58" stroke="#fff" strokeOpacity=".3" strokeWidth="3" />
    </g>
  );
}

export function TailorScene({ className, title }: { className?: string; title?: string }) {
  const uid = useUid();
  return (
    <ArtSvg uid={uid} w={960} h={1200} className={className} title={title} fallback="A dress form with a tape measure around its neck, a guest card pinned to it, and spools of thread on a table">
      {/* window arch */}
      <Paper d="M130 700 V310 a240 240 0 0 1 480 0 V700Z" fill={C.sage} />
      <Paper d="M174 700 V315 a196 196 0 0 1 392 0 V700Z" fill="#fdf9ef" sh={false} />
      <path d="M370 120 V700 M174 360 H566" stroke={C.sage} strokeWidth="10" />
      <circle cx="470" cy="240" r="40" fill={C.butter} opacity=".9" />
      <Paper d={blob(800, 300, 100, 100, 5, 6)} fill={C.peach} sh={false} />

      {/* floor */}
      <Paper d={cut(-10, 1000, 980, 220, 3, 3, 120)} fill={C.cream2} sh="sh" />
      <Stitch d="M30 1080 H930" color={C.green} w={3} dash="2 10" opacity={0.4} />

      {/* dress form stand */}
      <Paper d="M472 800 h16 v190 h-16Z" fill={C.deep} sh="sh2" />
      <path d="M480 960 L380 1030 M480 960 L580 1030 M480 960 V1040" stroke={C.deep} strokeWidth="14" strokeLinecap="round" />
      <circle cx="380" cy="1034" r="9" fill={C.ink} />
      <circle cx="580" cy="1034" r="9" fill={C.ink} />
      <circle cx="480" cy="1044" r="9" fill={C.ink} />
      {/* torso */}
      <Paper d="M440 360 q40 -20 80 0 l6 36 q70 14 96 50 q-18 80 -46 140 q18 70 12 150 q-92 28 -208 0 q-6 -80 12 -150 q-28 -60 -46 -140 q26 -36 96 -50Z" fill={C.coral} />
      <path d="M440 360 q40 -20 80 0 l6 36 q-46 16 -92 0Z" fill="#f09677" />
      <path d="M480 410 V790" stroke={C.peach} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" />
      <path d="M430 430 q-24 100 6 200 q10 50 0 140 M530 430 q24 100 -6 200 q-10 50 0 140" stroke={C.peach} strokeWidth="3" strokeDasharray="2 9" strokeLinecap="round" fill="none" opacity=".8" />
      <Paper d="M476 312 h8 v34 h-8Z" fill={C.deep} sh={false} />
      <circle cx="480" cy="306" r="16" fill={C.butter} />
      <Paper d="M450 350 h60 v24 q-30 10 -60 0Z" fill={C.green} sh="sh2" />
      {/* pinned card */}
      <MiniCard x={402} y={520} w={110} rot={-6} />
      <Pin x={450} y={526} color={C.butter} />
      {/* tape measure draped */}
      <g filter={`url(#${uid}-sh2)`}>
        <path d="M444 372 C380 400 420 470 470 440 C520 410 560 470 604 560 C640 640 600 700 640 760" stroke={C.butter} strokeWidth="26" fill="none" strokeLinecap="round" />
        <path d="M444 372 C380 400 420 470 470 440 C520 410 560 470 604 560 C640 640 600 700 640 760" stroke={C.ink} strokeOpacity=".45" strokeWidth="14" fill="none" strokeDasharray="1.5 7" />
      </g>
      <path d="M636 770 l10 36 l16 -4 l-6 -36Z" fill={C.coral} />

      {/* table + spools */}
      <Paper d={cut(620, 840, 330, 28, 5, 2)} fill={C.green} />
      <Paper d="M660 868 h18 v132 h-18Z M900 868 h18 v132 h-18Z" fill={C.deep} sh={false} />
      <Spool x={640} y={750} thread={C.coral} s={1} />
      <Spool x={730} y={768} thread={C.butter} s={0.85} />
      <Spool x={808} y={760} thread={C.green} s={0.92} />
      <Spool x={864} y={778} thread={C.sage} s={0.75} />
      <path d="M700 800 q40 40 20 80 q-10 20 10 40" stroke={C.coral} strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* pin cushion */}
      <Paper d={blob(300, 1005, 54, 34, 3, 3)} fill={C.butter} sh="sh2" />
      <circle cx="288" cy="990" r="5" fill={C.coral} />
      <circle cx="312" cy="994" r="5" fill={C.green} />
      <circle cx="300" cy="1006" r="5" fill="#fff" />
      <Sprig x={150} y={1010} s={0.9} rot={-5} />
      <Tape x={440} y={510} w={64} h={20} rot={-8} color={C.coral} />
    </ArtSvg>
  );
}
