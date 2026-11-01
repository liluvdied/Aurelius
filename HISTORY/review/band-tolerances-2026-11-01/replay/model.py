import pickle,math,statistics as st,json
rows=pickle.load(open('rows.pkl','rb'))
U="/mnt/user-data/uploads/Desktop/aurelius fixxd <3/Aurelius/data/"
import datetime as dt
def ts(s): return dt.datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()
ser={'btc':[],'gold':[]}
for l in open(U+'band-log.jsonl'):
    try:d=json.loads(l)
    except:continue
    ser[d['asset']].append((ts(d['at']),d['tick']))
sig={}
for a,s in ser.items():
    s.sort(); v=[]
    for (t0,p0),(t1,p1) in zip(s,s[1:]):
        dt_=t1-t0
        if 20<dt_<120: v.append((p1-p0)**2/dt_)
    sig[a]=math.sqrt(st.median(v)*1.4)  # robust
print(sig)
N=lambda x:0.5*(1+math.erf(x/math.sqrt(2)))
for r in rows:
    s=sig[r['asset']]*math.sqrt(max(r['left'],1))
    pu=N((r['tick']-r['strike'])/s)
    r['fair']=pu if r['side']=='up' else 1-pu
    r['edge']=(1 if r['win'] else 0)-r['fair']
pickle.dump(rows,open('rows2.pkl','wb'))
f=[r for r in rows if r['src']=='fill' and r['paid']]
print('fills n',len(f),'mean paid',st.mean(r['paid'] for r in f),'mean fair',st.mean(r['fair'] for r in f),'corr-ish')
print('fill actual P&L per $1 contract', st.mean((1 if r['win'] else 0)-r['paid'] for r in f))
print('fill model edge',st.mean(r['edge'] for r in f))
for a in ('btc','gold'):
    R=[r for r in rows if r['asset']==a]; print(a,len(R),'edge all reads',round(st.mean(r['edge'] for r in R),4),'win',round(st.mean(r['win'] for r in R),3))
