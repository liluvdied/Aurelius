import { scanDesk } from "../src/lib/desk/scan.ts";

const snap = await scanDesk();
const rows = [];
for (const id of Object.keys(snap.assets)) {
  const asset = snap.assets[id];
  const setup = asset.setup;
  rows.push({
    id,
    spot: asset.spot,
    target: asset.target,
    left: asset.secondsLeft,
    ticker: asset.market?.ticker ?? null,
    yesAsk: asset.market?.yesAsk ?? null,
    noAsk: asset.market?.noAsk ?? null,
    label: setup?.pattern?.label ?? asset.pattern1m?.label ?? null,
    kind: setup?.pattern?.kind ?? asset.pattern1m?.kind ?? null,
    side: setup?.side ?? null,
    multiple: setup?.multiple ?? null,
    watchOnly: setup?.watchOnly ?? null,
    ask: setup?.ask ?? null,
    through: setup?.throughTarget ?? null,
  });
}
console.log(JSON.stringify(rows, null, 2));
