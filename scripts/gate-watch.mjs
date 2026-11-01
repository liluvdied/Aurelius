import { readFileSync, writeFileSync } from "node:fs";
import { scanDesk } from "../src/lib/desk/scan.ts";
import { heldFifteens, seedGate } from "../src/lib/desk/kalshi-live.server.ts";

const shape = /^(tap-reject at |close above |close below |open )/i;

function log(row) {
  const line = { at: new Date().toISOString(), ...row };
  console.log(JSON.stringify(line));
  let prev = [];
  try {
    const parsed = JSON.parse(readFileSync("data/gate-watch.json", "utf8"));
    if (Array.isArray(parsed)) prev = parsed;
  } catch {
    prev = [];
  }
  prev.unshift(line);
  writeFileSync("data/gate-watch.json", JSON.stringify(prev.slice(0, 100), null, 2));
}

function latest(file, ticker) {
  try {
    const rows = JSON.parse(readFileSync(file, "utf8"));
    if (!Array.isArray(rows)) return null;
    return rows.find((row) => row.ticker === ticker) ?? null;
  } catch {
    return null;
  }
}

let active = null;
const started = Date.now();
while (Date.now() - started < 6 * 60 * 60 * 1000) {
  try {
    if (!active) {
      const snap = await scanDesk();
      const silver = snap.assets.silver;
      const setup = silver?.setup;
      const label = setup?.pattern?.label || silver?.pattern1m?.label || "";
      log({
        phase: "scan",
        label,
        side: setup?.side ?? null,
        multiple: setup?.multiple ?? null,
        watch: setup?.watchOnly ?? null,
        left: Math.round(silver?.secondsLeft ?? 0),
        spot: silver?.spot ?? null,
        target: silver?.target ?? null,
      });
      const ready = Boolean(
        setup &&
          !setup.watchOnly &&
          setup.side &&
          shape.test(label) &&
          (silver?.secondsLeft ?? 0) > 150 &&
          setup.ticker,
      );
      if (ready) {
        const placed = await seedGate(
          setup.side,
          setup.ticker,
          silver.market?.yesAsk ?? 0,
          silver.market?.noAsk ?? 0,
          label,
        );
        log({ phase: "seed", label, result: placed });
        if (placed.status === "filled") {
          active = { ticker: placed.ticker, side: placed.side, paid: placed.paid, label };
        }
      }
    } else {
      const held = await heldFifteens();
      const row = held.find((item) => item.ticker === active.ticker);
      const trace = latest("data/cash-trace.json", active.ticker);
      log({
        phase: "watch",
        ticker: active.ticker,
        open: Boolean(row),
        cost: row?.cost ?? null,
        why: trace ? `${trace.action} ${trace.pct}% ${trace.why}` : "no read yet",
      });
      if (!row) {
        const exit = latest("data/exit-log.json", active.ticker);
        const reason = exit?.reason || "closed with no exit note";
        log({ phase: "closed", ticker: active.ticker, reason, profit: exit?.profit ?? null });
        if (/gate|failsafe/i.test(reason)) {
          log({ phase: "solved", reason, profit: exit?.profit ?? null });
          break;
        }
        active = null;
        writeFileSync("data/gate-test.json", JSON.stringify({ on: false }));
      }
    }
  } catch (err) {
    log({ phase: "error", message: err instanceof Error ? err.message : String(err) });
  }
  await new Promise((resolve) => setTimeout(resolve, active ? 8000 : 20000));
}
