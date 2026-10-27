# 5M trades from main's extra calls (record only)

Love Oct 27 2:25 PM PT: "track and log those and we'll see if it's a problem or a proud one :)"

From main's extra calls: 0W 0L, $+0.00  |  rest of that 5M lane: 0W 0L, $+0.00  (since fix336, Oct 27 1:13 PM PT)

| when (UTC) | window | kind | what happened | $ | why |
|---|---|---|---|---|---|
| 2026-10-27T20:54:03.251Z | KXBTC15M-26OCT271700-00 | main's extra call itself | expired |  | its own window is over - a call never trades the next window |
| 2026-10-27T20:59:03.890Z | KXBTC15M-26OCT271700-00 | 5m swing after main's extra call | expired |  | its own window is over - a call never trades the next window |
