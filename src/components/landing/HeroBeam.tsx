"use client";

import { useEffect, useRef } from "react";

/**
 * The hero light: a bright point (you), a beam of light streaming right (your card reaching the
 * counters), hairline orbit ellipses with small satellites (the places you are a regular at).
 * Canvas 2D. Decorative only. Paused offscreen, static under prefers-reduced-motion.
 */

type Orbit = { cx: number; rx: number; ry: number; tilt: number; sats: { a: number; v: number; r: number }[] };

// Units: 1000 = the reference panel width. cx is relative to the origin point.
const ORBITS: Orbit[] = [
  { cx: 86, rx: 134, ry: 150, tilt: -0.06, sats: [{ a: 2.0, v: 0.05, r: 2.4 }] },
  { cx: 292, rx: 342, ry: 166, tilt: 0.02, sats: [{ a: 4.3, v: 0.022, r: 2.2 }, { a: 1.2, v: 0.022, r: 1.8 }] },
  { cx: 205, rx: 214, ry: 52, tilt: -0.03, sats: [{ a: 3.9, v: 0.06, r: 2.2 }] },
  { cx: 262, rx: 278, ry: 92, tilt: 0.05, sats: [] },
];

type Geo = { w: number; h: number; ox: number; oy: number; s: number; flare: number; mobile: boolean };

type Variant = "hero" | "cta";

function geometry(w: number, h: number, v: Variant): Geo {
  const mobile = w < 720;
  if (mobile) {
    const ox = w * (v === "cta" ? 0.2 : 0.17);
    const oy = h * (v === "cta" ? 0.26 : 0.34);
    return { w, h, ox, oy, s: (w / 760) * (v === "cta" ? 0.8 : 1), flare: Math.min(h * 0.26, (w - ox) * 0.9), mobile };
  }
  if (v === "cta") {
    const ox = w * 0.5;
    const oy = h * 0.4;
    return { w, h, ox, oy, s: (Math.min(w, h * 1.62) / 1000) * 0.72, flare: h * 0.62, mobile };
  }
  const ox = w * 0.33;
  const oy = h * 0.52;
  return { w, h, ox, oy, s: Math.min(w, h * 1.62) / 1000, flare: h * 0.66, mobile };
}

/** Horn-shaped cone from the origin to the right edge. */
function cone(ctx: CanvasRenderingContext2D, g: Geo, spread: number, pinch: number) {
  const { ox, oy, w } = g;
  const end = w + 40;
  const half = g.flare * spread;
  const len = end - ox;
  ctx.beginPath();
  ctx.moveTo(ox, oy - 1.5);
  ctx.bezierCurveTo(ox + len * pinch, oy - 3, ox + len * 0.78, oy - half * 0.55, end, oy - half);
  ctx.lineTo(end, oy + half);
  ctx.bezierCurveTo(ox + len * 0.78, oy + half * 0.55, ox + len * pinch, oy + 3, ox, oy + 1.5);
  ctx.closePath();
}

function paintGlow(c: HTMLCanvasElement, g: Geo, q: number) {
  c.width = Math.max(1, Math.round(g.w * q));
  c.height = Math.max(1, Math.round(g.h * q));
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(q, 0, 0, q, 0, 0);
  const hasFilter = "filter" in ctx;
  const blur = (px: number) => {
    if (hasFilter) ctx.filter = `blur(${px * q}px)`;
  };

  const len = g.w - g.ox;

  // wide pale light filling the right side, reaching the corners
  blur(60);
  let grad = ctx.createLinearGradient(g.ox, 0, g.w, 0);
  grad.addColorStop(0, "rgba(90,150,255,0)");
  grad.addColorStop(0.3, "rgba(110,170,255,0.3)");
  grad.addColorStop(0.65, "rgba(170,215,255,0.72)");
  grad.addColorStop(1, "rgba(220,238,255,0.96)");
  ctx.fillStyle = grad;
  cone(ctx, g, 1.7, 0.25);
  ctx.fill();

  // two dark lobes pressing on the beam from above and below
  blur(26);
  const lobe = (sign: number) => {
    const cx = g.ox + len * 0.53;
    const cy = g.oy + sign * g.flare * 0.5;
    const rx = len * 0.36;
    const ry = g.flare * 0.38;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    const lg = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    lg.addColorStop(0, "rgba(5,16,58,0.92)");
    lg.addColorStop(0.8, "rgba(6,22,72,0.84)");
    lg.addColorStop(1, "rgba(8,26,82,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(0, 0, rx, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  lobe(-1);
  lobe(1);

  // medium cyan cone
  blur(30);
  grad = ctx.createLinearGradient(g.ox, 0, g.w, 0);
  grad.addColorStop(0, "rgba(200,232,255,0.75)");
  grad.addColorStop(0.35, "rgba(160,215,255,0.66)");
  grad.addColorStop(1, "rgba(205,234,255,0.9)");
  ctx.fillStyle = grad;
  cone(ctx, g, 0.5, 0.42);
  ctx.fill();

  // inner bright ribbon
  blur(10);
  grad = ctx.createLinearGradient(g.ox, 0, g.w, 0);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.4, "rgba(220,242,255,0.8)");
  grad.addColorStop(1, "rgba(220,240,255,0.7)");
  ctx.fillStyle = grad;
  cone(ctx, g, 0.2, 0.55);
  ctx.fill();
  if (hasFilter) ctx.filter = "none";
}

function paintCore(c: HTMLCanvasElement, g: Geo, dpr: number) {
  c.width = Math.max(1, Math.round(g.w * dpr));
  c.height = Math.max(1, Math.round(g.h * dpr));
  const ctx = c.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const len = g.w - g.ox;
  // tapered white core, strongest near the point
  const grad = ctx.createLinearGradient(g.ox, 0, g.ox + len * 0.8, 0);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(240,247,255,0.85)");
  grad.addColorStop(1, "rgba(220,235,255,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(g.ox, g.oy - 2);
  ctx.quadraticCurveTo(g.ox + len * 0.5, g.oy - 4, g.ox + len * 0.8, g.oy - 14 * (g.mobile ? 0.6 : 1));
  ctx.lineTo(g.ox + len * 0.8, g.oy + 14 * (g.mobile ? 0.6 : 1));
  ctx.quadraticCurveTo(g.ox + len * 0.5, g.oy + 4, g.ox, g.oy + 2);
  ctx.closePath();
  ctx.fill();
}

export function HeroBeam({ variant = "hero" }: { variant?: Variant }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const glow = document.createElement("canvas");
    const core = document.createElement("canvas");
    let g: Geo = geometry(1, 1, variant);
    let dpr = 1;
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let t = 0;
    let nextPulse = 2.2;
    const pulses: number[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      g = geometry(r.width, r.height, variant);
      paintGlow(glow, g, "filter" in ctx ? 0.5 : 0.12);
      paintCore(core, g, dpr);
      draw();
    };

    const ellipsePoint = (o: Orbit, a: number) => {
      const rx = o.rx * g.s;
      const ry = o.ry * g.s;
      const x = Math.cos(a) * rx;
      const y = Math.sin(a) * ry;
      const ct = Math.cos(o.tilt);
      const st = Math.sin(o.tilt);
      return { x: g.ox + o.cx * g.s + x * ct - y * st, y: g.oy + x * st + y * ct };
    };

    const draw = () => {
      const { w, h, ox, oy, s } = g;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // breathing glow, scaled about the origin
      const breathe = reduce.matches ? 0 : Math.sin(t * 0.55);
      ctx.save();
      ctx.globalAlpha = 0.9 + 0.1 * breathe;
      ctx.translate(ox, oy);
      ctx.scale(1, 1 + 0.035 * breathe);
      ctx.translate(-ox, -oy);
      ctx.drawImage(glow, 0, 0, w, h);
      ctx.restore();
      ctx.drawImage(core, 0, 0, w, h);

      // orbits
      ctx.lineWidth = 1;
      for (const o of ORBITS) {
        ctx.strokeStyle = "rgba(220,232,255,0.26)";
        ctx.beginPath();
        ctx.ellipse(ox + o.cx * s, oy, o.rx * s, o.ry * s, o.tilt, 0, Math.PI * 2);
        ctx.stroke();
      }

      // light pulses travelling along the beam
      for (const p of pulses) {
        const k = Math.min(1, p);
        const e = 1 - Math.pow(1 - k, 2.2);
        const x = ox + (w - ox) * e;
        const rad = (18 + 90 * e) * (g.mobile ? 0.6 : 1);
        const a = Math.sin(Math.PI * k) * 0.55;
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

      // satellites
      for (const o of ORBITS) {
        for (const sat of o.sats) {
          const p = ellipsePoint(o, sat.a + t * sat.v);
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.beginPath();
          ctx.arc(p.x, p.y, sat.r * Math.max(0.8, s * 1.1), 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ringed dot just left of the origin
      const rx = ox - 50 * s;
      ctx.fillStyle = "rgba(10,30,90,0.9)";
      ctx.beginPath();
      ctx.arc(rx, oy, 7 * Math.max(0.75, s * 1.1), 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(170,205,255,0.85)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(rx, oy, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // the bright point (you)
      const halo = ctx.createRadialGradient(ox, oy, 0, ox, oy, 26);
      halo.addColorStop(0, "rgba(255,255,255,1)");
      halo.addColorStop(0.3, "rgba(235,244,255,0.8)");
      halo.addColorStop(1, "rgba(200,225,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(ox, oy, 26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(ox, oy, 6.5 * Math.max(0.8, s * 1.1), 0, Math.PI * 2);
      ctx.fill();
    };

    const frame = (now: number) => {
      raf = 0;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;
      for (let i = pulses.length - 1; i >= 0; i--) {
        pulses[i] += dt / 3.2;
        if (pulses[i] >= 1) pulses.splice(i, 1);
      }
      nextPulse -= dt;
      if (nextPulse <= 0) {
        pulses.push(0);
        nextPulse = 5 + Math.random() * 4;
      }
      draw();
      loop();
    };
    const loop = () => {
      if (!raf && visible && !reduce.matches && !document.hidden) {
        raf = requestAnimationFrame(frame);
      }
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const restart = () => {
      stop();
      last = performance.now();
      if (reduce.matches) draw();
      loop();
    };

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
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", restart);
      reduce.removeEventListener("change", restart);
    };
  }, [variant]);

  return <canvas ref={ref} className="xl-hero-canvas" aria-hidden="true" />;
}
