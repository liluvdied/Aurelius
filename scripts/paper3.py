exec(open(__import__('os').path.expanduser('~/lab/paper2.py')).read().split("print('Oct 2-11")[0])
s25=[t for t in cur if t['stake']<=25.01]
d9=[t for t in s25 if pt(t['openedAt']).strftime('%m-%d')=='10-09']
show('Oct 9 by hour',agg(d9,lambda t:pt(t['openedAt']).hour),1,sortby=0,top=30)
show('Oct 9 by asset',agg(d9,lambda t:t['asset']),1)
# streak analysis in $25-only
T2=sorted(s25,key=lambda t:t['openedAt']); runs=[]; cur2=None
for t in T2:
    k='W' if t['profit']>0.05 else 'L'
    if cur2 and cur2[0]==k: cur2[1].append(t)
    else: cur2=[k,[t]]; runs.append(cur2)
print('-- $25 loss streaks of 5+')
for k,rs in runs:
    if k=='L' and len(rs)>=5:
        a=pt(rs[0]['openedAt']); b=pt(rs[-1]['openedAt'])
        print(f"  L{len(rs)} {sum(t['profit'] for t in rs):+.0f} {a:%m-%d %H:%M}->{b:%H:%M} assets {dict(collections.Counter(t['asset'] for t in rs))} sides {dict(collections.Counter(t['side'] for t in rs))} mins {round((b-a).total_seconds()/60)}")
# hours table for $25 only, split halves
SPLIT='2026-10-07T07:00'
o=collections.defaultdict(lambda:[0,0,0.0,0,0.0])
for t in s25:
    h=pt(t['openedAt']).hour; x=o[h]; x[0]+=1; x[1]+=t['profit']>0.05; x[2]+=t['profit']
    if t['openedAt']<SPLIT: x[3]+=t['profit']
    else: x[4]+=t['profit']
print('-- $25-only by hour (A=Oct2-6, B=Oct7-11)')
for h in range(24):
    x=o[h]; 
    if x[0]: print(f"   {h:2d}  {x[0]:3d} {x[1]/x[0]*100:5.1f}%  {x[2]:+8.2f}  A {x[3]:+7.2f}  B {x[4]:+7.2f}")
show('$25-only by setup family',agg(s25,lambda t:f"{t['asset']} {t['side']} {re.sub(r'[+-]?[0-9.]+σ|VWAP','*',lab(t['patternLabel']))}"),10,top=20)
show('$25-only by band',agg(s25,lambda t:f"{t['asset']} {re.findall(r'[+-]?[0-9.]+σ|VWAP',lab(t['patternLabel']))[:1]}"),10,top=40)
