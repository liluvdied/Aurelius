import pickle,statistics as st,collections
W=pickle.load(open('waits.pkl','rb')); R=pickle.load(open('rows2.pkl','rb'))
F=[r for r in R if r['src']=='fill' and r['paid']]
def ret_model(r): return (1/r['fair'] if r['win'] else 0)-1
def ret_real(r): return (1/r['paid'] if r['win'] else 0)-1
print('FILLS taken n',len(F),'win',round(st.mean(r['win'] for r in F),3),'real ret/$1',round(st.mean(ret_real(r) for r in F),3),'model ret',round(st.mean(ret_model(r) for r in F),3),'avg paid',round(st.mean(r['paid'] for r in F),3),'avg fair',round(st.mean(r['fair'] for r in F),3))
for a in ('btc','gold'):
  Fa=[r for r in F if r['asset']==a]; print(' fills',a,len(Fa),'win',round(st.mean(r['win'] for r in Fa),3),'real',round(st.mean(ret_real(r) for r in Fa),3),'model',round(st.mean(ret_model(r) for r in Fa),3))
# first blocked read per window per family, tradable
BK={'btc':[(0,100),(100,200),(200,350),(350,500),(500,1e9)],'gold':[(0,5),(5,10),(10,20),(20,1e9)]}
first={}
for r in sorted(W,key=lambda r:r['t']):
    k=(r['tk'],r['side'],r['fam'])
    if k not in first: first[k]=r
X=list(first.values())
pickle.dump(X,open('waits_first.pkl','wb'))
for fam in ('pink','sess'):
  for a in ('btc','gold'):
    Y=[r for r in X if r['fam']==fam and r['asset']==a]
    T=[r for r in Y if 0.05<=r['fair']<=0.667]
    print(f"\n{fam} {a}: reads {sum(1 for r in W if r['fam']==fam and r['asset']==a)}, windows blocked {len(Y)}, tradable at 1.5x+ {len(T)}")
    if T: print(f"  ALL widths: win {st.mean(r['win'] for r in T):.3f} model ret/$1 {st.mean(ret_model(r) for r in T):+.3f} avg payout {st.mean(1/r['fair'] for r in T):.2f}x avg $ move after {st.mean(r['move'] for r in T):+.2f}")
    for lo,hi in BK[a]:
      Z=[r for r in T if lo<=r['W']<hi]
      if Z: print(f"  W {lo}-{hi if hi<1e8 else '+'}: n{len(Z)} win {st.mean(r['win'] for r in Z):.3f} ret {st.mean(ret_model(r) for r in Z):+.3f} move {st.mean(r['move'] for r in Z):+.2f}")
