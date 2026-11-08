#!/usr/bin/env python3
"""Offline preparation only. Does not run, edit, unlock or switch the live desk."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import sys
import tempfile
from datetime import datetime, timezone

SAVE_NAME = "2026-11-07-1255AM-PT-love-save-point"
SKIP_DIRS = {".git", ".secrets", "node_modules", ".venv", "venv", "__pycache__"}
MAX_FILES = 30000
MAX_BYTES = 512 * 1024 * 1024
CONFIGS = (
    "golden-baseline.json", "approved-model.json", "CORNERSTONE-MANIFEST.json",
    "LOVE-REQUESTS.jsonl", "ALLOW-REMOVE.json", "live-switch.json",
    "schedule-approved.json", "UMPIRE-VERDICT.json", "halt.json",
    "install-phase-1025.json", "gate-unlock.json", "umpire-override-618.json",
    "spine-lock.json", "FROZEN.json", "firewall.json", "xrp5m-961-cfg.json",
)
STAGES = (
    "STAGED-CHANGE-colour-from-hl-1032", "STAGED-CHANGE-eth-xrp-push-1031",
    "STAGED-CHANGE-xrp-plain-colour-1027", "STAGED-CHANGE-push-off-band-1030",
)
ROOT_FILES = (
    "AGENTS.md", "AGENTS.project.md", "LOVE-RULEBOOK.md", "package.json",
    "package-lock.json", "tsconfig.json", "vite.config.ts",
)

def sha(p):
    h = hashlib.sha256()
    with p.open("rb") as f:
        for b in iter(lambda: f.read(1024 * 1024), b""):
            h.update(b)
    return h.hexdigest()

def permitted(p):
    return not any(x in SKIP_DIRS or x.startswith(".env") for x in p.parts) and p.suffix not in {".pem", ".key", ".p12", ".pfx"}

def selected_tree(root):
    if root.is_symlink():
        raise RuntimeError(f"Refusing symlink tree: {root}")
    if not root.exists():
        return []
    result = []
    for parent, dirs, files in os.walk(root, followlinks=False):
        dirs[:] = sorted(d for d in dirs if d not in SKIP_DIRS and not d.startswith(".env"))
        for name in dirs:
            if (Path(parent) / name).is_symlink():
                raise RuntimeError(f"Refusing symlink directory: {Path(parent) / name}")
        for name in sorted(files):
            p = Path(parent) / name
            if permitted(p.relative_to(root)):
                if p.is_symlink() or not p.is_file():
                    raise RuntimeError(f"Not a regular file: {p}")
                result.append(p)
    return result

def collect(root, trees, files):
    result = []
    for tree in trees:
        result += selected_tree(root / tree)
    for f in files:
        p = root / f
        if p.is_symlink():
            raise RuntimeError(f"Refusing symlink: {p}")
        if p.is_file():
            result.append(p)
    return sorted(set(result))

def prepare(source, destination):
    source = source.expanduser().resolve(strict=True)
    destination = destination.expanduser().absolute()
    if destination.exists():
        raise RuntimeError(f"Destination already exists; nothing overwritten: {destination}")
    if source == destination or source in destination.parents:
        raise RuntimeError("Destination must be outside the live desk.")
    saved = source / "data" / "SAVES" / SAVE_NAME
    metadata_path = saved / "SAVE.json"
    if not metadata_path.is_file() or not (saved / "src/lib/desk/engine.ts").is_file():
        raise RuntimeError(f"The exact selected save is missing at {saved}; no substitute chosen.")
    metadata = json.loads(metadata_path.read_text())
    if metadata.get("label") != "love-save-point":
        raise RuntimeError("SAVE.json label is not love-save-point.")
    for name, expected in metadata.get("hashes", {}).items():
        if Path(name).name != name:
            raise RuntimeError("Unsafe filename in SAVE.json.")
        actual = sha(saved / "src/lib/desk" / name)
        if not actual.startswith(expected):
            raise RuntimeError(f"Stored save checksum mismatch: {name}")

    old = collect(saved, ["src", "data"], ["SAVE.json", "LOVE-RULEBOOK.md", "spine-lock.json"])
    now = collect(source, ["src", "tools", "scripts"] + [f"data/{x}" for x in STAGES],
                  list(ROOT_FILES) + [f"data/{x}" for x in CONFIGS])
    all_files = old + now
    if len(all_files) > MAX_FILES or sum(p.stat().st_size for p in all_files) > MAX_BYTES:
        raise RuntimeError("Evidence exceeds the bounded size limit; stopped without copying.")
    destination.parent.mkdir(parents=True, exist_ok=True)
    stage = Path(tempfile.mkdtemp(prefix=".flexity-preparing-", dir=destination.parent))
    entries = []
    try:
        for label, root, files in (("SAVIORS", saved, old), ("CURRENT-EVIDENCE", source, now)):
            for p in files:
                rel = p.relative_to(root)
                out = stage / label / rel
                out.parent.mkdir(parents=True, exist_ok=True)
                before = sha(p)
                shutil.copyfile(p, out)  # bytes only, never copy immutable flags
                if sha(out) != before or sha(p) != before:
                    raise RuntimeError(f"File changed during capture: {rel}")
                entries.append({"group":label, "path":rel.as_posix(), "sha256":before, "bytes":out.stat().st_size})
        # Recheck all input files once more: a changing desk is not an atomic snapshot.
        for e in entries:
            root = saved if e["group"] == "SAVIORS" else source
            if sha(root / e["path"]) != e["sha256"]:
                raise RuntimeError(f"Source changed during capture: {e['path']}; retry only after changes stop.")
        candidate = stage / "PERPLEXITY-REVISIONS" / "candidate-source"
        shutil.copytree(stage / "SAVIORS" / "src", candidate / "src")
        (candidate / "DO-NOT-RUN.md").write_text(
            "# Not a runnable release\n\nExact saved src only. Later revisions have NOT been layered yet. "
            "No startup scripts, credentials or order state were provisioned. "
            "Do not replace the running desk with this preparation folder.\n")
        manifest = {"status":"PREPARATION ONLY; NOT INSTALLED; REVISIONS NOT YET LAYERED",
                    "at":datetime.now(timezone.utc).isoformat(), "source":str(source),
                    "save":str(saved), "save_metadata":metadata, "files":entries}
        (stage / "MANIFEST.json").write_text(json.dumps(manifest, indent=2))
        before = {e["path"]:e["sha256"] for e in entries if e["group"] == "SAVIORS" and e["path"].startswith("src/")}
        after = {e["path"]:e["sha256"] for e in entries if e["group"] == "CURRENT-EVIDENCE" and e["path"].startswith("src/")}
        changes = []
        for path in sorted(before.keys() | after.keys()):
            if before.get(path) != after.get(path):
                changes.append({"path":path, "saved":before.get(path), "current":after.get(path)})
        (stage / "SOURCE-DIFFERENCES.json").write_text(json.dumps(changes, indent=2))
        (stage / "01-02-03-04.md").write_text(
            "# PERPLEXITY FLEXITY: 1–2–3–4\n\n"
            "1. CAPTURE: SAVIORS holds the chosen save; CURRENT-EVIDENCE holds selected current code and approval records. Originals untouched.\n"
            "2. VERIFY: MANIFEST.json records SHA-256 values; SOURCE-DIFFERENCES.json lists changed source files. These were checked during capture.\n"
            "3. RECONCILE AND TEST: pending. candidate-source is saved src only. Resolve rule conflicts, apply authorized patches one by one, test with orders/network disabled.\n"
            "4. INSTALL: blocked pending audited CHANGE, passing tests, intact approval records, backup/rollback and your explicit cutover. No installation or startup command is included.\n\n"
            "Secrets, dependencies, order journals and positions were not copied. Do not start a second live desk or copy historical order state over current state.\n")
        os.rename(stage, destination)
        print(f"PREPARED ONLY: {destination}")
        print(f"SAVIORS: {len(old)} files. Current evidence: {len(now)} files.")
        print(f"Source differences: {len(changes)}. Live desk unchanged; nothing started or unlocked.")
        print("Next: evidence review and offline patch/test work, NOT live startup.")
    except Exception:
        print(f"Incomplete preparation retained for inspection: {stage}", file=sys.stderr)
        raise

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path.home() / "Desktop/aurelius fixxd <3/Aurelius")
    parser.add_argument("--destination", type=Path, default=Path.home() / "Desktop/PERPLEXITY FLEXITY")
    args = parser.parse_args()
    try:
        prepare(args.source, args.destination)
    except Exception as exc:
        print(f"STOP: {exc}", file=sys.stderr)
        sys.exit(1)
