import json,os,datetime,glob
D=os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius/data/")
bars=json.load(open(D+'pivot-btc5.json'))['bars']; bars.sort(key=lambda b:b['t'])
print('bars',datetime.datetime.utcfromtimestamp(bars[0]['t']),datetime.datetime.utcfromtimestamp(bars[-1]['t']))
def piv(t,spot):
  cl=[b for b in bars if b['t']+300<=t][-60:]
  if len(cl)<20 or t-cl[-1]['t']>900: return None
  fo=[b for b in bars if b['t']<=t<b['t']+300]
  if fo: o=fo[0]['o']; cl=cl+[{'h':max(o,spot),'l':min(o,spot),'c':spot}]
  ema=None;rng=[]
  for x in cl:
    pp=(x['h']+x['l']+x['c'])/3; ema=pp if ema is None else pp*.25+ema*.75; rng.append(x['h']-x['l'])
  a=sum(rng[-7:])/7; return ema,ema-a,ema+a
own={}
for f in [D+'live-book-done.json']:
  d=json.load(open(f))
  for k,v in d.items():
    if v.get('orderId'): own[v['orderId']]=k.split(':')[1] if ':' in k else '?'
for l in open(D+'live-book-done-archive.jsonl'):
  try: v=json.loads(l)
  except: continue
  oid=v.get('orderId') or (v.get('rec') or {}).get('orderId'); key=v.get('key') or v.get('id') or ''
  if oid: own.setdefault(oid, key.split(':')[1] if key.count(':')>=1 else v.get('book','?'))
bp=json.load(open(D+'bid-paths.json'))
f=json.load(open(D+'live-fires.json')); f=f if isinstance(f,list) else f.get('rows',[])
def ts(a): return datetime.datetime.fromisoformat(a.replace('Z','+00:00')).timestamp()
rows=[]
for x in f:
  if x.get('asset')!='btc': continue
  p=bp.get(x['ticker']); 
  if not p or 0.1<p[-1][1]<0.9: continue
  t=ts(x['at']); z=piv(t,x['spot'])
  if not z: continue
  pp,s1,r1=z; s=x['spot']; side=x['side']
  if side=='down':
    if not(s1<s<pp): continue
    pos=(s-s1)/(pp-s1)
  else:
    if not(pp<s<r1): continue
    pos=1-(s-pp)/(r1-pp)   # distance from pink as share, mirror: long cut if (s-pp)/(r1-pp)>=1-g  -> pos<=g
  won=(p[-1][1]>=0.5)==(side=='up')
  pnl=(x['contracts']*(1 if won else 0))-x['cost']
  rows.append((x['at'],own.get(x.get('orderId'),'?'),side,round(pos,2),won,round(pnl,2)))
import collections
for bk in ['recon-tog','ALL']:
  R=[r for r in rows if bk=='ALL' or r[1]==bk]
  for lo,hi in [(0,.4),(.4,.5),(.5,1.01)]:
    S=[r for r in R if lo<pos<=hi] if False else [r for r in R if lo<r[3]<=hi]
    n=len(S); w=sum(r[4] for r in S); print(f"{bk:10s} zone {int(lo*100)}-{int(min(hi,1)*100)}%: {n} trades, win {100*w/max(n,1):.0f}%, ${sum(r[5] for r in S):+.2f}")
print(collections.Counter(r[1] for r in rows))
for r in rows:
  if .4<r[3]<=.5: print(r)
