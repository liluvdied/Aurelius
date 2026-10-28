import json,bisect,datetime,collections
P=lambda s:datetime.datetime.fromisoformat(s.replace("Z","+00:00")).timestamp()
rows=[]
for l in open("data/grok-og-archive.jsonl"):
    try:r=json.loads(l)
    except:continue
    rows.append(r)
rows+=json.load(open("data/grok-og.json"))
LANES=("recon-tog","recon-rej","recon-togp")
seen=set();T=[]
for r in rows:
    if r.get("lane") not in LANES or r.get("pnl") is None or not r.get("spotAt"): continue
    k=(r["lane"],r.get("ticker"));
    if k in seen: continue
    seen.add(k);T.append(r)
snaps={"btc":[],"gold":[]}
for l in open("data/band-log.jsonl"):
    try:s=json.loads(l)
    except:continue
    if s.get("asset") in snaps and s.get("at","")>="2026-10-24": snaps[s["asset"]].append((P(s["at"]),s))
keys={a:[x[0] for x in v] for a,v in snaps.items()}
st=collections.defaultdict(lambda:[0,0,0,0,0.0,0.0])
for r in T:
    a=r["asset"];t=P(r["at"]);i=bisect.bisect_right(keys[a],t)-1
    if i<0 or t-keys[a][i]>120: continue
    s=snaps[a][i][1];L=dict(s["L"]);spot=float(r["spotAt"]);up=r["side"]=="up"
    vw=L.get("fresh VWAP") or L.get("session VWAP");u1=L.get("fresh +1σ") or L.get("+1σ")
    if not(vw and u1): continue
    w=abs(u1-vw);tight=w<(150 if a=="btc" else 3)
    lines=sorted(set(v for v in L.values() if v))
    ahead=[p for p in lines if p>spot] if up else [p for p in reversed(lines) if p<spot]
    if len(ahead)<2: continue
    end=t+float(r.get("secondsLeft") or 900)
    j=bisect.bisect_right(keys[a],end)
    px=[x[1]["tick"] for x in snaps[a][i:j]]
    if not px: continue
    best=max(px) if up else min(px)
    r1=(best>=ahead[0]) if up else (best<=ahead[0]); r2=(best>=ahead[1]) if up else (best<=ahead[1])
    g=st[(a,"tight" if tight else "normal")]
    g[0]+=1;g[1]+=r1;g[2]+=r2;g[3]+=r["pnl"]>0;g[4]+=r["pnl"];g[5]+=abs(ahead[0]-spot)
for k,g in sorted(st.items()):
    print(k,f"trades {g[0]}  reached 1st band {g[1]/g[0]:.0%}  reached 2nd {g[2]/g[0]:.0%}  of those at 1st, went on to 2nd {g[2]/max(g[1],1):.0%}  win {g[3]/g[0]:.0%}  pnl {g[4]:+.0f}  avg dist to 1st {g[5]/g[0]:.2f}")
