import pickle,statistics as st,re
X=[r for r in pickle.load(open('waits_first.pkl','rb')) if 0.05<=r['fair']<=0.667]
R=pickle.load(open('rows2.pkl','rb'))
F=[r for r in R if r['src']=='fill' and r['paid']]
P=[r for r in R if r['fair']<=0.667]
def s(Z): 
    if not Z: return "n0"
    return f"n{len(Z)} win {st.mean(r['win'] for r in Z)*100:.0f}% move {st.mean(r['move'] for r in Z):+.2f}"
for a in ('btc','gold'):
    print(a,'TAKEN fills',s([r for r in F if r['asset']==a]),'| all tradable reads',s([r for r in P if r['asset']==a]))
def pinkpos(r):
    # pink position in its channel 0=bottom 1=top
    if not r['pink']: return None
    return (r['pink']-r['sb'])/(r['sa']-r['sb'])
opts={
 'pink':[
  ('tol 10% of channel (release if price-pink > 10%)',lambda r: r['pink'] and abs(r['tick']-r['pink'])>0.10*r['W']),
  ('tol 5% of channel',lambda r: r['pink'] and abs(r['tick']-r['pink'])>0.05*r['W']),
  ('release rejection reads (label says reject/rejected)',lambda r: re.search(r'reject',r['label'],re.I)),
  ('release when pink is in the middle third of the channel',lambda r: (pinkpos(r) is not None) and 1/3<=pinkpos(r)<=2/3),
  ('release when pink is in the far third (pink-slide rule your way)',lambda r: (pinkpos(r) is not None) and ((r['side']=='up' and pinkpos(r)>2/3) or (r['side']=='down' and pinkpos(r)<1/3))),
  ('release on channels over $500 (BTC) / $20 (gold)',lambda r: r['W']>(500 if r['asset']=='btc' else 20)),
  ('release only with 8+ min left in the window',lambda r: r['left']>=480),
 ],
 'sess':[
  ('release if band ahead > 10% of channel',lambda r: ((r['sa']-r['tick']) if r['side']=='up' else (r['tick']-r['sb']))>0.10*r['W']),
  ('release if band ahead > 20% of channel',lambda r: ((r['sa']-r['tick']) if r['side']=='up' else (r['tick']-r['sb']))>0.20*r['W']),
  ('release rejection reads',lambda r: re.search(r'reject',r['label'],re.I)),
  ('release on channels under $200 (BTC) / $10 (gold)',lambda r: r['W']<(200 if r['asset']=='btc' else 10)),
  ('release only with 8+ min left',lambda r: r['left']>=480),
 ]}
for fam,L in opts.items():
  for a in ('btc','gold'):
    Y=[r for r in X if r['fam']==fam and r['asset']==a]
    print(f"\n== {fam} {a}: blocked windows {s(Y)}")
    for name,fn in L:
        rel=[r for r in Y if fn(r)]; keep=[r for r in Y if not fn(r)]
        print(f"  {name}: RELEASED {s(rel)}  | STILL HELD {s(keep)}")
