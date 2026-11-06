"use client";

import { useEffect, useRef } from "react";
import "./beam.css";

/**
 * The Xenia light, for the app screens: a bright point (you), a beam streaming right (your card reaching the
 * counter), hairline orbit ellipses with small satellites. Same technique as the landing hero.
 *
 * `level` 0..1 is how bright the beam is: 1 = shared/lit, ~0.25 = dimming while access is being taken back,
 * 0 = beam off (only a faint point and the orbits remain). Changes tween smoothly.
 * Decorative only. Paused offscreen and in hidden tabs; static under prefers-reduced-motion.
 */

type Orbit = { cx: number; rx: number; ry: number; tilt: number; sats: { a: number; v: number; r: number }[] };

const ORBITS: Orbit[] = [
  { cx: 86, rx: 134, ry: 150, tilt: -0.06, sats: [{ a: 2.0, v: 0.05, r: 2.4 }] },
  { cx: 292, rx: 342, ry: 166, tilt: 0.02, sats: [{ a: 4.3, v: 0.022, r: 2.2 }, { a: 1.2, v: 0.022, r: 1.8 }] },
  { cx: 205, rx: 214, ry: 52, tilt: -0.03, sats: [{ a: 3.9, v: 0.06, r: 2.2 }] },
  { cx: 262, rx: 278, ry: 92, tilt: 0.05, sats: [] },
];

export type BeamProps = {
  /** 0 = off, 1 = full. */
  level?: number;
  /** Origin as fractions of the canvas [x, y], at widths >= 720. */
  origin?: [number, number];
  /** Origin under 720px wide. Defaults to `origin`. */
  originMobile?: [number, number];
  /** Orbit scale multiplier. 0 hides orbits. */
  orbitScale?: number;
  /** Beam height as a fraction of the canvas height. */
  spread?: number;
  className?: string;
};

type Geo = { w: number; h: number; s: number; flare: number; mobile: boolean };

function cone(ctx: CanvasRenderingContext2D, len: number, half: number, pinch: number, cy: number) {
  ctx.beginPath();
  ctx.moveTo(0, cy - 1.5);
  ctx.bezierCurveTo(len * pinch, cy - 3, len * 0.78, cy - half * 0.55, len + 40, cy - half);
  ctx.lineTo(len + 40, cy + half);
  ctx.bezierCurveTo(len * 0.78, cy + half * 0.55, len * pinch, cy + 3, 0, cy + 1.5);
  ctx.closePath();
}

/** Glow painted once per size, with its origin at (0, h). Drawn later translated and stretched to the origin. */
function paintGlow(c: HTMLCanvasElement, w: number, h: number, flare: number, q: number) {
  const H = h * 2;
  c.width = Math.max(1, Math.round(w * q));
  c.height = Math.max(1, Math.round(H * q));
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(q, 0, 0, q, 0, 0);
  const hasFilter = "filter" in ctx;
  const blur = (px: number) => {
    if (hasFilter) ctx.filter = `blur(${px * q}px)`;
  };
  const cy = h;
  blur(70);
  let g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(90,140,255,0)");
  g.addColorStop(0.35, "rgba(96,150,255,0.16)");
  g.addColorStop(0.75, "rgba(150,195,255,0.46)");
  g.addColorStop(1, "rgba(207,227,255,0.78)");
  ctx.fillStyle = g;
  cone(ctx, w, flare * 1.25, 0.3, cy);
  ctx.fill();
  blur(34);
  g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(180,210,255,0.5)");
  g.addColorStop(0.4, "rgba(150,195,255,0.4)");
  g.addColorStop(1, "rgba(215,232,255,0.85)");
  ctx.fillStyle = g;
  cone(ctx, w, flare * 0.62, 0.45, cy);
  ctx.fill();
  blur(12);
  g = ctx.createLinearGradient(0, 0, w, 0);
  g.addColorStop(0, "rgba(255,255,255,0.95)");
  g.addColorStop(0.45, "rgba(225,238,255,0.7)");
  g.addColorStop(1, "rgba(225,238,255,0.6)");
  ctx.fillStyle = g;
  cone(ctx, w, flare * 0.2, 0.6, cy);
  ctx.fill();
  if (hasFilter) ctx.filter = "none";
}

export function BeamCanvas({ level = 1, origin = [0.3, 0.5], originMobile, orbitScale = 1, spread = 0.66, className }: BeamProps) {
  const ref = useRef<HTMLCanvasElement>(null);
  const target = useRef({ level, origin, originMobile: originMobile ?? origin, orbitScale });
  const kick = useRef<() => void>(() => {});

  useEffect(() => {
    target.current = { level, origin, originMobile: originMobile ?? origin, orbitScale };
    kick.current();
    // origin arrays are compared by value so inline literals do not restart anything
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, origin[0], origin[1], originMobile?.[0], originMobile?.[1], orbitScale]);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const glow = document.createElement("canvas");
    let g: Geo = { w: 1, h: 1, s: 1, flare: 1, mobile: false };
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let t = 0;
    let nextPulse = 2.4;
    const pulses: number[] = [];
    // tweened state
    const cur = { level: target.current.level, ox: 0, oy: 0, orb: target.current.orbitScale, init: false };

    const goal = () => {
      const o = g.mobile ? target.current.originMobile : target.current.origin;
      return { level: target.current.level, ox: o[0] * g.w, oy: o[1] * g.h, orb: target.current.orbitScale };
    };

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const mobile = r.width < 720;
      g = {
        w: r.width,
        h: r.height,
        mobile,
        s: Math.min(r.width, r.height * 1.62) / 1000,
        flare: Math.min(r.height * spread, r.width * 0.6),
      };
      paintGlow(glow, g.w, g.h, g.flare, "filter" in ctx ? 0.5 : 0.12);
      const want = goal();
      if (!cur.init || reduce.matches) {
        Object.assign(cur, want, { init: true });
      } else {
        cur.ox = want.ox;
        cur.oy = want.oy;
      }
      draw();
    };

    const draw = () => {
      const { w, h } = g;
      const { ox, oy } = cur;
      const L = Math.max(0, Math.min(1, cur.level));
      const s = g.s * cur.orb;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const breathe = reduce.matches ? 0 : Math.sin(t * 0.55);

      if (L > 0.01) {
        ctx.save();
        ctx.globalAlpha = Math.pow(L, 1.15) * (0.9 + 0.1 * breathe);
        ctx.translate(ox, oy);
        ctx.scale(Math.max(0.05, (w - ox) / w), 1 + 0.035 * breathe);
        ctx.drawImage(glow, 0, -h, w, h * 2);
        ctx.restore();

        // tapered white core
        const len = w - ox;
        const thick = (g.mobile ? 8 : 14) * (0.5 + 0.5 * L);
        const cg = ctx.createLinearGradient(ox, 0, ox + len * 0.8, 0);
        cg.addColorStop(0, `rgba(255,255,255,${L})`);
        cg.addColorStop(0.35, `rgba(240,247,255,${0.85 * L})`);
        cg.addColorStop(1, "rgba(220,235,255,0)");
        ctx.fillStyle = cg;
        ctx.beginPath();
        ctx.moveTo(ox, oy - 2);
        ctx.quadraticCurveTo(ox + len * 0.5, oy - 4, ox + len * 0.8, oy - thick);
        ctx.lineTo(ox + len * 0.8, oy + thick);
        ctx.quadraticCurveTo(ox + len * 0.5, oy + 4, ox, oy + 2);
        ctx.closePath();
        ctx.fill();

        for (const p of pulses) {
          const k = Math.min(1, p);
          const e = 1 - Math.pow(1 - k, 2.2);
          const x = ox + (w - ox) * e;
          const rad = (18 + 90 * e) * (g.mobile ? 0.6 : 1);
          const a = Math.sin(Math.PI * k) * 0.55 * L;
          const pg = ctx.createRadialGradient(x, oy, 0, x, oy, rad);
          pg.addColorStop(0, `rgba(255,255,255,${a})`);
          pg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.save();
          ctx.translate(x, oy);
          ctx.scale(1.8, 0.45);
          ctx.translate(-x, -oy);
          ctx.fillStyle = pg;
          ctx.fillRect(x - rad, oy - rad, rad * 2, rad * 2);
          ctx.restore();
        }
      }

      if (cur.orb > 0.01) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(220,232,255,${0.12 + 0.14 * L})`;
        for (const o of ORBITS) {
          ctx.beginPath();
          ctx.ellipse(ox + o.cx * s, oy, o.rx * s, o.ry * s, o.tilt, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(255,255,255,${0.45 + 0.5 * L})`;
        for (const o of ORBITS) {
          for (const sat of o.sats) {
            const a = sat.a + t * sat.v;
            const x = Math.cos(a) * o.rx * s;
            const y = Math.sin(a) * o.ry * s;
            const ct = Math.cos(o.tilt);
            const st = Math.sin(o.tilt);
            ctx.beginPath();
            ctx.arc(ox + o.cx * s + x * ct - y * st, oy + x * st + y * ct, sat.r * Math.max(0.8, s * 1.1), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // the bright point (you). Off = a hollow ring.
      const pr = 6.5 * Math.max(0.8, g.s * 1.1);
      const halo = ctx.createRadialGradient(ox, oy, 0, ox, oy, 26);
      halo.addColorStop(0, `rgba(255,255,255,${0.15 + 0.85 * L})`);
      halo.addColorStop(0.3, `rgba(235,244,255,${0.8 * L})`);
      halo.addColorStop(1, "rgba(200,225,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(ox, oy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,255,${0.25 + 0.75 * L})`;
      ctx.beginPath();
      ctx.arc(ox, oy, pr * (0.55 + 0.45 * L), 0, Math.PI * 2);
      ctx.fill();
      if (L < 0.5) {
        ctx.strokeStyle = `rgba(207,227,255,${0.55 * (1 - L * 2)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox, oy, pr * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      const want = goal();
      const k = 1 - Math.exp(-dt * 2.4);
      cur.level += (want.level - cur.level) * k;
      cur.ox += (want.ox - cur.ox) * k;
      cur.oy += (want.oy - cur.oy) * k;
      cur.orb += (want.orb - cur.orb) * k;
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i] += dt / 3.2;
        if (pulses[i] >= 1) pulses.splice(i, 1);
      }
      nextPulse -= dt;
      if (nextPulse <= 0) {
        if (cur.level > 0.6) pulses.push(0);
        nextPulse = 5 + Math.random() * 4;
      }
      draw();
      loop();
    };
    const loop = () => {
      if (!raf && visible && !reduce.matches && !document.hidden) raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const restart = () => {
      stop();
      last = performance.now();
      if (reduce.matches) {
        Object.assign(cur, goal());
        draw();
      }
      loop();
    };
    kick.current = restart;

    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) restart();
      else stop();
    });
    io.observe(canvas);
    document.addEventListener("visibilitychange", restart);
    reduce.addEventListener("change", restart);
    resize();
    restart();

    return () => {
      stop();
      kick.current = () => {};
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", restart);
      reduce.removeEventListener("change", restart);
    };
  }, [spread]);

  return <canvas ref={ref} className={className ? `xb-canvas ${className}` : "xb-canvas"} aria-hidden="true" />;
}
