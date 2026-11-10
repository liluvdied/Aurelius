// NAV CLOSE ENTRIES (Love, 2026-10-02): "a close above or below the nav bands is an entry.
// Long for above, short for below."
// When a 5-MINUTE candle CLOSES across a 5m, 10m or 15m nav line (the purple center or an outer
// band), that is a setup in the direction of the close: closed above → long, closed below → short.
// (Love: "1m aren't as strong, just confirmation" — the 1m close is checked by the nav skip.)
// It goes through the exact same path as her other setups (paper first, then Kalshi), so every
// rule still applies: 1.38x minimum, band in the way, nav skip, worst hours, $5 cap on 3x+,
// one order per window. Switch: data/live-switch.json "navCross": { "on": true }.
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Frame = { c: number; up: number; dn: number } | null | undefined;
type NavLike = { m5?: Frame; m10?: Frame; m15?: Frame; close5m?: number | null; prev5m?: number | null; close5mAt?: number | null; bar5m?: { o: number; h: number; l: number; c: number } | null } | null | undefined;
type AssetLike = {
  asset: string;
  spot: number;
  target: number | null;
  secondsLeft: number;
  market: { ticker: string; yesAsk: number; noAsk: number } | null;
  nav?: NavLike;
};

function config(): { on: boolean; bandAssets: string[]; rejectOnly: string[] } {
  try {
    const sw = JSON.parse(readFileSync(join(process.cwd(), "data", "live-switch.json"), "utf8"));
    // Love (11:52 PM): the Bollinger (outer) band entries apply to BTC, not gold.
    const bandAssets = Array.isArray(sw?.navCross?.bandAssets) ? sw.navCross.bandAssets : ["btc"];
    // Love (3:50 AM): gold may trade Bollinger REJECTIONS too (breaks stay BTC-only).
    const rejectOnly = Array.isArray(sw?.navCross?.rejectOnly) ? sw.navCross.rejectOnly : [];
    return { on: sw?.navCross?.on === true, bandAssets, rejectOnly };
  } catch {
    return { on: false, bandAssets: ["btc"], rejectOnly: [] };
  }
}

export function navCrossSetup(asset: AssetLike | null | undefined) {
  const cfg = config();
  if (!asset || !cfg.on) return null;
  const name0 = String(asset.asset).toLowerCase();
  const bandsToo = cfg.bandAssets.includes(name0);
  const rejectOnly = cfg.rejectOnly.includes(name0);
  const nav = asset.nav;
  const m = asset.market;
  const close = Number(nav?.close5m);
  const prev = Number(nav?.prev5m);
  const at = Number(nav?.close5mAt);
  if (!m?.ticker || !(close > 0) || !(prev > 0) || !(at > 0)) return null;
  // Only a FRESH close: the crossing 5m candle closed within the last ~70 seconds.
  if (Date.now() / 1000 - (at + 300) > 70) return null;
  if (!(asset.secondsLeft > 120)) return null;
  // Longer timeframes first: a 15m line outranks a 10m, a 10m outranks a 5m.
  for (const tf of ["m15", "m10", "m5"] as const) {
    const f = nav?.[tf];
    if (!f) continue;
    const lines = bandsToo ? ([["purple", f.c], ["upper band", f.up], ["lower band", f.dn]] as const) : ([["purple", f.c]] as const);
    for (const [name, level] of lines) {
      if (!(level > 0)) continue;
      let side: "up" | "down" | null = null;
      let kind = "close";
      const isBand = name !== "purple";
      if (!(isBand && rejectOnly)) {
        if (prev <= level && close > level) side = "up";
        else if (prev >= level && close < level) side = "down";
      }
      // Love (11:48 PM): a Bollinger band REJECTED is a fade, a Bollinger band BROKEN is continuation.
      //   wick up into the upper band, 5m closed back under it → short
      //   wick down into the lower band, 5m closed back over it → long
      //   (a close through either band is the break → caught above as close above / below)
      const bar = nav?.bar5m;
      if (!side && bar && name === "upper band" && bar.o < level && bar.h >= level && bar.c < level) {
        side = "down";
        kind = "reject";
      }
      if (!side && bar && name === "lower band" && bar.o > level && bar.l <= level && bar.c > level) {
        side = "up";
        kind = "reject";
      }
      if (!side) continue;
      const ask = side === "up" ? m.yesAsk : m.noAsk;
      if (!(ask > 0.02 && ask < 0.98)) return null;
      const label = kind === "reject" ? `${side === "up" ? "Close above" : "Close below"} ${tf.slice(1)}m nav ${name} (rejected)` : `${side === "up" ? "Close above" : "Close below"} ${tf.slice(1)}m nav ${name}`;
      const target = Number(asset.target);
      return {
        id: `${m.ticker}:${side}:navcross:${tf}:${name}:${kind}`,
        asset: asset.asset,
        ticker: m.ticker,
        side,
        pattern: { kind: "break_retest", side, band: null, quality: 1, label, reasons: [`5m closed ${side === "up" ? "above" : "below"} the ${tf.slice(1)}m nav ${name} (${level.toFixed(2)})`] },
        ask,
        multiple: Math.round((1 / ask) * 100) / 100,
        localConviction: 0.6,
        exitPct: 0,
        holdToExpiry: false,
        reasons: [`Nav close: 5m closed ${side === "up" ? "above" : "below"} the ${tf.slice(1)}m ${name} at ${level.toFixed(2)}.`],
        watchOnly: false,
        premium: false,
        throughTarget: target > 0 ? (side === "up" ? asset.spot > target : asset.spot < target) : false,
      };
    }
  }
  return null;
}
