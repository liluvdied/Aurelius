import json,collections,datetime as dt,os,re
D=os.path.expanduser('~/mnt/Downloads/aurelius fixxd <3/Aurelius/data/')
pt=lambda s:dt.datetime.fromisoformat(s.replace('Z','+00:00'))-dt.timedelta(hours=7)
lab=lambda s:(s or '').replace('−','-')
for f in ('prime-paper.json','own-paper.json'):
    R=[r for r in json.load(open(D+f)) if r.get('result') in ('yes','no') and r.get('multiple')]
    for r in R: r['_p']=25*(r['multiple']-1) if r['result']=='yes' else -25.0
    print(f"==== {f}: {len(R)} settled {pt(min(r['at'] for r in R)):%m-%d}->{pt(max(r['at'] for r in R)):%m-%d}  won {sum(r['result']=='yes' for r in R)}  held-to-bell {sum(r['_p'] for r in R):+.2f} ($25)")
    def show(title,key,minn=4):
        o=collections.defaultdict(lambda:[0,0,0.0])
        for r in R: x=o[key(r)]; x[0]+=1; x[1]+=r['result']=='yes'; x[2]+=r['_p']
        print('--',title)
        for k,v in sorted(o.items(), key=lambda kv:kv[1][2]):
            if v[0]>=minn: print(f"   {str(k):40s} {v[0]:3d} {v[1]/v[0]*100:5.1f}% {v[2]:+8.2f}")
    show('asset',lambda r:r['asset'],1)
    show('setup',lambda r:f"{r['asset']} {r['side']} {lab(r['pattern'])}",4)
    show('hour PT',lambda r:pt(r['at']).hour,3)
    show('price',lambda r:('<1.5x' if r['multiple']<1.5 else '1.5-2x' if r['multiple']<2 else '2-3x' if r['multiple']<3 else '3x+'),1)
    show('kind',lambda r:re.sub(r'[+-]?[0-9.]+σ|VWAP','*',lab(r['pattern'])),3)
