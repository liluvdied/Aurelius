import type { ExitNote } from "@/lib/desk/fns";

const pill =
  "inline-flex h-6 w-[92px] shrink-0 items-center justify-center rounded-full border border-white/35 bg-transparent text-[9px] tracking-[0.12em] text-fg disabled:text-muted";

export type TakeNote = {
  at?: string;
  asset?: string;
  side?: string;
  pattern?: string;
  stake?: number;
  profit?: number | null;
  ticker?: string;
};

function money(n: number, asset: string): string {
  const digits = asset === "gold" ? 2 : 0;
  return `$${Math.abs(n).toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits })}`;
}

function clock(seconds: number | undefined): string {
  if (seconds == null || !Number.isFinite(seconds)) return "time running out";
  if (seconds >= 90) return `${Math.round(seconds / 60)} min left`;
  return `${Math.round(seconds)}s left`;
}

export function explainExit(row: ExitNote): string {
  const ticker = row.ticker ?? "";
  const asset = ticker.includes("ETH")
    ? "ETH"
    : ticker.includes("SOL")
      ? "SOL"
      : ticker.includes("SILVER")
        ? "Silver"
        : row.asset === "gold" || ticker.includes("GOLD")
          ? "Gold"
          : "Bitcoin";
  const way = row.side === "down" ? "short" : "long";
  const name = `${asset} ${way}`;
  const left = clock(row.secondsLeft);
  const spot = row.spot ?? 0;
  const strike = row.strike ?? null;
  const signed = spot > 0 && strike != null ? spot - strike : null;
  const gap =
    signed == null
      ? ""
      : row.side === "down"
        ? `price was ${money(signed, row.asset ?? "")} ${signed > 0 ? "above" : "below"} the target`
        : `price was ${money(signed, row.asset ?? "")} ${signed < 0 ? "below" : "above"} the target`;
  const against = signed != null && (row.side === "down" ? signed > 0.05 : signed < -0.05);
  const pct = row.bidPct != null ? `${row.bidPct}%` : "in profit";
  const reason = row.reason ?? "";
  const red = (row.profit ?? 0) < 0 || (row.bidPct ?? 0) < 0;
  const caught =
    !red && (row.highBid == null || (row.yesBid != null && row.yesBid + 0.02 >= row.highBid));
  const trail = red
    ? "That was not a take profit."
    : caught
      ? "The trailing take profit caught the highest quote."
      : "The trailing take profit sold it just under the highest quote.";
  const entry = row.entry ? ` ${row.entry}` : "";

  if (reason === "band") {
    const high = caught ? " That bid was the highest quote on it." : "";
    return `${name} was green at ${pct} and sitting on a VWAP band, with ${left}. Desk took it. That rejection is the failsafe.${high}`;
  }
  if (reason === "salvage-missed") {
    return `${name} was through the line with ${left}, and the sell found no bid.`;
  }
  if (reason === "salvage" || reason === "cut") {
    return `${name} was clearly through the line with ${left}. Desk sold what the bid would still pay.`;
  }
  if (reason === "ceiling") {
    return `${name} was all the way at ${pct}. Almost nothing was left to the max, so the desk sold it instead of waiting on the bell.`;
  }
  if (reason === "trail" || reason === "pin" || reason === "ease") {
    const trigger = row.targetPct ?? 45;
    const extra = row.bidPct != null ? row.bidPct - trigger : null;
    const kept =
      extra != null && extra > 0
        ? ` The trail kept an extra ${extra} points past ${trigger}%.`
        : extra === 0
          ? ` It sold right on the ${trigger}% trigger.`
          : "";
    const thin = trigger === 33 ? " The multiple was under 1.6×, so 33% was the take." : "";
    if (red) return `${name} was sold in the red at ${pct}. The ${trigger}% trigger was never reached.${entry}`;
    return `${name} reached ${pct} against a ${trigger}% trigger.${thin}${kept} ${trail}${entry}`;
  }
  if (against && (reason === "capped" || reason === "time")) {
    return `${name} was still green, but ${gap}, against the ${way}, with ${left}. Desk closed it rather than risk the bell.`;
  }
  if (reason === "capped") {
    return `${name} was at ${pct} with ${left}, and there was little left to collect. Desk closed it.`;
  }
  if (reason === "target" || reason === "time" || reason === "called") {
    const side = gap || "price was on side";
    return `${name} reached ${pct} against a ${row.targetPct ?? 65}% target, with ${left}. ${side}. Desk banked it. ${trail}`;
  }
  if (reason === "paper") {
    return `${name} was closed because the other book had already taken it.`;
  }
  if (row.profit != null && row.profit < 0) {
    return `${name} was closed in the red with ${left}. ${gap || "The lead was gone."}`;
  }
  return `${name} was closed at ${pct} with ${left}. ${gap}`.trim();
}

export function whyTrade(input: {
  name?: string;
  side?: string;
  pattern?: string;
  spot?: number | null;
  target?: number | null;
}): string {
  const raw = input.name ?? "";
  const name = /gold/i.test(raw) ? "Gold" : /eth/i.test(raw) ? "ETH" : /sol/i.test(raw) ? "SOL" : "Bitcoin";
  const way = input.side === "down" ? "short" : "long";
  const pattern = (input.pattern || "").replace(/−/g, "-").trim();
  const place =
    input.spot && input.spot > 0 && input.target && input.target > 0
      ? ` Price was ${Math.round(input.spot).toLocaleString("en-US")} and the target was ${Math.round(input.target).toLocaleString("en-US")}.`
      : "";
  if (!pattern || pattern === "Live" || pattern === "Paper") {
    return `${name} ${way} was copied from the other book. The ticket did not keep the setup name.`;
  }
  const hit = pattern.match(/([+-])(\d+(?:\.\d+)?)σ/);
  const pole = hit?.[1] === "-" ? "lower" : hit ? "upper" : "";
  const width = hit?.[2] ?? "";
  const kind = /^Open/.test(pattern)
    ? "open"
    : /^Fade/.test(pattern)
      ? "fade"
      : /^Tap/.test(pattern)
        ? "tap"
        : /^Break/.test(pattern)
          ? "break"
          : "";
  if (kind === "open" && pole === "lower" && input.side === "down") {
    return `${name} short is an open on the lower ${width} band. That short is on the paying list.${place} Price was already above the band, so it has to fall back through it.`;
  }
  if (kind === "open" && pole === "lower") {
    return `${name} long is an open on the lower ${width} band. Price opened on that band and the long is the bounce off it.${place}`;
  }
  if (kind === "open" && pole === "upper" && input.side === "down") {
    return `${name} short is an open on the upper ${width} band. Price opened under that band and the short fades it.${place}`;
  }
  if (kind === "open" && pole === "upper") {
    return `${name} long is an open on the upper ${width} band. Price opened through it and the long goes with the break.${place}`;
  }
  if (kind === "fade" && pole === "upper") {
    return `${name} short is a fade off the upper ${width} band. Price tagged that band and stepped off it.${place}`;
  }
  if (kind === "fade" && pole === "lower") {
    return `${name} long is a fade off the lower ${width} band. Price tagged that band and stepped off it.${place}`;
  }
  if (kind === "tap" && pole === "upper") {
    return `${name} short is a tap-reject of the upper ${width} band. The wick tagged it and closed back inside.${place}`;
  }
  if (kind === "tap" && pole === "lower") {
    return `${name} long is a tap-reject of the lower ${width} band. The wick tagged it and closed back inside.${place}`;
  }
  if (kind === "break" && pole === "upper") {
    return `${name} long is a break through the upper ${width} band. Price cleared it and kept going.${place}`;
  }
  if (kind === "break" && pole === "lower") {
    return `${name} short is a break through the lower ${width} band. Price cleared it and kept going.${place}`;
  }
  return `${name} ${way} matched ${pattern}. That setup is on the paying list.${place}`;
}

export function explainTake(row: TakeNote): string {
  const asset = row.asset === "gold" ? "Gold" : row.asset === "btc" ? "Bitcoin" : "That";
  const way = row.side === "down" ? "short" : "long";
  const pattern = row.pattern || "a listed setup";
  const fade = row.side === "down" && /\+[0-9]/.test(pattern);
  const base = `${asset} ${way} matched ${pattern}. That label is on the paying list, so the desk sent it.`;
  if (!fade) return base;
  return `${base} It did not check whether a VWAP band sat between price and the target. If price is above the band and the target is under it, the short has to fall through the band. That is not prime. Those are blocked now.`;
}

export function SitRep({
  rows,
  takes,
  answer,
  note,
  error,
  busy,
  onAsk,
  onDig,
  onTake,
}: {
  rows: ExitNote[];
  takes: TakeNote[];
  answer: string;
  note: string;
  error: string;
  busy: boolean;
  onAsk: () => void;
  onDig: (row: ExitNote) => void;
  onTake: (row: TakeNote) => void;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] tracking-[0.18em] text-subtle">WHY IT CLOSED</p>
        <button type="button" onClick={onAsk} disabled={busy} className={pill}>
          {busy ? "..." : "Ask Grok"}
        </button>
      </div>
      {note ? <p className="text-sm leading-snug text-fg">{note}</p> : null}
      {answer && answer !== note ? <p className="text-sm leading-snug text-fg">{answer}</p> : null}
      {error ? <p className="text-sm text-warn">{error}</p> : null}
      {takes.length > 0 ? <p className="pt-1 text-[10px] tracking-[0.18em] text-subtle">WHY IT ENTERED</p> : null}
      {takes.map((row, i) => {
        const asset = row.asset === "gold" ? "GOLD" : row.asset === "btc" ? "BTC" : (row.asset ?? "").toUpperCase();
        return (
          <div key={`${row.at}-${row.ticker}-${i}`} className="border-b border-white/10 py-2">
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-[10px] tabular-nums text-muted">
                {(row.at ?? "").slice(11, 16)} · {asset} {(row.side ?? "").toUpperCase()} · {row.pattern} · ${Number(row.stake ?? 0).toFixed(0)}
              </p>
              <button type="button" onClick={() => onTake(row)} disabled={busy} className={pill}>
                Dig Deeper
              </button>
            </div>
          </div>
        );
      })}
      {rows.length === 0 ? <p className="text-sm text-muted">No exits yet.</p> : null}
      {rows.map((row, i) => {
        const won = (row.profit ?? 0) > 0;
        const when = (row.at ?? "").slice(11, 16);
        return (
          <div key={`${row.at}-${row.ticker}-${i}`} className="border-b border-white/10 py-2">
            <p className="text-sm leading-snug text-fg">{explainExit(row)}</p>
            <div className="mt-1.5 flex items-center justify-between gap-3">
              <p className={`font-mono text-[10px] tabular-nums ${won ? "text-up" : "text-down"}`}>
                {when} · {row.profit == null ? "no fill" : `${won ? "+" : ""}$${row.profit.toFixed(2)}`}
              </p>
              <button type="button" onClick={() => onDig(row)} disabled={busy} className={pill}>
                Dig Deeper
              </button>
            </div>
          </div>
        );
      })}
    </section>
  );
}
