# READ-ONLY study (Claude, Oct 16 ~11:00 PM PT, Love: "look back ... where volume was when price pushed past the red/green and where
# volume was when it wasn't"). Pepperstone 1m bars -> 5m CM Pivot Bands (forming candle included), every minute: is price going
# INTO the red (long) / green (short)? Outcome = Kalshi-style: price at the end of the 15m window vs the entry price.
import json, sys, collections
segs = [json.load(open(sys.argv[1])), json.load(open(sys.argv[2]))['bars']]
ev = []
for seg in segs:
    seg = sorted(seg, key=lambda x: x['t'])
    byT = {b['t']: b for b in seg}
    five = []  # completed 5m bars
    cur = None
    for b in seg:
        k = b['t'] // 300 * 300
        if cur and cur['t'] != k: five.append(cur); cur = None
        if not cur: cur = dict(t=k, o=b['o'], h=b['h'], l=b['l'], c=b['c'], v=b['v'])
        else: cur['h'] = max(cur['h'], b['h']); cur['l'] = min(cur['l'], b['l']); cur['c'] = b['c']; cur['v'] += b['v']
        bars = five[-60:] + [cur]
        if len(five) < 25: continue
        ema = 0
        for i, x in enumerate(bars):
            pp = (x['h'] + x['l'] + x['c']) / 3; ema = pp if i == 0 else pp * 0.25 + ema * 0.75
        a = sum(x['h'] - x['l'] for x in bars[-7:]) / 7
        Z = dict(pp=ema, r1=ema + a, r2=ema + 2 * a, s1=ema - a, s2=ema - 2 * a)
        tick = b['c']; tnow = b['t'] + 60
        frac = (tnow - k) / 300
        if frac < 0.2: continue
        avg = sum(x['v'] for x in five[-20:]) / 20
        pace = (cur['v'] / frac) / avg if avg > 0 else 0
        lines = list(Z.values())
        near = min(lines, key=lambda p: abs(p - tick))
        side = None
        if Z['r1'] <= tick <= Z['r2'] or (tick < Z['r1'] and near == Z['r1']): side = 'up'
        if Z['s2'] <= tick <= Z['s1'] or (tick > Z['s1'] and near == Z['s1']): side = 'down' if side is None else None
        if not side: continue
        wend = (tnow // 900 + (1 if tnow % 900 else 0)) * 900
        endb = byT.get(wend - 60)
        if not endb or wend - tnow < 120: continue
        win = endb['c'] > tick if side == 'up' else endb['c'] < tick
        ev.append(dict(w=wend, side=side, pace=pace, win=win, move=(endb['c'] - tick) * (1 if side == 'up' else -1)))
first = {}
for e in ev: first.setdefault((e['w'], e['side']), e)
def table(xs, lab):
    print(lab, len(xs))
    for lo, hi in [(0, 1), (1, 1.5), (1.5, 2), (2, 2.5), (2.5, 3), (3, 99)]:
        g = [e for e in xs if lo <= e['pace'] < hi]
        if g: print(f'   volume {lo}-{hi}x avg: {len(g):4} entries, {100*sum(e["win"] for e in g)/len(g):3.0f}% pushed through (window ended past entry), avg move {sum(e["move"] for e in g)/len(g):+.1f}')
table(list(first.values()), 'FIRST entry into a red/green zone per 15m window:')
table(ev, 'EVERY minute into a zone:')
