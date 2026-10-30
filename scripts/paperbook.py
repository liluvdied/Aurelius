import json,collections,datetime as dt,os
D=os.path.expanduser('~/mnt/Downloads/aurelius fixxd <3/Aurelius/data/')
T=[t for t in json.load(open(D+'live-paper-book.json'))['trades'] if t.get('source')=='paper' and t.get('result')!='open' and t.get('profit') is not None]
T.sort(key=lambda t:t['openedAt'])
pt=lambda s:dt.datetime.fromisoformat(s.replace('Z','+00:00'))-dt.timedelta(hours=7)
for t in T: t['_pt']=pt(t['openedAt']); t['_w']=t['profit']>0.05
lab=lambda s:(s or '').replace('−','-')
print('PAPER closed', len(T), 'won', sum(t['_w'] for t in T), 'P&L %+.2f'%sum(t['profit'] for t in T), T[0]['_pt'].date(), '->', T[-1]['_pt'].date())
# by day
by=collections.defaultdict(lambda:[0,0,0.0])
for t in T: x=by[t['_pt'].strftime('%m-%d %a')]; x[0]+=1; x[1]+=t['_w']; x[2]+=t['profit']
print('-- by day'); [print(' ',k,v[0],'W',v[1],'%+.2f'%v[2]) for k,v in sorted(by.items())]
# streaks
streaks=[]; cur=None
for t in T:
    s='W' if t['_w'] else 'L'
    if cur and cur['k']==s: cur['n']+=1; cur['p']+=t['profit']; cur['end']=t['_pt']; cur['rows'].append(t)
    else:
        cur={'k':s,'n':1,'p':t['profit'],'start':t['_pt'],'end':t['_pt'],'rows':[t]}; streaks.append(cur)
big=sorted([s for s in streaks if s['n']>=6], key=lambda s:s['start'])
print('-- streaks of 6+')
for s in big:
    labs=collections.Counter(lab(r['patternLabel']) for r in s['rows']).most_common(3)
    assets=collections.Counter(r['asset'] for r in s['rows'])
    sides=collections.Counter(r['side'] for r in s['rows'])
    mult=sum(r['multiple'] for r in s['rows'])/s['n']
    print(f"  {s['k']}x{s['n']:2d} {s['p']:+8.2f} {s['start']:%m-%d %H:%M}->{s['end']:%H:%M} {dict(assets)} {dict(sides)} avg {mult:.2f}x | {labs}")
json.dump([{k:v for k,v in t.items() if not k.startswith('_')} for t in T],open(os.path.expanduser('~/lab/paperT.json'),'w'))
