import json,collections,os,datetime as dt
os.chdir(os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius/data"))
S="2026-10-28T07:00"  # midnight PT today
B=["recon-tog","recon-rej","recon-togp","recon-np","recon-sov","recon-dly"]
rows={}
def take(x):
    if x.get("lane") in B and str(x.get("at",""))>=S and x.get("result") not in (None,"open") and x.get("pnl") is not None: rows[x["id"]]=x
for l in open("grok-og-archive.jsonl"):
    if '"recon-' in l and '2026-10-28T' in l:
        try: take(json.loads(l))
        except: pass
g=json.load(open("grok-og.json")); g=g if isinstance(g,list) else g.get("rows",[])
for x in g: take(x)
def hpt(at): return (dt.datetime.fromisoformat(at.replace("Z","+00:00"))-dt.timedelta(hours=7)).hour
T=collections.defaultdict(lambda:[0,0,0.0])  # (book,asset,hour)->n,w,pnl
tot=collections.defaultdict(lambda:[0,0,0.0])
for x in rows.values():
    k=(x["lane"],x["asset"],hpt(x["at"])); t=T[k]; t[0]+=1; t[1]+=x["pnl"]>0; t[2]+=x["pnl"]
    t=tot[(x["lane"],x["asset"])]; t[0]+=1; t[1]+=x["pnl"]>0; t[2]+=x["pnl"]
print("PAPER TODAY since midnight PT ($20 stake)")
for a in ("btc","gold"):
    print(a, " | ".join(f"{b[6:]} {tot[(b,a)][0]}t {round(100*tot[(b,a)][1]/max(tot[(b,a)][0],1))}% {tot[(b,a)][2]:+.0f}" for b in B))
hours=sorted(set(k[2] for k in T))
for a in ("btc","gold"):
    print("\n",a.upper(),"hour  "+"  ".join(f"{b[6:]:>6}" for b in B),"  best")
    for h in hours:
        vals={b:T[(b,a,h)][2] for b in B if T[(b,a,h)][0]}
        best=max(vals,key=vals.get) if vals else "-"
        print(f"{h:>4}  "+"  ".join(f"{T[(b,a,h)][2]:>+6.0f}" if T[(b,a,h)][0] else "     ." for b in B),"  ",best[6:])
