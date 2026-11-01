import json,os,datetime as dt,collections
D=os.path.expanduser('~/mnt/Downloads/aurelius fixxd <3/Aurelius/data/')
def bars(f):
    b=json.load(open(D+f))['bars']; b.sort(key=lambda x:x['t']); return b
def pivots(b,L=7):
    out=[];ema=None;k=2/(L+1);rng=collections.deque(maxlen=7)
    for x in b:
        pp=(x['h']+x['l']+x['c'])/3; ema=pp if ema is None else pp*k+ema*(1-k); rng.append(x['h']-x['l'])
        a=sum(rng)/len(rng)
        out.append(dict(t=x['t'],o=x['o'],h=x['h'],l=x['l'],c=x['c'],pp=ema,r1=ema+a,s1=ema-a,r2=ema+2*a,s2=ema-2*a,rng=a))
    return out
# ground truth: bell per ticker from book ledger
rows={}
for l in open(D+'exit-ledger.jsonl'):
    if l.strip(): r=json.loads(l); rows[r['id']]=r
for r in json.load(open(D+'night-book.json')): rows[r['id']]=r
bell={}; 
for r in rows.values():
    tk=r['id'].split(':')[0]
    if r.get('bell') in ('yes','no') and '15M' in tk: bell[tk]=r['bell']
tape=collections.defaultdict(dict); tgt={}
for x in json.load(open(D+'nav-tape.json')):
    if x.get('tk'): tape[x['tk']][x['t']//60*60]=x; tgt.setdefault(x['tk'],x.get('tgt'))
MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
def ticker(asset,close_ts):
    et=dt.datetime.fromtimestamp(close_ts,dt.timezone.utc)-dt.timedelta(hours=4)
    return f"KX{'BTC' if asset=='btc' else 'GOLD'}15M-{et:%y}{MON[et.month-1]}{et:%d%H%M}-{et:%M}"
fee=lambda n,p:0.07*n*p*(1-p)
def run(asset,f):
    P=pivots(bars(f)); idx={p['t']:i for i,p in enumerate(P)}
    res=collections.defaultdict(lambda:[0,0,0.0,0])  # n, win, pnl($20, priced), priced n
    start=dt.datetime(2026,10,4,7,tzinfo=dt.timezone.utc).timestamp()
    for i in range(10,len(P)):
        b=P[i]; prev=P[i-1]; close_t=b['t']+300
        if b['t']<start: continue
        wclose=(close_t//900+1)*900 if close_t%900 else close_t+900   # window containing the moment right after this bar closes
        left=wclose-close_t
        if left<300: continue  # need 5+ min left
        tk=ticker(asset,wclose); out=bell.get(tk)
        if out not in ('yes','no'): continue
        bands=prev  # bands known at the close of this bar use this bar too
        bands=b
        sig=[]
        for nm,lvl in (('S1',b['s1']),('S2',b['s2'])):
            if b['l']<=lvl<b['c']: sig.append((f'reject up off {nm}','up'))
        for nm,lvl in (('R1',b['r1']),('R2',b['r2'])):
            if b['h']>=lvl>b['c']: sig.append((f'reject down off {nm}','down'))
        for nm,lvl in (('R1',b['r1']),('R2',b['r2'])):
            if b['o']<lvl<b['c']: sig.append((f'break up through {nm}','up'))
        for nm,lvl in (('S1',b['s1']),('S2',b['s2'])):
            if b['o']>lvl>b['c']: sig.append((f'break down through {nm}','down'))
        if b['o']<b['pp']<b['c']: sig.append(('reclaim pivot up','up'))
        if b['o']>b['pp']>b['c']: sig.append(('lose pivot down','down'))
        for name,side in sig:
            won=(out=='yes')==(side=='up')
            x=res[name]; x[0]+=1; x[1]+=won
            m=tape.get(tk,{}).get(close_t//60*60)
            if m and m.get('yb') is not None and 0.02<m['yb']<0.98:
                ask=min(0.97,m['yb']+0.02) if side=='up' else 1-m['yb']
                if 0.05<ask<0.95:
                    n=20/ask; pnl=(n*(1-ask) if won else -20)-fee(n,ask); x[2]+=pnl; x[3]+=1
    return res
for asset,f in (('btc','pivot-btc5.json'),('gold','pivot-gold5.json')):
    r=run(asset,f); print('==',asset.upper())
    for k,v in sorted(r.items(), key=lambda kv:-kv[1][0]):
        print(f"  {k:24s} {v[0]:4d} signals  won {v[1]/v[0]*100:5.1f}%   priced {v[3]:3d}: {v[2]:+8.2f}")
