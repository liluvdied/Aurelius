# READ-ONLY feed lab (Claude, Oct 16 ~11:45 PM PT, Love: "find us another btc chart to use that respects the bands as muchhhh as
# possible? pepperstones candles flip wayyyy to often"). Every candidate chart's own 1m bars (data/lab/tv-*.json) -> its own 5m
# candles, session VWAP + sigma bands (5 PM ET anchor like the desk; 00:00 UTC shown too) and the pink (CM pivot, EMA7 hlc3).
#  FAKE BREAKS: of the 5m closes through a band, how many closed straight back the next candle (the violent flip-flop)
#  RESPECT: of the 5m candles that touched a band from one side, how many closed back on that side (rejection held)
#  KALSHI: over the settled 15-minute windows, how often the chart moved the same way Kalshi settled (from feedmatch.json)
import json, glob, os, sys, math
from datetime import datetime, timezone, timedelta
D = sys.argv[1]
kal = json.load(open(f'{D}/feedmatch.json'))['markets']['btc']
def sess(ts, mode):
    if mode == 'utc': return ts // 86400 * 86400
    d = datetime.fromtimestamp(ts, timezone(timedelta(hours=-4))); s = d.replace(hour=17, minute=0, second=0, microsecond=0)
    if d.hour < 17: s -= timedelta(days=1)
    return int(s.timestamp())
def lab(path, mode):
    B = sorted(json.load(open(path)), key=lambda b: b['t'])
    if len(B) < 1500: return None
    F = {}
    for b in B:
        k = b['t'] // 300 * 300; y = F.get(k)
        if not y: F[k] = dict(t=k, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b.get('v', 0) or 0)
        else: y['h'] = max(y['h'], b['h']); y['l'] = min(y['l'], b['l']); y['c'] = b['c']; y['v'] += b.get('v', 0) or 0
    F = [F[k] for k in sorted(F)]
    novol = sum(x['v'] for x in F) == 0
    lines_at = []  # per 5m bar: lines as known BEFORE that bar (previous bars only)
    S0 = None; cv = cv2 = cvv = 0; ema = None; rng = []
    for i, x in enumerate(F):
        s0 = sess(x['t'], mode)
        if s0 != S0: S0 = s0; cv = cv2 = cvv = 0
        L = {}
        if cvv > 0:
            vw = cv / cvv; sd = math.sqrt(max(0, cv2 / cvv - vw * vw))
            if sd > 0: L.update({'VWAP': vw, '+1σ': vw + sd, '-1σ': vw - sd, '+2σ': vw + 2 * sd, '-2σ': vw - 2 * sd})
        if ema is not None and len(rng) >= 7: L['pink'] = ema
        lines_at.append((L, (cv2 / cvv - (cv / cvv) ** 2) ** 0.5 if cvv > 0 and cv2 / cvv - (cv / cvv) ** 2 > 0 else None))
        tp = (x['h'] + x['l'] + x['c']) / 3; w = x['v'] if not novol else 1
        cv += tp * w; cv2 += tp * tp * w; cvv += w
        ema = tp if ema is None else tp * 0.25 + ema * 0.75; rng.append(x['h'] - x['l'])
    cross = fake = touch = held = clean = 0
    for i in range(1, len(F) - 1):
        L, sd = lines_at[i]; p, x, n = F[i - 1], F[i], F[i + 1]
        for name, lv in L.items():
            if (p['c'] - lv) * (x['c'] - lv) < 0:
                cross += 1
                if (x['c'] - lv) * (n['c'] - lv) < 0: fake += 1
            above = p['c'] > lv
            if (above and x['l'] <= lv) or (not above and x['h'] >= lv):   # candle reached the band from one side
                touch += 1
                if (x['c'] - lv) * (p['c'] - lv) > 0:                       # ...and closed back on that side = rejection held
                    held += 1
                    # clean rejection: the next candle keeps going away from the band (doesn't close through it)
                    if (n['c'] - lv) * (p['c'] - lv) > 0: clean += 1
    days = (F[-1]['t'] - F[0]['t']) / 86400
    # Kalshi: same direction over each settled window
    byT = {b['t']: b for b in B}; agree = n_k = 0; gaps = []
    for m in kal:
        t0 = int(datetime.fromisoformat(m['open'].replace('Z', '+00:00')).timestamp()); t1 = t0 + 900
        a, z = byT.get(t0), byT.get(t1 - 60)
        if not a or not z: continue
        n_k += 1; agree += ((z['c'] > a['o']) == (m['result'] == 'yes')); gaps.append(a['o'] - float(m['strike']))
    gaps.sort()
    return dict(days=round(days, 1), bars=len(B), novol=novol, crossesPerDay=round(cross / days, 1), fakePct=round(100 * fake / cross, 1) if cross else None,
                touches=touch, respectPct=round(100 * held / touch, 1) if touch else None, cleanPct=round(100 * clean / touch, 1) if touch else None,
                kalshiWindows=n_k, kalshiSamePct=round(100 * agree / n_k, 1) if n_k else None, medGapToStrike=round(gaps[len(gaps) // 2], 1) if gaps else None,
                last=datetime.fromtimestamp(B[-1]['t'], timezone(timedelta(hours=-7))).strftime('%m-%d %I:%M %p'))
rows = []
for path in sorted(glob.glob(f'{D}/lab/tv-*BTC*.json')):
    sym = os.path.basename(path)[3:-5]
    try:
        r5, ru = lab(path, 'et'), lab(path, 'utc')
    except Exception as e:
        print(sym, 'error', e); continue
    if not r5: print(f'{sym:22} no / too few bars'); continue
    rows.append((sym, r5, ru))
rows.sort(key=lambda r: (r[1]['fakePct'] or 99))
print(f"{'chart':22} {'flip-backs':>10} {'(UTC)':>6} {'band held':>9} {'(UTC)':>6} {'held+next':>9} {'Kalshi same':>11} {'vs strike':>9}  last bar")
for sym, a, u in rows:
    print(f"{sym:22} {str(a['fakePct'])+'%':>10} {str(u['fakePct'])+'%':>6} {str(a['respectPct'])+'%':>9} {str(u['respectPct'])+'%':>6} {str(a['cleanPct'])+'%':>9} {str(a['kalshiSamePct'])+'%':>11} {a['medGapToStrike']:>+9}  {a['last']}{'  (no volume)' if a['novol'] else ''}")
