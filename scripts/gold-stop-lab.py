import json,datetime,collections,os,sys
D=os.path.expanduser('~/mnt/Aurelius/data/')
h=json.load(open(D+'kalshi-history.json')); a=json.load(open(D+'kalshi-audit.json')); b=json.load(open(D+'bid-paths.json'))
S=json.load(open(D+'gold-strikes.json'))
done=json.load(open(D+'live-book-done.json'))
bookTk={v.get('ticker') for v in done.values() if v.get('status') in ('filled','partial')}
import re
ts=lambda s: datetime.datetime.fromisoformat(re.sub(r'\.\d+','',s).replace('Z','+00:00')).timestamp()
seen=set(); fills=collections.defaultdict(list)
for f in h['fills']+a['fills']:
    if not f['ticker'].startswith('KXGOLD15M'): continue
    k=(f.get('order'),f['t'][:19],f['count'],f['action'],f['side'])
    if k in seen: continue
    seen.add(k); fills[f['ticker']].append(f)
fee=lambda c,p: 0.07*c*p*(1-p)
def run(tk, X):
    # Kalshi nets: every fill ADDS contracts of its stated side (a "sell no" after a yes buy is the exit: it adds NO, and a
    # YES+NO pair is worth $1 at the bell). Checked against Kalshi's own settlement counts: 634 of 649 windows match.
    st=S.get(tk) or {}
    K=st.get('floor'); res=st.get('result')
    if K is None or res not in ('yes','no') or tk not in b: return None
    fs=sorted(fills[tk], key=lambda f: f['t'])
    ev=[(ts(f['t']),0,f) for f in fs]+[(p[0],1,p) for p in b[tk]]
    ev.sort(key=lambda e:(e[0],e[1]))
    Y=N=0.0; cash=0.0; stopped=None; started=False
    for t,kind,x in ev:
        if kind==0:
            if stopped: continue
            c=float(x['count']); yp=float(x['yes']); p=yp if x['side']=='yes' else 1-yp
            cash-=c*p+float(x.get('fee') or 0); started=True
            if x['side']=='yes': Y+=c
            else: N+=c
        elif X is not None and started and not stopped:
            yb,nb,spot=x[1],x[2],x[3]
            if not spot: continue
            net=Y-N
            if net>0.01 and K-spot>=X and yb and yb>=0.01:
                cash+=net*yb-fee(net,yb); stopped=(t,'yes',yb,K-spot); Y=N
            elif net<-0.01 and spot-K>=X and nb and nb>=0.01:
                cash+=(-net)*nb-fee(-net,nb); stopped=(t,'no',nb,spot-K); N=Y
    if not started: return None
    cash+=Y*(1 if res=='yes' else 0)+N*(1 if res=='no' else 0)
    return cash, stopped
tks=[t for t in fills if t in S]
base={t:run(t,None) for t in tks}; base={t:v for t,v in base.items() if v}
print(f"gold windows traded on Kalshi with a bid path + strike: {len(base)} (book-copied {sum(1 for t in base if t in bookTk)}, hand {sum(1 for t in base if t not in bookTk)})")
print(f"actual P&L on them: {sum(v[0] for v in base.values()):+.2f}  wins {sum(1 for v in base.values() if v[0]>0.01)}  losses {sum(1 for v in base.values() if v[0]<-0.01)}")
for grp,sel in (('ALL',lambda t:True),('BOOKS',lambda t:t in bookTk),('HAND',lambda t:t not in bookTk)):
    print(f"\n== {grp}")
    for X in (1.0,1.5,2.0,2.5,3.0,3.5,4.0,5.0):
        tot=0; trig=0; saved=0; lost=0; nS=0; nL=0
        for t in base:
            if not sel(t): continue
            r=run(t,X)
            d=r[0]-base[t][0]; tot+=d
            if r[1]:
                trig+=1
                if d>0.005: saved+=d; nS+=1
                elif d<-0.005: lost+=d; nL+=1
        print(f"  stop at ${X:.2f} past the target: net {tot:+8.2f} | fired {trig:3d} | saved {saved:+8.2f} on {nS} losers | gave up {lost:+8.2f} on {nL} that came back")
