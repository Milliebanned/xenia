"use client";

import { useEffect } from "react";

/** Scroll reveals for [data-reveal]. Without JS, or under reduced motion, everything is simply visible. */
export function Motion() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".xenia-landing");
    if (!root) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const els = root.querySelectorAll<HTMLElement>("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    root.classList.add("xl-js");
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );
    els.forEach((el) => io.observe(el));

    // pause CSS loops (orbit drift, beam pulses) in sections that are offscreen
    const loops = root.querySelectorAll<HTMLElement>("[data-loop]");
    const lo = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle("is-live", e.isIntersecting);
    });
    loops.forEach((el) => lo.observe(el));
    return () => {
      io.disconnect();
      lo.disconnect();
    };
  }, []);
  return null;
}
