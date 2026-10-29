export function usd(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function money(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "−" : n > 0 ? "+" : "";
  return `${sign}$${usd(Math.abs(n), digits)}`;
}

export function cents(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return `${(n * 100).toFixed(1)}¢`;
}

export function reachText(multiple?: number | null, peak?: number | null): string {
  if (!(multiple && multiple > 1)) return "";
  const maxPct = Math.round((multiple - 1) * 100);
  const entry = 1 / multiple;
  if (!(peak && peak > 0.02) || !(entry > 0.02)) return `max ${maxPct}%`;
  const saw = Math.round((peak / entry - 1) * 100);
  return `max ${maxPct}% · saw ${saw}%`;
}

export function multiple(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${n.toFixed(2)}×`;
}

export function countdown(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "00:00";
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function signed(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${usd(Math.abs(n), digits)}`;
}

export function bps(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n > 0 ? "+" : n < 0 ? "−" : "";
  return `${sign}${Math.abs(n).toFixed(1)} bp`;
}

export function pct(n: number, digits = 0): string {
  if (!Number.isFinite(n)) return "—";
  return `${n.toFixed(digits)}%`;
}

export function askOf(side: "up" | "down", yesAsk: number, noAsk: number): number {
  return side === "up" ? yesAsk : noAsk;
}

export function bidOf(side: "up" | "down", yesBid: number, noBid: number): number {
  return side === "up" ? yesBid : noBid;
}
