// One-off (Claude, Oct 10 ~8:50 PM PT, Love's gold stop lab): the strike of every gold 15m window she traded on Kalshi that
// has a bid path, so the lab knows how far gold was from the target at every tick. Read only. data/gold-strikes.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { kget } from "./scanner";
const g = globalThis as unknown as { __gsDone?: boolean };
export async function goldStrikesOnce() {
  if (g.__gsDone) return;
  g.__gsDone = true;
  const D = (f: string) => join(process.cwd(), "data", f);
  if (!existsSync(D("gold-strike-want.json"))) return;
  const want: string[] = JSON.parse(readFileSync(D("gold-strike-want.json"), "utf8"));
  const out: Record<string, any> = existsSync(D("gold-strikes.json")) ? JSON.parse(readFileSync(D("gold-strikes.json"), "utf8")) : {};
  for (const tk of want) {
    if (out[tk]) continue;
    try {
      const j = await kget(`/trade-api/v2/markets/${tk}`);
      const m = j?.market || {};
      out[tk] = { floor: m.floor_strike ?? null, cap: m.cap_strike ?? null, strikeType: m.strike_type ?? null, result: m.result ?? null, sub: m.yes_sub_title ?? null, exp: m.expiration_value ?? null };
    } catch (e) {
      out[tk] = { error: String(e).slice(0, 80) };
    }
    await new Promise((r) => setTimeout(r, 350));
    if (Object.keys(out).length % 25 === 0) writeFileSync(D("gold-strikes.json"), JSON.stringify(out));
  }
  writeFileSync(D("gold-strikes.json"), JSON.stringify(out));
}
