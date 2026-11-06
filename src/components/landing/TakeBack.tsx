"use client";

import Image from "next/image";
import { useState } from "react";
import { IMAGES } from "@/lib/images";

/** Demo only: press the toggle and the beam to the barber switches off; the counter screen goes blank. */
export function TakeBack() {
  const [shared, setShared] = useState(true);
  return (
    <div className={`xl-take ${shared ? "is-shared" : "is-off"}`}>
      <div className="xl-take-stage" aria-hidden="true">
        <div className="xl-take-orbit" />
        <div className="xl-take-orbit xl-take-orbit-2" />
        <span className="xl-take-you"><i /></span>
        <span className="xl-take-you-label">You</span>
        <span className="xl-take-beam"><i /></span>
        <span className="xl-take-node">
          <Image src={IMAGES.barber.src} alt="" width={96} height={96} className="xl-duo" />
        </span>
        <span className="xl-take-node-label">Corner Barber</span>
      </div>
      <div className="xl-take-screen" aria-hidden="true">
          <p className="xl-take-screen-top">Counter screen</p>
          <div className="xl-take-screen-on">
            <p className="xl-take-screen-name">May</p>
            <p>Skin fade, number 2 on the sides</p>
            <p className="xl-take-screen-warn">Sensitive scalp. No clippers on the neck.</p>
          </div>
          <div className="xl-take-screen-off">
            <p>No guest card shared</p>
            <span /><span /><span />
          </div>
      </div>
      <div className="xl-take-controls">
        <button
          type="button"
          className="xl-btn xl-btn-white"
          aria-pressed={!shared}
          onClick={() => setShared((s) => !s)}
        >
          <span>{shared ? "Take it back" : "Share for this visit"}</span>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="xl-arrow">
            <path d="M2.5 8h10M9 4.5 12.5 8 9 11.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
          </svg>
        </button>
        <p className="xl-take-status" role="status" aria-live="polite">
          <i aria-hidden="true" />
          {shared
            ? "Shared with Corner Barber for this visit."
            : "Taken back. The counter stops getting your card within about 30 seconds (not yet measured)."}
        </p>
      </div>
      <p className="xl-take-note">A demo of the idea. Nothing is sent from this page.</p>
    </div>
  );
}
