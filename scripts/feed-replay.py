import json,os,math,collections,datetime
A=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data')+'/'
fm=json.load(open(A+'feedmatch.json')); rows=json.load(open(A+'night-book.json'))
res={}
for a in ('btc','gold'):
    for m in fm['markets'][a]: res[m['tk']]=m.get('result')
def agg(b1,sec):
    out={}
    for t,o,h,l,c,v in b1:
        k=t//sec*sec
        if k not in out: out[k]=[k,o,h,l,c,v]
        else:
            x=out[k]; x[2]=max(x[2],h); x[3]=min(x[3],l); x[4]=c; x[5]+=v
    return [out[k] for k in sorted(out)]
def nav(bars,ln=7,mult=4):
    if len(bars)<ln*2-1: return None
    h3=lambda b:(b[2]+b[3]+b[4])/3
    def vw(e):
        a=w=0
        for j in range(e-ln+1,e+1): a+=h3(bars[j])*(bars[j][5] or 0); w+=bars[j][5] or 0
        return a/w if w>0 else h3(bars[e])
    n=len(bars)-1; xs=[vw(n-ln+1+i) for i in range(ln)]; m=sum(xs)/ln
    sd=math.sqrt(sum((x-m)**2 for x in xs)/ln); c=xs[-1]
    return (c,c+mult*sd,c-mult*sd)
def lines_at(b1,t,asset,frames=('m5','m10','m15')):
    past=[b for b in b1 if b[0]<t]
    if len(past)<200: return None,None
    spot=past[-1][4]
    s0=datetime.datetime.utcfromtimestamp(t).replace(hour=21,minute=0,second=0).timestamp()
    if t<s0: s0-=86400
    ss=[b for b in past if b[0]>=s0 and b[5]>0]
    if len(ss)<5: return None,None
    pv=vv=sq=0
    for b in ss:
        tp=(b[2]+b[3]+b[4])/3; pv+=tp*b[5]; vv+=b[5]; sq+=b[5]*tp*tp
    vwap=pv/vv; sd=math.sqrt(max(sq/vv-vwap*vwap,0))
    L=[vwap]+[vwap+k*sd for k in (0.5,1,1.5,2,2.5,3)]+[vwap-k*sd for k in (0.5,1,1.5,2,2.5,3)]
    b5=agg(past[-600:],300); b10=agg(past[-900:],600); b15=agg(past[-900:],900)
    navs={'m5':nav(b5[-40:]),'m10':nav(b10[-40:]),'m15':nav(b15[-40:])}
    for fr in frames:
        n=navs[fr]
        if n: L+= [n[0]] + ([n[1],n[2]] if asset=='btc' else [])
    return spot,L
def chan_block(side,p,L,edge=0.25):
    xs=sorted(L); gaps=sorted(g for g in (xs[i+1]-xs[i] for i in range(len(xs)-1)) if g>0)
    typ=gaps[len(gaps)//2] if gaps else 0
    mg=[]
    for x in xs:
        if mg and typ>0 and x-mg[-1]<typ*0.15: continue
        mg.append(x)
    above=[x for x in mg if x>p]; below=[x for x in mg if x<=p]
    up=above[0] if above else None; dn=below[-1] if below else None
    front=up if side=='up' else dn
    if front is None: return False
    back=dn if side=='up' else up
    width=abs(front-back) if back is not None else typ
    ahead=front-p if side=='up' else p-front
    return width>0 and ahead<=width*edge
FEEDS={'btc':['PEPPERSTONE:BTCUSD','VANTAGE:BTCUSD','OANDA:BTCUSD','BITFINEX:BTCUSD','GEMINI:BTCUSD','BINANCE:BTCUSDT'],'gold':['PEPPERSTONE:XAUUSD','VANTAGE:XAUUSD','OANDA:XAUUSD']}
seen=set(); setups=[]
for r in rows:
    if r.get('dnaMode') or r.get('stale') or r['asset'] not in('btc','gold'): continue
    k=(r['ticker'],r['side'])
    if k in seen: continue
    seen.add(k)
    out=res.get(r['ticker'])
    if out not in('yes','no'): continue
    t=int(datetime.datetime.fromisoformat(r['at'].replace('Z','+00:00')).timestamp())
    setups.append((r,t,(out=='yes')==(r['side']=='up')))
for asset in ('btc','gold'):
    S=[s for s in setups if s[0]['asset']==asset]
    print(f"== {asset.upper()}: {len(S)} logged setups with a Kalshi result (first trade per window per side)")
    for feed in FEEDS[asset]:
        b1=fm['bars'].get(feed) or []
        if not b1: print(f"  {feed:20} no bars in this pull"); continue
        b1=sorted(b1); lo,hi=b1[0][0],b1[-1][0]
        for mode,frames in (('25% rule, all her lines',('m5','m10','m15')),('5M SOLE lines',('m5',))):
            took=[];skip=[]
            for r,t,win in S:
                if not(lo+12*3600<t<hi): continue
                spot,L=lines_at(b1,t,asset,frames)
                if L is None: continue
                (skip if chan_block(r['side'],spot,L) else took).append((r,win))
            def st(xs):
                n=len(xs); w=sum(1 for _,x in xs if x)
                pnl=sum(((1/r['ask']-1)*50 if x else -50) for r,x in xs)
                return f"{n:3} trades {w/max(1,n)*100:4.0f}% won  {pnl:+9.2f}"
            print(f"  {feed:20} {mode:24} TOOK {st(took)} | SKIPPED {st(skip)}")
