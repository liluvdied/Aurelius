# test installer for tools/prestamp.py: in the COPY only, deletes a behaviour test's proof line - the umpire must say NOT SAFE (honours AUR_ROOT; refuses to run on her real desk)
import os, sys; root = os.environ.get("AUR_ROOT") or "."
if not os.environ.get("AUR_PRESTAMP"): sys.exit("refusing: test installer only runs inside the pre-stamp copy")
os.chdir(root); p = "src/lib/desk/bandlock.ts"; s = open(p, encoding="utf8").read()
s = s.replace("export function sameSide434(", "export function sameSide434_GONE(", 1); open(p, "w", encoding="utf8").write(s); print("broke side-test-434 in the copy")
