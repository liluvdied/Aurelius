// fix440 behaviour test (Love Oct 28 2026 9:18 PM PT: "no trading into them. only away from them. within 1.50 ... target = 4040 + price currently 4038 - no longs into the 10 level. only shorts. vis versa."):
// replays her $10-level rule from bandlock.ts for main + rejection (flipRule). Run by tools/umpire.py.
const fs = require("fs"), path = require("path");
const root = process.env.AUR_ROOT || path.join(__dirname, "..");
const src = fs.readFileSync(process.argv[2] || path.join(root, "src/lib/desk/bandlock.ts"), "utf8");
const i = src.indexOf("const tgt10 = targetNow(\"gold\");"); if (i < 0) { console.log("TEN LEVEL TEST: FAIL - her $10 level rule is missing"); process.exit(1); }
let d = 0, j = src.indexOf("{", src.indexOf("if (tgt10 > 0)", i)); for (let k = j; k < src.length; k++) { if (src[k] === "{") d++; else if (src[k] === "}") { d--; if (d === 0) { j = k + 1; break; } } }
const body = src.slice(i, j);
const run = (tgt, tick, side, flipRule = true) => new Function("targetNow", "tick", "side", "flipRule", "let why = ''; " + body + " return why;")(() => tgt, tick, side, flipRule);
let ok = true; const t = (c, m) => { if (!c) { ok = false; console.log("TEN LEVEL TEST: FAIL - " + m); } };
t(run(4040, 4038, "up"), "target 4040, price 4038: a long INTO 4040 must be refused");
t(!run(4040, 4038, "down"), "target 4040, price 4038: a short AWAY must go");
// Love Oct 29 2026 10:35 AM PT, word for word: "EXAMPLE = PRICE CURRENTLY AT 4018 / TARGET PRICE 4020 / LONG INTO THAT LEVEL === BLOCKED / SHORT AWAY FROM THAT == ONLY TRADE ALLOWED."
t(run(4020, 4018, "up"), "Love 10:35 AM: price 4018, target 4020 - LONG INTO it must be BLOCKED");
t(!run(4020, 4018, "down"), "Love 10:35 AM: price 4018, target 4020 - SHORT AWAY is the only trade allowed");
t(run(4020, 4022, "down"), "mirror: price 4022, target 4020 - SHORT INTO it must be BLOCKED");
t(!run(4020, 4022, "up"), "mirror: price 4022, target 4020 - LONG AWAY is allowed");
t(run(4041.4, 4038, "up"), "target $1.40 off the level (within $1.50): a long into it must be refused (main + rejection)");
t(!run(4041.4, 4038, "up", false), "other books keep their $1");
t(run(4040, 4042, "down"), "mirror: target 4040, price 4042: a short INTO 4040 must be refused");
t(!run(4040, 4042, "up"), "mirror: a long AWAY must go");
t(!run(4038.5, 4038.91, "down"), "tonight's 9:10 PM pink-rejection short at 4038.91 under 4040 must go");
t(src.indexOf("CLEAR OF THE $10 LEVEL: ${side") < 0, "the old fix376 check (held trades going AWAY) is still in her");
console.log(ok ? "TEN LEVEL TEST ✓ - no trading into an even $10 level when the target is within $1.50 of it, only away (4040/4038: long refused, short goes; mirror too); tonight's 9:10 short goes; fix376 is out." : "TEN LEVEL TEST: FAIL");
process.exit(ok ? 0 : 1);
