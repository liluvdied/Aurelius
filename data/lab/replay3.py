import sys,os,json,collections; sys.path.insert(0,os.path.expanduser("~/lab")); from acct import *
T,bell=load()
tkbook={}
def addb(k,v):
    if isinstance(v,dict) and v.get('status') in ('filled','partial'):
        tk=k.split(':')[0]; bk=k.split(':')[1]
        if tk not in tkbook or str(v.get('at'))<tkbook[tk][1]: tkbook[tk]=(bk,str(v.get('at')))
for k,v in json.load(open('live-book-done.json')).items(): addb(k,v)
for l in open('live-book-done-archive.jsonl'):
    try: x=json.loads(l)
    except: continue
    if isinstance(x,dict) and x.get('key'): addb(x['key'],x)
add={}
for l in open('addon-log.jsonl'):
    try: x=json.loads(l)
    except: continue
    if x.get('ok') and x.get('orderId'): add[x['orderId'][:13]]='add2' if x.get('add2') else 'twin' if 'twin' in str(x.get('why','')) else 'add1'
since,until=sys.argv[1],sys.argv[2]; E,A1,A2=map(float,sys.argv[3:6])
rows=[]
for tk,fs in T.items():
    if not(since<=fs[0]['t']<until): continue
    pnl,legs,cash,fee=trade(fs,bell.get(tk))
    if pnl is None or not legs: continue
    bk=tkbook.get(tk,('?',''))[0]
    C=sum(L[1] for L in legs.values()); cost=sum(L[2] for L in legs.values())
    val=(pnl+cost)/C if C else 0   # realized value per contract
    late=fs[0]['t']>='2026-10-28T08:16'; new=0; ent=0; kinds=[]
    for i,(o,(sd,c,sp)) in enumerate(legs.items()):
        kind=add.get(o) or ('entry' if i==0 else 'add1'); kinds.append(kind)
        lp=c*val-sp
        if kind=='entry': ent+=lp
        if bk=='recon-dly' or kind=='twin' or bk=='?': f=1
        elif kind=='entry': f=E/(3 if bk=='recon-np' else 5)
        elif kind=='add1': f=1 if bk=='recon-np' else A1/(7 if late else 8)
        else: f=A2/3
        new+=lp*f
    rows.append(dict(tk=tk,bk=bk,pnl=pnl,new=new,ent=ent,n=len(legs),entryCost=list(legs.values())[0][2]))
def st(rs,k):
    w=[r[k] for r in rs if r[k]>0.05]; l=[r[k] for r in rs if r[k]<=0.05]
    return f"n={len(rs)} W{len(w)} avg+{sum(w)/max(len(w),1):.2f} L{len(l)} avg{sum(l)/max(len(l),1):.2f} total {sum(r[k] for r in rs):.2f}"
print("ACTUAL ",st(rows,'pnl')); print("NEW    ",st(rows,'new'))
print("no add-on ",st([r for r in rows if r['n']==1],'pnl')); print("add-on    ",st([r for r in rows if r['n']>1],'pnl'))
print("entry legs total %.2f  add-on legs total %.2f  avg entry $%.2f"%(sum(r['ent'] for r in rows),sum(r['pnl']-r['ent'] for r in rows),sum(r['entryCost'] for r in rows)/len(rows)))
bb=collections.defaultdict(lambda:[0,0,0])
for r in rows: b=bb[r['bk']]; b[0]+=1;b[1]+=r['pnl'];b[2]+=r['new']
for k,v in sorted(bb.items(),key=lambda z:-z[1][1]): print(" ",k,v[0],round(v[1],2),round(v[2],2))
print("worst actual %.2f new %.2f"%(min(r['pnl'] for r in rows),min(r['new'] for r in rows)))
