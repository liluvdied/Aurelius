# Installs fix460 (R181/R182, Love Oct 29 2026 11:31-11:33 AM PT: "A BAND 250 AWAY IS NOT A FUCKING OBSTACLE" + "33% FUCKING PERCENT FROM BAND TO BAND BRO" + "NO LONGS IN TOP 33% . NO SHORTS IN THE BOTTOM 33%")
# into bandlock.ts at the next quarter-hour: the session-band-ahead wait (fix413) holds only inside her thirds. Main + rejection. Everything else untouched.
import json,hashlib,os,shutil,datetime,time,sys,subprocess
os.chdir("/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
B=sys.argv[1]; D='src/lib/desk'; F=['bandlock.ts']
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
FIVE=['bandlock5m.ts','recon.ts','engine.ts','kalshi-live.server.ts']; five0={f:h16(f'{D}/{f}') for f in FIVE}
if h16(f'{D}/bandlock.ts')!=h16(f'{B}/bandlock.ts.base'): sys.exit("bandlock.ts changed since fix460 was built - NOT installing (nothing changed). Tell Claude.")
print('Saving her first...', flush=True); print(subprocess.run([sys.executable,'tools/save-her.py','before-fix460-session-ahead-33'],capture_output=True,text=True).stdout.strip().split('\n')[-1], flush=True)
g=subprocess.run([sys.executable,'tools/no-removal-gate.py',f'{D}/bandlock.ts',f'{B}/bandlock.ts'],capture_output=True,text=True); print(g.stdout.strip().split('\n')[0], flush=True)
if g.returncode!=0: print(g.stdout); sys.exit("REFUSED by the no-removal gate - nothing installed")
r=subprocess.run(['node',f'{B}/session-ahead-33-test-460.cjs',f'{B}/bandlock.ts'],capture_output=True,text=True,env={**os.environ,'AUR_ROOT':os.getcwd()})
if r.returncode!=0: print(r.stdout); sys.exit("the 11:23 replay did not pass - nothing installed")
T=(int(time.time())//900+1)*900; w=T-time.time()
print(f'Waiting {int(w)} s for the next quarter-hour ({datetime.datetime.fromtimestamp(T).strftime("%I:%M %p")})...', flush=True)
time.sleep(max(0,w))
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
m=os.stat(D).st_mode; os.chmod(D,0o755)
for f in F:
    p=f'{D}/{f}'; fm=os.stat(p).st_mode; os.chmod(p,0o644); shutil.copyfile(f'{B}/{f}',p+'.tmp'); os.replace(p+'.tmp',p); os.chmod(p,fm & 0o777)
os.chmod(D,m & 0o777)
shutil.copyfile(B+'/session-ahead-33-test-460.cjs','tools/session-ahead-33-test-460.cjs')

u=open('tools/umpire.py',encoding='utf8').read()
if 'session-ahead-33-test-460' not in u:
    a='if rB441.returncode != 0: ok = False\n'
    add='rS460 = subprocess.run(["node", "tools/session-ahead-33-test-460.cjs"], capture_output=True, text=True)  # fix460 (R181/R182, Love Oct 29 2026 11:32-11:33 AM PT: \"33% FUCKING PERCENT FROM BAND TO BAND BRO\" + \"NO LONGS IN TOP 33% . NO SHORTS IN THE BOTTOM 33%\"): the session-band-ahead wait holds only inside her thirds\nprint(("SAFE   " if rS460.returncode == 0 else "OUT    ") + "tools/session-ahead-33-test-460.cjs  " + ((rS460.stdout.strip().split("\\n") or [""])[-1]))\nif rS460.returncode != 0: ok = False\n'
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
os.makedirs('data/BACKUPS/fix460',exist_ok=True)
for f in ['bandlock.ts','session-ahead-33-test-460.cjs','install460.py']: shutil.copyfile(f'{B}/{f}',f'data/BACKUPS/fix460/{f}')
RB=open('LOVE-RULEBOOK.md',encoding='utf8').read()
if '0p. CORNERSTONE - SESSION BAND AHEAD ONLY INSIDE HER THIRDS' not in RB:
    fm=os.stat('LOVE-RULEBOOK.md').st_mode; os.chmod('LOVE-RULEBOOK.md',0o644)
    open('LOVE-RULEBOOK.md','a',encoding='utf8').write('\n0p. CORNERSTONE - SESSION BAND AHEAD ONLY INSIDE HER THIRDS (Oct 29 2026 11:31-11:33 AM PT, R181/R182/R183, fix460). Love: "A BAND 250 AWAY IS NOT A FUCKING OBSTACLE" + "33% FUCKING PERCENT FROM BAND TO BAND BRO" + "NO LONGS IN TOP 33% . NO SHORTS IN THE BOTTOM 33%. STOPPPPPPP THROWING SHIT OUT" + "give me the command so i know it goes in and stays in please". The session-band-ahead wait (fix413) holds main + rejection only for a long in the top 33% / a short in the bottom 33% of the session-band channel, band to band - never farther. tools/session-ahead-33-test-460.cjs (in the umpire) replays the 11:23:32 AM BTC short (free) and a bottom-33% short + top-33% long (held); any change that lets the wait reach past her thirds fails it.\n')
    os.chmod('LOVE-RULEBOOK.md',fm & 0o777)
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
with open('data/overnight-fixes.log','a') as f:
    f.write(f"{now} fix460 INSTALLED by Love's double-click (R181/R182, Love Oct 29 2026 11:31 AM PT: \"A BAND 250 AWAY IS NOT A FUCKING OBSTACLE\" + 11:32 AM \"33% FUCKING PERCENT FROM BAND TO BAND BRO\" + 11:33 AM \"NO LONGS IN TOP 33% . NO SHORTS IN THE BOTTOM 33%\"): the SESSION BAND AHEAD wait (fix413, main + rejection) holds only a long in the top 33% / a short in the bottom 33% of the session-band channel; the 11:23:32 AM BTC short replays free. {H}.\n")
print('', flush=True); print(f'Landed at {datetime.datetime.now().strftime("%I:%M:%S %p")} PT.')
for n,l in enumerate(open(f'{D}/bandlock.ts',encoding='utf8'),1):
    if 'export function aheadBeyond460(' in l: print(f'IN ✓  the 33% limit: src/lib/desk/bandlock.ts:{n}')
    if 'aheadBeyond460(lbR.L, qR.c, side)' in l: print(f'IN ✓  in front of the session-band-ahead wait at the door: src/lib/desk/bandlock.ts:{n}')
r=subprocess.run(['node','tools/session-ahead-33-test-460.cjs'],capture_output=True,text=True); print('\nReplays on her LIVE code:'); print(r.stdout.strip())
bad=[f for f in FIVE if h16(f'{D}/{f}')!=five0[f]]
print('5M unchanged ✓ (bandlock5m.ts, recon.ts, engine.ts byte-identical)' if not bad else f'5M CHECK: changed {bad}')
