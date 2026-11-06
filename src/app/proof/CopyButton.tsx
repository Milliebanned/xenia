"use client";
import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="xp-copy"
      onClick={() => {
        void navigator.clipboard?.writeText(value).then(() => {
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        });
      }}
      aria-label={label === "Copy" ? `Copy ${value}` : label}
    >
      <span aria-live="polite">{done ? "Copied" : "Copy"}</span>
    </button>
  );
}
