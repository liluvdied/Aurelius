# RE-ENTRY LAB (Claude, Oct 8 ~3:25 AM PT, Love: "if she ever exits a position early like that (justly), she's clear to re
# enter into the same position when the next window starts, more time for it to follow through... could you look back and
# check on that"). For every paper trade of the RUN books that ended on LOCK THE WIN or a TAKE-PROFIT GATE: what did the
# SAME side do in the NEXT 15-minute window of that asset (settled at its bell)? Entry priced at that window's first
# paper ask on that side when one exists, else 50c. $30 a trade, Kalshi taker fee going in, settlement free.
import json, re, collections
from datetime import datetime, timedelta
MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
RUN = {'hour','cotc','brickt','confirm','brk1','new','brick','brickc'}
def key(tk):
    m = re.match(r'(KX\w+15M)-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)', tk)
    if not m: return None
    return m[1], datetime(2000+int(m[2]), MON.index(m[3])+1, int(m[4]), int(m[5]), int(m[6]))
def tick(series, t): return f"{series}-{t:%y}{MON[t.month-1]}{t:%d%H%M}-{t:%M}"
rows = {}
for l in open('data/exit-ledger.jsonl'):
    try: r = json.loads(l)
    except: continue
    rows[r['id']] = r
for r in json.load(open('data/night-book.json')): rows.setdefault(r['id'], r)
bell = {}; firstask = {}
for r in sorted(rows.values(), key=lambda r: r['at']):
    tk = r.get('ticker') or r['id'].split(':')[0]
    if r.get('bell') in ('yes', 'no'): bell[tk] = r['bell']
    if r.get('ask'): firstask.setdefault((tk, r.get('side')), r['ask'])
seen = set(); out = collections.defaultdict(lambda: [0, 0, 0.0])
for r in sorted(rows.values(), key=lambda r: r['at']):
    tk = r.get('ticker') or r['id'].split(':')[0]
    if r.get('book') not in RUN or tk in seen or r.get('result') != 'sold' or not re.search('lock|gate', str(r.get('exit','')), re.I): continue
    k = key(tk)
    if not k: continue
    seen.add(tk)
    nxt = tick(k[0], k[1] + timedelta(minutes=15))
    if nxt not in bell: continue
    side = r['side']; won = (bell[nxt] == 'yes') == (side == 'up')
    ask = 0.52  # window start: strike = price, so roughly a coin flip; 52c with a little slippage (first-paper-ask pricing was biased)
    c = 30 / ask; fee = 0.07 * c * ask * (1 - ask)
    pnl = (c - 30 if won else -30) - fee
    just = 'early exit was RIGHT (holding would have lost)' if (r.get('heldPnl') is not None and r['heldPnl'] < 0) else 'early exit was WRONG (holding would have won)'
    for g in ('ALL early exits', just, f"{r['asset']}: ALL", f"{r['asset']}: {just}"):
        a = out[g]; a[0] += 1; a[1] += won; a[2] += pnl
for g, a in sorted(out.items()):
    print(f"{g:60s} {a[0]:3d} re-entries  {round(100*a[1]/a[0]):3d}% won  ${a[2]:+8.2f} at $30 after fees")
