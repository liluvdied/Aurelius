import json,datetime,collections,os
os.chdir(os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius"))
P=lambda s:datetime.datetime.fromisoformat(s.replace("Z","+00:00")).timestamp()
S={"btc":[],"gold":[]}
for l in open("data/band-log.jsonl"):
    if '"at":"2026-10-2' not in l[:20]: continue
    try:s=json.loads(l)
    except:continue
    if s.get("asset") in S and s["at"]>="2026-10-24": S[s["asset"]].append((P(s["at"]),s["tick"],dict(s["L"])))
def cls(n):
    if n in("fresh VWAP","session VWAP"): return "blue VWAP"
    if "σ" in n: return "sigma bands"
    if n=="5m PP": return "pink"
    if n.startswith("5m"): return "R1/S1/R2/S2"
    return None
st=collections.defaultdict(lambda:[0,0])
for a,v in S.items():
    tol=10 if a=="btc" else 0.4; back=3*tol; thru=2*tol
    last={}
    for i in range(5,len(v)):
        t,p,L=v[i]
        vw=L.get("fresh VWAP") or L.get("session VWAP"); u1=L.get("fresh +1σ") or L.get("+1σ")
        if not(vw and u1): continue
        tight=abs(u1-vw)<(150 if a=="btc" else 3)
        for n,x in L.items():
            c=cls(n)
            if not c or not x or abs(p-x)>tol: continue
            if t-last.get((n,),0)<900: continue
            prev=[q for (tt,q,_) in v[i-5:i] if t-tt<=360]
            if not prev: continue
            side=1 if max(prev)-x>=2*tol and min(prev)>x-tol else (-1 if x-min(prev)>=2*tol and max(prev)<x+tol else 0)
            if not side: continue
            last[(n,)]=t; res=None
            for (tt,q,L2) in v[i+1:i+20]:
                if tt-t>900: break
                x2=L2.get(n) or x
                if side*(q-x2)>=back: res=1;break
                if side*(x2-q)>=thru: res=0;break
            if res is None: continue
            k=(a,"tight" if tight else "normal",c); st[k][0]+=1; st[k][1]+=res
for k,g in sorted(st.items()): print(k, f"touches {g[0]}  held {g[1]/g[0]:.0%}")
