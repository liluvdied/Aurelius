import pickle,statistics as st,json,datetime as dt
rows=pickle.load(open('rows2.pkl','rb'))
SPLIT=dt.datetime(2026,10,28,tzinfo=dt.timezone.utc).timestamp()
BK={'btc':[(0,100),(100,200),(200,350),(350,500),(500,1e9)],'gold':[(0,5),(5,10),(10,20),(20,1e9)]}
def pink(r,lv):
    p=r['pink']
    if not p: return False
    if r['side']=='up': return p>r['tick'] and p-r['tick']<=lv
    return p<r['tick'] and r['tick']-p<=lv
def sess(r,lv):
    return (r['sa']-r['tick']<=lv) if r['side']=='up' else (r['tick']-r['sb']<=lv)
def boll(r,lv):
    e=r['bu'] if r['side']=='up' else r['bl']
    return bool(e) and abs(r['tick']-e)<=lv
def zone(r,lv):
    if r['side']=='up':
        a,b=r['r1'],r['r2']
    else:
        a,b=r['s2'],r['s1']
    if not a or not b: return False
    lo,hi=min(a,b),max(a,b)
    return lo-lv<=r['tick']<=hi+lv
RULES={'pink':(pink,'pct'),'sess':(sess,'pct'),'boll':(boll,'pct'),'zone':(zone,'pct')}
PCTS=[0,0.05,0.10,0.15,0.20,0.25,0.33,0.40,0.50]
def stats(R):
    if not R: return dict(n=0)
    return dict(n=len(R),win=round(st.mean(r['win'] for r in R),3),edge=round(st.mean(r['edge'] for r in R)*100,2),tot=round(sum(r['edge'] for r in R),2))
out={}
for name,(fn,_) in RULES.items():
    for a in ('btc','gold'):
        for lo,hi in BK[a]:
            R=[r for r in rows if r['asset']==a and lo<=r['W']<hi]
            res=[]
            for p in PCTS:
                P=[r for r in R if not fn(r,p*r['W'])]; Bl=[r for r in R if fn(r,p*r['W'])]
                h1=[r for r in P if r['t']<SPLIT]; h2=[r for r in P if r['t']>=SPLIT]
                res.append(dict(pct=p,passed=stats(P),blocked=stats(Bl),h1=round(sum(r['edge'] for r in h1),2),h2=round(sum(r['edge'] for r in h2),2)))
            out[(name,a,lo)]=res
            best=max(res,key=lambda x:x['passed'].get('tot',-1e9))
            print(f"{name:5} {a:4} W{lo:>4}-{hi if hi<1e8 else '+':<4} n={len(R):4} best={best['pct']:.2f} ", ' '.join(f"{x['pct']:.2f}:{x['passed'].get('tot',0):+.1f}/{x['blocked'].get('edge',0):+.1f}c[{x['blocked'].get('n',0)}]" for x in res))
pickle.dump(out,open('sweep.pkl','wb'))
