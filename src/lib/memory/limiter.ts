/** Points budget over a sliding window (relayer: 60 points/min/account; remember=5, analyze=10, recall=1). */
export const POINTS = { remember: 5, analyze: 10, recall: 1 } as const;

export class PointLimiter {
  private events: { t: number; p: number }[] = [];
  private chain: Promise<void> = Promise.resolve();
  constructor(
    private maxPoints = 55, // headroom under 60
    private windowMs = 60_000,
    private now: () => number = Date.now,
    private sleep: (ms: number) => Promise<void> = (ms) => new Promise((r) => setTimeout(r, ms)),
  ) {}

  /** Record points without waiting (cheap reads should never queue behind writes). */
  consume(points: number): void {
    this.events.push({ t: this.now(), p: points });
  }

  /** Resolves when `points` fit in the window; callers are served FIFO. */
  acquire(points: number): Promise<void> {
    const run = this.chain.then(async () => {
      for (;;) {
        const t = this.now();
        this.events = this.events.filter((e) => t - e.t < this.windowMs);
        const used = this.events.reduce((s, e) => s + e.p, 0);
        if (used + points <= this.maxPoints || this.events.length === 0) {
          this.events.push({ t, p: points });
          return;
        }
        await this.sleep(Math.max(50, this.windowMs - (t - this.events[0].t) + 5));
      }
    });
    this.chain = run.catch(() => undefined);
    return run;
  }
}

export class TimeoutError extends Error {
  constructor(what: string, ms: number) {
    super(`${what} timed out after ${ms} ms`);
    this.name = "TimeoutError";
  }
}

/** Our own timeout (SDK recall can hang, upstream #1367). The underlying call is abandoned, not cancelled. */
export function withTimeout<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>;
  const t = new Promise<never>((_, rej) => {
    timer = setTimeout(() => rej(new TimeoutError(what, ms)), ms);
  });
  p.catch(() => undefined);
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}
