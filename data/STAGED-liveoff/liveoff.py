# READY, NOT RUN - only on Love's own words: main + rejection stop OPENING on Kalshi (liveBook.books -> ["recon-dly"]); exits/take-profits and the delayed book keep running exactly as now.
# Updates golden-baseline sealLiveBook so THE SEAL doesn't hold the delayed book. Saves her first; diary line.
import json, hashlib, os, subprocess, sys, datetime
os.chdir("/Users/liluv/Desktop/aurelius fixxd <3/Aurelius")
print(subprocess.run([sys.executable, "tools/save-her.py", "before-liveoff-main-rej"], capture_output=True, text=True).stdout.strip().split("\n")[-1])
p = "data/live-switch.json"; s = json.load(open(p)); lb = s["liveBook"]; prev = list(lb.get("books") or [])
lb["liveoffPrev"] = prev; lb["books"] = [b for b in prev if b not in ("recon-tog", "recon-rej")]
t = p + ".tmp"; open(t, "w").write(json.dumps(s, indent=2, ensure_ascii=False) + "\n"); os.replace(t, p)
def py(v): return json.dumps(v, sort_keys=True)  # the same text tools/seal-check.py hashes
g = json.load(open("data/golden-baseline.json")); x = {k: v for k, v in lb.items() if k not in ("dollars", "note", "at", "since")}
g["sealLiveBook"] = hashlib.sha256(py(x).encode()).hexdigest()[:10]
g["config"]["liveBook"] = hashlib.sha256(py(s["liveBook"]).encode()).hexdigest()[:10]
g["configFiles"]["data/live-switch.json"] = hashlib.sha256(open(p, "rb").read()).hexdigest()[:16]
json.dump(g, open("data/golden-baseline.json", "w"), indent=2, ensure_ascii=False)
open("data/overnight-fixes.log", "a").write(f"{datetime.datetime.now(datetime.timezone.utc).isoformat()} LIVE OFF for main + rejection on Love's words: liveBook.books {prev} -> {lb['books']} (exits + delayed book unchanged)\n")
for c in ["tools/verify-golden.py", "tools/seal-check.py"]: print(subprocess.run([sys.executable, c], capture_output=True, text=True).stdout.strip().split("\n")[0])
