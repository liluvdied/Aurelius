#!/usr/bin/env python3
# WHOLE SAVE POINT (Love Nov 10 2026 9:07 AM PT: "i need to diagnose why my models are not loading from savepoints ... the ones i loaded are NOT saved models").
#
# Why the old save points came back as "pieces of her":
#   1. .git/info/exclude ignores all of data/, so a save point held her code plus ~5 settings files. The ~170 settings files her code reads
#      (addon-settings, five-guard, combo-guard, kalshi-target, schedule-approved, breaker, halt, book-mode, model-mode, ...) were never saved.
#   2. Save points were branches, and a branch moves whenever anything is pushed to it.
#   3. The restore clicks committed with their output thrown away, so when her own commit-msg guard refused (no R### in the message),
#      nobody saw it and her version list kept pointing at the version she had just left.
#
# This tool fixes all three. A whole save point is:
#   * her code (src, tools, scripts, server, spine, pine, migrations, deploy, public, root files) AND every data/ file her code reads,
#     found fresh from her code at save time, so a new setting is never missed;
#   * built in a side index (never touches her main, her staging area or her hooks) and pinned by an ANNOTATED TAG (tags never move);
#   * carrying SAVEPOINT-MANIFEST.json: the sha256 of every file in it, so a load can PROVE it matches, file by file.
#
#   python3 tools/whole-save-point.py save <label>        make a whole save point now (tag whole-save-<date>-<label>), push it to GitHub
#   python3 tools/whole-save-point.py list                every save point, and whether it is WHOLE or CODE ONLY
#   python3 tools/whole-save-point.py verify <tag>        is she, on disk right now, exactly that save point? (changes nothing)
#   python3 tools/whole-save-point.py plan <tag>          what a load would change (changes nothing)
#   python3 tools/whole-save-point.py load <tag> <R###>   put her back to that save point (run by LOAD-A-SAVE-POINT.command, LIVE off, desk stopped)
#
# Never rolled back by a load (her records, not her settings): her request book, exit log, win pings, positions, fills, histories, logs, live feeds.
# LIVE on/off is never changed by a load. Nothing is deleted: files not in the save are moved to data/SAVES/moved-aside-<time>/.
import os, sys, json, re, hashlib, subprocess, datetime, tempfile, shutil, fnmatch

ROOT = os.environ.get("AUR_ROOT") or os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
os.chdir(ROOT)
MANIFEST = "SAVEPOINT-MANIFEST.json"
SELF = "tools/whole-save-point.py"  # the tool itself always stays, so she can always save and load again
TAG_PREFIX = "whole-save-"
PUSH_URL = "git@github.com:liluvdied/aurelius.git"
CODE_DIRS = ["src", "tools", "scripts", "server", "spine", "pine", "migrations", "deploy", "public"]
ROOT_FILE_EXT = (".command", ".md", ".json", ".ts", ".mjs", ".sh", ".log")
SKIP_PARTS = ("__pycache__", ".DS_Store", "node_modules")
MAX_BYTES = 40_000_000  # GitHub refuses files over 100 MB; anything this big in data/ is a log, not a setting
ALWAYS_DATA = ["FROZEN.json", "approved-model.json", "firewall.json", "golden-baseline.json", "live-switch.json", "spine-lock.json",
               "live-size.json", "UMPIRE-VERDICT.json", "RULE-ANCHORS.json", "ALLOW-REMOVE.json", "FIVE-M-FREEZE.json", "HER-ANSWERS-2.json",
               "CORNERSTONE-MANIFEST.json", "STATE-GUARD-SEEN.json", "LOVE-REQUESTS.jsonl", "exit-log.json", "win-pings.json"]
# Her records: saved (so a save point is a full picture) but NEVER put back by a load - they describe what happened, not how she trades.
KEEP_EXACT = {"data/LOVE-REQUESTS.jsonl", "data/exit-log.json", "data/win-pings.json", "data/STATE-GUARD-SEEN.json", "data/CORNERSTONE-MANIFEST.json",
              "data/live-book-done.json", "data/fill-log.json", "data/kalshi-history.json", "data/hedges.json", "data/outside-orders.json",
              "data/quote-stream.json", "data/live-today.json", "data/window-results.json", "data/events.json", "data/mentions-history.json",
              "data/nav-tape.json", "data/bid-paths.json", "data/kalshi-audit.json", "data/poly-audit.json", "data/poly-audit-paths.json",
              "data/selfcheck.json", "data/station-audit.json", "data/feedmatch.json", "data/rfq-cashout.json", "data/rfq-probe.json",
              "data/real-twin-probe.json", "data/tv-asks.json", "data/combo-hedges.json", "data/combo-joins.json", "data/live-fires.json"}
KEEP_GLOBS = ["data/*.jsonl", "data/*.log", "data/*-now.json", "data/*history*", "data/*ledger*", "data/*audit*", "data/*-log.json",
              "data/*trail*", "data/*fills*", "data/*positions*", "data/*-status.json", "data/*-summary.json"]
SECRET_RE = re.compile(r"(^|/)\.secrets/|(^|/)\.env($|\.)|\.pem$|\.p12$|(^|/)id_(rsa|ed25519)|kalshi\.id$|polymarket\.(id|secret)$|ldc-hook\.secret$|ldc-alerts\.txt$|tv-session$", re.I)


def git(*a, check=True, inp=None, env=None):
    r = subprocess.run(["git", *a], capture_output=True, text=inp is None or isinstance(inp, str), input=inp, env=env)
    if check and r.returncode != 0:
        raise SystemExit(f"!! git {' '.join(a[:3])} failed:\n{r.stderr if isinstance(r.stderr, str) else r.stderr.decode(errors='replace')}")
    return r


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()


def is_keep(p):
    return p in KEEP_EXACT or any(fnmatch.fnmatch(p, g) for g in KEEP_GLOBS)


def code_files():
    out = []
    for d in CODE_DIRS:
        for base, dirs, files in os.walk(d):
            dirs[:] = [x for x in dirs if x not in SKIP_PARTS]
            for f in files:
                p = os.path.join(base, f)
                if f in SKIP_PARTS or f.startswith("cloudflared") or os.path.islink(p): continue
                if os.path.getsize(p) > MAX_BYTES: continue
                out.append(p)
    for f in os.listdir("."):
        if os.path.isfile(f) and (f.endswith(ROOT_FILE_EXT) or f in (".gitignore", ".prettierrc")) and os.path.getsize(f) <= MAX_BYTES:
            out.append(f)
    return out


def data_files_her_code_reads():
    names = set(ALWAYS_DATA)
    pat = re.compile(r"data/([A-Za-z0-9_.\-]+\.(?:json|jsonl|txt))")
    for base, dirs, files in os.walk("src"):
        dirs[:] = [x for x in dirs if x not in SKIP_PARTS]
        for f in files:
            if f.endswith((".ts", ".tsx", ".js", ".mjs", ".cjs")):
                try: names.update(pat.findall(open(os.path.join(base, f), encoding="utf8", errors="replace").read()))
                except OSError: pass
    out = []
    for n in sorted(names):
        p = "data/" + n
        if os.path.isfile(p) and os.path.getsize(p) <= MAX_BYTES and not (p.endswith(".jsonl") and p not in ALWAYS_DATA and is_keep(p)):
            out.append(p)
    return out


def secret_problems(paths):
    probs = [f"secret-looking file: {p}" for p in paths if SECRET_RE.search(p)]
    vals = []
    for f in ("kalshi.id", "ldc-hook.secret", "polymarket.id", "polymarket.secret", "tv-session"):
        try:
            v = open(".secrets/" + f, encoding="utf8", errors="replace").read(200).strip()
            if len(v) >= 8: vals.append((f, v))
        except OSError: pass
    try:
        lines = open(".secrets/kalshi.pem", encoding="utf8", errors="replace").read().splitlines()
        if len(lines) > 1 and len(lines[1].strip()) >= 8: vals.append(("kalshi.pem", lines[1].strip()))
    except OSError: pass
    for p in paths:
        try: t = open(p, encoding="utf8", errors="ignore").read()
        except OSError: continue
        if re.search(r"BEGIN [A-Z ]*PRIVATE KEY", t): probs.append(f"private key inside: {p}")
        for f, v in vals:
            if v in t: probs.append(f"the value of .secrets/{f} is inside {p}")
    return probs


def now_pt():
    return datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=8)


def save(label, quiet=False):
    label = re.sub(r"[^A-Za-z0-9._-]+", "-", label).strip("-") or "save"
    tag = f"{TAG_PREFIX}{now_pt().strftime('%Y-%m-%d-%H%M')}-{label}"
    if git("rev-parse", "-q", "--verify", f"refs/tags/{tag}", check=False).returncode == 0:
        raise SystemExit(f"!! {tag} already exists - save points never get overwritten. Try again in a minute.")
    files = sorted(set(code_files()) | set(data_files_her_code_reads()))
    probs = secret_problems(files)
    if probs:
        print("HELD - nothing saved, a secret would have gone into the save point:"); [print("   ", x) for x in probs]; raise SystemExit(2)
    man = {"tag": tag, "label": label, "savedAtUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(),
           "headWhenSaved": git("rev-parse", "HEAD").stdout.strip(), "whole": True,
           "files": {p: sha(p) for p in files}}
    fd, idx = tempfile.mkstemp(prefix="aurelius-whole-save-"); os.close(fd); os.remove(idx)
    env = dict(os.environ, GIT_INDEX_FILE=idx)
    try:
        git("read-tree", "--empty", env=env)
        listing = "\0".join(files) + "\0"
        r = subprocess.run(["git", "add", "-f", "--pathspec-from-file=-", "--pathspec-file-nul"], input=listing.encode(), capture_output=True, env=env)
        if r.returncode != 0: raise SystemExit("!! could not gather her files:\n" + r.stderr.decode(errors="replace"))
        blob = git("hash-object", "-w", "--stdin", inp=json.dumps(man, indent=1, sort_keys=True)).stdout.strip()
        git("update-index", "--add", "--cacheinfo", f"100644,{blob},{MANIFEST}", env=env)
        tree = git("write-tree", env=env).stdout.strip()
    finally:
        if os.path.exists(idx): os.remove(idx)
    msg = f"WHOLE SAVE POINT {label} - code + {sum(p.startswith('data/') for p in files)} settings/state files ({len(files)} files)"
    commit = git("commit-tree", tree, "-p", "HEAD", "-m", msg,
                 env=dict(os.environ, GIT_AUTHOR_NAME="Love", GIT_AUTHOR_EMAIL="liluvdied@users.noreply.github.com",
                          GIT_COMMITTER_NAME="Love", GIT_COMMITTER_EMAIL="liluvdied@users.noreply.github.com")).stdout.strip()
    git("-c", "user.name=Love", "-c", "user.email=liluvdied@users.noreply.github.com", "tag", "-a", tag, commit, "-m", msg)
    print(f"SAVED  {tag}")
    print(f"       {len(files)} files: {sum(not p.startswith('data/') for p in files)} code + {sum(p.startswith('data/') for p in files)} settings/state, each fingerprinted")
    pushed = False
    for url in ("origin", PUSH_URL):
        r = subprocess.run(["git", "push", "-q", url, f"refs/tags/{tag}"], capture_output=True, text=True,
                           env=dict(os.environ, GIT_SSH_COMMAND="ssh -o BatchMode=yes -o ConnectTimeout=20"))
        if r.returncode == 0: pushed = True; break
    print("       on GitHub ✓ (a tag: it can never move)" if pushed else
          f"  !!   NOT on GitHub yet - it is safe on this Mac. Push it later with: git push origin refs/tags/{tag}\n       ({(r.stderr or '').strip()[-200:]})")
    return tag


def tag_manifest(tag):
    if git("rev-parse", "-q", "--verify", f"refs/tags/{tag}", check=False).returncode != 0:
        if git("rev-parse", "-q", "--verify", f"refs/remotes/origin/{tag}", check=False).returncode == 0 or \
           git("rev-parse", "-q", "--verify", f"refs/heads/{tag}", check=False).returncode == 0:
            raise SystemExit(f"!! '{tag}' is a BRANCH, not a save point tag. Branches move every time something is pushed to them, so it may not be\n"
                             f"   what you saved. Pick a tag from the list (python3 tools/whole-save-point.py list).")
        git("fetch", "-q", "origin", f"refs/tags/{tag}:refs/tags/{tag}", check=False)
        if git("rev-parse", "-q", "--verify", f"refs/tags/{tag}", check=False).returncode != 0:
            raise SystemExit(f"!! There is no save point tag called '{tag}'.")
    r = git("show", f"{tag}^{{commit}}:{MANIFEST}", check=False)
    if r.returncode == 0:
        m = json.loads(r.stdout); m["whole"] = True; return m
    files = {}
    for line in git("ls-tree", "-r", f"{tag}^{{commit}}").stdout.splitlines():
        meta, p = line.split("\t", 1)
        if meta.split()[1] != "blob": continue
        files[p] = None  # older save points carry no fingerprints; verify uses git's own blob ids instead
    return {"tag": tag, "whole": False, "files": files}


def blob_ids(tag):
    out = {}
    for line in git("ls-tree", "-r", f"{tag}^{{commit}}").stdout.splitlines():
        meta, p = line.split("\t", 1); out[p] = meta.split()[2]
    return out


def file_matches(p, want_sha, want_blob, tag=None):
    if not os.path.isfile(p): return False
    if p == "data/live-switch.json" and tag:  # LIVE on/off is her hand, never part of a save point
        try:
            saved = json.loads(subprocess.run(["git", "cat-file", "blob", want_blob], capture_output=True).stdout)
            now = json.load(open(p))
            return {k: v for k, v in saved.items() if k not in ("live", "note", "at")} == {k: v for k, v in now.items() if k not in ("live", "note", "at")}
        except (ValueError, OSError): pass
    if want_sha: return sha(p) == want_sha
    return git("hash-object", p).stdout.strip() == want_blob


def scope(m):
    """What a load puts back: code dirs exactly, root files, and data settings (never her records)."""
    code = [p for p in m["files"] if p.split("/")[0] in CODE_DIRS]
    root = [p for p in m["files"] if "/" not in p and p != MANIFEST]
    data = [p for p in m["files"] if p.startswith("data/") and p.count("/") == 1 and not is_keep(p)]
    return code, root, data


def on_disk_code():
    out = set()
    for d in CODE_DIRS:
        for base, dirs, files in os.walk(d):
            dirs[:] = [x for x in dirs if x not in SKIP_PARTS]
            for f in files:
                if f in SKIP_PARTS or f.startswith("cloudflared"): continue
                out.add(os.path.join(base, f))
    return out


def compare(tag):
    m = tag_manifest(tag); blobs = blob_ids(tag); code, root, data = scope(m)
    # a code-only save point never held tools/ in some versions (tools/ was in .gitignore) - only judge code dirs the save actually has
    have_dirs = {p.split("/")[0] for p in code}
    differ = [p for p in code + root + data if p != SELF and not file_matches(p, m["files"].get(p), blobs.get(p), tag)]
    extra = sorted(p for p in on_disk_code() if p.split("/")[0] in have_dirs and p not in m["files"] and p != SELF)
    missing_settings = []
    if not m["whole"]:
        for p in data_files_her_code_reads():
            if p not in m["files"] and not is_keep(p): missing_settings.append(p)
    return m, code, root, data, differ, extra, missing_settings


def verify(tag):
    m, code, root, data, differ, extra, missing = compare(tag)
    n = len(code) + len(root) + len(data)
    print(f"=== Is she exactly {tag}? ===")
    print(f"  {'WHOLE save point (code + settings)' if m['whole'] else 'CODE-ONLY save point (made before whole save points existed)'}")
    print(f"  {n - len(differ)} of {n} saved files match her on disk")
    if differ: print(f"  {len(differ)} differ:"); [print("     ", p) for p in differ[:40]]; len(differ) > 40 and print(f"      ... and {len(differ) - 40} more")
    if extra: print(f"  {len(extra)} files in her code folder are NOT in that save:"); [print("     ", p) for p in extra[:25]]; len(extra) > 25 and print(f"      ... and {len(extra) - 25} more")
    if missing: print(f"  {len(missing)} settings files her code reads were never in that save, so no load can bring them back (they stay as they are now):"); print("      " + ", ".join(p[5:] for p in missing))
    ok = not differ and not extra
    print(f"\n  RESULT: {'SHE IS EXACTLY THIS SAVE POINT ✓' if ok else 'NOT the same as the save point'}{' (code + the settings it held)' if ok and not m['whole'] else ''}")
    return ok


def plan(tag):
    m, code, root, data, differ, extra, missing = compare(tag)
    print(f"=== Loading {tag} would ===")
    print(f"  put back {len([p for p in differ if p.split('/')[0] in CODE_DIRS or '/' not in p])} code files and {len([p for p in differ if p.startswith('data/')])} settings files that differ")
    for p in differ[:30]: print("     ", p)
    if len(differ) > 30: print(f"      ... and {len(differ) - 30} more")
    print(f"  move aside {len(extra)} newer code files (never deleted)")
    print(f"  keep as they are now: LIVE on/off, your request book, exit log, win pings, positions, fills, histories and logs")
    if not m["whole"]:
        print(f"\n  !! This is an older CODE-ONLY save point. {len(missing)} of her settings files were never saved in it, so they stay as they are now:")
        print("      " + ", ".join(p[5:] for p in missing))
    return m, differ, extra


def load(tag, rid):
    if not re.fullmatch(r"R\d{3,4}", rid or ""): raise SystemExit("!! load needs Love's request id (R###) - run it from LOAD-A-SAVE-POINT.command")
    live = json.load(open("data/live-switch.json")).get("live")
    if live: raise SystemExit("STOP: LIVE is on. Turn LIVE off in the desk header first. Nothing changed.")
    m, differ, extra = plan(tag)
    blobs = blob_ids(tag)
    T = now_pt().strftime("%Y%m%d-%H%M%S"); aside = f"data/SAVES/moved-aside-load-{T}"
    problems = []
    for p in extra:
        dst = os.path.join(aside, p); os.makedirs(os.path.dirname(dst), exist_ok=True)
        try: shutil.move(p, dst)
        except OSError as e: problems.append(f"could not move aside {p}: {e}")
    for p in differ:
        os.makedirs(os.path.dirname(p) or ".", exist_ok=True)
        data = subprocess.run(["git", "cat-file", "blob", blobs[p]], capture_output=True).stdout
        if p == "data/live-switch.json":  # her hand on LIVE never moves
            try: d = json.loads(data); d["live"] = live; data = (json.dumps(d, indent=2, ensure_ascii=False) + "\n").encode()
            except ValueError: pass
        tmp = p + ".loading-tmp"
        try:
            with open(tmp, "wb") as f: f.write(data)
            mode = int(git("ls-tree", f"{tag}^{{commit}}", "--", p).stdout.split()[0], 8) & 0o777 or 0o644
            os.chmod(tmp, mode); os.replace(tmp, p)
        except OSError as e:
            problems.append(f"could not put back {p}: {e}")
            if os.path.exists(tmp): os.remove(tmp)
    open("data/LOADED-SAVE-POINT.json", "w").write(json.dumps({"tag": tag, "whole": m["whole"], "rid": rid,
        "atUTC": datetime.datetime.now(datetime.timezone.utc).isoformat(), "movedAside": aside if extra else None}, indent=1))
    with open("data/overnight-fixes.log", "a") as f:
        f.write(f"{datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')} {rid}: LOADED save point {tag} "
                f"({'whole' if m['whole'] else 'code-only'}): {len(differ)} files put back, {len(extra)} moved to {aside}\n")
    for p in problems: print("  !!", p)
    print("")
    return verify(tag) and not problems


if __name__ == "__main__":
    a = sys.argv[1:]
    if a[:1] == ["save"]: save(" ".join(a[1:]) or "save")
    elif a[:1] == ["list"]:
        rows = git("for-each-ref", "refs/tags", "--sort=-creatordate", "--format=%(refname:short)|%(creatordate:format:%b %d %I:%M %p)|%(contents:subject)").stdout.splitlines()
        print("=== Her save points (newest first) ===")
        for r in rows:
            t, d, s = (r.split("|", 2) + ["", ""])[:3]
            whole = git("cat-file", "-e", f"{t}^{{commit}}:{MANIFEST}", check=False).returncode == 0
            print(f"  {'WHOLE    ' if whole else 'CODE ONLY'}  {d:>17}  {t}   {s[:70]}")
    elif a[:1] == ["verify"] and len(a) > 1: sys.exit(0 if verify(a[1]) else 1)
    elif a[:1] == ["plan"] and len(a) > 1: plan(a[1])
    elif a[:1] == ["load"] and len(a) > 2: sys.exit(0 if load(a[1], a[2]) else 1)
    else: print(__doc__ or open(__file__).read().split("\nimport ")[0]); sys.exit(1)
