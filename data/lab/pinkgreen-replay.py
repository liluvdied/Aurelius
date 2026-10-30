# Read-only replay (Love Oct 28 2026 5:36 PM PT card "Look at the numbers first"): every gold SHORT the PINK TO GREEN wall blocked
# on main / rejection / copy (first block per window per book), split by whether price had touched pink (within 30c) earlier in that
# window, and how the window settled. Writes data/lab/pinkgreen-replay.json only.
import json,re,collections,sys
W=json.load(open("data/window-results.json"))
try:
    for r in json.load(open("data/grok-og.json")):
        t=str(r.get("ticker",""))
        if t.startswith("KXGOLD") and t not in W and r.get("result") in("win","loss") and r.get("side") in("up","down"):
            W[t]="yes" if (r["side"]=="up")==(r["result"]=="win") else "no"
except Exception: pass
hi=collections.defaultdict(list); blocks={}
for f in ("data/archive/band-lock-upto-2026-10-27-1005PM-PT.jsonl","data/band-lock.jsonl"):
    for l in open(f):
        if '"gold"' not in l: continue
        try: r=json.loads(l)
        except Exception: continue
        if not r.get("id") or not r.get("tick"): continue
        tk=r["id"].split(":")[0]
        if not tk.startswith("KXGOLD"): continue
        hi[tk].append((r["at"],float(r["tick"])))
        w=r.get("reason","")
        if r.get("side")=="down" and w.startswith("PINK TO GREEN") and r.get("book") in("recon-tog","recon-togp","recon-rej"):
            k=(tk,r["book"])
            if k not in blocks: blocks[k]=r
out=collections.defaultdict(lambda:{"win":0,"loss":0,"unknown":0}); rows=[]
for (tk,b),r in blocks.items():
    m=re.search(r'pink ([\d.]+) space',r["reason"]); pc=re.search(r'at (\d+)%',r["reason"])
    if not m or not pc: continue
    pink=float(m.group(1)); pct=int(pc.group(1))
    touched=any(p>=pink-0.30 for a,p in hi[tk] if a<=r["at"])
    res=W.get(tk); o="unknown" if res is None else ("win" if res=="no" else "loss")
    key=f"{b} | {'pink touched' if touched else 'no touch'} | {'50%+' if pct>=50 else 'under 50%'}"
    out[key][o]+=1; rows.append({"at":r["at"],"ticker":tk,"book":b,"pct":pct,"touched":touched,"short":o})
json.dump({"buckets":out,"rows":rows},open("data/lab/pinkgreen-replay.json","w"),indent=1)
print("from",min(x["at"] for x in rows) if rows else None)
for k in sorted(out): print(k,dict(out[k]))
u=collections.defaultdict(lambda:[0,0])
seen=set()
for x in rows:
    if (x["ticker"],x["touched"]) in seen or x["short"]=="unknown": continue
    seen.add((x["ticker"],x["touched"])); u[x["touched"]][0 if x["short"]=="win" else 1]+=1
print("unique windows: touched",u[True],"no touch",u[False])
