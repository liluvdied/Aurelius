import re,sys
B='data/PRE295-BUILD/src/lib/desk/'
CK='checkpoints/CHECKPOINT-2-2026-10-25-1218am/src/'
def one(s,old,new,lbl):
    n=s.count(old); assert n==1,(lbl,n); return s.replace(old,new)
def rx(s,pat,new,lbl,flags=0):
    r,n=re.subn(pat,lambda m:new,s,flags=flags); assert n==1,(lbl,n); return r
# ---------- bandlock
s=open(B+'bandlock.ts',encoding='utf8').read()
s=one(s,'const gwR = dlyThirds(asset, lbR.L, qR.c, side); /* fix307 */','const gwR = dlyKeeps(impossibleGeo(asset, lbR.L, qR.c, side, true).why, asset);','B1')
s=one(s,'whyR = dlyThirds(a1, lbR.L, qR.c, side); /* fix307 */','whyR = dlyKeeps(impossibleGeo(a1, lbR.L, qR.c, side, true).why, a1);','B2')
s=rx(s,r'// THE TWIN AT THE BAND \(fix307.*?\n\}\n(?=// UNDER ALL HER RULES)','','B3',re.S)
s=rx(s,r'    if \(Array\.isArray\(hrs\) && hrs\.map\(Number\)\.includes\(h\)\) return true;\n    // fix306.*?return Array\.isArray\(dh\) && !dh\.map\(Number\)\.includes\(h\);\n','    return Array.isArray(hrs) && hrs.map(Number).includes(h);\n','B4',re.S)
s=one(s,'dlyFree ? dlyThirds(asset, lb.L, q.c, side) /* fix307 */ : geo.why','dlyFree ? dlyKeeps(geo.why, asset) : geo.why','B5')
s=one(s,', loose = false /* fix311: the no-pink copy */','','B6')
s=rx(s,r'      // NO FINISHED 1m CLOSE FOR THE COPY \(fix311.*?turnUp = loose[^\n]*\n','','B7a',re.S)
s=one(s,'((Number(k1.c) < B.p && Number(k1.c) < Number(k1.o)) || turnDn)','Number(k1.c) < B.p && Number(k1.c) < Number(k1.o)','B7b')
s=one(s,'((Number(k1.c) > B.p && Number(k1.c) > Number(k1.o)) || turnUp)','Number(k1.c) > B.p && Number(k1.c) > Number(k1.o)','B7c')
s=one(s,'cush = asset === "btc" ? (wc <= 100 ? 25','cush = asset === "btc" ? (wc < 100 ? 25','B8a')
s=rx(s,r'Math\.max\(50, 0\.10 \* wc\) /\* fix298.*?\*/\)','Math.max(50, (wc >= 1000 ? 0.10 : 0.15) * wc))','B8b')
s=rx(s,r'  // NO SHORTS IN THE BOTTOM RUNG \(fix296.*?lock: null \}; \}\n','','B9',re.S)
s=one(s,'fakeOutTurnNow(asset, L, tick, false /* fix312: same as main */ && togpLoose /* fix311 */)','fakeOutTurnNow(asset, L, tick)','B10')
s=one(s,' && r1Z - tick < 3 /* fix310: Love Oct 27 2:15 AM "we can make that $3 hun" - $3 clearance */','','B11a')
s=one(s,' && tick - s1Z < 3 /* fix310: $3 clearance */','','B11b')
s=one(s,'const w10 = asset === "btc" ? ((above - below) <= 100 ? 25','const w10 = asset === "btc" ? ((above - below) < 100 ? 25','B12a')
s=rx(s,r'Math\.max\(50, 0\.10 \* \(above - below\)\) /\* fix298.*?\*/\)','Math.max(50, ((above - below) >= 1000 ? 0.10 : 0.15) * (above - below)))','B12b')
s=rx(s,r'if \(togpLoose\) w10e = asset === "gold" \? 1\.5 : w10e;.*?\) w10e = Math\.min\(w10e, 25\); // fix292','if (togpLoose && asset === "btc") w10e = Math.min(w10e, 25); // fix292','B13')
s=rx(s,r'const w10g286 = false /\* fix312: same as main \*/ && togpLoose && asset === "btc" && \(above - below\) <= 100 /\* fix302.*?\*/ \?','const w10g286 = togpLoose && asset === "btc" ?','B14')
s=one(s,'(true /* fix312: same as main */ || !togpLoose)','!togpLoose','B15')
bk=open('data/bandlock.ts.pre-fix315.bak',encoding='utf8').read().split('\n')
cur=s.split('\n'); i=[k for k,l in enumerate(cur) if 'const o5D = fiveOpenNow(asset); const dS = o5D' in l]; assert len(i)==1
j=[k for k,l in enumerate(bk) if 'const dS = c > o ? "up" : "down";' in l]; assert len(j)==1
assert 'DOJI AFTER THE TREND' in cur[i[0]+1] and 'DOJI AFTER THE TREND' in bk[j[0]+1]
cur[i[0]:i[0]+2]=bk[j[0]:j[0]+2]; s='\n'.join(cur)
s=rx(s,r'  // EARN THE COLOUR \(fix295.*?\n(?=  if \(!why && side === "up" && cdl === "down"\))','','B17',re.S)
open(B+'bandlock.ts','w',encoding='utf8').write(s)
# ---------- recon
r=open(B+'recon.ts',encoding='utf8').read()
ck=open(CK+'recon.ts',encoding='utf8').read().split('\n')
ckf=[l for l in ck if l.startswith('  cands2 = cands2.filter((c) => { const lb = String(c.label); if (!/(Green|Red) zone$/')]; assert len(ckf)==1
r=rx(r,r'  // fix297 \(Oct 26.*?\n  cands2 = cands2\.filter\(\(c\) => \{ const lb = String\(c\.label\); if \(!/\(Green\|Red\) zone\( - \|\$\)/[^\n]*\n',ckf[0]+'\n','R1',re.S)
r=one(r,'  let foLoose: { side: "up" | "down"; label: string } | null = null; // fix311\n','','R2')
r=rx(r,r'    // fix311 \(Oct 27 2026 ~2:21 AM.*?foLoose = \{[^\n]*\n','','R3',re.S)
r=one(r,'(false /* fix312: same as main */ && foLoose) || firstT','firstT','R4a')
r=one(r,'(false /* fix312: same as main */ && tpStack)','tpStack','R4b')
r=rx(r,r'      // THE BAND TOUCH IS HER ONLY ENTRY \(fix309.*?const DLY_TOUCH_ONLY = true;\n','','R5a',re.S)
r=rx(r,r'      // THE TWIN IS DELAYED \(fix307.*?\n      const dlyHold = false;[^\n]*\n','','R5b',re.S)
r,n=re.subn(r'!dlyHold && !DLY_TOUCH_ONLY && ','',r); assert n==3,('R6',n)
ckh=[l for l in ck if l.startswith('          const hit = L6.filter((l) => l.name !== z.skip')]; assert len(ckh)==1
r=rx(r,r'          const hit = L6\.filter\(\(l\) => l\.name !== z\.skip && \(!z\.first \|\| l\.name !== z\.first /\* fix307[^\n]*',ckh[0],'R7a')
r=one(r,'else if (hit && !dlyHold) z.hit','else if (hit) z.hit','R7b')
r=rx(r,r'          // fix307 \(Love ~1:26-1:33 AM PT.*?/\* fix309: her entry band, so her add-on waits for the next one \*/ \}','          const side: "up" | "down" = dir === "up" ? "down" : "up";\n          if (ln && book("recon-dly", { side, label: `Touch of ${ln.name} - the next band after the initial move` })) changed = true;','R8',re.S)
r=one(r,'!(globalThis as any).__dlyHold?.[m.ticker] /* fix307: delayed */ && ','','R9')
open(B+'recon.ts','w',encoding='utf8').write(r)
# ---------- engine
e=open(B+'engine.ts',encoding='utf8').read()
e=one(e,' && !aoTwin /* fix309 */','','E1')
e=rx(e,r'          // HER ADD-ON AT THE NEXT BAND \(fix309.*?// the band her entry touched \(recon fix309\)\n','','E2',re.S)
e=one(e,'          if (why && aoTwin && twEB[row.ticker] && bandOf(why) === twEB[row.ticker]) why = null; // fix309: not her entry band\n','','E3')
open(B+'engine.ts','w',encoding='utf8').write(e)
print('ok')
