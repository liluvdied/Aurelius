#!/usr/bin/env python3
"""Rebuild her big logs from data/big-logs/ (Love Oct 27 2026: "nothingggg left out pls.").
Writes data/<name>.jsonl.restored next to the live log - never overwrites the live one.
Needs: pip install zstandard (or the zstd command)."""
import glob, io, os, shutil, subprocess
os.chdir(os.path.join(os.path.dirname(__file__), ".."))
names = sorted({os.path.basename(p).split(".jsonl.zst.part-")[0] for p in glob.glob("data/big-logs/*.jsonl.zst.part-*")})
for name in names:
    parts = sorted(glob.glob(f"data/big-logs/{name}.jsonl.zst.part-*"))
    out = f"data/{name}.jsonl.restored"
    try:
        import zstandard
        data = b"".join(open(p, "rb").read() for p in parts)
        with open(out, "wb") as w:
            shutil.copyfileobj(zstandard.ZstdDecompressor().stream_reader(io.BytesIO(data)), w)
    except ImportError:
        with open(out, "wb") as w:
            subprocess.run("cat " + " ".join(f'"{p}"' for p in parts) + " | zstd -dc", shell=True, stdout=w, check=True)
    print(out, os.path.getsize(out), "bytes")
