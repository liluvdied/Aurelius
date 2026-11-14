#!/bin/bash
# SAVE MY WHOLE MODEL (Love Nov 10 2026: "i need to diagnose why my models are not loading from savepoints").
# One click = a save point of ALL of her: her code AND every settings file her code reads (add-ons, guards, schedule, breaker, book mode...).
# Pinned by a tag (tags never move, unlike branches) and fingerprinted file by file. Changes nothing in her. No password needed.
DESK="$(cd "$(dirname "$0")" && pwd)"
HERE="$DESK/tools"
cd "$DESK" || { echo "STOP: can't find your desk folder. Nothing changed."; read -r -p "Press return to close." _; exit 1; }
echo "================ SAVE MY WHOLE MODEL · $(date '+%b %-d %-I:%M %p') ================"
echo ""; read -r -p "A short name for this save (Enter = 'my-save'): " L; L="${L:-my-save}"
echo ""; AUR_ROOT="$DESK" python3 "$HERE/whole-save-point.py" save "$L"
echo ""; read -r -p "Press return to close." _
