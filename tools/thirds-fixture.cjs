// Compile the production channel helpers alongside rules tested in isolation.
module.exports = (ts, source) => {
  const file = ts.createSourceFile("bandlock.ts", source, ts.ScriptTarget.Latest, true);
  return ["carryExtra617", "thirdsChannel1050"].map((name) =>
    file.statements.find((node) => ts.isFunctionDeclaration(node) && node.name?.text === name)
      .getText(file).replace(/^export /, "").replace(/\bG\.__sessCarry/g, "globalThis.__sessCarry"),
  ).join("\n");
};
