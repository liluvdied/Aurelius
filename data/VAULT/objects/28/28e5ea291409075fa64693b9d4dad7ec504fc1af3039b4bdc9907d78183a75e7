#!/usr/bin/env python3
# 5m RE-AIM PAPER TWIN (read-only; Love Oct 25 ~6:00 PM PT: "yes let's keep her as is, let's run a paper twin that can re aim ok"). The live 5m book holds one call per
# 5m slot. This paper twin follows the rejection model's BTC read as it turns inside the slot (data/rej-reads.jsonl, logged by the desk since fix223): until she is in,
# each new read replaces the old one. Entry = the first finished 1m candle after the current read that closed her way with 3+ minutes left in the 5m window, her side's
# ask (data/poly5-quotes.jsonl) 30-68c. Once in, the window is locked. $5 paper at the ask, settled on the 5m window (BTC close vs open). Lane "first" replays the same
# door on the slot's FIRST read only (no re-aim) so the two compare like for like. Writes only data/five-reaim/.
import json, os, datetime, bisect, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); D = lambda *p: os.path.join(ROOT, 'data', *p)
ts = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
STAKE = 5.0
bars = {}
for l in open(D('latency-shadow.jsonl')):
    if '"kind":"close"' not in l or '"asset":"btc"' not in l: continue
    try: r = json.loads(l); b = r.get('tv') or r.get('tick'); bars[int(ts(r['minute']))] = {k: float(b[k]) for k in 'ohlc'}
    except Exception: pass
Q = {}
for l in open(D('poly5-quotes.jsonl')):
    try: q = json.loads(l)
    except Exception: continue
    t0 = q.get('t'); t0 = t0 / 1000 if t0 > 1e11 else t0
    Q.setdefault(q.get('closes'), []).append((t0, q.get('bid'), q.get('ask')))
for k in Q: Q[k].sort()
def ask_at(side, te, s5):
    L = Q.get(datetime.datetime.fromtimestamp(s5 + 300, datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'))
    if not L: return None
    i = bisect.bisect_left(L, (te,)); c = [x for x in L[max(0, i - 1):i + 3] if abs(x[0] - te) <= 8 and x[1] is not None and x[2] is not None]
    if not c: return None
    _, b, a = min(c, key=lambda x: abs(x[0] - te)); return a if side == 'up' else round(1 - b, 3)
reads = collections.defaultdict(list)
try:
    for l in open(D('rej-reads.jsonl')):
        try: x = json.loads(l); reads[int(x['s5']) * 300].append((ts(x['at']), x['side'], x.get('label', '')))
        except Exception: pass
except FileNotFoundError: pass
now = datetime.datetime.now(datetime.timezone.utc).timestamp()
def play(s5, seq):
    # seq: [(t, side, label)] in time order; returns the trade or None
    for i, (t, sd, lb) in enumerate(seq):
        until = seq[i + 1][0] if i + 1 < len(seq) else s5 + 300
        m = int(t // 60) * 60 + 60
        while m + 60 <= min(until, s5 + 300) + 60:
            te = m + 60; b = bars.get(m)
            if te > until or te > s5 + 120: break
            if b and (b['c'] > b['o'] if sd == 'up' else b['c'] < b['o']):
                a = ask_at(sd, te, s5)
                if a and 0.30 <= a <= 0.68:
                    o = bars.get(s5); cl = bars.get(s5 + 240)
                    if o and cl and s5 + 300 <= now: won = (cl['c'] >= o['o']) == (sd == 'up'); res = 'win' if won else 'loss'; pnl = round(STAKE * (1 / a - 1), 2) if won else -STAKE
                    else: res, pnl = 'open', 0.0
                    return {'at': datetime.datetime.fromtimestamp(te, datetime.timezone.utc).isoformat(), 'slot': datetime.datetime.fromtimestamp(s5, datetime.timezone.utc).isoformat(), 'side': sd, 'setup': lb, 'ask': a, 'left': int(s5 + 300 - te), 'reaims': i, 'result': res, 'pnl': pnl}
            m += 60
    return None
rows = []
for s5 in sorted(reads):
    seq = sorted(reads[s5])
    for lane, sq in (('re-aim', seq), ('first', seq[:1])):
        t = play(s5, sq)
        if t: t['lane'] = lane; rows.append(t)
os.makedirs(D('five-reaim'), exist_ok=True)
json.dump(rows, open(D('five-reaim', 'rows.json'), 'w'), indent=1)
L = ['# 5m re-aim paper twin vs first-read-only', '', f"Slots with reads: {len(reads)} · updated {datetime.datetime.now().strftime('%b %d %I:%M %p')}", '', '| Lane | Trades | Wins | Win rate | P&L ($5) | Trades after a re-aim |', '|---|---|---|---|---|---|']
for lane in ('re-aim', 'first'):
    xs = [r for r in rows if r['lane'] == lane and r['result'] != 'open']; w = sum(r['result'] == 'win' for r in xs)
    L.append(f"| {lane} | {len(xs)} | {w} | {round(100 * w / len(xs)) if xs else 0}% | {sum(r['pnl'] for r in xs):+.2f} | {sum(1 for r in xs if r['reaims'] > 0)} |")
L += ['', '| Slot | Lane | Side | Ask | Left | Re-aims | Result | P&L |', '|---|---|---|---|---|---|---|---|']
for r in rows[-40:]: L.append(f"| {r['slot'][11:16]}Z | {r['lane']} | {r['side']} | {r['ask']} | {r['left']}s | {r['reaims']} | {r['result']} | {r['pnl']:+.2f} |")
open(D('five-reaim', 'REPORT.md'), 'w').write('\n'.join(L) + '\n')
print('\n'.join(L[:8]))
