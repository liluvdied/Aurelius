# The 11:39 UTC long, the umpire, the window lock, and the money at $20
*Nov 1 2026. Nothing on the live desk was changed.*

**\*\*\*\*\*\*\*\*\*\* Caveats first. (1) I found no place where a long left under an unbroken pink inside her tolerance. The 11:39 long left $3.73 outside the tolerance, and the pink cushion then refused every top-up once price came inside it. So there is no pink command; I won't invent one. (2) The "duplicate door shut" rows at 11:39 were after a real fill, which is correct. The window gap I'm closing (fix586) was found in the code, not seen live yet. (3) The blocked trades in the waits report can't be priced in dollars: the skip log doesn't record a usable contract price (mostly ask 0), and scoring them held-to-the-bell is banned. The $20 money below is her REAL Kalshi money from Kalshi's own fills and settlements, which includes her real exits. \*\*\*\*\*\*\*\*\*\***

## 1. The order (fill-audit.jsonl, 2026-11-01T11:39:25.417Z)
- Book **recon-rej**, window KXBTC15M-26NOV010645-45 (closes 11:45 UTC), side **up**, row `...:recon-rej:n2`
- Label: "Launched from the bottom third (low 77762.93) - a long until the top third"
- **Price at the send:** 77,815.09 (read tick 77,820.03)
- **Pink (5m PP):** 77,857.51
- **Channel:** session VWAP 77,699.20 to +1σ 77,892.66 = **$193.46**
- **Tolerance:** BTC $100–500 channel = 20% (pinkSlide580) = **$38.69**
- **Distance under the pink:** **$42.42**, outside the $38.69 by **$3.73**. The pink correctly did not hold.
- Channel position about 60%, so not in the top third.
- Paid 2¢; 15 of 41.66 contracts filled.
- **Line that let it leave:** kalshi-live.server.ts L874, `finalGate524` returned clear (no wall within reach), then L875 sent.
- 11:39:28.7 rejudge on the top-up: "PINK CUSHION: long $35.75 under the unbroken pink (77858.12) - inside her $38.69 cushion (fix514)" → refused. Every later top-up was refused (pink cushion, then THE IMPOSSIBILITY at 68–70% of channel). Row now blocked.
- Her photo (price 77,832, pink 77,850.22, $18 under) is from after the send, when the cushion was already holding.

## 2. The umpire (data/UMPIRE-VERDICT.json)
- ok: **true**, at **2026-11-01T11:10:25.93Z** (right after fix584 went in)
- why: "" (no failing check), reportOnly: [] (nothing waved through)
- Code fingerprints match the live files (bandlock 71c22adee18932eb, engine 8c95c70bf90cd0b1). The fill row shows "HIS STAMP OK at 11:39:25.042Z".
- It stamped SAFE because every rule anchor was present and no file differed from her last save. The stamp checks that the rules are there; it doesn't judge each trade. The trade check is the pink cushion, which did its job here.

## 3. Every place a long can leave under the pink
Checked: recon bonesDecide pink cushion (fix514), pinkSlide580 tolerance, finalGate524 rejudge at the wire, top-up rejudge. All four read the same pink and the same tolerance. None lets a long out inside the tolerance. The only "release" is her own fix584 rule (pink in the far third = slide her way).

## 4. fix586 EVERY WINDOW STAYS OPEN (staged, not applied)
- **Gap:** in sendOrder the one-door lock (`__oneDoor`) shuts before the last-line check. If that check refuses, or the send throws, nothing reaches Kalshi, yet the window stays shut ("duplicate door shut") for the rest of its 15 minutes.
- **Fix:** a refused or failed send opens the door again. Only an order on the wire or a fill keeps it shut. One EXECUTED trade per window is unchanged.
- Other paths checked and already fine: unfilled orders reopen (L545 frees `:n2`), a rejected `!res.ok` reopens, the resting path isn't used by live books.
- **Test** tools/window-stays-open-586.cjs runs the real sendOrder: FAILS on live (refusal and throw keep the window shut), PASSES with the fix. Every other tools/*.cjs test gives identical output before and after.
- Diff: /mnt/project-files/aurelius/commands/fix586/kalshi-live-586.diff. Desk: Desktop **5-EVERY-WINDOW-STAYS-OPEN**.

## 5. Real money at $20 (Kalshi's own fills + settlements, Oct 20 – Nov 1 09:06 UTC)
Every window scaled so $20 went in (add-ons included). 1,550 windows; Kalshi's yes/no counts matched on every one.

| | Windows | Made money | Real $ as traded | Avg per window at $20 | Total at $20 |
|---|---|---|---|---|---|
| BTC | 926 | 50% | −$627.31 | −$1.38 | −$1,280.91 |
| Gold | 624 | 48% | −$359.42 | −$2.89 | −$1,802.95 |
| **All** | 1,550 | 49% | **−$986.74** | **−$1.99** | **−$3,083.86** |

Books the desk logged by name (from Oct 30, small samples):

| | Windows | Made money | Avg at $20 | Total at $20 |
|---|---|---|---|---|
| recon-tog (main) | 46 | 50% | −$1.29 | −$59.40 |
| recon-rej (rejection) | 39 | 31% | −$9.17 | −$357.73 |
| recon-dly (delayed) | 1 | 100% | +$16.18 | +$16.18 |

Script: band-tolerances-2026-11-01/replay/money20.py.
