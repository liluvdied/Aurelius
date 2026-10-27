import json,collections,os,datetime as dt
D=os.path.expanduser('~/mnt/Downloads/aurelius fixxd <3/Aurelius/data/')
lab=lambda s:(s or '').replace('−','-')
pt=lambda s:dt.datetime.fromisoformat(s.replace('Z','+00:00'))-dt.timedelta(hours=7)
T=json.load(open(os.path.expanduser('~/lab/paperT.json')))
P=[t for t in T if t['openedAt']>='2026-10-02T07:00' and t['stake']<=25.01]
pa=collections.defaultdict(lambda:[0,0,0.0])
for t in P: x=pa[(t['asset'],t['side'],lab(t['patternLabel']))]; x[0]+=1; x[1]+=t['profit']>0.05; x[2]+=t['profit']
pr=collections.defaultdict(lambda:[0,0,0.0])
for f in ('prime-paper.json','own-paper.json'):
    for r in json.load(open(D+f)):
        if r.get('result') not in ('yes','no') or not r.get('multiple'): continue
        x=pr[(r['asset'],r['side'],lab(r['pattern']))]; x[0]+=1; x[1]+=r['result']=='yes'; x[2]+=25*(r['multiple']-1) if r['result']=='yes' else -25
print('setup | PAPER n W% P&L | PRIME n W% P&L')
keys=set(pa)&set(pr)
for k in sorted(keys,key=lambda k:-(pa[k][2]+pr[k][2])):
    a=pa[k]; b=pr[k]
    if a[0]>=5 and b[0]>=4:
        tag='BOTH GREEN' if a[2]>0 and b[2]>0 else ('BOTH RED' if a[2]<0 and b[2]<0 else '')
        print(f"{' '.join(k):34s} | {a[0]:3d} {a[1]/a[0]*100:4.0f}% {a[2]:+7.2f} | {b[0]:3d} {b[1]/b[0]*100:4.0f}% {b[2]:+7.2f}  {tag}")
# what-ifs on paper $25
tot=lambda xs:(len(xs),sum(t['profit']>0.05 for t in xs),round(sum(t['profit'] for t in xs),2))
best={3,11,15,19,20,22}
print('paper $25 all', tot(P))
print('paper no silver', tot([t for t in P if t['asset']!='silver']))
print('paper best hours', tot([t for t in P if pt(t['openedAt']).hour in best]))
print('paper best hours, no silver', tot([t for t in P if pt(t['openedAt']).hour in best and t['asset']!='silver']))
green=[k for k in keys if pa[k][2]>0 and pr[k][2]>0 and pa[k][0]>=5 and pr[k][0]>=4]
print('paper both-green setups only', tot([t for t in P if (t['asset'],t['side'],lab(t['patternLabel'])) in green]))
