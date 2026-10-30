import json,hashlib,os,shutil,datetime,subprocess,sys
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
P='src/lib/desk/bandlock.ts'; s=open(P,encoding='utf8').read()
s=one(s,'rejNoAhead = false /* fix317: the rejection model */)','rejNoAhead = false /* fix317: the rejection model */, noBBTarget = false /* fix318: rejection model + main */)','sig')
s=one(s,'const hit = TB.filter((l: Line) => !((twinFade || twinPinkAll || foTurn) && String(l.name) === "5m PP"))','const hit = TB.filter((l: Line) => !((twinFade || twinPinkAll || foTurn) && String(l.name) === "5m PP")).filter((l: Line) => !(noBBTarget && /^BB |BBSR|Bollinger/i.test(String(l.name)))) /* fix318 */','tb')
s=one(s,'book === "recon-togp", book === "recon-rej").why','book === "recon-togp", book === "recon-rej", book === "recon-rej" || book === "recon-tog").why','door')
s=one(s,'String(r.lane ?? r.book ?? "") === "recon-rej").why','String(r.lane ?? r.book ?? "") === "recon-rej", String(r.lane ?? r.book ?? "") === "recon-rej" || String(r.lane ?? r.book ?? "") === "recon-tog").why','copier')
s=one(s,'!dlyFree && rejOrderAtWire(t, side)); // fix286 // fix317','!dlyFree && rejOrderAtWire(t, side), !dlyFree && (rejOrderAtWire(t, side) || togOrderAtWire(t, side))); // fix286 // fix317 // fix318','wire')
fn='''// fix318 (Oct 27 2026 ~5:41 AM PT, Love: "she shouldn't be waiting for price to cross a bollinger back down before entering. she was mad late on that short ... toss that too please"
// + card "Rejection model and main"): for the REJECTION model and the MAIN book (recon-tog) the Bollinger no longer counts in TARGET PAST A BAND; session bands and pink there unchanged.
function togOrderAtWire(t: string, side: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":recon-tog:") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
'''
s=one(s,'// fix317 (Oct 27 2026 ~5:16 AM PT',fn+'// fix317 (Oct 27 2026 ~5:16 AM PT','fn')
open('data/PRE295-BUILD/bandlock.fix318.ts','w',encoding='utf8').write(s)
r=subprocess.run(['node','-e','const ts=require("typescript"),fs=require("fs");const r=ts.transpileModule(fs.readFileSync("data/PRE295-BUILD/bandlock.fix318.ts","utf8"),{reportDiagnostics:true,compilerOptions:{target:99,module:99}});console.log(r.diagnostics.length?"ERR":"OK")'],capture_output=True,text=True)
assert r.stdout.strip()=='OK',r.stdout+r.stderr
if len(sys.argv)<2: print('built ok'); sys.exit()
ls=json.load(open('data/live-switch.json')); ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} THAW (fix318 REJECTION MODEL + MAIN: the Bollinger no longer counts in gold's TARGET PAST A BAND for recon-rej and recon-tog (door, copier, wire); session bands and pink in that wall unchanged; every other book unchanged): Love Oct 27 5:41 AM PT: \"she shouldn't be waiting for price to cross a bollinger back down before entering. she was mad late on that short. if that's the reason toss that too please. don't remember that trait being a problem before now and her entries were always perfect so\" + card \"Rejection model and main\" (5:42 AM)\n")
shutil.copyfile(P,'data/bandlock.ts.pre-fix318.bak')
D='src/lib/desk'; os.chmod(D,0o755); os.chmod(P,0o644)
shutil.copyfile('data/PRE295-BUILD/bandlock.fix318.ts',P+'.tmp'); os.replace(P+'.tmp',P); os.chmod(P,0o444); os.chmod(D,0o555)
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
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix318 {now()} (bandlock {hv}; backup data/bandlock.ts.pre-fix318.bak)\n")
print('installed',hv)
