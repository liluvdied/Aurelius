# Installs Love's approved code picks at the 9:30 PM PT boundary: fix433 (picks 1 zone flip, 2 slide-hold label, 7 flip 2-5m), fix434 (on her side of the break / her 33%),
# fix435 (every main + rejection order passes her walls at the wire or does not go). No settings change (picks 3/4/5 held - Love 9:03 PM seat plan).
import json,hashlib,os,shutil,datetime,time,sys,subprocess
os.chdir("/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
B=sys.argv[1]; D='src/lib/desk'; F=['engine.ts']
print('Saving her first...', flush=True); print(subprocess.run([sys.executable,'tools/save-her.py','before-fix452-3pm-rule'],capture_output=True,text=True).stdout.strip().split('\n')[-1])
for f in F:
    g=subprocess.run([sys.executable,'tools/no-removal-gate.py',f'{D}/{f}',f'{B}/{f}'],capture_output=True,text=True); print(g.stdout.strip().split('\n')[0])
    if g.returncode!=0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
T=max((int(time.time())//900+1)*900, 1793293200); w=T-time.time()
print(f'Waiting {int(w)} s for the next quarter-hour boundary ({datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")})...', flush=True)
time.sleep(max(0,w))
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
m=os.stat(D).st_mode; os.chmod(D,0o755)
for f in F:
    p=f'{D}/{f}'; fm=os.stat(p).st_mode; os.chmod(p,0o644); shutil.copyfile(f'{B}/{f}',p+'.tmp'); os.replace(p+'.tmp',p); os.chmod(p,fm & 0o777)
os.chmod(D,m & 0o777)
for f in ['cornerstones.py','umpire.py']:
    q='tools/'+f; qm=os.stat(q).st_mode; os.chmod(q,0o644); shutil.copyfile(B+'/'+f,q+'.tmp'); os.replace(q+'.tmp',q); os.chmod(q,qm & 0o777)
for f in ['three-pm-test-452.cjs']: shutil.copyfile(B+'/'+f,'tools/'+f)
H={f:h16(f'{D}/{f}') for f in F}
am=json.load(open('data/approved-model.json'))
def walk(o):
    if isinstance(o,dict):
        for k in o:
            if k in H and isinstance(o[k],str): o[k]=H[k]
            else: walk(o[k])
    elif isinstance(o,list):
        for x in o: walk(x)
walk(am); wj('data/approved-model.json',am)
sl=json.load(open('data/spine-lock.json'))
for f in F:
    if f in sl.get('files',{}): sl['files'][f]=H[f]
wj('data/spine-lock.json',sl)
g=json.load(open('data/golden-baseline.json'))
for f,h in H.items(): g['code'][f]=h
if 'data/spine-lock.json' in g['configFiles']: g['configFiles']['data/spine-lock.json']=h16('data/spine-lock.json')
wj('data/golden-baseline.json',g)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
with open('data/overnight-fixes.log','a') as f:
    f.write(f"{now} fix452 INSTALLED (Love Oct 29 2026 9:42 AM PT: \"3pm ✅ (bollingers, green/red zones only) (for btc and gold pls)\"): at 3 PM PT the rejection model takes only Bollinger and green/red zone calls, gold + BTC. R163. No-removal gate passed. {H}.\n")
print('installed',H,now)
