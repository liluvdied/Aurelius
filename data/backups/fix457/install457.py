# Installs fix457 (R170, Love Oct 29 2026 10:42 AM PT: "yes. if a band broke downwards it is only a short ... band breaks = trade the direction of the break. WITH PRICE ON THE SAME SIDE OF
# THE BREAK. A WICK THRU WITH PRICE ON THE OTHER SIDE OF THE BAND IS NOT AN ENTRY ... a LONG WITH A SESSION BAND 5 MILLIMETERS ABOVE HER ====== BLOCKKKKKED ... count the 33% correctly")
# into bandlock.ts at the next quarter-hour: main + rejection, gold + BTC. The 5M book's files are not touched.
import json,hashlib,os,shutil,datetime,time,sys,subprocess
os.chdir("/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
B=sys.argv[1]; D='src/lib/desk'; F=['bandlock.ts']
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
FIVE=['bandlock5m.ts','recon.ts','engine.ts','kalshi-live.server.ts']; five0={f:h16(f'{D}/{f}') for f in FIVE}
if h16(f'{D}/bandlock.ts')!=h16(f'{B}/bandlock.ts.base'): sys.exit("bandlock.ts changed since fix457 was built - NOT installing (nothing changed). Tell Claude.")
print('Saving her first...', flush=True); print(subprocess.run([sys.executable,'tools/save-her.py','before-fix457-broke-candle-33'],capture_output=True,text=True).stdout.strip().split('\n')[-1], flush=True)
g=subprocess.run([sys.executable,'tools/no-removal-gate.py',f'{D}/bandlock.ts',f'{B}/bandlock.ts'],capture_output=True,text=True); print(g.stdout.strip().split('\n')[0], flush=True)
if g.returncode!=0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
r=subprocess.run(['node',f'{B}/broke-candle-test-457.cjs',f'{B}/bandlock.ts'],capture_output=True,text=True,env={**os.environ,'AUR_ROOT':os.getcwd()})
if r.returncode!=0: print(r.stdout); sys.exit("the 10:22 replay did not pass - nothing installed")
T=(int(time.time())//900+1)*900; w=T-time.time()
print(f'Waiting {int(w)} s for the next quarter-hour ({datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")})...', flush=True)
time.sleep(max(0,w))
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
m=os.stat(D).st_mode; os.chmod(D,0o755)
for f in F:
    p=f'{D}/{f}'; fm=os.stat(p).st_mode; os.chmod(p,0o644); shutil.copyfile(f'{B}/{f}',p+'.tmp'); os.replace(p+'.tmp',p); os.chmod(p,fm & 0o777)
os.chmod(D,m & 0o777)
shutil.copyfile(B+'/broke-candle-test-457.cjs','tools/broke-candle-test-457.cjs')
u=open('tools/umpire.py',encoding='utf8').read()
if 'broke-candle-test-457' not in u:
    a='if rB441.returncode != 0: ok = False\n'
    add='rB457 = subprocess.run(["node", "tools/broke-candle-test-457.cjs"], capture_output=True, text=True)  # fix457 (R170, Love Oct 29 2026 10:42 AM PT: "band breaks = trade the direction of the break. WITH PRICE ON THE SAME SIDE OF THE BREAK ... count the 33% correctly"): the 10:22 AM gold long must be refused\nprint(("SAFE   " if rB457.returncode == 0 else "OUT    ") + "tools/broke-candle-test-457.cjs  " + ((rB457.stdout.strip().split("\\n") or [""])[-1]))\nif rB457.returncode != 0: ok = False\n'
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
os.makedirs('data/BACKUPS/fix457',exist_ok=True)
for f in ['bandlock.ts','broke-candle-test-457.cjs','install457.py']: shutil.copyfile(f'{B}/{f}',f'data/BACKUPS/fix457/{f}')
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
with open('data/overnight-fixes.log','a') as f:
    f.write(f"{now} fix457 INSTALLED by Love's double-click (R170, Love Oct 29 2026 10:42 AM PT: \"yes. if a band broke downwards it is only a short ... band breaks = trade the direction of the break. WITH PRICE ON THE SAME SIDE OF THE BREAK. A WICK THRU WITH PRICE ON THE OTHER SIDE OF THE BAND IS NOT AN ENTRY ... count the 33% correctly\" + 10:43 AM \"please send me a command so i know this fix got in\"): main + rejection, gold + BTC - band broke this candle = only the break's direction with price on its side; wick through = no entry; her 33% counts a band broken against her this candle as in front. The 10:22 AM gold long replays REFUSED. 5M files untouched. {H}.\n")
print('', flush=True); print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for n,l in enumerate(open(f'{D}/bandlock.ts',encoding='utf8'),1):
    if 'export function brokeThisCandle457(' in l: print(f'IN ✓  the rule: src/lib/desk/bandlock.ts:{n}')
    if 'const bt457 = brokeThisCandle457(' in l: print(f'IN ✓  checked on every main + rejection order: src/lib/desk/bandlock.ts:{n}')
r=subprocess.run(['node','tools/broke-candle-test-457.cjs'],capture_output=True,text=True); print('\nReplay of the 10:22 AM gold long on her LIVE code:'); print(r.stdout.strip())
bad=[f for f in FIVE if h16(f'{D}/{f}')!=five0[f]]
print('5M unchanged ✓ (bandlock5m.ts, recon.ts, engine.ts byte-identical)' if not bad else f'5M CHECK: changed {bad}')
