# Installs fix459 (R176, Love Oct 29 2026 11:12-11:18 AM PT: "she is only not allowed to long into pink at 15% of the channel width, band to band" + "15% just for gold rn hun. 20% for btc" + "both books pls")
# into bandlock.ts at the next quarter-hour: main + rejection, gold + BTC. The downslope pink rule, the 5M and every other book untouched.
import json,hashlib,os,shutil,datetime,time,sys,subprocess
os.chdir("/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
B=sys.argv[1]; D='src/lib/desk'; F=['bandlock.ts']
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
FIVE=['bandlock5m.ts','recon.ts','engine.ts','kalshi-live.server.ts']; five0={f:h16(f'{D}/{f}') for f in FIVE}
if h16(f'{D}/bandlock.ts')!=h16(f'{B}/bandlock.ts.base'): sys.exit("bandlock.ts changed since fix459 was built - NOT installing (nothing changed). Tell Claude.")
print('Saving her first...', flush=True); print(subprocess.run([sys.executable,'tools/save-her.py','before-fix459-pink-15-20'],capture_output=True,text=True).stdout.strip().split('\n')[-1], flush=True)
g=subprocess.run([sys.executable,'tools/no-removal-gate.py',f'{D}/bandlock.ts',f'{B}/bandlock.ts'],capture_output=True,text=True); print(g.stdout.strip().split('\n')[0], flush=True)
if g.returncode!=0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
r=subprocess.run(['node',f'{B}/pink-15-20-test-459.cjs',f'{B}/bandlock.ts'],capture_output=True,text=True,env={**os.environ,'AUR_ROOT':os.getcwd()})
if r.returncode!=0: print(r.stdout); sys.exit("the pink 15%/20% replay did not pass - nothing installed")
T=(int(time.time())//900+1)*900; w=T-time.time()
print(f'Waiting {int(w)} s for the next quarter-hour ({datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")})...', flush=True)
time.sleep(max(0,w))
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
m=os.stat(D).st_mode; os.chmod(D,0o755)
for f in F:
    p=f'{D}/{f}'; fm=os.stat(p).st_mode; os.chmod(p,0o644); shutil.copyfile(f'{B}/{f}',p+'.tmp'); os.replace(p+'.tmp',p); os.chmod(p,fm & 0o777)
os.chmod(D,m & 0o777)
shutil.copyfile(B+'/pink-15-20-test-459.cjs','tools/pink-15-20-test-459.cjs')
rm=os.stat('tools/reach-test-429.cjs').st_mode; os.chmod('tools/reach-test-429.cjs',0o644); shutil.copyfile(B+'/reach-test-429.cjs','tools/reach-test-429.cjs'); os.chmod('tools/reach-test-429.cjs',rm & 0o777)
u=open('tools/umpire.py',encoding='utf8').read()
if 'pink-15-20-test-459' not in u:
    a='if rB441.returncode != 0: ok = False\n'
    add='rP459 = subprocess.run(["node", "tools/pink-15-20-test-459.cjs"], capture_output=True, text=True)  # fix459 (R176, Love Oct 29 2026 11:12 AM PT: \"she is only not allowed to long into pink at 15% of the channel width, band to band\" + \"15% just for gold rn hun. 20% for btc\"): pink holds a long only inside 15%/20%\nprint(("SAFE   " if rP459.returncode == 0 else "OUT    ") + "tools/pink-15-20-test-459.cjs  " + ((rP459.stdout.strip().split("\\n") or [""])[-1]))\nif rP459.returncode != 0: ok = False\n'
    if u.count(a)==1:
        um=os.stat('tools/umpire.py').st_mode; os.chmod('tools/umpire.py',0o644); open('tools/umpire.py','w',encoding='utf8').write(u.replace(a,a+add)); os.chmod('tools/umpire.py',um & 0o777)
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
gb=json.load(open('data/golden-baseline.json'))
for f,h in H.items(): gb['code'][f]=h
if 'data/spine-lock.json' in gb['configFiles']: gb['configFiles']['data/spine-lock.json']=h16('data/spine-lock.json')
wj('data/golden-baseline.json',gb)
os.makedirs('data/BACKUPS/fix459',exist_ok=True)
for f in ['bandlock.ts','pink-15-20-test-459.cjs','reach-test-429.cjs','install459.py']: shutil.copyfile(f'{B}/{f}',f'data/BACKUPS/fix459/{f}')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
with open('data/overnight-fixes.log','a') as f:
    f.write(f"{now} fix459 INSTALLED by Love's double-click (R176, Love Oct 29 2026 11:12 AM PT: \"she is only not allowed to long into pink at 15% of the channel width, band to band. / not all distances, period.\" + 11:18 AM \"15% just for gold rn hun. 20% for btc\" + \"both books pls\"): main + rejection - the unbroken pink holds a long (fix432) and reaches (fix429/430, over its $1/$50 floor) only within 15% gold / 20% BTC of the session-band channel; downslope pink rule untouched. {H}.\n")
print('', flush=True); print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for n,l in enumerate(open(f'{D}/bandlock.ts',encoding='utf8'),1):
    if 'export const PINK_PCT459' in l: print(f'IN ✓  the 15%/20% share: src/lib/desk/bandlock.ts:{n}')
    if 'pinkBeyond459(asset, L, tick' in l: print(f'IN ✓  checked on every main + rejection long under the pink: src/lib/desk/bandlock.ts:{n}')
r=subprocess.run(['node','tools/pink-15-20-test-459.cjs'],capture_output=True,text=True); print('\nReplays on her LIVE code:'); print(r.stdout.strip())
bad=[f for f in FIVE if h16(f'{D}/{f}')!=five0[f]]
print('5M unchanged ✓ (bandlock5m.ts, recon.ts, engine.ts byte-identical)' if not bad else f'5M CHECK: changed {bad}')
