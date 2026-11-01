import pickle,statistics as st,datetime as dt
from sweep import pink,sess,boll,zone,PCTS,SPLIT
rows=[r for r in pickle.load(open('rows2.pkl','rb')) if r['fair']<=0.667]
for name,fn in (('pink',pink),('sess',sess),('boll',boll),('zone',zone)):
    for a in ('btc','gold'):
        R=[r for r in rows if r['asset']==a]
        line=[]
        for p in PCTS:
            P=[r for r in R if not fn(r,p*r['W'])]; B=[r for r in R if fn(r,p*r['W'])]
            h1=sum(r['edge'] for r in P if r['t']<SPLIT); h2=sum(r['edge'] for r in P if r['t']>=SPLIT)
            bw=st.mean(r['win'] for r in B) if B else 0; pw=st.mean(r['win'] for r in P)
            line.append(f"{p:.2f}: tot{sum(r['edge'] for r in P):+6.1f} h1{h1:+5.1f} h2{h2:+5.1f} passW{pw:.2f} blkW{bw:.2f} blkE{(st.mean(r['edge'] for r in B)*100 if B else 0):+5.1f}c n{len(B)}")
        print(name,a); print('\n'.join('   '+x for x in line))
