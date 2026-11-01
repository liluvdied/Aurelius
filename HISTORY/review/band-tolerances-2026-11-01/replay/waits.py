import json,re,pickle,math,statistics as st,collections
import build  # reuses snap/at/close_t (rebuilds rows.pkl too)
from build import at,close_t,ts,U
SIG={'btc': 3.1076, 'gold': 0.09647}
N=lambda x:0.5*(1+math.erf(x/math.sqrt(2)))
def fam(w):
    if re.search(r'PINK TO (GREEN|RED)',w): return None
    if re.search(r'THE PINK in the read|PINK CUSHION|PINK \d+%|UNBROKEN PINK|OVER THE PINK|UNDER THE PINK|5m PP \(|BROKE IT THIS CANDLE',w): return 'pink'
    if re.search(r'HER THIRDS|top third|bottom third|TOP RUNG|[+-]\d?σ \(|session band|TARGET PAST A BAND',w): return 'sess'
    return None
MAIN=build.MAIN
seen=set(); out=[]
for l in open(U+'recon-skips.jsonl'):
    try:d=json.loads(l)
    except:continue
    f=fam(d.get('why',''))
    if not f or d.get('side') not in('up','down') or d.get('lane') not in MAIN: continue
    tk=d['ticker'];a='btc' if 'BTC' in tk else 'gold';t=ts(d['at'])
    k=(tk,d['side'],int(t//60),f)
    if k in seen: continue
    seen.add(k)
    ct=close_t(tk)
    if not ct or t>=ct: continue
    s=at(a,t);e=at(a,ct,60,False);o=at(a,ct-900,60,False)
    if not s or not e or not o: continue
    tick=s[1];L=s[2]; sess=[p for n,p in L.items() if n.endswith('σ') or n=='session VWAP']
    A=[p for p in sess if p>tick];B=[p for p in sess if p<tick]
    if not A or not B: continue
    sa,sb=min(A),max(B);W=sa-sb;dirn=1 if d['side']=='up' else -1
    pu=N((tick-o[1])/(SIG[a]*math.sqrt(ct-t))); fair=pu if d['side']=='up' else 1-pu
    win=(e[1]-o[1])*dirn>0
    out.append(dict(asset=a,fam=f,why=d['why'],label=d.get('label',''),side=d['side'],tk=tk,t=t,W=W,tick=tick,pink=L.get('5m PP'),sa=sa,sb=sb,left=ct-t,fair=fair,win=win,move=(e[1]-tick)*dirn,lane=d['lane']))
pickle.dump(out,open('waits.pkl','wb')); print(len(out),collections.Counter((r['asset'],r['fam']) for r in out))
