exec(open(__import__('os').path.expanduser('~/lab/pivot.py')).read().split("for asset,f in")[0])
import bisect
books=('brick','brickc','squeeze','refined','cotc','diamond','dcd')
res=collections.defaultdict(lambda:[0,0,0.0])
for asset,f in (('btc','pivot-btc5.json'),('gold','pivot-gold5.json')):
    P=pivots(bars(f)); T=[p['t']+300 for p in P]
    for r in rows.values():
        if r.get('book') not in books or r.get('asset')!=asset or r.get('pnl') is None: continue
        tk=r['id'].split(':')[0]; ts=dt.datetime.fromisoformat(r['at'].replace('Z','+00:00')).timestamp()
        m=tape.get(tk,{}).get(int(ts)//60*60) or tape.get(tk,{}).get(int(ts)//60*60-60)
        if not m or not m.get('tgt'): continue
        spot=m['spot']; K=m['tgt']; i=bisect.bisect_right(T,ts)-1
        if i<10: continue
        b=P[i]; up=r['side']=='up'; lv=[b['pp'],b['r1'],b['r2'],b['s1'],b['s2']]
        lo,hi=min(spot,K),max(spot,K)
        between=any(lo<L<hi for L in lv) and ((up and spot<K) or ((not up) and spot>K))
        room=0.5*b['rng']
        front=any((spot<L<=spot+room) if up else (spot-room<=L<spot) for L in lv)
        trend=(spot>b['pp']) if up else (spot<b['pp'])
        for key in (('pivot wall to the strike' if between else 'no pivot wall'),('pivot band right in front' if front else 'nothing right in front'),('with the pivot (right side of PP)' if trend else 'against the pivot')):
            x=res[(key)]; x[0]+=1; x[1]+=r['pnl']>0.05; x[2]+=r['pnl']
for k in ('no pivot wall','pivot wall to the strike','nothing right in front','pivot band right in front','with the pivot (right side of PP)','against the pivot'):
    v=res[k]; print(f"{k:36s} {v[0]:4d} trades  won {v[1]/max(1,v[0])*100:5.1f}%  {v[2]:+9.2f}")
