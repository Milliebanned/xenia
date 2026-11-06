"use client";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/** Calls `fn` now and then every `ms` while `enabled`. Errors are passed to onError, never thrown. */
export function usePolling<T>(
  fn: () => Promise<T>,
  ms: number,
  enabled: boolean,
  onData: (d: T) => void,
  onError?: (e: Error) => void,
) {
  const fnRef = useRef(fn);
  const dataRef = useRef(onData);
  const errRef = useRef(onError);
  useEffect(() => {
    fnRef.current = fn;
    dataRef.current = onData;
    errRef.current = onError;
  });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    const tick = async () => {
      try {
        const d = await fnRef.current();
        if (alive) dataRef.current(d);
      } catch (e) {
        if (alive) errRef.current?.(e instanceof Error ? e : new Error(String(e)));
      }
    };
    void tick();
    const t = setInterval(tick, ms);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [ms, enabled]);
}

/** Current time, ticking every `ms`. */
export function useNow(ms = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms, enabled]);
  return now;
}

export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** localStorage-backed string, hydration-safe (server snapshot is null). */
export function useStoredString(key: string): [string | null, (v: string | null) => void] {
  const subscribe = (cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(`xenia:${key}`, cb);
    return () => {
      window.removeEventListener("storage", cb);
      window.removeEventListener(`xenia:${key}`, cb);
    };
  };
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(key),
    () => null,
  );
  const set = (v: string | null) => {
    if (v === null) localStorage.removeItem(key);
    else localStorage.setItem(key, v);
    window.dispatchEvent(new Event(`xenia:${key}`));
  };
  return [value, set];
}
