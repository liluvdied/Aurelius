// Pure: same inputs, same answer. Used by live, paper and replay alike.
import { SETUPS } from "./setups.js";
import { WALLS } from "./walls.js";

/** ctx: {asset, bars, lines, price, priceAgeSec, now, secondsLeft, market:{yesAsk, noAsk} (cents), tol, book}
 *  returns {take: {...look, askCents}} or {take: null, looks:[{...look, wall}], why} */
export function decide(ctx) {
  const book = ctx.tol.books[ctx.book];
  if (!book?.on) return { take: null, why: `book ${ctx.book} is off`, looks: [] };
  const looks = [];
  for (const name of book.setups) {
    const look = SETUPS[name]?.(ctx);
    if (!look) continue;
    const askCents = look.side === "up" ? ctx.market.yesAsk : ctx.market.noAsk;
    let wall = null;
    for (const W of WALLS) { wall = W({ ...ctx, look, askCents }); if (wall) { wall = `${W.name}: ${wall}`; break; } }
    looks.push({ ...look, askCents, wall });
    if (!wall) return { take: { ...look, askCents }, looks };
  }
  return { take: null, looks, why: looks.length ? "every setup hit a wall" : "no setup" };
}
