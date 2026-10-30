import json,hashlib,os,shutil,datetime,subprocess,sys
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
P='src/lib/desk/bandlock.ts'; s=open(P,encoding='utf8').read()
# A: pink 10% wall only when the pink sits in the top/bottom 10% of the channel (rejection model only)
old='''      const pbd = asset === "btc" ? 3 /* fix166'''
new='''      if (rejNoAhead && above > below && (pp - below) / (above - below) > 0.10 && (pp - below) / (above - below) < 0.90) continue; // fix319 (Oct 27 ~6:23 AM PT, Love: "make her only wait for pink to clear if it is in the top 10% or bottom 10% of the channel" + card "Rejection model only")
      const pbd = asset === "btc" ? 3 /* fix166'''
s=one(s,old,new,'pink10')
# A: same for the pink in TARGET PAST A BAND
old='.filter((l: Line) => !(noBBTarget && /^BB |BBSR|Bollinger/i.test(String(l.name)))) /* fix318 */'
new=old+'.filter((l: Line) => !(rejNoAhead && String(l.name) === "5m PP" && above > below && (Number(l.price) - below) / (above - below) > 0.10 && (Number(l.price) - below) / (above - below) < 0.90)) /* fix319 */'
s=one(s,old,new,'tbpink')
# B: candle flip on any of 1-5m
old='  if (foTurn) cdl = ""; // fix139: the red/green 1m close back across the fake-out band is her proof\n'
new=old+'  if (rejNoAhead && cdl && cdl !== side && anyFlipNow(asset, side, tick)) cdl = ""; // fix319 (Oct 27 ~6:23 AM PT, Love: "enter in at a candle flip of 1, 2,3,4, 5M candles" + card "Rejection model only"): the rejection model may go with any 1-5m candle moving her way\n'
s=one(s,old,new,'cdl')
fn='''// fix319 (Oct 27 2026 ~6:23 AM PT, Love: "enter in at a candle flip of 1, 2,3,4, 5M candles. that's it." + card "Rejection model only"): true when any of the
// live 1m/2m/3m/4m/5m candles has price past its open in `side`'s direction. Read only for the rejection model (rejNoAhead).
function anyFlipNow(asset: string, side: string, tick: number): boolean {
  try {
    const bars: any[] = G.__pivBars?.[asset]?.bars ?? [], tr = trailNow(asset), ms = Date.now();
    for (const n of [1, 2, 3, 4, 5]) {
      const f0 = Math.floor(ms / (n * 60000)) * n * 60;
      const inF = bars.filter((x) => Number(x.t) >= f0).sort((x, y) => x.t - y.t);
      let o = inF.length ? Number(inF[0].o) : 0;
      if (!(o > 0)) { const pre = tr.filter((x) => x.t < f0 * 1000 && x.t >= f0 * 1000 - 10000); const inn = tr.filter((x) => x.t >= f0 * 1000); o = pre.length ? Number(pre[pre.length - 1].c) : inn.length ? Number(inn[0].c) : 0; }
      if (o > 0 && (side === "up" ? tick > o : tick < o)) return true;
    }
  } catch {}
  return false;
}
'''
s=one(s,'/** The live 5m candle\'s open from the desk\'s own 1m bars (pivotbooks __pivBars). */',fn+'/** The live 5m candle\'s open from the desk\'s own 1m bars (pivotbooks __pivBars). */','fn')
open('data/PRE295-BUILD/bandlock.fix319.ts','w',encoding='utf8').write(s)
r=subprocess.run(['node','-e','const ts=require("typescript"),fs=require("fs");const r=ts.transpileModule(fs.readFileSync("data/PRE295-BUILD/bandlock.fix319.ts","utf8"),{reportDiagnostics:true,compilerOptions:{target:99,module:99}});console.log(r.diagnostics.length?"ERR":"OK")'],capture_output=True,text=True)
assert r.stdout.strip()=='OK',r.stdout+r.stderr
if len(sys.argv)<2: print('built ok'); sys.exit()
ls=json.load(open('data/live-switch.json')); ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} THAW (fix319 REJECTION MODEL ONLY (recon-rej via rejNoAhead at door, copier, wire): (A) the pink blocks her (PINK 10% and the pink in TARGET PAST A BAND) only when it sits in the top 10% or bottom 10% of the channel; (B) HER CANDLE passes when any live 1/2/3/4/5m candle is past its open her way; main, twin, copy unchanged): Love Oct 27 6:23 AM PT: \"dude doji is inconsequential... i never said i want her to stop taking trades from the top/bottom 3rd hun. i want her to trade exactly that. not skip them... the $10 level can stay. last wrung channels can stay. steep slope can stay. pitched over 45 degrees. not a small tilt. make her only wait for pink to clear if it is in the top 10% or bottom 10% of the channel. enter in at a candle flip of 1, 2,3,4, 5M candles. that's it. that. is. it. NOTHING. else.\" + card \"Rejection model only\" (6:25 AM)\n")
shutil.copyfile(P,'data/bandlock.ts.pre-fix319.bak')
D='src/lib/desk'; os.chmod(D,0o755); os.chmod(P,0o644)
shutil.copyfile('data/PRE295-BUILD/bandlock.fix319.ts',P+'.tmp'); os.replace(P+'.tmp',P); os.chmod(P,0o444); os.chmod(D,0o555)
hv=h16(P)
am=json.load(open('data/approved-model.json'))
def walk(o):
    if isinstance(o,dict):
        for k in o:
            if k=='bandlock.ts' and isinstance(o[k],str): o[k]=hv
            else: walk(o[k])
    elif isinstance(o,list):
        for x in o: walk(x)
walk(am); wj('data/approved-model.json',am)
ls=json.load(open('data/live-switch.json')); ls['live']=True; wj('data/live-switch.json',ls)
g=json.load(open('data/golden-baseline.json')); g['code']['bandlock.ts']=hv
g['config']={k:hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()[:10] for k,v in ls.items()}
wj('data/golden-baseline.json',g)
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix319 {now()} (bandlock {hv}; backup data/bandlock.ts.pre-fix319.bak)\n")
print('installed',hv)
