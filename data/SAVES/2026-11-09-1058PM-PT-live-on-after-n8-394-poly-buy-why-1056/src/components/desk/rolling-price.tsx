import { useEffect, useRef, useState } from "react";

export function useRollingPrice(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    if (target <= 0) {
      shownRef.current = 0;
      setShown(0);
      return;
    }
    const from = shownRef.current;
    const snap = () => {
      shownRef.current = target;
      setShown(target);
    };
    if (
      from <= 0 ||
      Math.abs(target - from) < 0.01 ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      snap();
      return;
    }
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const step = (now: number) => {
      if (document.hidden) {
        snap();
        return;
      }
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const value = from + (target - from) * eased;
      shownRef.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // If the browser pauses animation frames, never leave a half-rolled number on screen.
    const guard = window.setTimeout(snap, duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(guard);
    };
  }, [target]);

  return shown > 0 ? shown : target;
}

export function useFlipBook(target: number, step: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);
  const targetRef = useRef(target);
  targetRef.current = target;

  useEffect(() => {
    const id = window.setInterval(() => {
      const dest = targetRef.current;
      let cur = shownRef.current;
      if (!Number.isFinite(dest) || dest <= 0) return;
      const gap = dest - cur;
      if (Math.abs(gap) > step * 24) {
        cur = dest - Math.sign(gap) * step * 12;
      }
      if (Math.abs(dest - cur) < step / 2) {
        if (cur !== dest) {
          shownRef.current = dest;
          setShown(dest);
        }
        return;
      }
      const next = Math.round((cur + Math.sign(dest - cur) * step) * 100) / 100;
      shownRef.current = next;
      setShown(next);
    }, 40);
    return () => window.clearInterval(id);
  }, [step]);

  return shown > 0 ? shown : target;
}

export function useLiveCountdown(closeTime: string | undefined, fallback: number): number {
  const [now, setNow] = useState(() => Date.now());
  const anchor = useRef({ at: Date.now(), left: fallback });

  useEffect(() => {
    anchor.current = { at: Date.now(), left: fallback };
  }, [closeTime, fallback]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(id);
  }, []);

  const raw = closeTime?.trim() ?? "";
  const numeric = Number(raw);
  const end = raw
    ? Number.isFinite(Date.parse(raw))
      ? Date.parse(raw)
      : Number.isFinite(numeric)
        ? numeric < 1e12
          ? numeric * 1000
          : numeric
        : NaN
    : NaN;
  if (Number.isFinite(end)) return Math.max(0, (end - now) / 1000);
  return Math.max(0, anchor.current.left - (now - anchor.current.at) / 1000);
}

export function useRollingNumber(target: number): number {
  const [shown, setShown] = useState(target);
  const shownRef = useRef(target);

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const from = shownRef.current;
    const snap = () => {
      shownRef.current = target;
      setShown(target);
    };
    if (
      !Number.isFinite(from) ||
      Math.abs(target - from) < 0.01 ||
      document.hidden ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      snap();
      return;
    }
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      if (document.hidden) {
        snap();
        return;
      }
      if (now - last < 80) {
        raf = requestAnimationFrame(step);
        return;
      }
      last = now;
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) * (1 - t);
      const value = from + (target - from) * eased;
      shownRef.current = value;
      setShown(value);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // If the browser pauses animation frames, never leave a half-rolled number on screen.
    const guard = window.setTimeout(snap, duration + 150);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(guard);
    };
  }, [target]);

  return Number.isFinite(shown) ? shown : target;
}

/** Kalshi-style rolling digits: every digit is its own little wheel that spins to the new value. */
export function RollDigits({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "baseline" }} aria-label={text}>
      {text.split("").map((ch, i) => {
        const d = ch.charCodeAt(0) - 48;
        if (d < 0 || d > 9) return (
          <span key={`s${i}-${ch}`} aria-hidden="true">{ch}</span>
        );
        return (
          <span
            key={`d${text.length - i}`}
            aria-hidden="true"
            style={{ display: "inline-block", height: "1em", lineHeight: "1em", overflow: "hidden", verticalAlign: "baseline", position: "relative", width: "0.62em" }}
          >
            <span
              style={{
                display: "flex",
                flexDirection: "column",
                transform: `translateY(${-d}em)`,
                transition: "transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1)",
                willChange: "transform",
              }}
            >
              {"0123456789".split("").map((n) => (
                <span key={n} style={{ height: "1em", lineHeight: "1em", textAlign: "center" }}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
