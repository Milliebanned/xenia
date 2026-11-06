"use client";

import { ArtSvg, C, MiniCard, Paper, Sprig, Stitch, blob, cut, useUid } from "./shared";

export function CornerShopScene({ className, title }: { className?: string; title?: string }) {
  const uid = useUid();
  const stripes = Array.from({ length: 10 });
  return (
    <ArtSvg uid={uid} w={960} h={1200} className={className} title={title} fallback="A corner shop front with a striped awning, crates of produce, a chalkboard sign and a guest card on the door">
      <Paper d={blob(150, 200, 110, 110, 4, 6)} fill={C.peach} sh={false} />
      <Paper d={blob(840, 120, 70, 70, 6, 5)} fill={C.cream2} sh={false} />
      {/* facade */}
      <Paper d={cut(90, 120, 780, 880, 3, 3, 150)} fill="#fff" />
      <Paper d={cut(120, 150, 720, 100, 5, 2, 150)} fill={C.green} sh={false} />
      <Stitch d="M150 200 H810" color={C.cream} w={4} dash="2 10" />
      <path d="M330 200 q30 -22 60 0 t60 0 t60 0 t60 0" stroke={C.butter} strokeWidth="8" fill="none" strokeLinecap="round" opacity=".95" />
      {/* window */}
      <Paper d={cut(150, 440, 410, 370, 7, 2, 120)} fill={C.green} sh="sh2" />
      <Paper d={cut(172, 462, 366, 326, 8, 1.5, 120)} fill={C.sage} sh={false} />
      <path d="M172 640 H538 M172 560 H538" stroke="#fff" strokeOpacity=".5" strokeWidth="8" />
      {[200, 290, 380, 450].map((x, i) => (
        <rect key={x} x={x} y={i % 2 ? 508 : 494} width={i % 2 ? 50 : 62} height={i % 2 ? 52 : 66} rx="8" fill={[C.coral, C.butter, C.peach, C.cream][i]} opacity=".95" />
      ))}
      {[210, 300, 400].map((x, i) => (
        <rect key={x} x={x} y={580} width={56} height={60} rx="8" fill={[C.butter, C.coral, C.cream][i]} opacity=".9" />
      ))}
      <path d="M200 770 L330 482 M290 788 L450 470" stroke="#fff" strokeWidth="16" strokeLinecap="round" opacity=".28" />
      {/* door */}
      <Paper d={cut(610, 440, 210, 560, 9, 2, 140)} fill={C.coral} sh="sh2" />
      <Paper d={cut(634, 466, 162, 190, 10, 1.5, 100)} fill={C.peach} sh={false} />
      <path d="M646 640 L720 480" stroke="#fff" strokeWidth="12" strokeLinecap="round" opacity=".6" />
      <circle cx="784" cy="780" r="11" fill={C.butter} />
      <rect x="634" y="690" width="162" height="270" rx="10" fill="none" stroke="#f09677" strokeWidth="6" />
      <MiniCard x={650} y={706} w={130} rot={3} tape wiggle />
      {/* awning */}
      <g filter={`url(#${uid}-sh)`}>
        <path d="M70 262 H890 L930 392 H30Z" fill={C.cream} />
        {stripes.map((_, i) => {
          const w = 820 / 10;
          const x0 = 70 + i * w;
          const x1 = 30 + i * (900 / 10);
          return i % 2 === 0 ? <path key={i} d={`M${x0} 262 h${w} L${x1 + 90} 392 H${x1}Z`} fill={C.coral} /> : null;
        })}
      </g>
      {stripes.map((_, i) => (
        <path key={i} d={`M${30 + i * 90} 392 q45 38 90 0Z`} fill={i % 2 === 0 ? C.coral : C.cream} />
      ))}
      <path d="M70 262 H890" stroke={C.deep} strokeOpacity=".2" strokeWidth="4" />

      {/* pavement */}
      <Paper d={cut(-10, 1000, 980, 220, 4, 3, 120)} fill={C.cream2} sh="sh" />
      <Stitch d="M30 1090 H930" color={C.green} w={3} opacity={0.35} dash="2 10" />

      {/* crates */}
      {[260, 440].map((x, k) => (
        <g key={x}>
          {k === 0 ? (
            <>
              <circle cx={x + 24} cy="858" r="26" fill={C.coral} />
              <circle cx={x + 74} cy="846" r="28" fill="#e46f4c" />
              <circle cx={x + 124} cy="858" r="26" fill={C.coral} />
              <circle cx={x + 50} cy="830" r="24" fill="#f09677" />
              <circle cx={x + 100} cy="826" r="24" fill={C.coral} />
              <path d={`M${x + 74} 812 l-6 -12 M${x + 100} 802 l4 -10`} stroke={C.green} strokeWidth="5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <ellipse cx={x + 40} cy="860" rx="30" ry="22" fill={C.butter} />
              <ellipse cx={x + 100} cy="858" rx="30" ry="22" fill="#f6d68a" />
              <ellipse cx={x + 70} cy="834" rx="30" ry="22" fill={C.butter} />
              <circle cx={x + 140} cy="850" r="26" fill={C.green} />
              <path d={`M${x + 140} 826 q-12 14 0 48 M${x + 120} 850 h40`} stroke={C.sage} strokeWidth="4" fill="none" strokeLinecap="round" />
            </>
          )}
          <Paper d={cut(x - 10, 870, 180, 110, 11 + k, 2, 90)} fill="#d9b36a" />
          <path d={`M${x - 4} 900 H${x + 166} M${x - 4} 940 H${x + 166}`} stroke="#b98f45" strokeWidth="5" opacity=".7" />
          <Stitch d={`M${x} 924 H${x + 160}`} color={C.cream} w={3} dash="2 9" />
        </g>
      ))}
      <Sprig x={640} y={1010} s={0.8} rot={-4} />

      {/* chalkboard sign */}
      <g transform="translate(90 740) rotate(-3)">
        <path d="M50 250 L70 40 M170 250 L150 40" stroke={C.deep} strokeWidth="12" strokeLinecap="round" />
        <Paper d={cut(14, 30, 176, 190, 12, 2, 90)} fill={C.ink} />
        <rect x="24" y="40" width="156" height="170" rx="4" fill="none" stroke={C.butter} strokeWidth="5" strokeDasharray="2 9" strokeLinecap="round" />
        <path d="M40 80 q16 -16 32 0 t32 0 t32 0 M40 118 q14 -14 28 0 t28 0 t28 0 t14 0" stroke={C.cream} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M40 160 h60" stroke={C.coral} strokeWidth="6" strokeLinecap="round" />
        <circle cx="140" cy="176" r="13" fill={C.butter} />
      </g>
    </ArtSvg>
  );
}
