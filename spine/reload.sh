#!/bin/sh
# Reload the frozen desk only when the live code has drifted.
# If it already matches, leave the screen alone.
set -eu
# DISABLED by Claude 2026-10-01: this copied BASELINE over the live desk and killed the server.
# That is how the desk kept landing on the bad model. Do not re-enable.
echo "reload disabled"
exit 0
if [ -f /workspace/data/spine-hold ]; then
  exit 0
fi
if diff -qr /workspace/spine/BASELINE/src/lib/desk /workspace/src/lib/desk >/dev/null 2>&1 \
  && diff -qr /workspace/spine/BASELINE/src/components/desk /workspace/src/components/desk >/dev/null 2>&1; then
  exit 0
fi
sleep 2
chmod -R u+w /workspace/src/lib/desk /workspace/src/components/desk
rsync -a --delete /workspace/spine/BASELINE/src/lib/desk/ /workspace/src/lib/desk/
rsync -a --delete /workspace/spine/BASELINE/src/components/desk/ /workspace/src/components/desk/
pids=""
for d in /proc/[0-9]*; do
  cmd=$(tr '\0' ' ' < "$d/cmdline" 2>/dev/null || true)
  case "$cmd" in
    *vite\ dev*|*npm\ run\ dev*|*with-app-env.mjs\ vite*) pids="$pids ${d#/proc/}" ;;
  esac
done
if [ -n "$pids" ]; then
  kill $pids 2>/dev/null || true
  sleep 1
  kill -9 $pids 2>/dev/null || true
  sleep 1
fi
sh /workspace/startup.sh
