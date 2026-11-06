"use client";

import { useEffect, useRef } from "react";

export type Step = { t: string; d: string };

// Top half of an ellipse in a 1200 x 440 box. Nodes sit on it at these x positions.
const CX = 600;
const CY = 420;
const RX = 540;
const RY = 330;
const XS = [150, 450, 750, 1050];
const nodeY = (x: number) => CY - RY * Math.sqrt(1 - ((x - CX) / RX) ** 2);
const Y0 = nodeY(XS[0]).toFixed(1);
// the arc runs from the first node to the last; the faint full orbit fades out below
const ARC = `M ${XS[0]} ${Y0} A ${RX} ${RY} 0 0 1 ${XS[XS.length - 1]} ${Y0}`;

/** How it works: four steps on an orbit. A light pulse travels between them as you scroll. */
export function OrbitSteps({ steps }: { steps: Step[] }) {
  const root = useRef<HTMLDivElement>(null);
  const path = useRef<SVGPathElement>(null);
  const dot = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = root.current;
    const p = path.current;
    const d = dot.current;
    if (!el || !p || !d) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const total = p.getTotalLength();
    // arc length at each node, found by sampling
    const at: number[] = XS.map((x) => {
      let best = 0;
      let bestD = Infinity;
      for (let l = 0; l <= total; l += total / 600) {
        const pt = p.getPointAtLength(l);
        const dd = Math.abs(pt.x - x);
        if (dd < bestD && pt.y < CY) {
          bestD = dd;
          best = l;
        }
      }
      return best;
    });
    const nodes = el.querySelectorAll<HTMLElement | SVGGElement>("[data-step]");
    let raf = 0;
    const set = (prog: number) => {
      el.style.setProperty("--p", prog.toFixed(4));
      const len = at[0] + (at[at.length - 1] - at[0]) * prog;
      const pt = p.getPointAtLength(len);
      d.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      const lit = at.map((l) => len >= l - 2);
      nodes.forEach((n) => n.classList.toggle("is-lit", lit[Number(n.dataset.step)] ?? false));
      el.style.setProperty("--trail", (len / total).toFixed(4));
    };
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const prog = Math.min(1, Math.max(0, (vh * 0.8 - r.top) / (r.height + vh * 0.25)));
      set(prog);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    if (reduce) {
      set(1);
      return;
    }
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="xl-orbit" ref={root}>
      <svg className="xl-orbit-svg" viewBox="0 0 1200 440" aria-hidden="true">
        <defs>
          <linearGradient id="xl-orbit-trail" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#cfe3ff" stopOpacity="0.15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>
          <linearGradient id="xl-orbit-fade" x1="0" x2="0" y1="0" y2="440" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#cfe3ff" stopOpacity="0.22" />
            <stop offset="0.5" stopColor="#cfe3ff" stopOpacity="0.06" />
            <stop offset="0.62" stopColor="#cfe3ff" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="xl-orbit-glow">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#cfe3ff" stopOpacity="0.45" />
            <stop offset="1" stopColor="#2d6cff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={CX} cy={CY} rx={RX} ry={RY} className="xl-orbit-faint" />
        <ellipse cx={CX} cy={CY + 20} rx={RX + 50} ry={RY + 50} className="xl-orbit-faint" />
        <path ref={path} d={ARC} className="xl-orbit-path" />
        <path d={ARC} className="xl-orbit-trail" pathLength={1} />
        {XS.map((x, i) => (
          <g key={x} transform={`translate(${x} ${nodeY(x).toFixed(1)})`} className="xl-orbit-node" data-step={i}>
            <circle r="15" className="xl-orbit-node-ring" />
            <circle r="4.5" className="xl-orbit-node-dot" />
          </g>
        ))}
        <g ref={dot} className="xl-orbit-pulse" transform={`translate(${XS[0]} ${nodeY(XS[0]).toFixed(1)})`}>
          <circle r="34" fill="url(#xl-orbit-glow)" />
          <circle r="5" fill="#fff" />
        </g>
      </svg>
      <ol className="xl-orbit-steps">
        {steps.map((s, i) => (
          <li
            key={s.t}
            data-step={i}
            style={{ ["--x" as string]: `${(XS[i] / 1200) * 100}%`, ["--y" as string]: `${(nodeY(XS[i]) / 440) * 100}%` }}
          >
            <span className="xl-orbit-n" aria-hidden="true">0{i + 1}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
