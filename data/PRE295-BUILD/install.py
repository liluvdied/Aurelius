import json,hashlib,os,shutil,datetime
now=datetime.datetime.now(datetime.timezone.utc).isoformat()
def h16(p): return hashlib.sha256(open(p,'rb').read()).hexdigest()[:16]
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
# diary
with open('data/overnight-fixes.log','a') as f:
    f.write(f"\n{now} THAW (fix316 RESTORE PRE-FIX295: bandlock/recon/engine taken back to Monday Oct 26 ~9:30 PM PT (before fix295) - fixes 295/296/297/298/299/300/302/306/307/308/309/310/311/312/315 undone (fix301/304/305 speed/lab only kept); config back to pre-295 (liveSkipHours gold [4,9,13] btc [8,18], gold 10 PM back to main); live lineup main (recon-tog) on BTC + rejection model (recon-rej) on gold, every size $1. Today's whole desk saved in data/SNAPSHOT-TODAY-2026-10-27-0457am to add fixes back on her word): Love Oct 27 4:51 AM PT: \"you're gonna put this model back where she was before fix295 precisely nothing else\" + 5:04 AM: \"okay bring the whole desk back where it was , and keep those changes on file so we can do them again later ... bring her back where she was prior to fix 295, keep all of these on file and something we can add back in at a moments notice. put her live at the pre fix295 model now at $1 on the rejection model ... make sure my main book doesn't. move. an. ATOM.\" + 5:06 AM: \"no put one on the main book and one on rejection , no preference. i need to make sure they are both the same now. never change a book without asking me again please hun.\"\n")
# code swap
D='src/lib/desk'; os.chmod(D,0o755)
for f in ['bandlock.ts','recon.ts','engine.ts']:
    p=f'{D}/{f}'; os.chmod(p,0o644); shutil.copyfile(f'data/PRE295-BUILD/src/lib/desk/{f}',p+'.tmp'); os.replace(p+'.tmp',p); os.chmod(p,0o444)
os.chmod(D,0o555)
# config
ls=json.load(open('data/live-switch.json')); om=ls['offHourMain']
ls['fix316Prev']={'live':ls['live'],'maxDollars':ls['maxDollars'],'liveBookBooks':ls['liveBook']['books'],'liveBookDollars':ls['liveBook']['dollars'],'omDollars':om['dollars'],'rejHoursByAsset':om['rejHoursByAsset'],'rejHours':om['rejHours'],'liveSkipHours':ls['liveSkipHours'],'goldTogSkip':ls['bookSkipHoursByAsset']['gold']['recon-tog'],'note':f'fix316 {now}: copy back to undo'}
ls['liveSkipHours']={'gold':[4,9,13],'btc':[8,18]}
ls['bookSkipHoursByAsset']['gold']['recon-tog']=[x for x in ls['bookSkipHoursByAsset']['gold']['recon-tog'] if x!=22]
ls['liveBook']['books']=['recon-tog','recon-rej']; ls['liveBook']['dollars']=1; ls['maxDollars']=1
om['dollars']=1; om['dollarsByHour']={}; om['addOn']['dollars']=1; om['addOn']['dollarsByHour']={}; ls['addOn']['dollars']=1
om['rejHoursByAsset']={'gold':list(range(24)),'btc':[]}; om['rejHours']=[]
ls['live']=True
wj('data/live-switch.json',ls)
# hashes
for f in ['bandlock.ts','recon.ts','engine.ts']:
    hv=h16(f'{D}/{f}')
    am=json.load(open('data/approved-model.json'))
    def walk(o):
        if isinstance(o,dict):
            for k in o:
                if k==f and isinstance(o[k],str): o[k]=hv
                else: walk(o[k])
        elif isinstance(o,list):
            for x in o: walk(x)
    walk(am); wj('data/approved-model.json',am)
    if f=='recon.ts':
        sl=json.load(open('data/spine-lock.json')); sl['files']['recon.ts']=hv; wj('data/spine-lock.json',sl)
g=json.load(open('data/golden-baseline.json'))
for f in ['bandlock.ts','recon.ts','engine.ts']: g['code'][f]=h16(f'{D}/{f}')
g['config']={k:hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()[:10] for k,v in ls.items()}
g['configFiles']['data/spine-lock.json']=h16('data/spine-lock.json')
lb={k:v for k,v in ls['liveBook'].items() if k not in('dollars','note','at','since')}
g['sealLiveBook']=hashlib.sha256(json.dumps(lb,sort_keys=True).encode()).hexdigest()[:10]
wj('data/golden-baseline.json',g)
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix316 {datetime.datetime.now(datetime.timezone.utc).isoformat()} (bandlock {g['code']['bandlock.ts']}, recon {g['code']['recon.ts']}, engine {g['code']['engine.ts']}; seal {g['sealLiveBook']})\n")
print('installed', g['code']['bandlock.ts'], g['code']['recon.ts'], g['code']['engine.ts'])
