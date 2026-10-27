# Her five biggest logs (each over GitHub's 100 MB file limit)

Kept whole, compressed with zstd and split into parts under 90 MB, as of Oct 27 2026 1:43 PM PT.
Love Oct 27 1:41 PM PT: "nothingggg left out pls."

| Log | Full size | Lines |
|---|---|---|
| band-lock.jsonl | 202,827,533 bytes | 835,903 |
| copy-timing.jsonl | 221,475,925 bytes | 959,143 |
| gold-law.jsonl | 624,584,982 bytes | 2,434,963 |
| grok-og-archive.jsonl | 394,651,057 bytes | 970,000 |
| other-side.jsonl | 1,439,648,561 bytes | 5,093,846 |

Restore any of them: `python3 tools/restore-big-logs.py` (writes data/<name>.jsonl.restored), or
`cat data/big-logs/<name>.jsonl.zst.part-* | zstd -d > <name>.jsonl`.
