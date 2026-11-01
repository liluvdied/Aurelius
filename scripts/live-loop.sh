#!/bin/sh
# Every two hours: if the desk is offline, start it again on the files already running.
# Never copies another model in.
set -u
cd /workspace
mkdir -p /tmp
echo $$ >/tmp/aurelius-live-loop.pid
note() {
  python3 - "$1" <<'PY'
import json, sys
from datetime import datetime, timezone
path = "/workspace/data/live-loop.json"
row = {"at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "did": sys.argv[1]}
try:
    prev = json.load(open(path))
    if not isinstance(prev, list):
        prev = []
except Exception:
    prev = []
prev.insert(0, row)
json.dump(prev[:40], open(path, "w"))
PY
}
while true; do
  sleep 300
  stale=0
  if ! python3 - <<'PY'
import json, sys, time
from datetime import datetime, timezone
try:
    t = json.load(open("/workspace/data/heartbeat.json")).get("at") or ""
    stamp = datetime.strptime(t[:19], "%Y-%m-%dT%H:%M:%S").replace(tzinfo=timezone.utc).timestamp()
except Exception:
    sys.exit(1)
sys.exit(0 if time.time() - stamp < 360 else 1)
PY
  then
    stale=1
  fi
  port=0
  if curl -s -o /dev/null --max-time 30 http://127.0.0.1:8080/; then
    port=1
  fi
  # The engine heartbeat is the truth. A slow page is not a dead desk.
  # Only restart after two stale checks in a row, so one long tick never kills a working desk.
  if [ "$stale" -eq 0 ]; then
    strikes=0
    note "up"
    continue
  fi
  strikes=$(( ${strikes:-0} + 1 ))
  if [ "$strikes" -lt 2 ]; then
    note "slow, checking again"
    continue
  fi
  strikes=0
  for d in /proc/[0-9]*; do
    cmd=$(tr '\0' ' ' < "$d/cmdline" 2>/dev/null || true)
    case "$cmd" in
      *vite\ dev*|*npm\ run\ dev*|*with-app-env.mjs\ vite*)
        kill "${d#/proc/}" 2>/dev/null || true
        ;;
    esac
  done
  sleep 2
  sh /workspace/startup.sh
  note "restarted"
done
