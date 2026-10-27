import json,hashlib,os,shutil,datetime,subprocess,sys
# usage: fix325.py <books comma> <gold|both> "<card>" [go]
BOOKS=sys.argv[1].split(','); AS=sys.argv[2]; CARD=sys.argv[3]; GO=len(sys.argv)>4
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
P='src/lib/desk/bandlock.ts'; s=open(P,encoding='utf8').read()
s=one(s,'zoneGuard = 0 /* fix323 */)','zoneGuard = 0 /* fix323 */, flipRule = false /* fix325 */)','sig')
door=' || '.join(f'book === "{b}"' for b in BOOKS)
s=one(s,'(book === "recon-tog" || book === "recon-rej" /* fix324 */) ? 0.4 : 0).why',f'(book === "recon-tog" || book === "recon-rej" /* fix324 */) ? 0.4 : 0, ({door}) ? true : false).why','door')
cp=' || '.join(f'String(r.lane ?? r.book ?? "") === "{b}"' for b in BOOKS)
s=one(s,'(String(r.lane ?? r.book ?? "") === "recon-tog" || String(r.lane ?? r.book ?? "") === "recon-rej" /* fix324 */) ? 0.4 : 0).why',f'(String(r.lane ?? r.book ?? "") === "recon-tog" || String(r.lane ?? r.book ?? "") === "recon-rej" /* fix324 */) ? 0.4 : 0, ({cp}) ? true : false).why','copier')
wr=' || '.join(f'bookOrderAtWire(t, side, "{b}")' for b in BOOKS)
s=one(s,'(bookOrderAtWire(t, side, "recon-tog") || bookOrderAtWire(t, side, "recon-rej") /* fix324 */) ? 0.4 : 0);',f'(bookOrderAtWire(t, side, "recon-tog") || bookOrderAtWire(t, side, "recon-rej") /* fix324 */) ? 0.4 : 0, !dlyFree && ({wr}) ? true : false);','wire')
old='''  if (foTurn) cdl = ""; // fix139: the red/green 1m close back across the fake-out band is her proof\n'''
new=old+f'''  // HER FLIP, LITERAL COLOUR (fix325, Oct 27 ~11:34 AM PT, Love: "hun. i'd like it to be the literal color of the candle." + "i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our
  // favor. one of the cornerstones of the model." + card "{CARD}" - 11:30:28 AM main gold short with every 1-5m candle green): for these books an entry needs at least one live
  // 1/2/3/4/5m candle past its open her way (literal colour); none = no entry. The 5m-only read with the 30c gold / $10 BTC stickiness stands down for them.
  if (flipRule) {{ if (!why && !foTurn && !anyFlipNow(asset, side, tick)) why = `HER FLIP: no 1/2/3/4/5m candle is ${{side === "up" ? "green" : "red"}} - a ${{side === "up" ? "long" : "short"}} needs one flipped her way.`; cdl = ""; }}
'''
s=one(s,old,new,'cdl')
open('data/PRE295-BUILD/bandlock.fix325.ts','w',encoding='utf8').write(s)
r=subprocess.run(['node','-e','const ts=require("typescript"),fs=require("fs");const r=ts.transpileModule(fs.readFileSync("data/PRE295-BUILD/bandlock.fix325.ts","utf8"),{reportDiagnostics:true,compilerOptions:{target:99,module:99}});console.log(r.diagnostics.length?"ERR":"OK")'],capture_output=True,text=True)
assert r.stdout.strip()=='OK',r.stdout+r.stderr
if not GO: print('built ok'); sys.exit()
subprocess.run(['python3','tools/save-her.py','before-fix325'],check=True)
ls=json.load(open('data/live-switch.json')); ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} THAW (fix325 HER FLIP for {','.join(BOOKS)} (door, copier, wire): an entry needs at least one live 1/2/3/4/5m candle past its open her way (literal colour), none = no entry; the 5m-only HER CANDLE with 30c gold / $10 BTC stickiness stands down for them; every other book unchanged): Love Oct 27 11:33 AM PT: \\\"hun. i'd like it to be the literal color of the candle.\\\" + 11:34 AM: \\\"hun, i asked for a 1 minute , 2m, 3m, or 5M candle to flip in our favor. one of the cornerstones of the model.\\\" + card \\\"{CARD}\\\" (11:30:28 AM main gold short on a green candle)\n")
shutil.copyfile(P,'data/bandlock.ts.pre-fix325.bak')
D='src/lib/desk'; os.chmod(D,0o755); os.chmod(P,0o644)
shutil.copyfile('data/PRE295-BUILD/bandlock.fix325.ts',P+'.tmp'); os.replace(P+'.tmp',P); os.chmod(P,0o444); os.chmod(D,0o555)
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
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix325 {now()} (bandlock {hv}; backup data/bandlock.ts.pre-fix325.bak)\n")
print('installed',hv)
