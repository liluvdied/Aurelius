import json,bisect,re,pickle,datetime as dt
from zoneinfo import ZoneInfo
U="/mnt/user-data/uploads/Desktop/aurelius fixxd <3/Aurelius/data/"
ET=ZoneInfo("America/New_York")
def ts(s): return dt.datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()
snap={'btc':[],'gold':[]}
for l in open(U+'band-log.jsonl'):
    try:d=json.loads(l)
    except:continue
    L={n:p for n,p in d['L']}; bb=d.get('bbsr') or {}
    snap[d['asset']].append((ts(d['at']),d['tick'],L,bb.get('u'),bb.get('l')))
for a in snap: snap[a].sort(key=lambda x:x[0])
T={a:[x[0] for x in snap[a]] for a in snap}
def at(a,t,maxgap=90,before=True):
    i=bisect.bisect_right(T[a],t)
    cands=[]
    if i>0: cands.append(i-1)
    if not before and i<len(T[a]): cands.append(i)
    best=None
    for j in cands:
        g=abs(T[a][j]-t)
        if g<=maxgap and (best is None or g<best[0]): best=(g,j)
    return snap[a][best[1]] if best else None
def close_t(tk):
    m=re.match(r'KX(BTC|GOLD)15M-(\d\d)([A-Z]{3})(\d\d)(\d\d)(\d\d)',tk)
    if not m: return None
    mon=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].index(m.group(3))+1
    d=dt.datetime(2000+int(m.group(2)),mon,int(m.group(4)),int(m.group(5)),int(m.group(6)),tzinfo=ET)
    return d.timestamp()
MAIN={'recon-tog','recon-rej','recon-togr','recon-rejx','recon-top','recon-togp','recon-og','recon-np','recon-sov','recon-npo','recon-dly','recon-paper','recon-b2'}
cands={}
def add(asset,tk,side,t,src,lane,why,paid=None):
    if side not in('up','down') or lane not in MAIN: return
    k=(tk,side,int(t//60))
    if k in cands and cands[k]['src']=='fill': return
    if k in cands and src!='fill': return
    cands[k]=dict(asset=asset,tk=tk,side=side,t=t,src=src,lane=lane,why=why,paid=paid)
for l in open(U+'recon-skips.jsonl'):
    try:d=json.loads(l)
    except:continue
    tk=d.get('ticker','');a='btc' if 'BTC' in tk else 'gold'
    add(a,tk,d.get('side'),ts(d['at']),'skip',d.get('lane'),d.get('why',''))
for l in open(U+'fill-audit.jsonl'):
    try:d=json.loads(l)
    except:continue
    if 'side' not in d: continue
    tk=d['ticker'];a=d['asset']
    add(a,tk,d['side'],ts(d['at']),'fill',d.get('book'),d.get('label',''),d.get('paid'))
rows=[]
for c in cands.values():
    ct=close_t(c['tk']);
    if not ct or c['t']>=ct: continue
    s=at(c['asset'],c['t']); e=at(c['asset'],ct,60,before=False); o=at(c['asset'],ct-900,60,before=False)
    if not s or not e or not o: continue
    tick=s[1];L=s[2]
    sess=[p for n,p in L.items() if n.endswith('σ') or n=='session VWAP']
    A=[p for p in sess if p>tick]; B=[p for p in sess if p<tick]
    if not A or not B: continue
    a=min(A);b=max(B);W=a-b
    dirn=1 if c['side']=='up' else -1
    r=dict(c,tick=tick,W=W,sa=a,sb=b,pink=L.get('5m PP'),r1=L.get('5m R1'),r2=L.get('5m R2'),s1=L.get('5m S1'),s2=L.get('5m S2'),bu=s[3],bl=s[4],close=e[1],strike=o[1],left=ct-c['t'])
    r['move']=(e[1]-tick)*dirn; r['win']=(e[1]-o[1])*dirn>0; r['cont']=r['move']>0
    rows.append(r)
pickle.dump(rows,open('/tmp/claude-0/-home-claude-aurelius/3952c805-6a7a-5665-898a-c18d4270877a/scratchpad/rep/rows.pkl','wb'))
import collections
print(len(rows),collections.Counter((r['asset'],r['src']) for r in rows))
f=[r for r in rows if r['src']=='fill']; print('fills win',sum(r['win'] for r in f)/max(1,len(f)),'cont',sum(r['cont'] for r in f)/max(1,len(f)))
