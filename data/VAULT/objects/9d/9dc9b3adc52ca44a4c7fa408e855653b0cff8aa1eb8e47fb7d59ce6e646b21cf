# APPROACH PAPER TWIN (Oct 25 ~11:52 PM PT, Love: "for the rejection model we just have her enter in at a band without waiting for the flip ... let's start a new paper twin
# that just enters when price is approaching"). READ-ONLY on the desk: reads data/snipes/paths (bid paths ~10 s, archived by snipe-tracker - run AFTER it), band-log and grok-og;
# writes only data/approach/. Rule: first time in a Kalshi 15m window (15 s in, 3+ min left) price moves TOWARD an unbroken session band or the pink within $10 BTC / 50c gold
# -> fade it (short from below, long from above) at that moment's ask, $20 paper, held to settlement. Compared against the rejection model's own $20 paper on the same windows.
import os
os.chdir(os.path.expanduser("~/mnt/Desktop/aurelius fixxd <3/Aurelius")); os.makedirs("data/approach", exist_ok=True)
import json,bisect,collections,datetime,re
from zoneinfo import ZoneInfo
PT=ZoneInfo("America/Los_Angeles")
ts=lambda s: datetime.datetime.fromisoformat(re.sub(r'\.\d+','',s).replace('Z','+00:00')).timestamp()
W={}
for l in open('data/snipes/windows.jsonl'):
  try: r=json.loads(l); W[r['ticker']]=r['won']
  except: pass
B=collections.defaultdict(list)
for l in open('data/band-log.jsonl'):
  try: r=json.loads(l)
  except: continue
  if r['at']<'2026-10-19T23': continue
  B[r['asset']].append((ts(r['at']),dict((n,p) for n,p in r['L'] if p)))
BT={a:[x[0] for x in v] for a,v in B.items()}
def bandsAt(a,t):
  i=bisect.bisect_right(BT[a],t)-1
  return B[a][i][1] if i>=0 and t-BT[a][i]<=120 else {}
REJ={'gold':[0,2,3,4,7,8,9,13,17,18,21,23],'btc':[0,2,3,4,7,10,13,15,17,18,19,20,21,22,23]}
LSKIP={'gold':{4,13},'btc':{8,18}}
rows={}
def take(r):
  if isinstance(r,dict) and r.get('lane')=='recon-rej' and r.get('pnl') is not None and r.get('result') in('win','loss','sold'): rows[r['ticker']]=r
for l in open('data/grok-og-archive.jsonl'):
  try: take(json.loads(l))
  except: pass
d=json.load(open('data/grok-og.json')); rs=d if isinstance(d,list) else d.get('rows',d); rs=rs if isinstance(rs,list) else list(rs.values())
for r in rs: take(r)
S=collections.defaultdict(lambda:[0,0,0.0]); trades=[]; LED=[]
for fn in os.listdir('data/snipes/paths'):
  tk=fn[:-5]; a='btc' if tk.startswith('KXBTC15M') else 'gold' if tk.startswith('KXGOLD15M') else None
  if not a or tk not in W: continue
  p=json.load(open('data/snipes/paths/'+fn))
  if not p: continue
  close=p[-1][0]; 
  m=re.search(r'26OCT(\d\d)(\d\d)(\d\d)',tk)
  ce=datetime.datetime(2026,10,int(m.group(1)),int(m.group(2)),int(m.group(3)),tzinfo=ZoneInfo('America/New_York')).timestamp()
  op=ce-900; hr=datetime.datetime.fromtimestamp(op+1,PT)
  if hr < datetime.datetime(2026,10,20,tzinfo=PT): continue
  reach=10 if a=='btc' else 0.5; pv=None; tr=None
  for t,bu,bd,s in p:
    if t<op+15 or ce-t<180: pv=s; continue
    L=bandsAt(a,t)
    if not L or pv is None: pv=s; continue
    for n,b in L.items():
      if not re.search(r'σ$|VWAP$|^5m PP$',n): continue
      if s<b and b-s<=reach and s>pv: tr=('down',1-bu,n,t,s); break
      if s>b and s-b<=reach and s<pv: tr=('up',1-bd,n,t,s); break
    if tr: break
    pv=s
  key='rejHr' if hr.hour in REJ[a] and hr.hour not in LSKIP[a] else 'other'
  rr=rows.get(tk)
  if rr:
    pp=float(rr['pnl'])*20/float(rr.get('stake') or 20); x=S[('rej paper',a,key)]; x[0]+=1; x[1]+=pp>0; x[2]+=pp
  if tr:
    side,ask,n,t,s=tr
    if not(0.05<=ask<=0.9): continue
    pnl=20*(1/ask-1)*0.97 if W[tk]==side else -20
    x=S[('approach',a,key)]; x[0]+=1; x[1]+=pnl>0; x[2]+=pnl
    LED.append({'ticker':tk,'asset':a,'hourPT':hr.hour,'rejHour':key=='rejHr','side':side,'ask':round(ask,3),'band':n,'at':datetime.datetime.fromtimestamp(t,PT).isoformat(),'spot':s,'won':W[tk],'pnl':round(pnl,2),'rejPaper':(round(float(rows[tk]['pnl'])*20/float(rows[tk].get('stake') or 20),2) if tk in rows else None)})
LED.sort(key=lambda r:r['at'])
with open('data/approach/ledger.jsonl','w') as f:
  for r in LED: f.write(json.dumps(r)+'\n')
out=['# Approach paper twin vs rejection model ($20 paper, held to settlement)','','Since Mon Oct 20 PT. rejHr = the asset\'s live rejection hours (fix243 map).','','| book | asset | hours | trades | win | P&L |','|---|---|---|---|---|---|']
for k in sorted(S): n,w,p=S[k]; out.append(f"| {k[0]} | {k[1]} | {k[2]} | {n} | {w/n*100:.0f}% | {p:+.2f} |")
since=[r for r in LED if r['at']>='2026-10-26T00:00']
if since: out+=['',f"Live-forward since Mon Oct 26 12 AM PT: {len(since)} trades, {sum(r['pnl']>0 for r in since)} wins, {sum(r['pnl'] for r in since):+.2f}"]
open('data/approach/REPORT.md','w').write('\n'.join(out)+'\n'); print('\n'.join(out))
