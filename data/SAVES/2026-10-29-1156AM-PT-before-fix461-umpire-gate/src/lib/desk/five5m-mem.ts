// THE WALLED-OFF 5M - HER OWN MEMORY (R169, Love Oct 29 2026 10:27 AM PT: "please create a SEPARATE BOOK FOR THAT MODEL. ITS SUPPOSED TO STAND ALONE FROM THE OTHERS. I CANNOT HAVE IT
// KEEP CHANGING EVRRYTIME WE REFINE THE OTHERS ... ONE ALTERATION TO ONE - DOES NOTTTTTTTTTTTTTTTT. DOES. NOT. TOUCH. THE 5M BOOK. WALLED OFF. PLEASE." + R173 10:58 AM: "october 27th please. she was
// at 79%. that's where she was when she was working"). A frozen copy of her Oct 27 4:57 AM PT save (data/SNAPSHOT-TODAY-2026-10-27-0457am), byte for byte except the wiring marked FIVE5M:
// its own memory (five5m-mem.ts), its own data folder (data/five5m/), its own frozen helpers. No other book's code imports this file; editing recon.ts / bandlock.ts / engine.ts never changes it.
import { join } from "node:path";
import { mkdirSync } from "node:fs";
// FIVE5M: the desk"s shared memory is read through (price feeds, bars, bands - written by the desk"s feed code: __pivBars, __lawBands, __bbsr, __bbsrChart, __symBtc, __freshSd, __sessCarry, __sessCarried, __kStrike, __doneDoc, __oneDoor);
// everything her Oct 27 code writes lives here only, so she never writes into what the Kalshi books read, and they never write into her.
export const SHARED: any = globalThis as any;
export const M5: any = Object.create(globalThis);
export const OWN_NAMES: string[] = ["__bandLawBroken", "__bandLogAt", "__bandSeen", "__brokenWalls", "__dlyHold", "__dlyReach", "__fakeOutTurn", "__indexBias", "__kGap", "__kGapOut", "__kGapTimer", "__ownerDone", "__pinkCap5", "__reconSkip", "__reconTop", "__rejMem", "__rejRead", "__sdGood", "__sealWarm", "__setupRows", "__stDefaultReach", "__swing5", "__togMiss", "__turnNow", "__twinTouchBand", "__vwH"];
for (const k of OWN_NAMES) Object.defineProperty(M5, k, { value: undefined, writable: true, configurable: true, enumerable: true });
// FIVE5M: her files - everything she writes, her own settings (live-switch.json = her Oct 27 settings), her own paper rows (grok-og.json) and swings - in data/five5m/.
// Read-only desk files she still looks at (Kalshi"s live-book-done.json, golden-baseline.json) stay where they are.
export const FIVE_DIR = join(process.cwd(), "data", "five5m");
try { mkdirSync(FIVE_DIR, { recursive: true }); } catch {}
const SHARED_READ = new Set(["live-book-done.json", "golden-baseline.json"]);
export const D5 = (f: string) => (SHARED_READ.has(f) ? join(process.cwd(), "data", f) : join(FIVE_DIR, f));
