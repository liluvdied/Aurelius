# READ-ONLY (Claude, Oct 17 ~10:55 AM PT, Love: "could you work out the hit rate on that without those losses? and could you replay the model
# now against those and see what she does there?"). Today's live ogp5-fast fills since 2:45 AM PT, through the two new rules:
#  A) flip after a too-close / band-before-target refusal = she waits (no trade);
#  B) closest wall is a session band within $8 of price = she waits; after the wait, the first 1m close $8+ from that band decides:
#     through it = the break side, back away = the rejection side (same side either way: the side price ends on). Result from the
#     window's settlement (inferred from the original trade's banked sign). Re-entry price unknown -> W/L only for re-entries.
import json, sys
from datetime import datetime, timezone, timedelta
D = sys.argv[1]; PT = timezone(timedelta(hours=-7))
fl = {}
for x in json.load(open(f'{D}/fill-log.json')):
    if x.get('kind') == 'banked' and x.get('profit') is not None: fl[x['ticker']] = fl.get(x['ticker'], 0) + float(x['profit'])
B = {b['t']: b for b in json.load(open(f'{D}/van-1m.json'))['bars']}
def pink(ts):
    m = int(ts // 60 * 60); F = {}
    for t in range(m - 60 * 400, m + 60, 60):
        b = B.get(t)
        if not b: continue
        k = t // 300 * 300; y = F.get(k)
        if not y: F[k] = dict(h=b['h'], l=b['l'], c=b['c'])
        else: y['h'] = max(y['h'], b['h']); y['l'] = min(y['l'], b['l']); y['c'] = b['c']
    e = None
    for k in sorted(F)[-60:]:
        x = F[k]; pp = (x['h'] + x['l'] + x['c']) / 3; e = pp if e is None else pp * 0.25 + e * 0.75
    return e
s = open(f'{D}/grok-og.json').read()
def label(tk):
    i = s.find(f'"id":"{tk}:ogp5-fast"')
    if i < 0: return ''
    j = s.find('"label":"', i) + 9; return s[j:s.find('","', j)]
d = json.load(open(f'{D}/live-book-done.json'))
own = {v['ticker'] for k, v in d.items() if isinstance(v, dict) and k.endswith(':ogp5-fast') and v.get('status') == 'filled' and v.get('at', '') >= '2026-10-17T09:44'}
SKIP = {'KXBTC15M-26OCT171315-15'}  # Love's hand-traded window
out = []; seen = set()
for r in json.load(open(f'{D}/live-fires.json')):
    tk = r['ticker']
    if tk not in own or tk in seen or tk in SKIP or r['at'] < '2026-10-17T09:44' or tk not in fl: continue
    seen.add(tk)
    ts = datetime.fromisoformat(r['at'].replace('Z', '+00:00')).timestamp(); m = int(ts // 60 * 60); ws = int(ts // 900 * 900)
    p = fl[tk]; side = r['side']; won = p > 0; res_up = (side == 'up') == won
    lab = label(tk); pt = datetime.fromtimestamp(ts, PT).strftime('%I:%M %p')
    rec = dict(pt=pt, side=side, pnl=round(p, 2), label=lab[:90])
    if 'the other side' in lab and '(needs more than' in lab or 'would have to cross' in lab:
        rec['new'] = 'A: waits (too-close flip)'; rec['newW'] = None; out.append(rec); continue
    tick = B[m]['c'] if m in B else r.get('spot')
    bd = r.get('bands') or {}
    L = [('session VWAP' if k == 'vwap' else f"{k}σ", v) for k, v in bd.items()] + [('pink', pink(ts))]
    n = min(L, key=lambda x: abs(x[1] - tick))
    if n[0] != 'pink' and abs(n[1] - tick) < 8:
        bp = n[1]; nxt = None
        for t in range(m + 60, ws + 900 - 60, 60):
            b = B.get(t)
            if b and abs(b['c'] - bp) >= 8: nxt = (t, 'up' if b['c'] > bp else 'down'); break
        if not nxt: rec['new'] = f"B: waits at {n[0]} - never broke/rejected $8, no trade"; rec['newW'] = None
        else:
            ns = nxt[1]; w = (ns == 'up') == res_up
            rec['new'] = f"B: waits at {n[0]}, then {'LONG' if ns == 'up' else 'SHORT'} at {datetime.fromtimestamp(nxt[0] + 60, PT).strftime('%I:%M')}"; rec['newW'] = w
        out.append(rec); continue
    rec['new'] = 'same trade'; rec['newW'] = won; out.append(rec)
json.dump(out, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
old = [x for x in out]; ow = sum(1 for x in old if x['pnl'] > 0)
print(f"AS TRADED (excl. your 10:00 hand window): {ow}-{len(old) - ow} ({100 * ow / len(old):.0f}%), P&L ${sum(x['pnl'] for x in old):+.2f}")
kept = [x for x in out if x['new'] == 'same trade']; kw = sum(1 for x in kept if x['pnl'] > 0)
print(f"WITHOUT THE TRADES THE NEW RULES STOP: {kw}-{len(kept) - kw} ({100 * kw / len(kept):.0f}%), P&L ${sum(x['pnl'] for x in kept):+.2f}")
re = [x for x in out if x['newW'] is not None and x['new'] != 'same trade']; rw = sum(1 for x in re if x['newW'])
allw = kw + rw; alln = len(kept) + len(re)
print(f"RE-ENTRIES AFTER A WAIT: {rw}-{len(re) - rw}  |  NEW MODEL TOTAL: {allw}-{alln - allw} ({100 * allw / alln:.0f}%)")
for x in out:
    if x['new'] != 'same trade': print(' ', x['pt'], x['side'], f"${x['pnl']:+.2f}", '->', x['new'], '' if x['newW'] is None else ('WIN' if x['newW'] else 'LOSS'))
