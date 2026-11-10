"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const root = path.join(__dirname, "../src/lib/desk");
const name = "bandlock.ts";
const source = ts.createSourceFile(name, fs.readFileSync(path.join(root, name), "utf8"), ts.ScriptTarget.Latest, true);
const flagNode = source.statements.find((n) => ts.isVariableStatement(n) &&
  n.declarationList.declarations.some((d) => d.name.getText(source) === "AUDIT_FLAGS523"));
const fn = source.statements.find((n) => ts.isFunctionDeclaration(n) && n.name?.text === "auditGrade523");
const code = ts.transpileModule(flagNode.getText(source) + "\n" + fn.getText(source), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS },
}).outputText;
const board = [{ name: "session VWAP", price: 75000 }];
const desk = { __lawBands: { btc: { L: board } } };
const api = {};
let refusal = "";
const geometry = (asset, lines, tick, side, ...flags) => {
  assert.equal(desk.__curBook465, "cup713");
  assert.equal(asset, "btc");
  assert.equal(lines, board);
  assert.equal(tick, 75010);
  assert.equal(side, "up");
  assert.deepEqual(flags, api.AUDIT_FLAGS523["recon-tog"]);
  return { why: refusal };
};
new Function("exports", "G", "impossibleGeo", code)(api, desk, geometry);
assert.equal(api.auditGrade523("cup713", "btc", 75010, "up"), "");
refusal = "blocked by the shared wall";
assert.equal(api.auditGrade523("cup713", "btc", 75010, "up"), refusal);
assert.equal(api.auditGrade523("cup713", "gold", 75010, "up"), "the board can't be read this instant - no order (fix523)");
assert.equal(api.auditGrade523("unknown", "btc", 75010, "up"), "unknown book - not in her flag table - no order (fix558)");
console.log("PASS Cup uses MAIN's full wall flags and fails closed for a refused or missing board.");
