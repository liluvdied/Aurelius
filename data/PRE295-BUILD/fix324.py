import json,hashlib,os,shutil,datetime,subprocess,sys
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
P='src/lib/desk/bandlock.ts'; s=open(P,encoding='utf8').read()
s=one(s,'(book === "recon-tog") ? 0.4 : 0','(book === "recon-tog" || book === "recon-rej" /* fix324 */) ? 0.4 : 0','door')
s=one(s,'(String(r.lane ?? r.book ?? "") === "recon-tog") ? 0.4 : 0','(String(r.lane ?? r.book ?? "") === "recon-tog" || String(r.lane ?? r.book ?? "") === "recon-rej" /* fix324 */) ? 0.4 : 0','copier')
s=one(s,'(bookOrderAtWire(t, side, "recon-tog")) ? 0.4 : 0','(bookOrderAtWire(t, side, "recon-tog") || bookOrderAtWire(t, side, "recon-rej") /* fix324 */) ? 0.4 : 0','wire')
open('data/PRE295-BUILD/bandlock.fix324.ts','w',encoding='utf8').write(s)
r=subprocess.run(['node','-e','const ts=require("typescript"),fs=require("fs");const r=ts.transpileModule(fs.readFileSync("data/PRE295-BUILD/bandlock.fix324.ts","utf8"),{reportDiagnostics:true,compilerOptions:{target:99,module:99}});console.log(r.diagnostics.length?"ERR":"OK")'],capture_output=True,text=True)
assert r.stdout.strip()=='OK',r.stdout+r.stderr
if len(sys.argv)<2: print('built ok'); sys.exit()
subprocess.run(['python3','tools/save-her.py','before-fix324'],check=True)
ls=json.load(open('data/live-switch.json')); ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} THAW (fix324 fix323's BTC 40% PINK TO GREEN / PINK TO RED trial extended to the REJECTION model (recon-rej) at door, copier, wire; twin + copy unchanged): Love Oct 27 11:27 AM PT: \"let's apply it to the rejection model too pls for rn\"\n")
shutil.copyfile(P,'data/bandlock.ts.pre-fix324.bak')
D='src/lib/desk'; os.chmod(D,0o755); os.chmod(P,0o644)
shutil.copyfile('data/PRE295-BUILD/bandlock.fix324.ts',P+'.tmp'); os.replace(P+'.tmp',P); os.chmod(P,0o444); os.chmod(D,0o555)
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
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix324 {now()} (bandlock {hv}; backup data/bandlock.ts.pre-fix324.bak)\n")
print('installed',hv)
