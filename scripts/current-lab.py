# CURRENT LAB (Claude, Oct 8, Love: "go with the current, not against it" - can we tell good days from bad ones,
# sit the bad ones out, and be more selective?). Read-only: paper ledger, BRICK replay, Kalshi history.
import json, collections, sys
from datetime import datetime, timedelta, timezone
D = 'data/'
def pt(ts):
    t = datetime.fromisoformat(ts.replace('Z', '+00:00')) if isinstance(ts, str) else datetime.fromtimestamp(ts, timezone.utc)
    return t - timedelta(hours=7)
MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
import re
def close_pt(tk):
    m = re.search(r'-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)', tk)
    if not m: return None
    et = datetime(2000 + int(m[1]), MON.index(m[2]) + 1, int(m[3]), int(m[4]), int(m[5]))
    return (et - timedelta(hours=3)).replace(tzinfo=timezone.utc)  # ET -> PT (both daylight time in Oct); same tz tag as pt()
def fee(stake, px, out):
    # Kalshi taker fee estimate on $30: entry always, exit only when sold before the bell (settlement is free)
    c = 30 / max(px, 0.01)
    f = 0.07 * c * px * (1 - px)
    if out is not None and 0 < out < 1: f += 0.07 * c * out * (1 - out)
    return f

def ledger():
    rows = {}
    for l in open(D + 'exit-ledger.jsonl'):
        try: r = json.loads(l)
        except: continue
        if r.get('dnaMode') or r.get('stale') or not isinstance(r.get('pnl'), (int, float)) or r.get('result') == 'open' or not r.get('book'): continue
        rows[r['id']] = r
    out = []
    for r in rows.values():
        k = 30 / (r.get('stake') or 50)  # rescale to $30
        sold = r.get('result') == 'sold'
        out.append(dict(book=r['book'], t=pt(r['at']), tk=r.get('ticker') or r['id'].split(':')[0], asset=r['asset'], side=r['side'], ask=r['ask'], mult=r.get('multiple') or 0,
                        end=(pt(r['soldAt']) if r.get('soldAt') else close_pt(r.get('ticker') or r['id'])), pnl=r['pnl'] * k, net=r['pnl'] * k - fee(30, r['ask'], r.get('sellBid') if sold else None), setup=r.get('setup', ''), hour=r.get('hourPT')))
    return sorted(out, key=lambda x: x['t'])

def replay():
    out = []
    for r in json.load(open(D + 'replay-lab.json'))['brick']:
        k = 30 / 50
        sold = not str(r.get('exit', '')).startswith('settle') and 'bell' not in str(r.get('exit', ''))
        out.append(dict(book=r['book'], t=pt(r['t']), tk=r['tk'], asset=r['asset'], side=r['side'], ask=r['ask'], mult=1 / r['ask'] if r['ask'] else 0,
                        end=close_pt(r['tk']), pnl=r['pnl'] * k, net=r['pnl'] * k - fee(30, r['ask'], 0.95 if (sold and r['pnl'] > 0) else (0.1 if sold else None)), setup=r.get('setup', ''), hour=pt(r['t']).hour))
    return sorted(out, key=lambda x: x['t'])

def combo(rows, books):
    seen = set(); out = []
    for r in rows:
        if r['book'] in books and r['tk'] not in seen:
            seen.add(r['tk']); out.append(r)
    return out

def days(rows, key='net'):
    d = collections.OrderedDict()
    for r in rows: d.setdefault(r['t'].strftime('%m-%d'), []).append(r)
    return d

def rules(rows, key='net'):
    """Each rule walks the day in order and decides trade-or-sit before seeing each result."""
    res = {}
    by = days(rows)
    def run(name, fn):
        tot = 0; n = 0; daily = []
        prev = None
        for day, rs in by.items():
            st = {'prev': prev}
            dp = 0; dn = 0
            for i, r in enumerate(rs):
                hist = [x[key] for x in sorted((x for x in rs[:i] if x['end'] and x['end'] <= r['t']), key=lambda x: x['end'])]
                take = fn(st, hist, dp)
                if take: dp += r[key]; dn += 1
                st['dp'] = dp
            daily.append((day, round(dp, 2), dn))
            prev = sum(x[key] for x in rs)
            tot += dp; n += dn
        green = sum(1 for _, p, _ in daily if p > 0.5); red = sum(1 for _, p, _ in daily if p < -0.5)
        res[name] = dict(total=round(tot, 2), n=n, green=green, red=red, worst=min((p for _, p, _ in daily), default=0), days=daily)
    run('ALWAYS (every trade)', lambda st, h, dp: True)
    for k in (2, 3):
        def f(st, h, dp, k=k):
            st.setdefault('out', False)
            if st['out']: return False
            run_ = 0
            for x in h:
                run_ = run_ + 1 if x < 0 else 0
                if run_ >= k: st['out'] = True; return False
            return True
        run(f'SIT REST OF DAY after {k} paper losses in a row', f)
    for g in (60, 90):
        def f(st, h, dp, g=g):
            st.setdefault('pk', 0); st.setdefault('out', False)
            if st['out']: return False
            c = 0
            for x in h:
                c += x; st['pk'] = max(st['pk'], c)
                if st['pk'] - c >= g: st['out'] = True; return False
            return True
        run(f'SIT REST OF DAY once paper gives back ${g} from its peak', f)
    for need, of in ((2, 3), (3, 4), (3, 5)):
        def f(st, h, dp, need=need, of=of):
            if len(h) < of: return False
            return sum(1 for x in h[-of:] if x > 0) >= need
        run(f'RIDE THE CURRENT: trade only while {need} of the last {of} paper trades won', f)
    def f(st, h, dp):
        return st['prev'] is None or st['prev'] > 0
    run('YESTERDAY GREEN -> trade today', f)
    def f(st, h, dp):
        if len(h) < 4: return False
        return sum(h[:4]) > 0
    run('MORNING TEST: watch the first 4, trade the day only if they were green', f)
    return res

def consensus(rows):
    """Windows where several books fired: did agreement pick winners?"""
    w = collections.defaultdict(list)
    for r in rows: w[r['tk']].append(r)
    agg = collections.defaultdict(lambda: [0, 0, 0.0])
    for tk, rs in w.items():
        ups = {r['book'] for r in rs if r['side'] == 'up'}; dns = {r['book'] for r in rs if r['side'] == 'down'}
        first = min(rs, key=lambda r: r['t'])
        same = ups if first['side'] == 'up' else dns; opp = dns if first['side'] == 'up' else ups
        key = 'disputed (books on both sides)' if opp else ('1 book alone' if len(same) == 1 else ('2-3 books agree' if len(same) <= 3 else '4+ books agree'))
        a = agg[key]; a[0] += 1; a[1] += first['net'] > 0; a[2] += first['net']
    return {k: dict(n=v[0], win=round(100 * v[1] / v[0]), net=round(v[2], 2), per=round(v[2] / v[0], 2)) for k, v in agg.items()}

def buckets(rows, f, name):
    agg = collections.defaultdict(lambda: [0, 0, 0.0])
    for r in rows:
        k = f(r); a = agg[k]; a[0] += 1; a[1] += r['net'] > 0; a[2] += r['net']
    return {str(k): dict(n=v[0], win=round(100 * v[1] / v[0]), net=round(v[2], 2), per=round(v[2] / v[0], 2)) for k, v in sorted(agg.items(), key=lambda x: str(x[0]))}

L = ledger(); R = replay()
CLOVER = {'cotc', 'brickc', 'brickt', 'new', 'confirm', 'brk1', 'hour'}
C = combo(L, CLOVER)
out = {}
out['span'] = dict(ledger=[str(L[0]['t'])[:16], str(L[-1]['t'])[:16], len(L)], replay=[str(R[0]['t'])[:16], str(R[-1]['t'])[:16], len(R)])
for name, rows in (('CLOVER combo (paper, Oct 4-7, after est. fees)', C), ('BRICK replay (Sep 20-Oct 5, after est. fees)', [r for r in R if r['book'] == 'brick'])):
    out[name] = rules(rows)
def streak(rows):
    a = {'after a win': [0, 0], 'after a loss': [0, 0], 'after 2 losses': [0, 0], 'after 2 wins': [0, 0]}
    for day, rs in days(rows).items():
        for i, r in enumerate(rs):
            h = [x['net'] for x in sorted((x for x in rs[:i] if x['end'] and x['end'] <= r['t']), key=lambda x: x['end'])]
            if not h: continue
            k = 'after a win' if h[-1] > 0 else 'after a loss'
            a[k][0] += 1; a[k][1] += r['net'] > 0
            if len(h) >= 2 and h[-1] < 0 and h[-2] < 0: a['after 2 losses'][0] += 1; a['after 2 losses'][1] += r['net'] > 0
            if len(h) >= 2 and h[-1] > 0 and h[-2] > 0: a['after 2 wins'][0] += 1; a['after 2 wins'][1] += r['net'] > 0
    return {k: f"{round(100*v[1]/v[0]) if v[0] else 0}% won of {v[0]}" for k, v in a.items()}
out['streaks CLOVER'] = streak(C)
out['streaks BRICK replay'] = streak([r for r in R if r['book'] == 'brick'])
out['clover by day'] = {d: dict(n=len(rs), win=round(100*sum(r['net']>0 for r in rs)/len(rs)), net=round(sum(r['net'] for r in rs),2), gross=round(sum(r['pnl'] for r in rs),2)) for d, rs in days(C).items()}
out['brick replay by day'] = {d: dict(n=len(rs), win=round(100*sum(r['net']>0 for r in rs)/len(rs)), net=round(sum(r['net'] for r in rs),2), gross=round(sum(r['pnl'] for r in rs),2)) for d, rs in days([r for r in R if r['book']=='brick']).items()}
out['clover by asset'] = buckets(C, lambda r: r['asset'], 'a')
out['clover by book (owner)'] = buckets(C, lambda r: r['book'], 'b')
out['consensus (all paper books, first trade in the window)'] = consensus(L)
out['multiple at entry (Clover)'] = buckets(C, lambda r: '<1.4x' if r['mult'] < 1.4 else '1.4-1.7x' if r['mult'] < 1.7 else '1.7-2.2x' if r['mult'] < 2.2 else '2.2x+', 'mult')
out['multiple at entry (all)'] = buckets(L, lambda r: '<1.4x' if r['mult'] < 1.4 else '1.4-1.7x' if r['mult'] < 1.7 else '1.7-2.2x' if r['mult'] < 2.2 else '2.2x+', 'mult')
json.dump(out, open(D + 'current-lab.json', 'w'), indent=1, default=str)
for k, v in out.items():
    print('==', k)
    if isinstance(v, dict) and all(isinstance(x, dict) and 'total' in x for x in v.values()):
        for rn, x in v.items(): print(f"  {rn:70s} ${x['total']:>9.2f}  n={x['n']:4d}  green {x['green']} red {x['red']}  worst {x['worst']:.0f}")
    else: print(' ', json.dumps(v)[:1500])
