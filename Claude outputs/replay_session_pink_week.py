# SESSION + PINK FRAMEWORK (Claude, Oct 17 ~8:10 PM PT, Love: "could you do another replay of this weeks trades under this framework?"):
# same replay as below, but judged ONLY by session bands + pink: breaks/rejections this candle, closest band, no band before the
# target, $8 at a session band, $6 at the pink. No red/green zones (no zone rejections, no push rule), no rejection hold.
# READ-ONLY (Claude, Oct 17 ~4:35 PM PT, Love: "can you test all of these new rules against alllll of the trades fast twin has taken this
# week?"). Every BTC trade the fast twin (ogp5-fast) booked since Oct 15, re-judged at its entry minute by her CURRENT gate, rebuilt from
# her Vantage chart's 1m bars: session VWAP +/-1/2/3 sigma (5 PM ET anchor, 5m hlc3, carry-over until the new sigma is half the old),
# the 5m pink + red/green (EMA7 hlc3 + 7-bar range, forming candle in). Rules, first refusal wins:
#   break against her this candle ($8) / rejection this candle (tap $3, $8 away) / 25% rule / band before the target (target = Vantage at the
#   window open) / red/green without a push (2x volume pace or a full-size candle) / at a session band within $8 / within $6 of the pink.
# Not modelled: the session-break-beats-pink hold, carry-over edge cases, live feed checks. P&L = the trade's own paper result ($20).
import json, re, math, sys
from collections import defaultdict
from datetime import datetime, timezone, timedelta
D = sys.argv[1]; CHART = (sys.argv[2] if len(sys.argv) > 2 else 'vantage').lower(); RULE = (sys.argv[3] if len(sys.argv) > 3 else '25')
bars = {}
FILES = {'vantage': (f'{D}/lab/tv-VANTAGE_BTCUSD.json', f'{D}/van-1m.json'), 'pepperstone': (f'{D}/pep-1m.json', f'{D}/lab/tv-PEPPERSTONE_BTCUSD.json')}[CHART]
for f in FILES:
    x = json.load(open(f)); x = x['bars'] if isinstance(x, dict) else x
    for b in x: bars[b['t']] = b
T = sorted(bars); B = [bars[t] for t in T]; I = {t: i for i, t in enumerate(T)}
F5 = {}
for b in B:
    k = b['t'] // 300 * 300; y = F5.get(k)
    if not y: F5[k] = dict(t=k, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b['v'])
    else: y['h'] = max(y['h'], b['h']); y['l'] = min(y['l'], b['l']); y['c'] = b['c']; y['v'] += b['v']
K5 = sorted(F5)
def sess_start(ts):
    d = datetime.fromtimestamp(ts, timezone(timedelta(hours=-4))); s0 = d.replace(hour=17, minute=0, second=0, microsecond=0)
    if d.hour < 17: s0 -= timedelta(days=1)
    return int(s0.timestamp())
def five_upto(ts):
    m = int(ts // 60 * 60); k0 = m // 300 * 300
    out = [F5[k] for k in K5 if k < k0 and k >= k0 - 300 * 400]
    cur = None
    for t in range(k0, m + 60, 60):
        b = bars.get(t)
        if not b: continue
        if not cur: cur = dict(t=k0, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b['v'])
        else: cur['h'] = max(cur['h'], b['h']); cur['l'] = min(cur['l'], b['l']); cur['c'] = b['c']; cur['v'] += b['v']
    if cur: out.append(cur)
    return out
def vwap_sd(F, s0, s1=None):
    S = [x for x in F if x['t'] >= s0 and (s1 is None or x['t'] < s1)]; V = sum(x['v'] for x in S)
    if len(S) < 8 or V <= 0: return None
    vw = sum((x['h'] + x['l'] + x['c']) / 3 * x['v'] for x in S) / V
    sd = math.sqrt(max(0, sum(x['v'] * ((x['h'] + x['l'] + x['c']) / 3) ** 2 for x in S) / V - vw * vw))
    return vw, sd
def view(ts, tick):
    m = int(ts // 60 * 60)
    if m not in bars: return None
    F = five_upto(ts)
    if len(F) < 80: return None
    s0 = sess_start(ts)
    cur = vwap_sd(F, s0); prev = vwap_sd(F, sess_start(s0 - 60), s0)
    if prev and (not cur or cur[1] < 0.5 * prev[1]): cur = prev
    if not cur: return None
    vw, sd = cur
    L = [('session VWAP', vw)] + [(f'{k:+d}σ', vw + k * sd) for k in (-3, -2, -1, 1, 2, 3)]
    ema = None
    for x in F[-60:]:
        pp = (x['h'] + x['l'] + x['c']) / 3; ema = pp if ema is None else pp * 0.25 + ema * 0.75
    a = sum(x['h'] - x['l'] for x in F[-7:]) / 7
    Z = dict(pp=ema, r1=ema + a, r2=ema + 2 * a, s1=ema - a, s2=ema - 2 * a)
    c = F[-1]; frac = min(1, (ts - c['t']) / 300); avgv = sum(x['v'] for x in F[-21:-1]) / 20
    ws = int(ts // 900 * 900); target = bars[ws]['o'] if ws in bars else None
    return dict(L=L, pink=ema, Z=Z, o=c['o'], h=max(c['h'], tick), l=min(c['l'], tick), pace=(c['v'] / max(frac, 0.2)) / avgv if avgv > 0 and frac >= 0.2 else 0, avgR=a, target=target)
def judge(v, tick, side):
    W = v['L'] + [('pink', v['pink'])]
    o, hi, lo = v['o'], v['h'], v['l']
    for n, p in W:
        if side == 'down' and o < p and (tick > p or hi >= p + 8): return 'break against her this candle'
        if side == 'up' and o > p and (tick < p or lo <= p - 8): return 'break against her this candle'
    REJ = W
    for n, p in REJ:
        if side == 'down' and lo <= p + 3 and lo > p - 8 and tick >= p + 8: return 'rejection this candle'
        if side == 'up' and hi >= p - 3 and hi < p + 8 and tick <= p - 8: return 'rejection this candle'
    above = min([p for _, p in W if p > tick], default=None); below = max([p for _, p in W if p < tick], default=None)
    if RULE == 'cb' and above and below:
        if side == 'up' and above - tick < tick - below: return 'closest band'
        if side == 'down' and tick - below < above - tick: return 'closest band'
    if RULE != 'cb' and above and below:
        g = above - below
        if side == 'up' and above - tick < 0.25 * g: return '25% rule'
        if side == 'down' and tick - below < 0.25 * g: return '25% rule'
    t = v['target']
    if t and not (side == 'up' and tick >= t) and not (side == 'down' and tick <= t):
        lo2, hi2 = min(tick, t), max(tick, t)
        if any(lo2 < p < hi2 for _, p in W): return 'band before the target'
    n, p = min(W, key=lambda x: abs(x[1] - tick))
    if n != 'pink' and abs(p - tick) < 8: return 'at a session band ($8 wait)'
    if n == 'pink' and abs(p - tick) < 6: return 'within $6 of the pink'
    return ''
rows = {}
s = open(f'{D}/grok-og.json').read()
for m in re.finditer(r'\{"id":"KX', s):
    j = s.find('},{"id"', m.start())
    try: r = json.loads(s[m.start():(j + 1) if j > 0 else None]); rows[r['id']] = r
    except Exception: pass
for l in open(f'{D}/grok-og-archive.jsonl'):
    try: r = json.loads(l); rows.setdefault(r['id'], r)
    except Exception: pass
R = sorted([r for r in rows.values() if r.get('lane') in ('ogp5-fast', 'ogp5-sess') and r.get('asset') == 'btc' and r.get('pnl') is not None], key=lambda r: r['at'])
kept = []; blocked = defaultdict(list); skipped = 0
for r in R:
    ts = datetime.fromisoformat(r['at'].replace('Z', '+00:00')).timestamp()
    tick = ((r.get('band') or {}).get('spot') if CHART == 'vantage' else None) or (bars.get(int(ts // 60 * 60)) or {}).get('c')  # other charts: that chart's own price
    v = view(ts, tick) if tick else None
    if not v: skipped += 1; continue
    why = judge(v, tick, r['side'])
    (blocked[why] if why else kept).append(r)
def st(xs):
    w = sum(1 for x in xs if x['pnl'] > 0.05); l = sum(1 for x in xs if x['pnl'] < -0.05)
    return f"{len(xs):3d} trades  {w:3d}-{l:<3d} ({100 * w / max(1, w + l):.0f}%)  P&L ${sum(x['pnl'] for x in xs):+9.2f}"
allr = kept + [x for v in blocked.values() for x in v]
print('SESSION + PINK FRAMEWORK | CHART:', CHART.upper(), '| middle rule:', 'CLOSEST BAND' if RULE == 'cb' else '25%'); print('ALL BTC TRADES (as taken):', st(allr), f'| skipped (no chart data) {skipped}')
print("KEPT by today's rules:    ", st(kept))
print("BLOCKED by today's rules: ", st([x for v in blocked.values() for x in v]))
print('--- blocked, by the rule that stopped it (first refusal):')
for k, v in sorted(blocked.items(), key=lambda x: sum(y['pnl'] for y in x[1])):
    print(f'  {k:30s}', st(v))
