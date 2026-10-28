import json,re,datetime,sys
D="/Users/liluv/Desktop/aurelius fixxd <3/Aurelius/data/"
import os; D=os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius/data/")
b=json.load(open(D+'bid-paths.json'))
paths={k:v for k,v in b.items() if k.startswith('KXBTC15M') and len(v)>5}
spans=sorted((v[0][0],v[-1][0],k) for k,v in paths.items())
reads=[json.loads(l) for l in open(D+'rej-reads.jsonl')]
def ts(a): return datetime.datetime.fromisoformat(a.replace('Z','+00:00')).timestamp()
EYES=re.compile(r'σ|VWAP|Bollinger|Green zone|Red zone'); NOT=re.compile(r'PP|pink|purple|nav|R1|R2|S1|S2',re.I)
BAND=re.compile(r'^(Rejected (up|down) off|Failed break (above|below)|Tap-reject at|1m rejection off)',re.I)
def kind(l):
  if re.search('third',l,re.I): return 'third'
  if BAND.search(l): return 'eyes' if EYES.search(l) and not NOT.search(l) else 'other'
  return None
V={'A band reads only (her eyes)':{'eyes'},'B her eyes + thirds':{'eyes','third'},'C every rejection read incl pink/PP':{'eyes','other'},'D thirds alone':{'third'}}
since=sys.argv[1] if len(sys.argv)>1 else '2000'
res={}
for name,ok in V.items():
  taken={};
  for r in reads:
    if r['at']<since: continue
    k=kind(r['label']);
    if k not in ok: continue
    t=ts(r['at']); tk=None
    for a,z,kk in spans:
      if a<=t<=z and z-t>30: tk=kk;break
    if not tk or tk in taken: continue
    p=paths[tk]; q=min(p,key=lambda x:abs(x[0]-t))
    ask=round((1-q[2] if r['side']=='up' else 1-q[1])+0.01,2)
    if not(0.05<=ask<=0.75): continue
    fin=p[-1]; won=(fin[1]>=0.5) if r['side']=='up' else (fin[1]<0.5)
    if p[-1][0]<t+60 or 0.1<fin[1]<0.9: continue  # unsettled
    c=10/ask; fee=0.07*ask*(1-ask)*c
    pnl=(c-10 if won else -10)-fee
    taken[tk]=(r['at'],r['side'],ask,won,round(pnl,2),r['label'][:40])
  res[name]=taken
  n=len(taken); w=sum(1 for v in taken.values() if v[3]); s=sum(v[4] for v in taken.values())
  print(f"{name:40s} trades {n:3d} win {100*w/max(n,1):3.0f}%  ${s:+8.2f}  per trade ${s/max(n,1):+.2f}")
