// SELF CHECK (Claude, Oct 9 ~11:15 PM PT, Love: "can you put safeguards in place somehow so they don't happen again? she
// works beautifullllly when she's dialed"). Every minute, guards against the four things that went wrong this week:
//  1. RECORD FILE WIPE (Oct 9 10:08 PM): snapshot live-book-done.json every 15 min; if it shrinks by 20%+, put the missing
//     records back (atomic write) and raise an alarm.
//  2. STALE / BACKUP PRICES (Oct 8-9): if 30%+ of the last 15 min of BTC band checks saw prices $15+ apart, raise a
//     notice (the band check now ignores them; this says the feed itself is flickering).
//  3. SETTINGS DRIFT: the rules we set (shifts on, gold map = the chosen set, REFINED longs band-free, COTC any hour,
//     DIAMOND gold-only) must still be in live-switch.json; if a save elsewhere drops one, raise a RED.
//  4. COPIER HEARTBEAT: if the copier has written nothing for 3 minutes while LIVE is on, raise a RED.
//  5. QUIET HOUR: the book that owns the hour, quiet 60 min or skipping with no rule behind it -> check + re-open.
// Writes data/selfcheck.json (shown on ALERTS); alarms go to the desk's alarm bar once per issue per hour.
import { appendFileSync, copyFileSync, existsSync, readFileSync, renameSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
const D = (f: string) => join(process.cwd(), "data", f);
const rd = (f: string, d: any) => {
  try {
    return JSON.parse(readFileSync(D(f), "utf8"));
  } catch {
    return d;
  }
};
function doneArchKeys(): Set<string> { // fix334: keys in the live-book-done archive, parsed once per change of the file
  try {
    const p = D("live-book-done-archive.jsonl"); const st = statSync(p); const G1 = globalThis as any; const c0 = G1.__doneArch;
    if (c0 && c0.m === st.mtimeMs && c0.s === st.size) return c0.k;
    const k = new Set<string>();
    for (const l of readFileSync(p, "utf8").split("\n")) { if (!l) continue; try { const o = JSON.parse(l); if (o && o.key) k.add(String(o.key)); } catch {} }
    G1.__doneArch = { m: st.mtimeMs, s: st.size, k };
    return k;
  } catch { return new Set(); }
}
const g = globalThis as unknown as { __selfAt?: number; __selfSnapAt?: number; __selfSaid?: Record<string, number> };
function alarm(key: string, text: string) {
  const said = (g.__selfSaid ||= {});
  if (said[key] && Date.now() - said[key] < 3600000) return;
  said[key] = Date.now();
  try {
    let rows: any[] = [];
    try {
      const p = JSON.parse(readFileSync(D("alarm.json"), "utf8"));
      if (Array.isArray(p)) rows = p;
    } catch {
    }
    rows.unshift({ at: new Date().toISOString(), text });
    writeFileSync(D("alarm.json.tmp"), JSON.stringify(rows.slice(0, 20)));
    renameSync(D("alarm.json.tmp"), D("alarm.json"));
  } catch {
  }
}
// TIMED RUN (Oct 11 ~5:15 AM PT, Love: "drop her on kalshi for the rest of the hour... no other books, just that one"):
// live-switch liveBook.revertAt + revertTo put the old lineup back on its own when the time is up, and drop the temporary
// anyHour / bandExempt entries that came with it (liveBook.tempBook).
function timedRunRevert() {
  try {
    const f = join(process.cwd(), "data", "live-switch.json");
    const d = JSON.parse(readFileSync(f, "utf8"));
    const lb = d?.liveBook;
    if (!lb?.revertAt || Date.now() < Date.parse(lb.revertAt) || !Array.isArray(lb.revertTo)) return;
    const temp = String(lb.tempBook || "");
    lb.books = lb.revertTo;
    delete lb.revertAt;
    delete lb.revertTo;
    delete lb.tempBook;
    if (temp) {
      for (const a of ["btc", "gold"]) {
        const ah = d?.shifts?.anyHour?.[a];
        if (Array.isArray(ah)) d.shifts.anyHour[a] = ah.filter((b: string) => b !== temp);
        if (d?.bandExempt?.[a]?.[temp]) delete d.bandExempt[a][temp];
      }
    }
    writeFileSync(f + ".tmp", JSON.stringify(d, null, 1));
    renameSync(f + ".tmp", f);
    appendFileSync(join(process.cwd(), "data", "overnight-fixes.log"), `${new Date().toISOString()} TIMED RUN ended: RUN back to ${lb.books.join(", ")}\n`);
  } catch {
  }
}
export function selfCheckTick() {
  timedRunRevert();
  if (g.__selfAt && Date.now() - g.__selfAt < 60000) return;
  g.__selfAt = Date.now();
  const checks: { name: string; ok: boolean; note: string }[] = [];
  // 0. TRIAL EXPIRY (Oct 10 ~12:25 AM PT, Love: SQUEEZE "next 2 windows and we'll see how we feel about her"). When
  // live-switch squeezeTrial.until passes: SQUEEZE comes off RUN, off any-hour and loses the band pass. Atomic write.
  try {
    const sw0 = rd("live-switch.json", {});
    const tr = sw0?.squeezeTrial;
    // Oct 10 ~1:15 AM PT (Love: "if she's doing good past 1am and i fall asleep you don't need to turn her off"):
    // sit-out hours (her worst: 5 + 6 AM) take her off any-hour for that hour only; at 'until', if her trades since the
    // trial began are green she stays on until 8 AM, otherwise she comes off.
    if (tr) {
      const hh = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
      const skip = (tr.skipHours || []).map(Number).includes(hh);
      const ah = (sw0.shifts.anyHour ||= {}).btc ||= [];
      const has = ah.includes("squeeze");
      let changed = false;
      if (skip && has) { sw0.shifts.anyHour.btc = ah.filter((b: string) => b !== "squeeze"); changed = true; }
      if (!skip && !has && !(tr.until && Date.now() > Date.parse(tr.until))) { ah.push("squeeze"); changed = true; }
      if (tr.until && Date.now() > Date.parse(tr.until) && tr.keepIfGreen && !tr.extended) {
        const nb: any[] = rd("night-book.json", []);
        const all = (Array.isArray(nb) ? nb : []).filter((r) => r?.book === "squeeze" && r.at >= tr.start && r.result !== "open" && typeof r.pnl === "number");
        // judge her on the trades that actually went to Kalshi (a window a hand trade took never cost her anything);
        // if none went, judge her paper.
        const dn = rd("live-book-done.json", {});
        const went = all.filter((r) => ["filled", "partial"].includes(dn?.[r.id]?.status));
        const mine = went.length ? went : all;
        const pnl = Math.round(mine.reduce((x, r) => x + r.pnl, 0) * 100) / 100;
        if (pnl >= 0) {
          const d = new Date();
          const ptNow = new Date(d.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
          const add = ((8 - ptNow.getHours() + 24) % 24) * 3600000 - ptNow.getMinutes() * 60000;
          tr.until = new Date(Date.now() + add).toISOString();
          tr.extended = { at: new Date().toISOString(), paperPnl: pnl, trades: mine.length };
          changed = true;
          alarm("trial-extend", `SQUEEZE is green so far (${pnl >= 0 ? "+" : ""}$${pnl} paper on ${mine.length} trades): she stays on until 8 AM, sitting out 5-6 AM.`);
        }
      }
      if (changed) {
        writeFileSync(D("live-switch.json.trial"), JSON.stringify(sw0, null, 1));
        renameSync(D("live-switch.json.trial"), D("live-switch.json"));
      }
    }
    if (tr?.until && Date.now() > Date.parse(tr.until)) {
      const lb = sw0.liveBook || {};
      lb.prevBooks = [...(lb.books || [])];
      lb.books = (lb.books || []).filter((b: string) => b !== "squeeze");
      if (sw0.shifts?.anyHour?.btc) sw0.shifts.anyHour.btc = sw0.shifts.anyHour.btc.filter((b: string) => b !== "squeeze");
      if (sw0.bandExempt?.btc) delete sw0.bandExempt.btc.squeeze;
      sw0.squeezeTrialDone = { ...tr, endedAt: new Date().toISOString() };
      delete sw0.squeezeTrial;
      writeFileSync(D("live-switch.json.trial"), JSON.stringify(sw0, null, 1));
      renameSync(D("live-switch.json.trial"), D("live-switch.json"));
      alarm("trial-end", "SQUEEZE's 2-window live trial is over: she's back to paper. Ask Claude for her trial results.");
    }
  } catch {
  }
  // AUTO-CLEAR EVERY 4 HOURS (fix343, Oct 27 2026 4:08 PM PT, Love: "aww poor ting let's clear up her cache so she can continue to execute properly hunn / i want to set up an
  // auto-clear every 4 hours so she doesn't get stopped up by the lag that comes from that pls"): every 4 hours (and once when she starts) each finished record that never
  // filled (skipped / missed / blocked-final) and is older than 3.5 h moves out of live-book-done.json into live-book-done-archive.jsonl - kept forever, never deleted.
  // Fills and partials stay (the breaker and day board read them). The copier only looks at rows from the last 3 h, so nothing she still needs is moved.
  try {
    const G4 = globalThis as any;
    if (!G4.__doneTrimAt || Date.now() - G4.__doneTrimAt >= 4 * 3600000) {
      G4.__doneTrimAt = Date.now();
      const d0 = rd("live-book-done.json", null);
      if (d0 && typeof d0 === "object") {
        const cut = Date.now() - 3.5 * 3600000; const keep: Record<string, any> = {}; let lines = ""; let moved = 0;
        for (const [k, v] of Object.entries(d0) as [string, any][]) {
          const t = Date.parse(String(v?.at));
          if (v && v.final === true && v.status !== "filled" && v.status !== "partial" && Number.isFinite(t) && t < cut) { lines += JSON.stringify({ key: k, ...v, archivedAt: new Date().toISOString(), archivedBy: "fix343 auto-clear" }) + "\n"; moved++; }
          else keep[k] = v;
        }
        if (moved) {
          appendFileSync(D("live-book-done-archive.jsonl"), lines);
          writeFileSync(D("live-book-done.json.trim"), JSON.stringify(keep)); renameSync(D("live-book-done.json.trim"), D("live-book-done.json"));
          try { copyFileSync(D("live-book-done.json"), D("guard/live-book-done.snap.tmp")); renameSync(D("guard/live-book-done.snap.tmp"), D("guard/live-book-done.snap.json")); g.__selfSnapAt = Date.now(); } catch {}
          try { appendFileSync(D("auto-clear.jsonl"), JSON.stringify({ at: new Date().toISOString(), moved, kept: Object.keys(keep).length }) + "\n"); } catch {}
        }
      }
    }
  } catch {}
  // 1. record file
  try {
    const snap = D("guard/live-book-done.snap.json");
    const cur = rd("live-book-done.json", null);
    const n = cur && typeof cur === "object" ? Object.keys(cur).length : 0;
    const old = existsSync(snap) ? rd("guard/live-book-done.snap.json", {}) : null;
    // fix334 (Oct 27 2026 ~1:05 PM PT, Love: "find out what's choking her loop and fix it permanently please i do not want to do this every hour"): a record
    // moved into data/live-book-done-archive.jsonl (fix301, Love Oct 26 10:45 PM PT: "yessss pls ... do it") is kept, not missing - this guard was putting the
    // archived weeks back into the 3 MB file that every tick parses. Only records that vanished without reaching the archive are put back.
    if (old && cur) { const ak = doneArchKeys(); if (ak.size) for (const k0 of Object.keys(old)) if (ak.has(k0) && !(k0 in cur)) delete old[k0]; }
    const on = old ? Object.keys(old).length : 0;
    if (old && cur && on > 50 && n < on * 0.8) {
      const merged = { ...old, ...cur };
      writeFileSync(D("live-book-done.json.guard"), JSON.stringify(merged));
      renameSync(D("live-book-done.json.guard"), D("live-book-done.json"));
      alarm("done-restore", `RED: the copier's trade records shrank from ${on} to ${n}. Self-check put the ${on - n} missing back.`);
      checks.push({ name: "records", ok: false, note: `restored ${on - n} missing records` });
    } else checks.push({ name: "records", ok: true, note: `${n} records` });
    if (cur && n >= on * 0.8 && (!g.__selfSnapAt || Date.now() - g.__selfSnapAt > 15 * 60000)) {
      copyFileSync(D("live-book-done.json"), D("guard/live-book-done.snap.tmp"));
      renameSync(D("guard/live-book-done.snap.tmp"), snap);
      g.__selfSnapAt = Date.now();
    }
  } catch {
    checks.push({ name: "records", ok: false, note: "could not read the record file" });
  }
  // 2. feed
  try {
    const since = new Date(Date.now() - 15 * 60000).toISOString();
    const lines = readFileSync(D("gate-log.jsonl"), "utf8").split("\n").slice(-400);
    let n = 0, bad = 0;
    for (const l of lines) {
      if (!l) continue;
      try {
        const x = JSON.parse(l);
        if (x.at < since) continue;
        const sp = (x.spots || []).filter((s: number) => s > 0);
        if (!sp.length) continue;
        n++;
        if (Math.max(...sp) - Math.min(...sp) > 15) bad++;
      } catch {
      }
    }
    const flaky = n >= 10 && bad / n >= 0.3;
    if (flaky) alarm("feed", `CHECK: the BTC feed is flickering (${bad} of ${n} band checks saw prices $15+ apart). The band check uses the live price only; watch the signals.`);
    checks.push({ name: "feed", ok: !flaky, note: n ? `${bad}/${n} checks with split prices` : "no BTC checks in 15 min" });
  } catch {
    checks.push({ name: "feed", ok: true, note: "no band checks yet" });
  }
  // 3. settings
  try {
    const sw = rd("live-switch.json", {});
    const sh = sw?.shifts || {};
    const miss: string[] = [];
    if (!sh.on) miss.push("shifts are off");
    const act = sh.activeGoldMap;
    if (act && JSON.stringify(sh.hourLead?.gold || {}) !== JSON.stringify(sh.hourLeadSets?.gold?.[act] || {})) miss.push(`gold map is not the ${String(act).toUpperCase()} set`);
    if (!(sw?.bandExempt?.btc?.refined || []).includes("up")) miss.push("REFINED longs lost their band pass");
    if (!(sh.anyHour?.btc || []).includes("cotc")) miss.push("COTC lost any-hour");
    if (!(sh.bookAssets?.diamond || []).includes("gold")) miss.push("DIAMOND lost gold-only");
    const runNow: string[] = (sw?.liveBook?.revertAt ? sw?.liveBook?.revertTo : sw?.liveBook?.books) || [];
    if (act === "diamond" && !runNow.includes("diamond") && ["refined", "brick", "squeeze", "brickc", "cotc", "dcd"].some((b) => runNow.includes(b))) miss.push("DIAMOND is off RUN");
    // Oct 9 ~11:58 PM PT: every book the shift schedule hands an hour to must be on RUN, or that hour goes dark.
    // During a timed run (liveBook.revertAt) the lineup is checked against the one it returns to.
    const run: string[] = (sw?.liveBook?.revertAt && Array.isArray(sw?.liveBook?.revertTo) ? sw.liveBook.revertTo : sw?.liveBook?.books) || [];
    const named = new Set<string>();
    if (typeof sh.day?.lead === "string") named.add(sh.day.lead);
    const nl = sh.night?.lead;
    if (typeof nl === "string") named.add(nl);
    else if (nl) for (const v of Object.values(nl)) if (v) named.add(String(v));
    for (const m of Object.values(sh.hourLead || {})) for (const v of Object.values(m as Record<string, unknown>)) if (v) named.add(String(v));
    const off = [...named].filter((b) => !run.includes(b));
    // A test lineup (Love, Oct 11: RUN holds none of the scheduled books, e.g. OG + PIVOT alone) is on purpose: no RED.
    const testLineup = ![...named].some((b) => run.includes(b));
    if (off.length && !testLineup) miss.push(`the schedule gives hours to ${off.map((b) => b.toUpperCase()).join(", ")} but ${off.length > 1 ? "they are" : "it is"} off RUN (those hours trade nothing live)`);
    if (miss.length) alarm("settings:" + miss.join("|"), `RED: a rule we set is missing: ${miss.join("; ")}. Tell Claude.`);
    checks.push({ name: "rules", ok: !miss.length, note: miss.length ? miss.join("; ") : "every rule in place" });
  } catch {
    checks.push({ name: "rules", ok: false, note: "could not read live-switch" });
  }
  // 4. copier heartbeat
  try {
    const sw = rd("live-switch.json", {});
    const age = Date.now() - statSync(D("live-book-done.json")).mtimeMs;
    const quiet = sw?.live && age > 3 * 60000;
    if (quiet) alarm("copier", `RED: the live copier has not written in ${Math.round(age / 60000)} min while LIVE is on.`);
    checks.push({ name: "copier", ok: !quiet, note: `last write ${Math.round(age / 1000)} s ago` });
  } catch {
    checks.push({ name: "copier", ok: false, note: "no record file" });
  }
  // 5. QUIET HOUR (Love, Oct 10 ~12:15 AM PT: "can we trigger a self check if she's quiet for an entire hour?... if she skips
  // can we institute a check and reignition if need be?"). For the book that owns this hour on each asset: no signals in
  // 60 min when she usually has 2+/hour = notice (with the feed's age). Signals but nothing on Kalshi = every skip is
  // checked against the rules; a skip with no rule behind it (no record after 2 min, or an unknown reason) is RE-OPENED
  // so the copier tries again while the window is still open, and a RED says so. Rule skips are left alone.
  try {
    const sw = rd("live-switch.json", {});
    const sh = sw?.shifts || {};
    // During a timed run (liveBook.revertAt) the lineup is checked against the one it returns to.
    const run: string[] = (sw?.liveBook?.revertAt && Array.isArray(sw?.liveBook?.revertTo) ? sw.liveBook.revertTo : sw?.liveBook?.books) || [];
    const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour: "2-digit", hourCycle: "h23" }).format(new Date()));
    const inW = (w: any) => w && h >= Number(w.from) && h < Number(w.to);
    const owner = (a: string): string | null => {
      const m = sh.hourLead?.[a];
      if (m && Object.prototype.hasOwnProperty.call(m, String(h))) return m[String(h)] || null;
      if (inW(sh.night)) return typeof sh.night.lead === "string" ? sh.night.lead : sh.night.lead?.[a] || null;
      if (inW(sh.day)) {
        const off = (sh.day.leadOff?.[a] || []).map(Number);
        return off.includes(h) ? null : sh.day.lead || null;
      }
      return null;
    };
    const nb: any[] = rd("night-book.json", []);
    const done = rd("live-book-done.json", {});
    const bn = rd("bands-now.json", {});
    const RULE = /headroom|band never|paper closed|hour map|shift|only .* trades|trades .* only|window ended|before RUN|already|daily|risk|breaker|bench|gate|skip|sit|cooldown|resting|channel|nav|multiple|headroom|1\.37|72c|cap|limit|target|session gap|front/i;
    const now = Date.now();
    let reopened = 0;
    for (const a of ["btc", "gold"]) {
      const o = owner(a);
      if (!o || !run.includes(o)) continue;
      const fresh = Date.now() - Date.parse(bn?.at || 0) < 120000 && Number(bn?.[a]?.spot) > 0;
      if (a === "gold" && !(Number(bn?.gold?.sd) > 0 && fresh)) continue; // gold closed / no gold data: nothing to judge
      const mine = (Array.isArray(nb) ? nb : []).filter((r) => r?.book === o && r?.asset === a);
      const recent = mine.filter((r) => now - Date.parse(r.at) < 3600000);
      const span = mine.length ? Math.max(1, (now - Math.min(...mine.map((r) => Date.parse(r.at)))) / 3600000) : 1;
      const perHour = mine.length / span;
      const name = o.toUpperCase();
      if (!recent.length) {
        if (perHour >= 2) {
          alarm(`quiet:${o}:${a}:${h}`, `CHECK: ${name} owns ${a.toUpperCase()} this hour and has not signaled in 60 min (she usually has ~${perHour.toFixed(1)}/hour). Feed ${fresh ? "is live" : "looks STALE"}.`);
          checks.push({ name: `quiet ${a}`, ok: fresh, note: `${name}: no signals in 60 min (usual ~${perHour.toFixed(1)}/h), feed ${fresh ? "live" : "stale"}` });
        }
        continue;
      }
      const onK = recent.filter((r) => ["filled", "partial", "resting"].includes(done?.[r.id]?.status));
      if (onK.length) {
        checks.push({ name: `quiet ${a}`, ok: true, note: `${name}: ${onK.length} of ${recent.length} signals on Kalshi this hour` });
        continue;
      }
      const why: Record<string, number> = {};
      const odd: any[] = [];
      for (const r of recent) {
        const rec = done?.[r.id];
        const age = now - Date.parse(r.at);
        if (!rec) {
          if (age > 120000) odd.push(r);
          continue;
        }
        const reason = String(rec.reason || rec.status || "");
        if (RULE.test(reason)) {
          const k = /headroom|band never/i.test(reason) ? "band" : /paper closed/i.test(reason) ? "paper sold first" : /window ended/i.test(reason) ? "window closed first" : /hour|shift|only/i.test(reason) ? "schedule" : "other rule";
          why[k] = (why[k] || 0) + 1;
        } else odd.push(r);
      }
      // reignite: only rows still inside their window (paper row under 13 min old and still open on paper)
      for (const r of odd) {
        if (now - Date.parse(r.at) > 13 * 60000 || r.result !== "open") continue;
        const rec = done?.[r.id];
        done[r.id] = { ...(rec || {}), at: new Date().toISOString(), ticker: r.ticker, side: r.side, status: "skipped", final: false, reason: `self-check re-opened it (was: ${rec ? String(rec.reason || rec.status) : "never tried"})` };
        reopened++;
      }
      const parts = Object.entries(why).map(([k, n]) => `${k} x${n}`).join(", ");
      if (odd.length) alarm(`odd:${o}:${a}:${h}`, `RED: ${name} had ${recent.length} signals on ${a.toUpperCase()} this hour, none on Kalshi, and ${odd.length} with no rule behind the skip. ${reopened ? `Self-check re-opened ${reopened} still in their window.` : "Their windows had closed."}`);
      checks.push({ name: `quiet ${a}`, ok: !odd.length, note: `${name}: ${recent.length} signals, 0 on Kalshi${parts ? ` (by the rules: ${parts})` : ""}${odd.length ? `, ${odd.length} unexplained` : ""}` });
    }
    if (reopened) {
      writeFileSync(D("live-book-done.json.guard"), JSON.stringify(done));
      renameSync(D("live-book-done.json.guard"), D("live-book-done.json"));
    }
  } catch {
  }
  try {
    writeFileSync(D("selfcheck.json.tmp"), JSON.stringify({ at: new Date().toISOString(), ok: checks.every((c) => c.ok), checks }, null, 1));
    renameSync(D("selfcheck.json.tmp"), D("selfcheck.json"));
  } catch {
  }
}
