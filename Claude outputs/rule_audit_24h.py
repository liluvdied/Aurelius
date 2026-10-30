# READ-ONLY (Claude, Oct 17 ~4:25 PM PT, Love: "yes i was going to ask you that"). Last 24 h of her book (ogp5-fast): every window where
# her gate refused a side she wanted, which rule refused it, and how that window settled. "Cost" = the refused side won and she didn't
# hold it; "saved" = the refused side lost. Settlement per window from the desk's paper rows held to the bell (any book).
import json, re, sys
from collections import defaultdict
from datetime import datetime, timezone, timedelta
D = sys.argv[1]; PT = timezone(timedelta(hours=-7)); SINCE = sys.argv[2]
rows = []
s = open(f'{D}/grok-og.json').read()
for m in re.finditer(r'\{"id":"KX', s):
    j = s.find('},{"id"', m.start())
    try: rows.append(json.loads(s[m.start():(j + 1) if j > 0 else None]))
    except Exception: pass
for l in open(f'{D}/grok-og-archive.jsonl'):
    try: rows.append(json.loads(l))
    except Exception: pass
win = {}
for r in rows:
    if r.get('result') in ('win', 'loss') and 'bell' in str(r.get('exit') or '') and r.get('side') in ('up', 'down'):
        win[r['ticker']] = r['side'] if r['result'] == 'win' else ('down' if r['side'] == 'up' else 'up')
took = {}
for r in rows:
    if r.get('lane') == 'ogp5-fast' and r.get('at', '') >= SINCE: took.setdefault(r['ticker'], set()).add(r['side'])
def cat(x):
    x = x or ''
    if "can't verify" in x or 'feed not healthy' in x or 'no session bands' in x: return 'can\'t verify / feed (safety)'
    if 'needs more than' in x: return 'RETIRED: room rule (sigma %)'
    if 'closest band' in x: return 'RETIRED: closest band'
    if 'closer than' in x and 'behind' in x: return 'RETIRED: session band ahead of pink'
    if re.search(r'[+-](0\.5|1\.5|2\.5)σ', x): return 'RETIRED: half-sigma band (any rule)'
    if 'top 25%' in x or 'bottom 25%' in x: return '25% rule'
    if 'would have to cross' in x: return 'band before the Kalshi target'
    if 'into the red' in x or 'into the green' in x: return 'red/green without a push'
    if 'against the rejection' in x: return 'rejection this candle'
    if 'at the pink' in x: return 'pink break needs $6'
    if x.startswith('at ') and 'waiting for a break' in x: return 'at a session band ($8 wait)'
    if 'broke' in x and ('candle' in x or 'break is a break' in x): return 'break against her this candle'
    if 'right under the pink' in x or 'right over the pink' in x or 'in charge' in x: return 'session break beats pink'
    return 'other: ' + x[:40]
ref = {}
for l in open(f'{D}/band-lock.jsonl'):
    if '"ogp5-fast"' not in l: continue
    try: r = json.loads(l)
    except Exception: continue
    if r.get('at', '') < SINCE or r.get('asset') != 'btc': continue
    tk = str(r.get('id', '') or '').split(':')[0] or r.get('ticker')
    if not tk: continue
    k = (tk, r['side']); c = cat(r.get('reason'))
    ref.setdefault(k, defaultdict(int))[c] += 1
agg = defaultdict(lambda: {'cost': 0, 'saved': 0, 'unknown': 0, 'ex': []})
for (tk, side), cs in ref.items():
    if side in took.get(tk, set()): continue
    c = max(cs.items(), key=lambda x: x[1])[0]
    w = win.get(tk)
    k = 'unknown' if w is None else ('cost' if w == side else 'saved')
    agg[c][k] += 1
    if k == 'cost' and len(agg[c]['ex']) < 3: agg[c]['ex'].append(tk[-11:] + ' ' + side)
print(f"{'rule':42s} | cost (refused side WON) | saved (refused side LOST) | unknown")
for c, v in sorted(agg.items(), key=lambda x: -(x[1]['cost'] - x[1]['saved'])):
    print(f"{c:42s} | {v['cost']:4d} | {v['saved']:4d} | {v['unknown']:3d}   e.g. {', '.join(v['ex'])}")
