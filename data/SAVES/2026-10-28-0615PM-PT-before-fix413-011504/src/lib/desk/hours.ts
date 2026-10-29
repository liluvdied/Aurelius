import type { AssetId, Trade } from "./types";

const TZ = "America/Los_Angeles";

export function goldBookClosed(at = new Date()): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      hour: "numeric",
      hourCycle: "h23",
    }).format(at),
  );
  return hour === 14;
}

export function goldHaltFill(trade: Pick<Trade, "asset" | "openedAt">): boolean {
  if (trade.asset !== "gold") return false;
  const at = Date.parse(trade.openedAt);
  if (!Number.isFinite(at)) return false;
  return goldBookClosed(new Date(at));
}

export function goldHalted(asset: AssetId, at = new Date()): boolean {
  return asset === "gold" && goldBookClosed(at);
}
