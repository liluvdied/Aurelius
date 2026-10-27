import json,hashlib,os,shutil,datetime,subprocess,sys
# usage: python3 fix323.py <books comma> <dollars> <card label> [go]
BOOKS=sys.argv[1].split(','); AMT=float(sys.argv[2]); CARD=sys.argv[3]; GO=len(sys.argv)>4
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
P='src/lib/desk/bandlock.ts'; s=open(P,encoding='utf8').read()
A=f"{AMT:g}"; SH=f"{AMT:g}"
s=one(s,'noBBTarget = false /* fix318: rejection model + main */)','noBBTarget = false /* fix318: rejection model + main */, zoneGuard = 0 /* fix323 */)','sig')
door=' || '.join(f'book === "{b}"' for b in BOOKS)
s=one(s,'book === "recon-rej", book === "recon-rej" || book === "recon-tog").why',f'book === "recon-rej", book === "recon-rej" || book === "recon-tog", ({door}) ? {A} : 0).why','door')
cp=' || '.join(f'String(r.lane ?? r.book ?? "") === "{b}"' for b in BOOKS)
s=one(s,'String(r.lane ?? r.book ?? "") === "recon-rej", String(r.lane ?? r.book ?? "") === "recon-rej" || String(r.lane ?? r.book ?? "") === "recon-tog").why',f'String(r.lane ?? r.book ?? "") === "recon-rej", String(r.lane ?? r.book ?? "") === "recon-rej" || String(r.lane ?? r.book ?? "") === "recon-tog", ({cp}) ? {A} : 0).why','copier')
wr=' || '.join(f'bookOrderAtWire(t, side, "{b}")' for b in BOOKS)
s=one(s,'!dlyFree && (rejOrderAtWire(t, side) || togOrderAtWire(t, side))); // fix286 // fix317 // fix318',f'!dlyFree && (rejOrderAtWire(t, side) || togOrderAtWire(t, side)), !dlyFree && ({wr}) ? {A} : 0); // fix286 // fix317 // fix318 // fix323','wire')
fn=f'''// fix323 (Oct 27 2026 ~11:07 AM PT, Love: "let's set a $40 btc green / red guard" + 11:11 AM 40% of pink-to-green + card "{CARD}"):
// true when this window's opening order at the wire belongs to `book`.
function bookOrderAtWire(t: string, side: string, book: string): boolean {{
  try {{
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":" + book + ":") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  }} catch {{}}
  return false;
}}
'''
s=one(s,'function rejOrderAtWire(t: string, side: string): boolean {',fn+'function rejOrderAtWire(t: string, side: string): boolean {','fn')
wall=f'''  // BTC PINK TO GREEN / PINK TO RED (fix323, Oct 27 ~11:11 AM PT, Love: "how far through the channel was she from the distance from pink to green? we can set it up to be
  // the bottom 40% and the top 40% of that distance pls" + card "{CARD}" - 11:00 AM main BTC short "Failed break above Green zone"): gold's PINK TO GREEN / RED on BTC at 40%:
  // no short in the bottom 40% of the green (5m S1) -> pink (5m PP) space, no long in the top 40% of the pink -> red (5m R1) space.
  if (zoneGuard > 0 && asset === "btc") {{ const zP = Number((L || []).find((l: Line) => String(l.name) === "5m PP")?.price) || 0, zS1 = Number((L || []).find((l: Line) => String(l.name) === "5m S1")?.price) || 0, zR1 = Number((L || []).find((l: Line) => String(l.name) === "5m R1")?.price) || 0;
    if (side === "down" && zP > 0 && zS1 > 0 && zS1 < zP && tick > zS1 && tick < zP && (tick - zS1) / (zP - zS1) <= zoneGuard) return {{ why: `PINK TO GREEN (BTC): short at ${{Math.round((tick - zS1) / (zP - zS1) * 100)}}% of the green ${{zS1.toFixed(2)}} -> pink ${{zP.toFixed(2)}} space - no short in the bottom ${{Math.round(zoneGuard * 100)}}%.`, below: null, above: null, pos: null, lock: null }};
    if (side === "up" && zP > 0 && zR1 > zP && tick > zP && tick < zR1 && (tick - zP) / (zR1 - zP) >= 1 - zoneGuard) return {{ why: `PINK TO RED (BTC): long at ${{Math.round((tick - zP) / (zR1 - zP) * 100)}}% of the pink ${{zP.toFixed(2)}} -> red ${{zR1.toFixed(2)}} space - no long in the top ${{Math.round(zoneGuard * 100)}}%.`, below: null, above: null, pos: null, lock: null }}; }}
'''
s=one(s,'  const sqzE = squeezedPinkOf(L);\n',wall+'  const sqzE = squeezedPinkOf(L);\n','wall')
open('data/PRE295-BUILD/bandlock.fix323.ts','w',encoding='utf8').write(s)
r=subprocess.run(['node','-e','const ts=require("typescript"),fs=require("fs");const r=ts.transpileModule(fs.readFileSync("data/PRE295-BUILD/bandlock.fix323.ts","utf8"),{reportDiagnostics:true,compilerOptions:{target:99,module:99}});console.log(r.diagnostics.length?"ERR":"OK")'],capture_output=True,text=True)
assert r.stdout.strip()=='OK',r.stdout+r.stderr
if not GO: print('built ok'); sys.exit()
subprocess.run(['python3','tools/save-her.py','before-fix323'],check=True)
ls=json.load(open('data/live-switch.json')); ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} THAW (fix323 BTC PINK TO GREEN / PINK TO RED {A} share for {','.join(BOOKS)} ONLY (impossibleGeo zoneGuard at door, copier, wire): no BTC short in the bottom 40% of green(5m S1)->pink(5m PP), no BTC long in the top 40% of pink->red(5m R1); every other book unchanged): Love Oct 27 11:07 AM PT: \"let's set a $40 btc green / red guard for right now pls hun / i don't want her to do that anymore\" + 11:11 AM: \"how far through the channel was she from the distance from pink to green? we can set it up to be the bottom 40% and the top 40% of that distance pls\" + card \"{CARD}\"\n")
shutil.copyfile(P,'data/bandlock.ts.pre-fix323.bak')
D='src/lib/desk'; os.chmod(D,0o755); os.chmod(P,0o644)
shutil.copyfile('data/PRE295-BUILD/bandlock.fix323.ts',P+'.tmp'); os.replace(P+'.tmp',P); os.chmod(P,0o444); os.chmod(D,0o555)
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
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix323 {now()} (bandlock {hv}; backup data/bandlock.ts.pre-fix323.bak)\n")
print('installed',hv)
