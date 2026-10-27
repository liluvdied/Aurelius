import json,collections,datetime as dt,os,re
T=json.load(open(os.path.expanduser('~/lab/paperT.json')))
pt=lambda s:dt.datetime.fromisoformat(s.replace('Z','+00:00'))-dt.timedelta(hours=7)
lab=lambda s:(s or '').replace('−','-')
def agg(rows,key):
    o=collections.defaultdict(lambda:[0,0,0.0])
    for t in rows: x=o[key(t)]; x[0]+=1; x[1]+=t['profit']>0.05; x[2]+=t['profit']
    return o
def show(title,o,minn=8,sortby=2,top=40):
    print('--',title)
    for k,v in sorted(o.items(), key=lambda kv:kv[1][sortby])[:top]:
        if v[0]>=minn: print(f"   {str(k):46s} {v[0]:4d}  {v[1]/v[0]*100:5.1f}%  {v[2]:+9.2f}")
cur=[t for t in T if t['openedAt']>='2026-10-02T07:00']
print('Oct 2-11 PAPER', len(cur), sum(t['profit']>0.05 for t in cur), '%+.2f'%sum(t['profit'] for t in cur))
show('by asset',agg(cur,lambda t:t['asset']),1)
show('by setup (worst first)',agg(cur,lambda t:f"{t['asset']} {t['side']} {lab(t['patternLabel'])}"),6,top=25)
show('by hour PT',agg(cur,lambda t:pt(t['openedAt']).hour),1,sortby=0,top=30)
show('by price paid',agg(cur,lambda t:('<1.38x' if t['multiple']<1.38 else '1.38-1.5x' if t['multiple']<1.5 else '1.5-1.65x' if t['multiple']<1.65 else '1.65-2x' if t['multiple']<2 else '2x+')),1)
show('by result type',agg(cur,lambda t:t['result']),1)
w=[t for t in cur if t['profit']>0.05]; l=[t for t in cur if t['profit']<-0.05]
print('avg win %+.2f  avg loss %+.2f'%(sum(t['profit'] for t in w)/len(w), sum(t['profit'] for t in l)/len(l)))
show('loss exits (notes)',agg(l,lambda t:re.sub(r'[0-9.]+','#',(t.get('notes') or 'held to bell'))[:46]),5)
show('win exits (notes)',agg(w,lambda t:re.sub(r'[0-9.]+','#',(t.get('notes') or 'held to bell'))[:46]),5)
print('==== STAKES')
show('by stake size',agg(cur,lambda t:('$25 or less' if t['stake']<=25.01 else '$25-50' if t['stake']<=50 else '$50-100' if t['stake']<=100 else '$100+')),1)
big=[t for t in cur if t['stake']>25.01]
for t in sorted(big,key=lambda t:t['profit'])[:12]: print('  ',pt(t['openedAt']).strftime('%m-%d %H:%M'),t['asset'],t['side'],lab(t['patternLabel']),'stake',round(t['stake'],2),'%+.2f'%t['profit'],t['result'],(t.get('notes') or '')[:60])
s25=[t for t in cur if t['stake']<=25.01]
print('ONLY $25 tickets:',len(s25),sum(t['profit']>0.05 for t in s25),'%+.2f'%sum(t['profit'] for t in s25))
show('$25-only by asset',agg(s25,lambda t:t['asset']),1)
show('$25-only by day',agg(s25,lambda t:pt(t['openedAt']).strftime('%m-%d')),1,sortby=0)
