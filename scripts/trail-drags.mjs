const trailPeak = new Map();

function trailExit(trade, bid) {
  const profit = bid - trade.ask;
  const pct = trade.ask > 0 ? profit / trade.ask : 0;
  if (!(bid > trade.ask) || !(profit > 0)) return false;
  const floor = trade.ask * 1.39;
  if (pct + 1e-9 >= 0.39) {
    const prev = trailPeak.get(trade.id) ?? 0;
    if (bid > prev) trailPeak.set(trade.id, bid);
  }
  const peak = trailPeak.get(trade.id) ?? 0;
  if (!(peak > floor)) return false;
  if (bid + 1e-9 < floor) return false;
  if (bid <= floor + 0.005 && peak > floor + 0.01) return bid + 1e-9 >= floor;
  const give = Math.max(floor, Math.round((peak - 0.02) * 100) / 100);
  return bid <= give + 1e-9 && bid + 0.015 < peak;
}

function run(name, bids, ask = 0.5) {
  const t = { id: name, ask };
  let sold = null;
  const rows = [];
  for (const bid of bids) {
    const hit = trailExit(t, bid);
    const pct = Math.round(((bid - ask) / ask) * 1000) / 10;
    rows.push(`${bid.toFixed(2)} ${pct}%${hit ? " SELL" : ""}`);
    if (hit && !sold) sold = `${pct}% @ ${bid.toFixed(2)}`;
  }
  console.log(`${(sold ?? "held").padEnd(18)} ${name}`);
  console.log(`  ${rows.join(" → ")}`);
}

run("never reaches 39", [0.52, 0.55, 0.6, 0.64, 0.68, 0.66, 0.6]);
run("rides 39 to 90, no fade", [0.7, 0.75, 0.8, 0.85, 0.9, 0.95]);
run("75 then gives 2 cents", [0.7, 0.8, 0.88, 0.875, 0.86]);
run("75 then 1 cent flicker", [0.7, 0.88, 0.87, 0.89, 0.91]);
run("peaks 50 and fades to floor", [0.72, 0.75, 0.74, 0.72, 0.7, 0.695]);
run("just over 39 then under", [0.7, 0.71, 0.68, 0.6, 0.4]);
run("slow grind still rising", [0.7, 0.71, 0.72, 0.73, 0.74, 0.76, 0.78, 0.8]);
run("gap from 80% to a loss", [0.72, 0.9, 0.2]);
run("two cent fade off 60", [0.72, 0.8, 0.78]);
run("three cent fade off 46", [0.7, 0.73, 0.7]);
run("choppy above 39", [0.75, 0.74, 0.76, 0.75, 0.78, 0.77, 0.8]);
run("tags 39 then lifts", [0.695, 0.7, 0.71, 0.74, 0.73]);
run("99 then 2 cents", [0.8, 0.95, 0.99, 0.97]);
run("cheap entry trails", [0.5, 0.56, 0.62, 0.6], 0.4);
run("expensive entry", [0.7, 0.86, 0.9, 0.88], 0.62);
run("dies before 39", [0.55, 0.48, 0.3, 0.1]);
run("new high after 1 cent dip", [0.74, 0.8, 0.79, 0.84, 0.83, 0.81]);
run("floor after a small peak", [0.71, 0.71, 0.7, 0.695]);
run("holds a 70% run", [0.72, 0.85, 0.84, 0.86, 0.85, 0.83]);
run("second trade does not inherit", [0.9, 0.8]);
