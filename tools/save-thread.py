#!/usr/bin/env python3
# SAVE THE THREAD (Love Oct 27 2026 1:31 PM PT: "can you have it be included for every thread i start on this project please hun?")
# Usage: python3 save-thread.py <out.md> "<thread title>" [transcript.jsonl]
# Default transcript = newest ~/.claude/projects/*/*.jsonl of this session. Writes every Love message, every Claude reply and every card, in time order.
import json,re,sys,glob,os
f=sys.argv[3] if len(sys.argv)>3 else max(glob.glob(os.path.expanduser('~/.claude/projects/*/*.jsonl')),key=os.path.getmtime)
TITLE=sys.argv[2] if len(sys.argv)>2 else 'thread'
out=[]; seen=set()
def add(ts,kind,text):
    k=(kind,text[:200])
    if k in seen: return
    seen.add(k); out.append((ts or '',kind,text))
for line in open(f):
    try: e=json.loads(line)
    except: continue
    ts=e.get('timestamp','')
    m=e.get('message') or {}
    content=m.get('content')
    if e.get('type')!='assistant':
        texts=[]
        def walk(o):
            if isinstance(o,str): texts.append(o)
            elif isinstance(o,list):
                for x in o: walk(x)
            elif isinstance(o,dict):
                for v in o.values(): walk(v)
        walk(e)
        for t in texts:
            for mm in re.finditer(r'<message trigger="true"[^>]*?(?:author="([^"]*)")?[^>]*sent-at="([^"]*)"[^>]*>(.*?)</message>',t,re.S):
                body=mm.group(3).strip()
                add(mm.group(2),'LOVE',body.replace('&#34;','"').replace('&#39;',"'"))
            for mm in re.finditer(r'<cited id="[^"]*" author="user" name="Love" at="([^"]*)"[^>]*>(.*?)</cited>',t,re.S):
                add(mm.group(1),'LOVE (relayed)',re.sub(r'\n\s+','\n',mm.group(2).strip()))
    if e.get('type')=='assistant' and isinstance(content,list):
        for c in content:
            if c.get('type')!='tool_use': continue
            n=c.get('name',''); i=c.get('input',{})
            if n.endswith('post_message'): add(ts,'CLAUDE',i.get('text',''))
            elif n.endswith('request_decision'):
                opts='\n'.join(f"  {j}. {o['label']} - {o['consequence']}" for j,o in enumerate(i.get('options',[])))
                add(ts,'CARD',f"Q: {i.get('question')}\nContext: {i.get('context','')}\nOptions:\n{opts}\nRecommended: {i.get('recommended')} - {i.get('reason','')}")
            elif n.endswith('close_decision'):
                add(ts,'CARD CLOSED',f"by Claude: {'chose option '+str(i['chose']) if 'chose' in i else 'withdrawn'}")
out.sort(key=lambda x:x[0])
with open(sys.argv[1],'w') as w:
    w.write(f"# Aurelius thread history - {TITLE}\n\nEvery message Love wrote, every reply, every option card (with the choice Love tapped), in time order (UTC; PT = UTC-7).\n\n")
    for ts,k,t in out:
        w.write(f"## {ts[:19].replace('T',' ')} UTC - {k}\n\n{t}\n\n")
print(len(out), sum(1 for o in out if o[1]=='LOVE'), sum(1 for o in out if o[1]=='CARD'))
