"use client";

import { ArtSvg, C, MiniCard, Paper, Sprig, Stitch, Tape, blob, cut, useUid } from "./shared";

function Bottle({ x, y, w, h, body, cap, label = "#fff", amber = false }: { x: number; y: number; w: number; h: number; body: string; cap: string; label?: string; amber?: boolean }) {
  const nh = h * 0.18;
  return (
    <g transform={`translate(${x} ${y})`}>
      <Paper d={`M${w * 0.2} ${nh} h${w * 0.6} v${-nh * 0.4} h${-w * 0.6}Z`} fill={body} sh={false} />
      <Paper d={`M0 ${nh + 14} q0 -14 14 -14 h${w - 28} q14 0 14 14 V${h - 12} q0 12 -12 12 H12 q-12 0 -12 -12Z`} fill={body} sh="sh2" />
      <rect x={w * 0.16} y={-nh * 0.1 - 4} width={w * 0.68} height={nh * 0.6 + 6} rx="5" fill={cap} />
      <rect x="6" y={h * 0.42} width={w - 12} height={h * 0.34} rx="5" fill={label} opacity={amber ? 0.95 : 0.9} />
      <path d={`M${w * 0.28} ${h * 0.52} h${w * 0.44} M${w * 0.28} ${h * 0.62} h${w * 0.3}`} stroke={C.green} strokeOpacity=".5" strokeWidth="4" strokeLinecap="round" />
      <path d={`M10 ${nh + 30} V${h * 0.38}`} stroke="#fff" strokeOpacity=".5" strokeWidth="5" strokeLinecap="round" />
    </g>
  );
}

export function PharmacyScene({ className, title }: { className?: string; title?: string }) {
  const uid = useUid();
  return (
    <ArtSvg uid={uid} w={960} h={1200} className={className} title={title} fallback="A pharmacy counter with medicine bottles, a paper bag, a green cross sign and a guest card in a holder">
      <Paper d={blob(800, 420, 120, 120, 4, 6)} fill={C.peach} sh={false} />
      {/* shelves */}
      <Paper d={cut(100, 420, 760, 22, 3, 2)} fill={C.cream2} />
      <Paper d={cut(100, 640, 760, 22, 4, 2)} fill={C.cream2} />
      <Bottle x={130} y={324} w={70} h={96} body={C.butter} cap={C.deep} />
      <Bottle x={216} y={344} w={56} h={76} body={C.sage} cap={C.green} />
      <Bottle x={290} y={312} w={78} h={108} body={C.peach} cap={C.coral} />
      <Bottle x={388} y={340} w={60} h={80} body={C.butter} cap={C.deep} />
      <Bottle x={470} y={320} w={72} h={100} body={C.sage} cap={C.deep} />
      <Bottle x={640} y={336} w={64} h={84} body={C.peach} cap={C.green} />
      <Bottle x={724} y={316} w={80} h={104} body={C.butter} cap={C.coral} />
      <Bottle x={130} y={548} w={80} h={92} body={C.sage} cap={C.deep} />
      <Bottle x={232} y={566} w={60} h={74} body={C.peach} cap={C.coral} />
      <Bottle x={312} y={540} w={72} h={100} body={C.butter} cap={C.green} />
      {/* little boxes */}
      <Paper d="M570 580 h90 v60 h-90Z" fill="#fff" sh="sh2" />
      <path d="M570 600 h90" stroke={C.coral} strokeWidth="10" />
      <Paper d="M676 596 h70 v44 h-70Z" fill={C.sage} sh="sh2" />
      <path d="M690 618 h42" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeDasharray="8 6" />
      <Paper d="M760 570 h80 v70 h-80Z" fill={C.butter} sh="sh2" />
      <circle cx="800" cy="605" r="14" fill="#fff" opacity=".85" />
      <Sprig x={440} y={640} s={0.6} rot={-5} />
      <Sprig x={540} y={640} s={0.5} rot={9} color={C.deep} />

      {/* cross sign */}
      <g className={`${uid}-sway`}>
        <path d="M400 0 L440 94 M560 0 L520 94" stroke={C.ink} strokeWidth="3" opacity=".7" />
        <Paper d="M392 94 h176 a16 16 0 0 1 16 16 v150 a16 16 0 0 1 -16 16 h-176 a16 16 0 0 1 -16 -16 v-150 a16 16 0 0 1 16 -16Z" fill="#fff" />
        <Paper d="M452 120 h56 v44 h44 v56 h-44 v44 h-56 v-44 h-44 v-56 h44Z" fill={C.green} sh={false} />
        <Stitch d="M392 106 h176" color={C.sage} w={3} dash="2 8" />
      </g>

      {/* counter */}
      <Paper d={cut(-10, 790, 980, 56, 6, 2.5, 100)} fill="#fff" />
      <Paper d={cut(-10, 842, 980, 400, 7, 2.5, 100)} fill={C.green} sh={false} />
      <Stitch d="M30 890 H930" />
      {[60, 350, 640].map((x, i) => (
        <rect key={i} x={x} y={940} width={260} height={190} rx="16" fill="none" stroke={C.deep} strokeWidth="6" opacity=".5" />
      ))}

      {/* on the counter */}
      <Bottle x={96} y={668} w={90} h={122} body={C.butter} cap={C.deep} amber />
      <Bottle x={206} y={700} w={70} h={90} body={C.sage} cap={C.green} />
      {/* paper bag */}
      <Paper d="M600 640 h190 l16 150 H590Z" fill={C.cream2} />
      <path d="M600 640 h190 l-6 34 h-178Z" fill="#e4d8bb" />
      <Stitch d="M606 700 H788" color={C.coral} w={4} dash="10 8" opacity={0.9} />
      <path d="M660 640 q35 -50 70 0" stroke={C.deep} strokeWidth="5" fill="none" strokeLinecap="round" opacity=".5" />
      <circle cx="695" cy="740" r="22" fill={C.coral} opacity=".9" />
      <path d="M695 728 v24 M683 740 h24" stroke="#fff" strokeWidth="6" strokeLinecap="round" />
      <Sprig x={760} y={642} s={0.6} rot={12} />
      {/* card holder */}
      <Paper d="M340 790 L352 722 H512 L524 790Z" fill={C.sage} opacity={0.9} sh="sh2" />
      <g transform="translate(364 700)">
        <MiniCard x={0} y={0} w={148} rot={-2} />
      </g>
      <Paper d="M334 760 H530 V790 H334Z" fill={C.sage} sh={false} opacity={0.75} />
      <Tape x={850} y={560} w={70} rot={24} color={C.coral} wiggle />
    </ArtSvg>
  );
}
