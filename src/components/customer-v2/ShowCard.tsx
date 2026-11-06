"use client";
import { useEffect, useRef } from "react";
import { BeamCanvas } from "@/components/beam";
import type { CardData } from "./card-data";
import { PassCard } from "./PassCard";
import { Bubble } from "./ui";

/**
 * Full-screen, read-only view of the user's own card. Built from the facts the page already holds:
 * no network calls, no keys. Meant to be held up to someone, so it is big and lit.
 */
export function ShowCard({ data, onClose }: { data: CardData; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        e.preventDefault();
        closeRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="xc-show" role="dialog" aria-modal="true" aria-labelledby="show-h" id="show-card">
      <BeamCanvas level={1} origin={[0.18, 0.46]} originMobile={[0.06, 0.46]} spread={0.5} />
      <div className="xc-show-in">
        <h2 id="show-h" className="xc-show-h">This is how I like things</h2>
        <PassCard data={data} size="xl" footer={<Bubble tone="ink">Kept by me, shown by me</Bubble>} />
        <p className="xc-show-sub">Only what I wrote myself. Nothing here was shared with anyone.</p>
        <button ref={closeRef} type="button" onClick={onClose} id="show-close" className="xb-btn xc-btn is-white is-lg is-block xc-show-close">
          <span>Done</span>
        </button>
      </div>
    </div>
  );
}
