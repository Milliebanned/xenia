"use client";

import { ArtSvg, C, MiniCard, Paper, Sprig, Stitch, Tape, blob, cut, useUid } from "./shared";

type P = { className?: string; title?: string };

function Cuff({ x1, y1, x2, y2, w, color }: { x1: number; y1: number; x2: number; y2: number; w: number; color: string }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />;
}

export function HeroHandover({ className, title }: P) {
  const uid = useUid();
  return (
    <ArtSvg uid={uid} w={1200} h={900} className={className} title={title} fallback="Two hands pass a small guest card across a shop counter">
      {/* backdrop */}
      <Paper d={blob(190, 230, 140, 140, 3, 8)} fill={C.peach} sh={false} />
      <Paper d={blob(1030, 150, 90, 90, 5, 6)} fill={C.cream2} sh={false} />
      <Paper d="M320 650 V300 a280 280 0 0 1 560 0 V650Z" fill={C.sage} />
      <Paper d="M368 650 V305 a232 232 0 0 1 464 0 V650Z" fill="#fdf9ef" sh={false} />
      <circle cx="690" cy="215" r="52" fill={C.butter} />
      <path d="M600 72 V650 M368 330 H832 M410 190 C520 250 680 250 790 190" stroke={C.sage} strokeWidth="12" fill="none" strokeLinecap="round" />
      <Paper d={cut(340, 640, 520, 24, 4, 2)} fill={C.cream2} />
      <Sprig x={410} y={640} s={0.9} rot={-6} />
      <Sprig x={800} y={640} s={0.75} rot={8} color={C.deep} />

      {/* counter */}
      <Paper d={cut(-10, 612, 1220, 52, 6, 2.5, 80)} fill="#fff" />
      <Paper d={cut(-10, 660, 1220, 260, 7, 2.5, 80)} fill={C.green} sh={false} />
      <Stitch d="M20 704 H1180" />
      <path d="M0 790 H1200" stroke={C.deep} strokeWidth="3" opacity=".35" />
      {[110, 450, 790].map((x, i) => (
        <rect key={i} x={x} y={730} width={300} height={140} rx="14" fill="none" stroke={C.deep} strokeWidth="6" opacity=".5" />
      ))}

      {/* pot + ticket on counter */}
      <Paper d="M120 565 H212 L200 612 H134Z" fill={C.coral} sh="sh2" />
      <Paper d="M112 556 H220 V574 H112Z" fill="#f09677" sh="sh2" />
      <Sprig x={150} y={558} s={0.85} rot={-8} />
      <Sprig x={185} y={558} s={0.7} rot={14} color={C.deep} />
      <g transform="translate(905 524) rotate(5)">
        <Paper d="M0 0 H150 V30 a14 14 0 0 0 0 30 V90 H0 V60 a14 14 0 0 0 0 -30Z" fill={C.butter} />
        <path d="M22 45 H128" stroke="#fff" strokeOpacity=".8" strokeWidth="4" strokeDasharray="3 9" strokeLinecap="round" />
        <path d="M24 22 H80 M24 70 H100" stroke={C.deep} strokeOpacity=".55" strokeWidth="6" strokeLinecap="round" />
        <circle cx="122" cy="70" r="7" fill={C.coral} />
      </g>
      <Sprig x={1100} y={612} s={0.8} rot={6} />

      {/* left arm (behind-card fingers first) */}
      <g filter={`url(#${uid}-sh)`}>
        <Cuff x1={-70} y1={520} x2={200} y2={452} w={138} color={C.coral} />
        <Cuff x1={214} y1={449} x2={248} y2={440} w={146} color={C.peach} />
        <Cuff x1={258} y1={438} x2={372} y2={418} w={100} color={C.skin1} />
        <Cuff x1={372} y1={436} x2={510} y2={440} w={34} color={C.skin1} />
        <Cuff x1={366} y1={462} x2={496} y2={474} w={32} color={C.skin1} />
      </g>
      {/* right arm */}
      <g filter={`url(#${uid}-sh)`}>
        <Cuff x1={1280} y1={300} x2={990} y2={346} w={138} color={C.deep} />
        <Cuff x1={976} y1={348} x2={942} y2={354} w={146} color={C.butter} />
        <Cuff x1={934} y1={356} x2={830} y2={350} w={100} color={C.skin2} />
        <Cuff x1={836} y1={332} x2={700} y2={332} w={34} color={C.skin2} />
        <Cuff x1={836} y1={366} x2={708} y2={366} w={32} color={C.skin2} />
      </g>

      {/* card */}
      <g transform="translate(468 308) rotate(-4)">
        <MiniCard x={0} y={0} w={264} tape wiggle />
      </g>

      {/* thumbs on top */}
      <Cuff x1={380} y1={398} x2={528} y2={376} w={38} color={C.skin1} />
      <ellipse cx="531" cy="375" rx="10" ry="8" fill={C.peach} transform="rotate(-10 531 375)" />
      <Cuff x1={832} y1={392} x2={688} y2={414} w={38} color={C.skin2} />
      <ellipse cx="684" cy="415" rx="10" ry="8" fill="#e9b997" transform="rotate(10 684 415)" />
      <path d="M300 420 q20 6 40 -2 M870 340 q-20 6 -40 0" stroke={C.deep} strokeOpacity=".18" strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* floating bits */}
      <Sprig x={560} y={290} s={0.45} rot={-24} />
      <Sprig x={760} y={300} s={0.4} rot={22} color={C.coral} light={C.peach} />
      <Tape x={920} y={96} w={90} rot={14} color={C.coral} />
    </ArtSvg>
  );
}
