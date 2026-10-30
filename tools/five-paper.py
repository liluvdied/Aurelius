#!/usr/bin/env python3
# FIVE-MINUTE PAPER BOOKS (Oct 25 ~12:18 AM PT, Love: "start new paper books on the main book, the rejection model and the delayed entry model
# specifically on the 5M market. i want to see how it performs in comparison" + "try running [the delayed entry model] overnight on paper").
# Read-only: every BTC call the three books make (data/grok-og.json lanes recon-tog / recon-rej / recon-dly) is replayed on the Poly-style 5m market
# the desk would take (the 5m window holding the call; under 60 s left = the next one): right if BTC closes that 5m window on her side of its open.
# Prices from data/latency-shadow.jsonl 1m closes. Same calls judged on their own 15m Kalshi result for comparison. Writes only data/five/.
import json, os, datetime, collections
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)
os.makedirs(D('five'), exist_ok=True)
BOOKS = {'recon-tog': 'MAIN 💞', 'recon-rej': 'REJECTION 🎯', 'recon-dly': 'DELAYED ⏳'}
ts = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
bars = {}
with open(D('latency-shadow.jsonl')) as f:
    for l in f:
        if '"kind":"close"' not in l or '"asset":"btc"' not in l: continue
        try: r = json.loads(l); bars[int(ts(r['minute']))] = r.get('tv') or r.get('tick')
        except Exception: pass
def px_open(t):  # open of the 1m bar starting at t
    b = bars.get(t); return float(b['o']) if b else None
def px_close(t):  # close of the 1m bar ending at t
    b = bars.get(t - 60); return float(b['c']) if b else None
rows = json.load(open(D('grok-og.json')))
out = []; seen = set()
# keep history: grok-og.json only holds the latest few thousand rows, so earlier replays carry forward from calls.jsonl
old = {}
try:
    for l in open(D('five', 'calls.jsonl')):
        x = json.loads(l); old[(x['book'], x['at'])] = x
except Exception: pass
for r in rows:
    bk = r.get('lane') or r.get('book')
    if bk not in BOOKS or r.get('asset') != 'btc' or r.get('side') not in ('up', 'down') or not r.get('at'): continue
    key = (bk, r.get('ticker'))
    if key in seen: continue
    seen.add(key)
    t = ts(r['at']); s5 = int(t // 300) * 300
    if s5 + 300 - t < 60: s5 += 300
    o, c = px_open(s5), px_close(s5 + 300)
    if o is None or c is None:
        if s5 + 300 > datetime.datetime.now().timestamp(): continue  # still running
        continue
    up = c >= o
    win5 = up if r['side'] == 'up' else not up
    res15 = r.get('result'); win15 = None if res15 in (None, 'open') else (res15 in ('win', 'won') or (r.get('pnl') or 0) > 0)
    hr = int(datetime.datetime.fromtimestamp(t, datetime.timezone(datetime.timedelta(hours=-7))).strftime('%H'))
    out.append({'at': r['at'], 'book': bk, 'side': r['side'], 'label': r.get('label'), 'win5': win5, 'win15': win15, 'o5': o, 'c5': c, 'hourPT': hr, 'ask15': r.get('ask')})
for x in out: old[(x['book'], x['at'])] = x
out = sorted(old.values(), key=lambda x: x['at'])
with open(D('five', 'calls.jsonl'), 'w') as f:
    for x in out: f.write(json.dumps(x) + '\n')
def summ(xs):
    n = len(xs); w5 = sum(x['win5'] for x in xs); s15 = [x for x in xs if x['win15'] is not None]; w15 = sum(1 for x in s15 if x['win15'])
    return n, w5, len(s15), w15
lines = ['# 5m paper books - main, rejection, delayed (BTC)', '', f"Updated {datetime.datetime.now(datetime.timezone.utc).isoformat()[:16]}Z. Every BTC call each book made, replayed on the 5m market the desk would take (right = BTC closes that 5m window on her side of its open), next to the same call's own 15m result. P&L at a flat 50c entry (Poly 5m usually opens near even): +$1 per $1 when right, -$1 when wrong.", '']
lines += ['| book | calls | 5m right | 5m % | 5m P&L per $1 | 15m settled | 15m right | 15m % |', '|---|---|---|---|---|---|---|---|']
for bk, nm in BOOKS.items():
    xs = [x for x in out if x['book'] == bk]
    n, w5, n15, w15 = summ(xs)
    if not n: lines.append(f'| {nm} | 0 | | | | | | |'); continue
    lines.append(f"| {nm} | {n} | {w5} | {100*w5/n:.0f}% | {w5-(n-w5):+d} | {n15} | {w15} | {(100*w15/n15 if n15 else 0):.0f}% |")
lines += ['', '## Overnight (12 AM - 9 AM PT)', '', '| book | calls | 5m % | 15m % |', '|---|---|---|---|']
for bk, nm in BOOKS.items():
    xs = [x for x in out if x['book'] == bk and x['hourPT'] < 9]
    n, w5, n15, w15 = summ(xs)
    lines.append(f"| {nm} | {n} | {(100*w5/n if n else 0):.0f}% | {(100*w15/n15 if n15 else 0):.0f}% |")
lines += ['', '## By PT hour (5m right % · calls)', '', '| hour | ' + ' | '.join(BOOKS.values()) + ' |', '|---|---|---|---|']
for h in range(24):
    cells = []
    for bk in BOOKS:
        xs = [x for x in out if x['book'] == bk and x['hourPT'] == h]
        cells.append(f"{100*sum(x['win5'] for x in xs)/len(xs):.0f}% · {len(xs)}" if xs else '-')
    lab = f"{h % 12 or 12}:00 {'AM' if h < 12 else 'PM'}"
    lines.append(f'| {lab} | ' + ' | '.join(cells) + ' |')
open(D('five', 'REPORT.md'), 'w').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:12]))
