import json,collections,os
os.chdir(os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius/data"))
def load():
    F={};bell={}
    for f in ("kalshi-history.json","kalshi-audit.json"):
        a=json.load(open(f))
        for x in a["fills"]: F[(x["t"][:19],x.get("order","")[:13],x["ticker"],x["action"],x["side"],x["count"])]=x
        for s in a["settlements"]:
            if s.get("result") in ("yes","no"): bell[s["ticker"]]=s["result"]
    T=collections.defaultdict(list)
    for x in F.values():
        if "15M" in x["ticker"]: T[x["ticker"]].append(x)
    for v in T.values(): v.sort(key=lambda x:x["t"])
    return T,bell
def trade(fs,bell_r):
    """riskguard accounting. returns pnl(None if open), side, legs [(order,contracts,cost)] of opening fills"""
    cash=pos=no=fee=0; legs=collections.OrderedDict()
    for x in fs:
        c=float(x["count"]);y=float(x["yes"]);k=x["action"]+"|"+x["side"];fee+=float(x.get("fee") or 0)
        o=x.get("order","")[:13]
        if k=="buy|no": cash-=c*(1-y); no+=c; L=legs.setdefault(o,["down",0,0]); L[1]+=c; L[2]+=c*(1-y)
        elif k=="sell|yes": cash+=c*(1-y); no-=c
        elif x["action"]=="buy": cash-=c*y; pos+=c; L=legs.setdefault(o,["up",0,0]); L[1]+=c; L[2]+=c*y
        else:
            cash+=c*y; pos-=c
            if pos< -0.01: L=legs.setdefault(o,["down",0,0]); L[1]+=c; L[2]+=c*(1-y)  # opening short yes = long no
    flat=abs(pos)<0.01 and abs(no)<0.01
    if flat: pnl=cash-fee
    elif bell_r: pnl=cash+pos*(bell_r=="yes")+no*(bell_r=="no")-fee
    else: pnl=None
    return pnl,legs,cash,fee
