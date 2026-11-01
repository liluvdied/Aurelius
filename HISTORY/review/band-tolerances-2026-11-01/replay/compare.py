import pickle,statistics as st
from sweep import pink,sess,boll,zone,SPLIT
R=[r for r in pickle.load(open('rows2.pkl','rb')) if r['fair']<=0.667]
def cur_pink(r): W=r['W']; return (25 if W<100 else .2*W if W<=500 else .15*W) if r['asset']=='btc' else .15*W
C={
 'pink':(pink,cur_pink,lambda r:.05*r['W']),
 'sess':(sess,lambda r:r['W']/3,lambda r:.05*r['W']),
 'boll':(boll,lambda r:50 if r['asset']=='btc' else 1.5,lambda r:min(.25*r['W'],50) if r['asset']=='btc' else min(.15*r['W'],1.5)),
 'zone':(zone,lambda r:0 if r['asset']=='btc' else 1.5,lambda r:min(.15*r['W'],40) if r['asset']=='btc' else .05*r['W']),
}
print("rule asset | CURRENT: blocked n, blocked edge c, kept edge total (h1/h2) | SUGGESTED: same")
for k,(fn,cur,new) in C.items():
  for a in ('btc','gold'):
    X=[r for r in R if r['asset']==a]
    def ev(f):
        B=[r for r in X if fn(r,f(r))]; P=[r for r in X if not fn(r,f(r))]
        return len(B),(st.mean(r['edge'] for r in B)*100 if B else 0),sum(r['edge'] for r in P),sum(r['edge'] for r in P if r['t']<SPLIT),sum(r['edge'] for r in P if r['t']>=SPLIT),(st.mean(r['win'] for r in B) if B else 0)
    c=ev(cur);n=ev(new)
    print(f"{k} {a} | cur n{c[0]} blk{c[1]:+.1f}c win{c[5]:.2f} kept{c[2]:+.1f} ({c[3]:+.1f}/{c[4]:+.1f}) | new n{n[0]} blk{n[1]:+.1f}c win{n[5]:.2f} kept{n[2]:+.1f} ({n[3]:+.1f}/{n[4]:+.1f})")
