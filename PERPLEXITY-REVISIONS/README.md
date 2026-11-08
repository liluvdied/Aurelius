# PERPLEXITY FLEXITY

Status: reconstruction review branch, NOT an installable trading release.

This branch starts from commit `773d9cf7bf649ce1b5947e6c6ff6ef2d9b85aa9f`,
the nearest identified Git checkpoint to the Nov 7 12:55 AM local
`love-save-point`. Identity with that exact local snapshot is NOT established.
The named Git branch `love-saved-nov7` contains later changes and is not
automatically interchangeable with the local snapshot.

No strategy, feed, switch, price cap, order route or safety check has been
modified on this review branch. No live deployment is authorized by this
README. Later patches must be audited against the actual saved configuration.

## Reconstruction contract

1. Preserve the exact chosen save as SAVIORS and inventory its bytes.
2. Map later requested revisions to minimal code changes and tests. Separate
   strategy rules from feed, scheduler, routing, startup and UI changes.
3. Test the combined candidate offline, including unchanged baseline behavior,
   with network/order submission unavailable. Do not run historical test
   scripts until their side effects have been inspected.
4. Provide a staged CHANGE and AUDIT, with expected hashes, precise scope,
   backups, rollback and integrity checks. The user controls LIVE and startup.

## Mandatory regression cases

- A cap-rejected signal does not consume the entire XRP window.
- A later eligible signal in that window is evaluated independently.
- Confirmed fills consume the window; ambiguous submission outcomes are
  reconciled before any retry, never blindly resent.
- A qualifying wick rejection uses the intended session-band channel width.
- No opening-colour RULE C veto in the requested XRP lane.
- Long/short side mapping is checked separately from order-book bid/ask labels.
- Pink-slide direction is checked on the actual book and actual inputs.
- Non-target books and the baseline execution path remain unchanged outside
  specifically approved revisions.
- Credentials, orders, positions and deduplication state are not rolled back.

Unresolved priorities and conflicting historical rules must be surfaced.
Passing an integrity checksum is not proof of correct strategy behavior or
successful order execution.
