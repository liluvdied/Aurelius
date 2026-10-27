import json,hashlib,os,datetime,subprocess,sys
def now(): return datetime.datetime.now(datetime.timezone.utc).isoformat()
def wj(p,o):
    t=p+'.tmp'; open(t,'w').write(json.dumps(o,indent=2,ensure_ascii=False)); os.replace(t,p)
subprocess.run(['python3','tools/save-her.py','before-fix320'],check=True)
ls=json.load(open('data/live-switch.json')); P=ls['fix313Prev']
prev={'maxDollars':ls['maxDollars'],'liveBookBooks':ls['liveBook']['books'],'liveBookDollars':ls['liveBook']['dollars'],'omDollars':ls['offHourMain']['dollars'],'omAddOn':ls['offHourMain']['addOn']['dollars'],'addOn':ls['addOn']['dollars'],'rejHoursByAsset':ls['offHourMain']['rejHoursByAsset'],'liveSkipHours':ls['liveSkipHours'],'goldTogSkip':ls['bookSkipHoursByAsset']['gold']['recon-tog'],'note':'fix320 '+now()+': copy back to undo'}
ls['fix320Prev']=prev
ls['live']=False; wj('data/live-switch.json',ls)
with open('data/overnight-fixes.log','a') as f: f.write(f"\n{now()} fix320 SCHEDULE BACK (config only, no code thawed): every book back on its best hours exactly as at 3 AM PT before fix313 (rejHoursByAsset = fix313Prev; gold 10 PM rejection / main skips gold 22; liveSkipHours gold [4,9,13,23] btc [8,18,23] = liveSkipHoursPrev315; twin skips unchanged), liveBook [recon-tog, recon-rej, recon-dly, recon-togp], every size $5 + one $5 add-on: Love Oct 27 10:46 AM PT: \"we can put her back on her schedule at $5 with a $5 add on on each books best hours like before / can we do that and see how she does today pls? and start fresh on a good note?\" + 10:47 AM: \"it'd be around 5\" + 10:48 AM: \"noo i'm saying backwards fires since 5 am not 6:30 bb / and i want the same schedule we had in place for each books best hours before. none of those changed right?\"\n")
rh={'gold':list(P['rejHoursByAsset']['gold']),'btc':list(P['rejHoursByAsset']['btc'])}
ls['liveSkipHours']={'gold':[4,9,13,23],'btc':[8,18,23]}
ls['bookSkipHoursByAsset']['gold']['recon-tog']=[2,4,6,8,14,16,18,21,22,23]
ls['maxDollars']=5; ls['liveBook']['books']=['recon-tog','recon-rej','recon-dly','recon-togp']; ls['liveBook']['dollars']=5
ls['offHourMain']['dollars']=5; ls['offHourMain']['addOn']['dollars']=5; ls['offHourMain']['dollarsByHour']={}; ls['offHourMain']['addOn']['dollarsByHour']={}
ls['addOn']['dollars']=5; ls['offHourMain']['rejHoursByAsset']=rh
ls['live']=True
g=json.load(open('data/golden-baseline.json'))
lb={k:v for k,v in ls['liveBook'].items() if k not in('dollars','note','at','since')}
g['sealLiveBook']=hashlib.sha256(json.dumps(lb,sort_keys=True).encode()).hexdigest()[:10]
g['config']={k:hashlib.sha256(json.dumps(v,sort_keys=True).encode()).hexdigest()[:10] for k,v in ls.items()}
wj('data/live-switch.json',ls); wj('data/golden-baseline.json',g)
with open('data/overnight-fixes.log','a') as f: f.write(f"LIVE back on after fix320 {now()} (seal {g['sealLiveBook']}; rej gold {rh['gold']} btc {rh['btc']})\n")
print('ok',rh)
