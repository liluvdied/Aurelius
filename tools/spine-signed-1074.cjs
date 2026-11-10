// fix1074 test: her spine lock is signed for the recon.ts she is running, so her reconstructed books (main) are not held by SPINE DRIFT.
const fs = require("fs"), path = require("path"), crypto = require("crypto");
const have = crypto.createHash("sha256").update(fs.readFileSync(path.join(__dirname, "../src/lib/desk/recon.ts"))).digest("hex").slice(0, 16);
let want = ""; try { want = String(JSON.parse(fs.readFileSync(path.join(__dirname, "../data/spine-lock.json"), "utf8")).files["recon.ts"] || ""); } catch {}
const ok = !!want && want === have;
console.log(ok ? "SPINE SIGNED 1074 TEST: PASS ✓ her spine lock matches the recon.ts she is running (" + have + ") - main is not held by SPINE DRIFT" : "SPINE SIGNED 1074 TEST: FAIL - recon.ts is " + have + " but her spine lock is signed for " + (want || "nothing") + " - main is HELD");
process.exit(ok ? 0 : 1);
