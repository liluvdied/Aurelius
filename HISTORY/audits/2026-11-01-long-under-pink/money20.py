# Real Kalshi money per window, scaled so every window had $20 put in (all buys that window, add-ons included). Source: data/kalshi-history.json (Kalshi's own fills + settlements)
# Counts: buy|yes = YES bought at yes; sell|no = NO bought at (1-yes); checked against settlement yes/no counts.
import json,collections,statistics as st,sys
U="/mnt/user-data/uploads/Desktop/aurelius fixxd <3/Aurelius/data/"
d=json.load(open(U+"kalshi-history.json"))
FA=[json.loads(l) for l in open(U+"fill-audit.jsonl") if l.strip()]
book={}
for r in FA:
    if r.get("ticker") and r.get("book"): book.setdefault(r["ticker"],r["book"])
T=collections.defaultdict(list)
for f in d["fills"]:
    if f["ticker"].startswith(("KXBTC15M","KXGOLD15M")) and f["t"]>="2026-10-20": T[f["ticker"]].append(f)
S={s["ticker"]:s for s in d["settlements"]}
bad=0;rows=[]
for tk,fs in T.items():
    s=S.get(tk)
    if not s: continue
    fs.sort(key=lambda f:f["t"]); Y=N=cost=fee=0.0; first=None
    for f in fs:
        c=float(f["count"]);p=float(f["yes"]);fee+=float(f["fee"])
        isY={"buy|yes":True,"sell|no":False,"buy|no":False,"sell|yes":True}[f["action"]+"|"+f["side"]]
        if isY: Y+=c; cost+=c*p
        else: N+=c; cost+=c*(1-p)
        if first is None: first=isY
    if abs(Y-float(s["yesCount"]))>0.02 or abs(N-float(s["noCount"]))>0.02: bad+=1; continue
    pairs=min(Y,N); win=(Y-pairs) if s["result"]=="yes" else (N-pairs)
    pnl=pairs+win-cost-fee
    ent=sum(float(f["count"])*(float(f["yes"]) if first else 1-float(f["yes"])) for f in fs if ({"buy|yes":True,"sell|no":False,"buy|no":False,"sell|yes":True}[f["action"]+"|"+f["side"]])==first)
    if ent<=0: continue
    rows.append(dict(tk=tk,a="BTC" if "BTC" in tk else "Gold",book=book.get(tk,"(before her fill log, Oct 20-30)"),pnl=pnl,ent=ent,cost=cost,p20=pnl*20/cost))
print("windows checked",len(rows),"skipped (counts did not match Kalshi):",bad)
def line(n,Z):
    if not Z: return
    w=sum(1 for r in Z if r["pnl"]>0)
    print(f"| {n} | {len(Z)} | {100*w/len(Z):.0f}% | ${sum(r['pnl'] for r in Z):+.2f} | ${st.mean(r['p20'] for r in Z):+.2f} | ${sum(r['p20'] for r in Z):+.2f} |")
print("| | Windows | Made money | Real $ (as traded) | Avg per trade at $20 | Total at $20 |\n|---|---|---|---|---|---|")
for a in ("BTC","Gold"): line(a,[r for r in rows if r["a"]==a])
line("All",rows)
print("\nBy book (windows the desk logged):")
print("| | Windows | Made money | Real $ (as traded) | Avg per trade at $20 | Total at $20 |\n|---|---|---|---|---|---|")
for b in sorted(set(r["book"] for r in rows)): line(b,[r for r in rows if r["book"]==b])
