import { useEffect, useRef } from "react";
import type { Look } from "@/lib/desk/look";
import type { AssetId, VwapFrame } from "@/lib/desk/types";

function fmt(asset: AssetId, n: number): string {
  if (asset === "gold" || asset === "silver") return n.toFixed(2);
  return Math.round(n).toLocaleString("en-US");
}

function niceStep(span: number): number {
  if (!(span > 0) || !Number.isFinite(span)) return 1;
  const raw = span / 5;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const n = raw / pow;
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return m * pow;
}

function mix(a: number, b: number, t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return a + (b - a) * x;
}

export function Sparkline({
  spark,
  target,
  live,
  asset,
  closeTime,
  look,
  tapeId,
}: {
  spark: number[];
  target: number | null;
  live?: number;
  asset: AssetId;
  closeTime?: string;
  look: Look;
  tapeId?: string;
}) {
  const priceRef = useRef(live && live > 0 ? live : 0);
  const targetRef = useRef(target);
  const closeRef = useRef(closeTime);
  const sparkRef = useRef(spark);
  const lookRef = useRef(look);
  const rootRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const ballRef = useRef<HTMLSpanElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const strikeRef = useRef<SVGLineElement>(null);
  const scaleRef = useRef<HTMLDivElement>(null);

  priceRef.current = live && live > 0 ? live : priceRef.current;
  targetRef.current = target;
  closeRef.current = closeTime;
  sparkRef.current = spark;
  lookRef.current = look;

  useEffect(() => {
    const tape: number[] = [];
    let shown = 0;
    let camLo = 0;
    let camHi = 0;
    let dir = 1;
    let lastPush = 0;
    let seeded = false;
    const headX = 82;

    const yOf = (v: number) => {
      const span = camHi - camLo || 1;
      const t = (v - camLo) / span;
      return 8 + (1 - Math.min(1, Math.max(0, t))) * 84;
    };

    const paint = (now: number) => {
      const price = priceRef.current;
      if (!(price > 0)) return;
      const lookNow = lookRef.current;
      const move = lookNow.movement / 100;
      const spd = lookNow.speed / 100;
      const wig = lookNow.fluctuations / 100;
      const sm = lookNow.smooth / 100;
      const sharp = lookNow.sharpness / 100;

      if (!(shown > 0)) shown = price;
      if (price > shown + 0.01) dir = 1;
      else if (price < shown - 0.01) dir = -1;
      shown += (price - shown) * mix(0.04, 0.3, spd) * mix(1, 0.55, sm);

      if (!seeded) {
        const src = sparkRef.current.filter((n) => n > 0).slice(-8);
        if (src.length >= 3) {
          tape.length = 0;
          for (let i = 0; i < src.length - 1; i++) {
            for (let s = 0; s < 3; s++) {
              const u = s / 3;
              const e = u * u * (3 - 2 * u);
              tape.push(src[i] + (src[i + 1] - src[i]) * e);
            }
          }
          tape.push(src[src.length - 1]);
          seeded = true;
        }
      }
      if (tape.length === 0) tape.push(shown);

      const follow = mix(0.2, 1, wig);
      const head = tape[tape.length - 1] + (shown - tape[tape.length - 1]) * follow;
      tape[tape.length - 1] = head;
      if (now - lastPush > mix(150, 36, spd)) {
        tape.push(head);
        lastPush = now;
        const cap = Math.round(mix(150, 70, spd));
        if (tape.length > cap) tape.splice(0, tape.length - cap);
      }

      const win = Math.round(mix(0, 7, sm));
      const display = tape.map((p, i) => {
        if (win === 0 || i === tape.length - 1) return i === tape.length - 1 ? shown : p;
        let acc = 0;
        let n = 0;
        const a = Math.max(0, i - win);
        const b = Math.min(tape.length - 2, i + win);
        for (let k = a; k <= b; k++) {
          acc += tape[k];
          n += 1;
        }
        return n ? acc / n : p;
      });
      display[display.length - 1] = shown;

      const fitCount = Math.round(mix(90, 28, spd));
      const fit = display.slice(-fitCount);
      let lo = shown;
      let hi = shown;
      for (const p of fit) {
        if (p < lo) lo = p;
        if (p > hi) hi = p;
      }
      const floor = asset === "gold" ? mix(1.4, 0.05, move) : mix(42, 2, move);
      const span = Math.max(hi - lo, floor);
      const pad = span * mix(0.62, 0.08, move);
      const wantLo = lo - pad * 0.85;
      const wantHi = hi + pad;
      if (!(camHi > camLo)) {
        camLo = wantLo;
        camHi = wantHi;
      } else {
        const ease = mix(0.025, 0.08, spd);
        camLo += (wantLo - camLo) * ease;
        camHi += (wantHi - camHi) * ease;
      }

      const pts = display.map((p, i) => ({
        x: 0.8 + (i / Math.max(1, display.length - 1)) * (headX - 0.8),
        y: yOf(p),
      }));
      pts[pts.length - 1] = { x: headX, y: yOf(shown) };

      const n2 = (v: number) => v.toFixed(2);
      const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
      const div = mix(8, 2.5, sharp);
      const slackMul = mix(0.55, 0.02, sharp);
      let d = `M${n2(pts[0].x)},${n2(pts[0].y)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const slack = Math.max(0.15, Math.abs(p2.y - p1.y) * slackMul);
        const loY = Math.min(p1.y, p2.y) - slack;
        const hiY = Math.max(p1.y, p2.y) + slack;
        const c1x = p1.x + (p2.x - p0.x) / div;
        const c2x = p2.x - (p3.x - p1.x) / div;
        const c1y = clamp(p1.y + (p2.y - p0.y) / div, loY, hiY);
        const c2y = clamp(p2.y - (p3.y - p1.y) / div, loY, hiY);
        d += ` C${n2(c1x)},${n2(c1y)} ${n2(c2x)},${n2(c2y)} ${n2(p2.x)},${n2(p2.y)}`;
      }
      lineRef.current?.setAttribute("d", d);
      areaRef.current?.setAttribute("d", `${d} L${n2(headX)},100 L${n2(pts[0].x)},100 Z`);
      if (ballRef.current) {
        const end = pts[pts.length - 1];
        ballRef.current.style.left = `${end.x}%`;
        ballRef.current.style.top = `${end.y}%`;
      }

      const up = targetRef.current != null && targetRef.current > 0 ? shown >= targetRef.current : dir >= 0;
      const tone = up ? "#3ddc84" : "#ff5c5c";
      rootRef.current?.querySelectorAll("stop").forEach((stop, i) => {
        stop.setAttribute("stop-color", tone);
        stop.setAttribute("stop-opacity", i === 0 ? "0.4" : i === 1 ? "0.08" : "0");
      });

      const strike = targetRef.current;
      if (strikeRef.current) {
        if (strike != null && strike > 0) {
          const sy = yOf(strike);
          strikeRef.current.setAttribute("y1", String(sy));
          strikeRef.current.setAttribute("y2", String(sy));
          strikeRef.current.style.display = sy > -4 && sy < 104 ? "" : "none";
        } else {
          strikeRef.current.style.display = "none";
        }
      }

      const box = scaleRef.current;
      if (box) {
        const step = niceStep(camHi - camLo);
        const first = Math.ceil(camLo / step) * step;
        const ticks: number[] = [];
        for (let p = first; p <= camHi + step * 0.01 && ticks.length < 6; p += step) ticks.push(p);
        while (box.children.length < ticks.length) {
          const el = document.createElement("span");
          el.className =
            "absolute right-0 -translate-y-1/2 text-right font-mono text-[10px] tabular-nums leading-none text-white/50";
          box.appendChild(el);
        }
        for (let i = 0; i < box.children.length; i++) {
          const el = box.children[i] as HTMLSpanElement;
          const p = ticks[i];
          if (p == null) {
            el.style.display = "none";
            continue;
          }
          const y = yOf(p);
          if (y < 1 || y > 99) {
            el.style.display = "none";
            continue;
          }
          el.style.display = "";
          el.style.top = `${y}%`;
          el.textContent = fmt(asset, p);
        }
      }
    };

    paint(performance.now());
  }, [asset, live]);

  const gid = `tape-${tapeId || asset}`;

  return (
    <div ref={rootRef} className="relative h-40 w-full overflow-hidden bg-black sm:h-52">
      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3ddc84" stopOpacity="0.4" />
            <stop offset="48%" stopColor="#3ddc84" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#3ddc84" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line
          ref={strikeRef}
          x1="0"
          x2="84"
          y1="50"
          y2="50"
          stroke="#ffffff"
          strokeOpacity="0.28"
          strokeDasharray="1.1 1.5"
          vectorEffect="non-scaling-stroke"
        />
        <path ref={areaRef} d="" fill={`url(#${gid})`} />
        <path
          ref={lineRef}
          d=""
          fill="none"
          stroke="#ffffff"
          strokeWidth="2.15"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        ref={ballRef}
        className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
      />
      <div ref={scaleRef} className="pointer-events-none absolute inset-y-0 right-0.5 w-[3.25rem] overflow-hidden" />
    </div>
  );
}

export function BandMeter({
  price,
  frame,
}: {
  price: number;
  frame: VwapFrame | null;
}) {
  if (!frame || frame.stdev <= 0) return null;
  const min = frame.vwap - 3 * frame.stdev;
  const max = frame.vwap + 3 * frame.stdev;
  const t = Math.min(1, Math.max(0, (price - min) / (max - min)));

  return (
    <div className="mt-2">
      <div className="relative h-px bg-white/25">
        <div
          className="absolute top-1/2 size-1 -translate-x-1/2 -translate-y-1/2 bg-white"
          style={{ left: `${t * 100}%` }}
        />
        {[0.166, 0.333, 0.5, 0.666, 0.833].map((p) => (
          <span key={p} className="absolute top-1/2 h-1.5 w-px -translate-y-1/2 bg-white/40" style={{ left: `${p * 100}%` }} />
        ))}
      </div>
      <div className="mt-1.5 flex justify-between font-mono text-[10px] tracking-wide text-white">
        <span>−3σ</span>
        <span>VWAP</span>
        <span>+3σ</span>
      </div>
    </div>
  );
}
