#!/usr/bin/env python3
# SAVE HER (Oct 27 2026 ~6:45 AM PT, Love card "Yes, save her every time"): a full copy of her brain (all of src/ + her
# config files + rulebook + fix log) into data/SAVES/<time>-<label>/ before every fix, and a KNOWN-GOOD copy whenever Love
# says she's perfect.  Usage: python3 tools/save-her.py <label> [--good]
# To bring a save back exactly: copy its src/ over src/ and its data/*.json over data/ (live off first), then verify-golden.
import os,shutil,sys,datetime,hashlib,json
lab=(sys.argv[1] if len(sys.argv)>1 else 'save').replace('/','-').replace(' ','-')
good='--good' in sys.argv
pt=datetime.datetime.now(datetime.timezone.utc)-datetime.timedelta(hours=7)
name=(('KNOWN-GOOD-' if good else '')+pt.strftime('%Y-%m-%d-%I%M%p-PT')+'-'+lab)
dst=os.path.join('data','SAVES',name); os.makedirs(os.path.join(dst,'data'))
shutil.copytree('src',os.path.join(dst,'src'))
for f in ['FROZEN.json','approved-model.json','firewall.json','golden-baseline.json','live-switch.json','spine-lock.json','overnight-fixes.log']:
    if os.path.exists('data/'+f): shutil.copy2('data/'+f,os.path.join(dst,'data',f))
for f in ['LOVE-RULEBOOK.md','spine-lock.json']:
    if os.path.exists(f): shutil.copy2(f,os.path.join(dst,f))
h={p:hashlib.sha256(open(os.path.join('src/lib/desk',p),'rb').read()).hexdigest()[:16] for p in ['bandlock.ts','recon.ts','engine.ts'] if os.path.exists(os.path.join('src/lib/desk',p))}
open(os.path.join(dst,'SAVE.json'),'w').write(json.dumps({'label':lab,'knownGood':good,'savedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'hashes':h},indent=2))
print(dst)
