import json,os,datetime,collections
D=os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius/data/")
B={a:{b['t']:b for b in json.load(open(D+f'pivot-{a}1.json'))['bars']} for a in ('btc','gold')}
bp=json.load(open(D+'bid-paths.json'))
f=json.load(open(D+'live-fires.json')); f=f if isinstance(f,list) else f.get('rows',[])
def ts(a): return datetime.datetime.fromisoformat(a.replace('Z','+00:00')).timestamp()
R=collections.defaultdict(lambda:[0,0,0.0])
rows=[]
for x in f:
  a=x.get('asset'); p=bp.get(x['ticker'])
  if a not in B or not p or 0.1<p[-1][1]<0.9: continue
  t=ts(x['at']); s=x['spot']; up=x['side']=='up'; fl={}
  ok=True
  for n in (1,2,3,4,5):
    f0=int(t//(n*60))*n*60; b=B[a].get(f0)
    if not b: ok=False;break
    fl[n]=(s>b['o']) if up else (s<b['o'])
  if not ok: continue
  won=(p[-1][1]>=0.5)==up; pnl=x['contracts']*won-x['cost']
  if fl[1] and not any(fl[n] for n in (2,3,4,5)): k='1m ONLY flipped'
  elif any(fl[n] for n in (2,3)) and not fl[5]: k='2m/3m flipped (5m not)'
  elif fl[5]: k='5m flipped'
  elif fl[4]: k='4m only'
  else: k='no candle flipped'
  for kk in (k,'ALL'):
    R[kk][0]+=1; R[kk][1]+=won; R[kk][2]+=pnl
  if any(fl[n] for n in (2,3,5)): R['any 2/3/5m flipped'][0]+=1; R['any 2/3/5m flipped'][1]+=won; R['any 2/3/5m flipped'][2]+=pnl
for k,(n,w,s) in sorted(R.items()): print(f"{k:26s} {n:4d} trades  win {100*w/max(n,1):3.0f}%  ${s:+8.2f}  ${s/max(n,1):+.2f}/trade")
