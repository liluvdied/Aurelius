#!/usr/bin/env python3
# DAY METER (Oct 26 ~8:31 PM PT, Love: "do you think we can try to develop an automatic switch over down the line hun? something that could best
# detect which book should be running that hour" + "yesss let's get some data on that over the week"). READ-ONLY shadow study, no desk change:
# main (recon-tog) and rejection (recon-rej) ride the move, the DELAYED twin (recon-dly) fades it. Each PT hour the meter looks at the last
# 3 hours of paper results: if the twin out-earned the move-riders it calls a "fade day" hour, else a "ride day" hour. Paper-follows three plans
# hour by hour, every call scaled to $20: FIXED = today's schedule owner, METER = the meter's pick, BEST = hindsight ceiling. Writes only data/day-meter/.
import json, os, datetime, collections
from zoneinfo import ZoneInfo
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
D = lambda *p: os.path.join(ROOT, 'data', *p)
os.makedirs(D('day-meter'), exist_ok=True)
PT = ZoneInfo('America/Los_Angeles'); LOOK = 3
BOOK = {'recon-tog': 'main', 'recon-rej': 'rej', 'recon-dly': 'twin'}
rows = {}
def take(r):
    if r.get('lane') in BOOK and r.get('result') in ('win', 'loss', 'sold') and isinstance(r.get('pnl'), (int, float)) and r.get('id'): rows[r['id']] = r
for r in json.load(open(D('grok-og.json'))): take(r)
try:
    with open(D('grok-og-archive.jsonl')) as f:
        for l in f:
            if '"recon-' not in l: continue
            try: take(json.loads(l))
            except Exception: pass
except Exception: pass
# pnl[(day, hour, asset)][book] = $ at $20 a call
pnl = collections.defaultdict(lambda: collections.defaultdict(float)); seen = set()
for r in rows.values():
    t = datetime.datetime.fromisoformat(r['at'].replace('Z', '+00:00')).astimezone(PT)
    st = float(r.get('stake') or 20) or 20
    k = (t.strftime('%Y-%m-%d'), t.hour, r.get('asset', '?')); pnl[k][BOOK[r['lane']]] += r['pnl'] * 20 / st; seen.add(k[0])
sw = json.load(open(D('live-switch.json')))
def owner(a, h):
    dly = (sw.get('bookSkipHoursByAsset', {}).get(a, {}) or {}).get('recon-dly', sw.get('bookSkipHours', {}).get('recon-dly', []))
    if h not in dly: return 'twin'
    if h in (sw.get('offHourMain', {}).get('rejHoursByAsset', {}).get(a) or []): return 'rej'
    return 'main'
days = sorted(seen); out = []; tot = collections.defaultdict(float); byday = {}
for day in days:
    for a in ('btc', 'gold'):
        for h in range(24):
            cur = pnl.get((day, h, a))
            if not cur: continue
            back = [pnl.get((day, x, a), {}) for x in range(max(0, h - LOOK), h)]
            ride = sum((b.get('main', 0) + b.get('rej', 0)) / 2 for b in back); fade = sum(b.get('twin', 0) for b in back)
            fx = owner(a, h); call = 'fade' if back and fade > ride else 'ride'
            mt = 'twin' if call == 'fade' else (fx if fx != 'twin' else 'main')
            best = max(('main', 'rej', 'twin'), key=lambda b: cur.get(b, 0))
            row = {'day': day, 'hour': h, 'asset': a, 'meter': call, 'fixed': fx, 'pick': mt, 'fixedPnl': round(cur.get(fx, 0), 2), 'meterPnl': round(cur.get(mt, 0), 2), 'bestPnl': round(cur.get(best, 0), 2), 'books': {b: round(v, 2) for b, v in cur.items()}}
            out.append(row)
            d = byday.setdefault(day, collections.defaultdict(float))
            for k in ('fixedPnl', 'meterPnl', 'bestPnl'): d[k] += row[k]; tot[k] += row[k]
            for b, v in cur.items(): d[b] += v
with open(D('day-meter', 'hours.jsonl'), 'w') as f:
    for r in out: f.write(json.dumps(r) + '\n')
m = lambda v: ('+' if v >= 0 else '−') + '$' + f'{abs(v):,.0f}'
L = ['# Day meter: which book fits the day?', '', f'Read-only shadow study, every call at $20, from {days[0] if days else "-"} to {days[-1] if days else "-"} (PT). Meter = last {LOOK} hours: twin ahead of main/rejection → "fade" hour (twin), else "ride" hour (schedule\'s main/rejection). FIXED uses today\'s schedule for every day.', '',
     '| Day | Main | Rejection | Twin | Day type | FIXED | METER | BEST (hindsight) |', '|---|---|---|---|---|---|---|---|']
for day in days:
    d = byday.get(day)
    if not d: continue
    kind = 'fade day (twin)' if d['twin'] > (d['main'] + d['rej']) / 2 else 'ride day (main/rej)'
    L.append(f"| {day} | {m(d['main'])} | {m(d['rej'])} | {m(d['twin'])} | {kind} | {m(d['fixedPnl'])} | **{m(d['meterPnl'])}** | {m(d['bestPnl'])} |")
L += ['', f"**Totals:** FIXED {m(tot['fixedPnl'])} · METER {m(tot['meterPnl'])} · BEST {m(tot['bestPnl'])}", '', 'Small samples: judge the meter only once it beats FIXED across most days, not on one big day.']
open(D('day-meter', 'REPORT.md'), 'w').write('\n'.join(L) + '\n')
print('\n'.join(L))
