# READ-ONLY (Claude, Oct 18 ~8:42 AM PT, Love: "lets see how her hit rate looks sitting out the worst hours... if theres a pattern across the
# last week (when she was working)... consistent across the ledgers that were working"). Every settled trade of her working ledgers
# (ogp5-fast since Oct 15 + ogp5-sess), by Pacific hour of entry: trades, W-L, P&L (paper $20), and how many days that hour was red.
import json, sys, collections, datetime, itertools
D = sys.argv[1]
PT = datetime.timezone(datetime.timedelta(hours=-7))
rows = {}
try:
    for r in json.load(open(f'{D}/grok-og.json')): rows[r['id']] = r
except Exception: pass
for l in open(f'{D}/grok-og-archive.jsonl'):
    try: r = json.loads(l); rows.setdefault(r['id'], r)
    except Exception: pass
R = [r for r in rows.values() if r.get('lane') in ('ogp5-fast', 'ogp5-sess') and r.get('pnl') is not None and r.get('at', '') >= '2026-10-15T07:00' and not r.get('stale')]
def hr(r): return datetime.datetime.fromisoformat(r['at'].replace('Z', '+00:00')).astimezone(PT)
H = collections.defaultdict(list)
for r in R: H[hr(r).hour].append(r)
def st(xs):
    w = sum(1 for x in xs if x['pnl'] > 0.05); l = sum(1 for x in xs if x['pnl'] < -0.05)
    return w, l, sum(x['pnl'] for x in xs)
print(f"TRADES: {len(R)}  ({min(r['at'] for r in R)[:16]} -> {max(r['at'] for r in R)[:16]} UTC)  lanes: ogp5-fast + ogp5-sess, BTC+gold")
w, l, p = st(R); print(f"ALL HOURS: {w}-{l} ({100*w/max(1,w+l):.0f}%)  P&L ${p:+.2f}\n")
print(" hour      n   W-L    win%    P&L     red days / days")
info = {}
for h in range(24):
    xs = H.get(h, [])
    if not xs: continue
    w, l, p = st(xs)
    days = collections.defaultdict(float)
    for x in xs: days[hr(x).date()] += x['pnl']
    red = sum(1 for v in days.values() if v < -0.05)
    info[h] = (len(xs), w, l, p, red, len(days))
    lab = datetime.time(h).strftime('%I %p').lstrip('0')
    print(f" {lab:>6} {len(xs):4d}  {w:3d}-{l:<3d} {100*w/max(1,w+l):4.0f}%  {p:+8.2f}   {red}/{len(days)}")
cons = [h for h, (n, w, l, p, red, nd) in info.items() if p < 0 and nd >= 2 and red / nd >= 0.6 and n >= 5]
print("\nCONSISTENTLY RED (red overall, red on 60%+ of its days, 2+ days, 5+ trades):", [datetime.time(h).strftime('%I %p').lstrip('0') for h in sorted(cons)])
keep = [r for r in R if hr(r).hour not in cons]
w, l, p = st(keep); print(f"SITTING THOSE OUT: {len(keep)} trades  {w}-{l} ({100*w/max(1,w+l):.0f}%)  P&L ${p:+.2f}")
out = [r for r in R if hr(r).hour in cons]
w, l, p = st(out); print(f"   the skipped hours: {len(out)} trades  {w}-{l} ({100*w/max(1,w+l):.0f}%)  P&L ${p:+.2f}")
# robustness: split days in half - do the same hours look red in the first half and the second half?
mid = sorted(set(hr(r).date() for r in R)); half = mid[len(mid)//2]
for name, part in (('first days', [r for r in R if hr(r).date() < half]), ('later days', [r for r in R if hr(r).date() >= half])):
    a = [r for r in part if hr(r).hour in cons]; b = [r for r in part if hr(r).hour not in cons]
    print(f"   check {name}: skipped hours {st(a)[0]}-{st(a)[1]} ${st(a)[2]:+.2f} | kept hours {st(b)[0]}-{st(b)[1]} ${st(b)[2]:+.2f}")
# OUT-OF-SAMPLE (pick on the first days only, test on the later days) + the tight set (red on EVERY day, 3+ days)
def pick(part, minfrac=0.6, mindays=2, minn=3):
    Hh = collections.defaultdict(list)
    for r in part: Hh[hr(r).hour].append(r)
    out = []
    for h, xs in Hh.items():
        days = collections.defaultdict(float)
        for x in xs: days[hr(x).date()] += x['pnl']
        red = sum(1 for v in days.values() if v < -0.05)
        if st(xs)[2] < 0 and len(days) >= mindays and red / len(days) >= minfrac and len(xs) >= minn: out.append(h)
    return sorted(out)
dts = sorted(set(hr(r).date() for r in R)); cut = dts[len(dts)//2]
train = [r for r in R if hr(r).date() < cut]; test = [r for r in R if hr(r).date() >= cut]
hs = pick(train, 0.5, 1, 3)
print(f"\nOUT-OF-SAMPLE: red hours picked from {dts[0]}..{cut} only ->", [datetime.time(h).strftime('%I %p').lstrip('0') for h in hs])
a = [r for r in test if hr(r).hour in hs]; b = [r for r in test if hr(r).hour not in hs]
w,l,p = st(test); print(f"   later days, all hours: {w}-{l} ({100*w/max(1,w+l):.0f}%) ${p:+.2f}")
w,l,p = st(b); print(f"   later days, sitting those out: {w}-{l} ({100*w/max(1,w+l):.0f}%) ${p:+.2f}")
w,l,p = st(a); print(f"   later days, the hours skipped: {w}-{l} ({100*w/max(1,w+l):.0f}%) ${p:+.2f}")
tight = [h for h, (n, w, l, p, red, nd) in info.items() if p < 0 and nd >= 3 and red == nd]
print("\nTIGHT SET (red on every day, 3+ days):", [datetime.time(h).strftime('%I %p').lstrip('0') for h in sorted(tight)])
k = [r for r in R if hr(r).hour not in tight]; w,l,p = st(k); print(f"   sitting out only those: {len(k)} trades {w}-{l} ({100*w/max(1,w+l):.0f}%) ${p:+.2f}")
