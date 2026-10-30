import sys,os,json,collections,datetime as dt; sys.path.insert(0,os.path.expanduser("~/lab")); from acct import *
T,bell=load(); P=json.load(open("bid-paths.json"))
since=sys.argv[1] if len(sys.argv)>1 else "2026-10-22"
def ts(s): return dt.datetime.strptime(s[:19],"%Y-%m-%dT%H:%M:%S").replace(tzinfo=dt.timezone.utc).timestamp()
out=[]
for tk,fs in T.items():
    if fs[0]["t"]<since or tk not in P: continue
    pnl,legs,_,_=trade(fs,bell.get(tk))
    if pnl is None: continue
    f0=fs[0]; side="up" if (f0["action"],f0["side"])==("buy","yes") else "down"
    held=0;cost=0;cash=0;orders=set();ev=[]
    for x in fs:
        c=float(x["count"]);y=float(x["yes"]);k=(x["action"],x["side"]);fee=float(x.get("fee") or 0)
        if side=="up":
            if k==("buy","yes"): held+=c;cost+=c*y;cash-=c*y;orders.add(x.get("order","")[:13])
            else: held-=c;cash+=c*y
        else:
            if k in(("buy","no"),("sell","no")): held+=c;cost+=c*(1-y);cash-=c*(1-y);orders.add(x.get("order","")[:13])
            else: held-=c;cash+=c*(1-y)
        cash-=fee
        ev.append((ts(x["t"]),held,cost,cash,len(orders)))
    if len(orders)<2: continue
    # equity path after first add-on fill
    t_add=next(e[0] for e in ev if e[4]>=2)
    tcls=None
    path=[p for p in P[tk] if p[0]>=t_add]
    peak=-9; hits={}
    last_exit=ev[-1][0] if abs(ev[-1][1])<0.01 else 9e18
    for p in path:
        if p[0]>last_exit: break
        st=[e for e in ev if e[0]<=p[0]][-1]
        bid=p[1] if side=="up" else p[2]
        if not bid: continue
        eq=st[3]+st[1]*bid; roi=(eq)/st[2]  # net gain / cost
        peak=max(peak,roi)
        for X in (0.25,0.5,0.75,1.0):
            if roi>=X and X not in hits: hits[X]=st[2]*X
    out.append(dict(tk=tk,side=side,cost=round(cost,2),pnl=round(pnl,2),peak=round(peak,3),hits=hits,n=len(orders)))
n=len(out); print("add-on trades",n,"since",since, "actual total %.2f"%sum(o['pnl'] for o in out), "wins",sum(o['pnl']>0 for o in out))
for X in (0.25,0.5,0.75,1.0):
    h=[o for o in out if X in o['hits']]
    lost=[o for o in h if o['pnl']<=0]; under=[o for o in h if 0<o['pnl']<o['cost']*X]
    sim=sum(o['hits'][X] if X in o['hits'] else o['pnl'] for o in out)
    print(f"reached +{int(X*100)}% (={1+X:.2f}x): {len(h)} trades | later lost {len(lost)} (${sum(o['pnl'] for o in lost):.2f}) | won less than that {len(under)} | SELL-ALL at +{int(X*100)}% total ${sim:.2f}")
