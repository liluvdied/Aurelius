#!/usr/bin/env python3
# FIVE-MINUTE LEDGER (Oct 25 ~2:09 AM PT, Love: "let's have those constitute as our 5M books ledger since we haven't really ran much on the previous regime, but let's
# start a fresh record for them pls, clean slate"): the live Polymarket 5m trades of the main book and the rejection model (hedges.json kind "rej5m") on the
# flip + 4 minutes rule at $5, from START. Read-only on the desk; writes only data/five-live/.
import json, os, datetime
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)
os.makedirs(D('five-live'), exist_ok=True)
START = '2026-10-25T09:12:07Z'
NAMES = {'recon-tog-5m': 'MAIN 💞', 'recon-rej-5m': 'REJECTION 🎯'}
ts = lambda s: datetime.datetime.fromisoformat(s.replace('Z', '+00:00')).timestamp()
PT = lambda s: datetime.datetime.fromtimestamp(ts(s), datetime.timezone(datetime.timedelta(hours=-7))).strftime('%a %I:%M %p')
bars = {}
for l in open(D('latency-shadow.jsonl')):
    if '"kind":"close"' not in l or '"asset":"btc"' not in l: continue
    try: r = json.loads(l); b = r.get('tv') or r.get('tick'); bars[int(ts(r['minute']))] = b
    except Exception: pass
led = {}
try:
    for l in open(D('five-live', 'ledger.jsonl')):
        x = json.loads(l); led[(x['book'], x['slug'])] = x
except Exception: pass
for h in json.load(open(D('hedges.json'))):
    if h.get('kind') != 'rej5m' or str(h.get('at', '')) < START or h.get('book') not in NAMES: continue
    x = {k: h.get(k) for k in ('at', 'book', 'slug', 'side', 'cost', 'stake', 'closesAt', 'status', 'banked', 'halfPx', 'soldPx')}
    st = str(h.get('status') or '')
    if h.get('banked') is not None and st == 'banked': x['pnl'] = round(float(h['banked']), 2); x['result'] = 'win' if x['pnl'] > 0 else 'loss'
    else:
        try:
            end = int(ts(h['closesAt'])); o = bars.get(end - 300); c = bars.get(end - 60)
            if end <= datetime.datetime.now().timestamp() and o and c and st != 'open':
                up = float(c['c']) >= float(o['o']); won = up if h['side'] == 'up' else not up
                stake = float(h.get('stake') or 0); cost = float(h.get('cost') or 0)
                x['pnl'] = round(stake / cost - stake, 2) if won and cost > 0 else round(-stake, 2); x['result'] = 'win' if won else 'loss'
            else: x['result'] = 'open'
        except Exception: x['result'] = 'open'
    led[(x['book'], x['slug'])] = x
rows = sorted(led.values(), key=lambda x: x['at'])
with open(D('five-live', 'ledger.jsonl'), 'w') as f:
    for x in rows: f.write(json.dumps(x) + '\n')
L = ['# 5M books ledger ✨ clean slate', '', f'Live Polymarket 5m trades on the flip + 4 minutes rule at $5, since {PT(START)} PT. Updated {datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=-7))).strftime("%a %I:%M %p")} PT.', '',
     '| Book | Trades | Won | Lost | Open | Win rate | P&L |', '|---|---|---|---|---|---|---|']
for b, nm in NAMES.items():
    xs = [x for x in rows if x['book'] == b]; w = sum(x['result'] == 'win' for x in xs); lo = sum(x['result'] == 'loss' for x in xs); op = sum(x['result'] == 'open' for x in xs)
    L.append(f"| {nm} | {len(xs)} | {w} | {lo} | {op} | {(100*w/(w+lo)):.0f}% |".replace('|  |', '| - |') if w + lo else f"| {nm} | {len(xs)} | {w} | {lo} | {op} | - |")
    L[-1] += f" ${sum(x.get('pnl') or 0 for x in xs):+.2f} |"
L += ['', '| When (PT) | Book | Side | Paid | Stake | Result | P&L |', '|---|---|---|---|---|---|---|']
for x in rows: L.append(f"| {PT(x['at'])} | {NAMES[x['book']]} | {x['side']} | {x.get('cost')} | ${x.get('stake')} | {x['result']} | {'' if x.get('pnl') is None else '$%+.2f' % x['pnl']} |")
open(D('five-live', 'REPORT.md'), 'w').write('\n'.join(L) + '\n')
print(f"five-ledger: {len(rows)} trades")
