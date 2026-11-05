#!/usr/bin/env python3
# SAVE HER (Oct 27 2026 ~6:45 AM PT, Love card "Yes, save her every time"): a full copy of her brain (all of src/ + her
# config files + rulebook + fix log) into data/SAVES/<time>-<label>/ before every fix, and a KNOWN-GOOD copy whenever Love
# says she's perfect.  Usage: python3 tools/save-her.py <label> [--good]
# To bring a save back exactly: copy its src/ over src/ and its data/*.json over data/ (live off first), then verify-golden.
import os,shutil,sys,datetime,hashlib,json
lab=(sys.argv[1] if len(sys.argv)>1 else 'save').replace('/','-').replace(' ','-')
good='--good' in sys.argv
# fix702 (Love Nov 5 2026 3:31 AM PT: "i put on the regular rejection book and she didn't take the rejections , gold or btc" + Nov 1 10:44 PM PT: "yes please allow me to change
# the schedule at will without tripping the umpire"): two pill taps half a second apart started two saves in the same minute - the second crashed on the same folder name, the
# newest save held only the first tap, and her gates read the second tap as a switch-off (ENFORCER blocked 3:16-3:33 AM). Saves now take turns (a lock), never share a name,
# and the folder name uses Pacific time by the calendar (PST in winter, PDT in summer) instead of a fixed -7 h.
import fcntl, zoneinfo
os.makedirs(os.path.join('data','SAVES'),exist_ok=True)
_lock702=open(os.path.join('data','SAVES','.save-lock'),'w'); fcntl.flock(_lock702,fcntl.LOCK_EX)  # fix702: one save at a time - the second waits, then copies her as she is after the first
pt=datetime.datetime.now(zoneinfo.ZoneInfo('America/Los_Angeles'))  # fix702: was utc - 7 h (an hour ahead all winter)
name=(('KNOWN-GOOD-' if good else '')+pt.strftime('%Y-%m-%d-%I%M%p-PT')+'-'+lab)
dst=os.path.join('data','SAVES',name); n702=2
while os.path.exists(dst): dst=os.path.join('data','SAVES',name+'-'+str(n702)); n702+=1  # fix702: a second save in the same minute gets its own folder, never a crash
os.makedirs(os.path.join(dst,'data'))
shutil.copytree('src',os.path.join(dst,'src'),copy_function=shutil.copyfile)  # R218 lock: copy the bytes only - copying her lock flag onto the save fails and left saves half-made (Oct 29 2:44 PM)
for f in ['FROZEN.json','approved-model.json','firewall.json','golden-baseline.json','live-switch.json','spine-lock.json','overnight-fixes.log']:
    if os.path.exists('data/'+f): shutil.copyfile('data/'+f,os.path.join(dst,'data',f))
for f in ['LOVE-RULEBOOK.md','spine-lock.json']:
    if os.path.exists(f): shutil.copyfile(f,os.path.join(dst,f))
h={p:hashlib.sha256(open(os.path.join('src/lib/desk',p),'rb').read()).hexdigest()[:16] for p in ['bandlock.ts','recon.ts','engine.ts'] if os.path.exists(os.path.join('src/lib/desk',p))}
open(os.path.join(dst,'SAVE.json'),'w').write(json.dumps({'label':lab,'knownGood':good,'savedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'hashes':h},indent=2))
print(dst)
# CORNERSTONE #2 (Love Oct 27 2:06 PM PT: "every request, every change, and every fix has a copied 1:1 file of them"): every save also copies every new/changed file into the vault
import subprocess; subprocess.run([sys.executable,'tools/vault.py','snap',lab])
