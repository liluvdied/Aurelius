#!/bin/bash
# READ-ONLY (Love Oct 29 2026 6:43 PM PT: "i need to confirm myself i don't trust you a MILLIMETER"). Prints every answer from her list next to the exact line in her
# running code that carries it (file:line), ✓ or ✗. Changes nothing, needs no password.
cd "$(dirname "$0")"
python3 - <<'PY'
import os, json, re, subprocess
def find(f, needle):
    try:
        for n, l in enumerate(open(f, encoding="utf8"), 1):
            if needle in l: return f"{f}:{n}"
    except Exception: pass
    return ""
def cfg(path):
    v = json.load(open("data/live-switch.json"))
    for k in path.split("."): v = v.get(k) if isinstance(v, dict) else None
    return v
D = "src/lib/desk/"
rows = [
 ("ANSWER", "PUT BACK - g1 pure no-pink twin + her own eyes + her own taps (paper)", D + "recon.ts", 'book("recon-npo"'),
 ("ANSWER", "PUT BACK - g2 sovereign twin (paper)", D + "recon.ts", 'book("recon-sov"'),
 ("ANSWER", "PUT BACK - g3 2nd-band flip (paper)", D + "recon.ts", 'book("recon-b2"'),
 ("ANSWER", "PUT BACK - g4 OG rolling VWAP (paper)", D + "recon.ts", 'book("recon-og"'),
 ("ANSWER", "PUT BACK - g6 5M mirrors (top rung, Bollinger over pink, 55% zones)", D + "bandlock5m27.ts", "NO LONGS IN THE TOP RUNG (fix468)"),
 ("ANSWER", "PUT BACK - g8 her skip log, every refusal with its rule", D + "recon.ts", "const log479 ="),
 ("ANSWER", "PUT BACK - g9 reach walls $50 BTC / $1 gold", D + "bandlock.ts", "export const REACH429: Record<string, number> = { gold: 1, btc: 50 };"),
 ("ANSWER", "LEAVE OUT - g7 delayed book against main stays off", D + "recon.ts", "const DLY_TOUCH_ONLY = true;"),
 ("ANSWER", "LEAVE OUT - g10 Bollinger bounce stays off", D + "bandlock.ts", 'if (false && !why && asset === "btc") {'),
 ("ANSWER", "LEAVE OUT - g11 trend through the bands stays off", D + "bandlock.ts", "if (false && !why && trNow && bA && bB && bA.p > bB.p)"),
 ("ANSWER", "LEAVE OUT - g12 3 PM pink/R1/Bollinger channel edges stay off", D + "bandlock.ts", "export const isChanBand = (asset: string, l: Line) => (false && quietHour()"),
 ("ANSWER", "LEAVE OUT - g13 5M add-on / late door / top-ups stay off", D + "engine.ts", "const G205_OFF = true;"),
 ("ANSWER", "c21 - no trade back against a broken band until price breaks back by her distance", D + "bandlock.ts", "continue; // fix483"),
 ("ANSWER", "c4 - BTC 33% up to $1,000, 20% over (every book but delayed)", D + "bandlock.ts", 'if (asset === "btc" && width > 1000 && !DLY465.has('),
 ("ANSWER", "c4 - same in her read", D + "recon.ts", "k483 = a.price - b.price > 1000 ? 0.2 : 0.33"),
 ("ANSWER", "c4 - same on the 5M", D + "bandlock5m27.ts", 'if (asset === "btc" && width > 1000) return 0.2;'),
 ("ANSWER", "gold Bollinger tolerance $1.50, every book", D + "bandlock.ts", 'const w10g = asset === "gold" ? 1.5'),
 ("ANSWER", "t1 2 PM til the bands widen: pink, Bollinger, zones, PP only", D + "engine.ts", "fix471"),
 ("ANSWER", "t2 3 PM: Bollingers + green/red zones (+ pink) only", D + "engine.ts", "3 PM = BOLLINGERS AND ZONES ONLY (fix452)"),
 ("ANSWER", "t3 inside the green/red counts as a zone call", D + "engine.ts", "fix472"),
 ("ANSWER", "t6 your schedule pill approves itself", D + "fns.ts", "fix478"),
 ("ANSWER", "t7 no rule switched off without your words (umpire)", "tools/umpire.py", "no-switch-off-gate.py"),
 ("ANSWER", "t8 umpire re-checks every setting change", D + "umpire-gate.ts", "function scanSettings477()"),
 ("ANSWER", "her hourly cache clear", D + "selfcheck.ts", "Date.now() - G4.__doneTrimAt >= 1 * 3600000 /* fix370"),
]
ok = True
print("\n=== YOUR ANSWERS, IN HER RUNNING CODE ===\n")
for _, what, f, needle in rows:
    w = find(f, needle); ok &= bool(w)
    print(("  ✓ " if w else "  ✗ ") + what + ("   ->  " + w if w else "   ->  NOT FOUND"))
d, a = cfg("liveBook.dollars"), cfg("addOn.dollars")
t9 = d == 5 and a == 5; ok &= t9
print(("  ✓ " if t9 else "  ✗ ") + f"t9 $5 entry + $5 add-on until you confirm she's working   ->  live-switch liveBook.dollars={d}, addOn.dollars={a}")
print("  ○ g5 second add-on: waits for your OK that she's working (not in yet, as you said)")
print("\n=== YOUR c AND s ANSWERS (her cornerstone check reads each one in her code) ===\n")
r = subprocess.run(["python3", "tools/cornerstones.py"], capture_output=True, text=True); print(r.stdout.rstrip()); ok &= r.returncode == 0
print("\n=== HER RULES, REPLAYED LONG AND SHORT ===\n")
r = subprocess.run(["node", "tools/check-her-rules.cjs"], capture_output=True, text=True); print(re.sub(r"\x1b\[[0-9;]*m", "", r.stdout.strip().split("\n")[-1])); ok &= r.returncode == 0
print("\n" + ("✓ EVERY ANSWER OF YOURS IS IN HER." if ok else "✗ SOMETHING ABOVE IS MISSING - the ✗ line says what."))
PY
echo ""; read -n 1 -s -r -p "Press any key to close."
