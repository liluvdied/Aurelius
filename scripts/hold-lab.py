# HOLD LAB (Claude, Oct 8 ~2:40 AM PT, Love: "let's update it to $75 for all books... if we make it no exiting under 1.25x,
# does that hurt or help? let me know what the numbers say"). Uses the exit ledger's exit context (cushion = how far price
# was from the strike in her favor at the exit, mult = 1/bid at the exit) and heldPnl (what holding to the bell paid).
# A rule that would have kept the trade on swaps the exit for the bell. (It can't see a later trail exit, so a held trade
# is scored at the bell: a slightly pessimistic read on winners that later faded and a fair one on everything else.)
import json, collections
RUN = {'hour', 'cotc', 'brickt', 'confirm', 'brk1', 'new', 'brick', 'brickc'}
rows = {}
for l in open('data/exit-ledger.jsonl'):
    try: r = json.loads(l)
    except: continue
    if r.get('exitCushion') is None or not isinstance(r.get('heldPnl'), (int, float)): continue
    rows[r['id']] = r
def kind(r):
    e = r['exit']
    if 'gate' in e or 'lock' in e: return 'gate'
    if 'peaked' in e or 'take profit' in e: return 'tp'
    return 'other'
def run(rs, asset, rule):
    base = alt = 0; n = changed = 0; flips = [0, 0]
    for r in rs:
        if r['asset'] != asset: continue
        n += 1; k = 30 / (r.get('stake') or 50)
        base += r['pnl'] * k
        if rule(r):
            changed += 1; alt += r['heldPnl'] * k
            d = (r['heldPnl'] - r['pnl']) * k
            flips[0 if d >= 0 else 1] += 1
        else: alt += r['pnl'] * k
    return dict(n=n, changed=changed, better=flips[0], worse=flips[1], base=round(base, 2), alt=round(alt, 2), diff=round(alt - base, 2))
out = {}
for scope, rs in (('RUN books', [r for r in rows.values() if r['book'] in RUN]), ('all books', list(rows.values()))):
    for asset in ('btc', 'gold'):
        out[f'{scope} {asset}: BTC clear $75 (gates only fire inside $75)'] = run(rs, asset, lambda r: asset == 'btc' and kind(r) == 'gate' and 75 < r['exitCushion'] <= 100) if asset == 'btc' else None
        out[f'{scope} {asset}: no gate exit under 1.25x'] = run(rs, asset, lambda r: kind(r) == 'gate' and r.get('exitMult') and r['exitMult'] < 1.25 and r['pnl'] > 0)
        out[f'{scope} {asset}: no profit exit of ANY kind under 1.25x (hold to the bell)'] = run(rs, asset, lambda r: r.get('exitMult') and r['exitMult'] < 1.25 and r['pnl'] > 0)
        if asset == 'btc':
            out[f'{scope} btc: BOTH ($75 + 1.25x gate floor)'] = run(rs, asset, lambda r: kind(r) == 'gate' and ((75 < r['exitCushion'] <= 100) or (r.get('exitMult') and r['exitMult'] < 1.25 and r['pnl'] > 0)))
first = min(r['soldAt'] or r['at'] for r in rows.values()); last = max(r['at'] for r in rows.values())
print('rows with exit context:', len(rows), first, '->', last)
for k, v in out.items():
    if v: print(f"{k:75s} changed {v['changed']:4d} of {v['n']:4d} (better {v['better']}, worse {v['worse']})  ${v['base']:9.2f} -> ${v['alt']:9.2f}  = {v['diff']:+.2f}")
json.dump(out, open('data/hold-lab.json', 'w'), indent=1)
