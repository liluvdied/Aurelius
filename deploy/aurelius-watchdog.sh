#!/bin/sh
# Restarts the desk if her heartbeat (data/heartbeat.json) has gone quiet for 4+ minutes (a hang; systemd already
# restarts crashes on its own). Waits 5 minutes after any start so a fresh boot is never restarted in a loop.
HB=/opt/aurelius/data/heartbeat.json
[ -f "$HB" ] || exit 0
UP=$(systemctl show aurelius -p ActiveEnterTimestamp --value)
UPS=$(date -d "$UP" +%s 2>/dev/null || echo 0)
[ $(( $(date +%s) - UPS )) -lt 300 ] && exit 0
AGE=$(python3 -c "import json,time,datetime;d=json.load(open('$HB'));t=datetime.datetime.fromisoformat(d['at'].replace('Z','+00:00')).timestamp();print(int(time.time()-t))" 2>/dev/null || echo 0)
if [ "$AGE" -gt 240 ]; then
  echo "$(date -u +%FT%TZ) heartbeat ${AGE}s old - restarting aurelius" >> /opt/aurelius/data/watchdog.log
  systemctl restart aurelius
fi
