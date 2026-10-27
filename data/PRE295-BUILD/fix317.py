import json,hashlib,os,shutil,datetime
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
P='src/lib/desk/bandlock.ts'
s=open(P,encoding='utf8').read()
s=one(s,'togpLoose = false /* fix286: the no-pink copy */)','togpLoose = false /* fix286: the no-pink copy */, rejNoAhead = false /* fix317: the rejection model */)','sig')
s=one(s,'else if (brZ && asset === "gold" && tick < r1Z && r1Z < nxZ) why','else if (brZ && asset === "gold" && tick < r1Z && r1Z < nxZ && !rejNoAhead /* fix317 */) why','up')
s=one(s,'else if (brZ && asset === "gold" && tick > s1Z && s1Z > nxZ) why','else if (brZ && asset === "gold" && tick > s1Z && s1Z > nxZ && !rejNoAhead /* fix317 */) why','dn')
s=one(s,'impossibleGeo(asset, lbR.L, qR.c, side, false, book === "recon-dly", book === "recon-togp").why','impossibleGeo(asset, lbR.L, qR.c, side, false, book === "recon-dly", book === "recon-togp", book === "recon-rej").why','door')
s=one(s,'String(r.lane ?? r.book ?? "") === "recon-togp").why','String(r.lane ?? r.book ?? "") === "recon-togp", String(r.lane ?? r.book ?? "") === "recon-rej").why','copier')
s=one(s,'impossibleGeo(asset, lb.L, q.c, side, dlyFree, false, !dlyFree && tpOrderAtWire(t, side)); // fix286','impossibleGeo(asset, lb.L, q.c, side, dlyFree, false, !dlyFree && tpOrderAtWire(t, side), !dlyFree && rejOrderAtWire(t, side)); // fix286 // fix317','wire')
fn='''// fix317 (Oct 27 2026 ~5:16 AM PT, Love: "i need you to stop letting shit i did not ask for get thru" - she never made fix238's gold "zone ahead before the next band" rule;
// her rule is fix242, the zone right behind/over the band): an opening order of the REJECTION model (recon-rej) at the wire skips the zone-ahead branch. Main and every other book unchanged.
function rejOrderAtWire(t: string, side: string): boolean {
  try {
    const doc = G.__doneDoc?.v ?? JSON.parse(readFileSync(D("live-book-done.json"), "utf8"));
    for (const [k, v] of Object.entries(doc) as [string, any][]) if (k.startsWith(t + ":recon-rej:") && v && String(v.side) === side && !(v.status === "filled" || v.status === "partial") && v.final !== true) return true;
  } catch {}
  return false;
}
'''
s=one(s,'// fix286: an opening order of the no-pink copy (recon-togp) at the wire - same lookup as the twin\'s\n',fn+'// fix286: an opening order of the no-pink copy (recon-togp) at the wire - same lookup as the twin\'s\n','fn')
import subprocess
open('data/PRE295-BUILD/bandlock.fix317.ts','w',encoding='utf8').write(s)
r=subprocess.run(['node','-e','const ts=require("typescript"),fs=require("fs");const r=ts.transpileModule(fs.readFileSync("data/PRE295-BUILD/bandlock.fix317.ts","utf8"),{reportDiagnostics:true,compilerOptions:{target:99,module:99}});console.log(r.diagnostics.length?"ERR":"OK")'],capture_output=True,text=True)
assert r.stdout.strip()=='OK',r.stdout+r.stderr
ls=json.load(open('data/live-switch.json')); ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} THAW (fix317 REJECTION MODEL ONLY: fix238's gold 'zone ahead before the next band' branch no longer refuses the rejection model (recon-rej) at door, copier and wire; fix242 (zone right over/behind the band) and fix238's 'landed inside the zone' stay; main and every other book unchanged): Love Oct 27 5:15 AM PT: \"she won't short into a band if green or red is in front of it now ???? ... I NEVER SAID THAT. NEVER MADE THAT RULE. EVER. SHE CANNOT TRADE IF THE GREEN ZONE IS BEHIIIIIND THE BAND. NOT IN FRONT OF IT\" + 5:16 AM: \"i need you to stop letting shit i did not ask for get thru hun\" (scope: rejection model only per her 5:06 AM 'never change a book without asking me')\n")
shutil.copyfile(P,'data/bandlock.ts.pre-fix317.bak')
D='src/lib/desk'; os.chmod(D,0o755); os.chmod(P,0o644)
shutil.copyfile('data/PRE295-BUILD/bandlock.fix317.ts',P+'.tmp'); os.replace(P+'.tmp',P); os.chmod(P,0o444); os.chmod(D,0o555)
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
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix317 {now()} (bandlock {hv}; backup data/bandlock.ts.pre-fix317.bak)\n")
print('ok',hv)
