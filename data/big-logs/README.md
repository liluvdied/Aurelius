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

## Rotated archives (Oct 27 2026 10:05 PM PT)

Love Oct 27 10:04-10:05 PM PT: "yes let's rotate those into the archive too bb" / "yesss pls". The four logs were moved whole to `data/archive/*-upto-2026-10-27-1005PM-PT.jsonl` on the desk and are kept here zstd-compressed (one part each, verified: decompressed sha256 matches the desk file).

| Log | Full size | Lines | sha256 (first 16) |
|---|---|---|---|
| band-lock-upto-2026-10-27-1005PM-PT.jsonl | 222,343,992 | 915,190 | 2575765b140aa984 |
| copy-timing-upto-2026-10-27-1005PM-PT.jsonl | 232,735,888 | 1,007,078 | 777c2642227e3a1a |
| gold-law-upto-2026-10-27-1005PM-PT.jsonl | 685,913,809 | 2,673,241 | b21378c95709c90b |
| other-side-upto-2026-10-27-1005PM-PT.jsonl | 1,526,894,423 | 5,396,468 | a3d482c809eb94f6 |

Restore: `cat <name>.zst.part-* | zstd -dc > <name>`

## dna-blocks.jsonl (from Oct 29 2026 ~10:08 AM PT)
Over 100 MB, so it lives here as 90 MB raw pieces: cat data/big-logs/dna-blocks.jsonl.part-* > data/dna-blocks.jsonl

## Added Oct 29 2026 ~11:00 AM PT (more files over 100 MB, none left out)
- `offsite/p380.zip` … `p383.zip` and `offsite/bundle-1027-d2.tzst.part-aa`: split into 90 MB parts. Restore: `cat data/big-logs/offsite/p380.zip.part-* > HISTORY/offsite/p380.zip`.
- `grok-og-archive-pre-runaway-7c76b71e.jsonl.gz.part-*`: ONE copy (gzip) of the 401 MB grok-og archive, sha256 7c76b71eab1b8d6a… - the same bytes as `data/grok-og-archive.jsonl.pre-runaway-cleanup`, `data/SAVES/2026-10-27-0700PM-PT-before-runaway-cleanup/grok-og-archive.jsonl.bak` and `data/VAULT/objects/7c/7c76b71e…`. Restore: `cat …part-* | gunzip > file`.
- `data/archive/*-upto-2026-10-27-1005PM-PT.jsonl`: already here as `*-upto-…jsonl.zst.part-*`.
