import fs from "node:fs";

const code = fs.readFileSync("src/App.jsx", "utf8");

function bodyStart(start) {
  const openParen = code.indexOf("(", start);
  if (openParen < 0) return -1;
  let paren = 0, quote = null, escape = false, line = false, block = false;
  for (let i = openParen; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") paren++;
    else if (ch === ")") {
      paren--;
      if (paren === 0) return code.indexOf("{", i + 1);
    }
  }
  return -1;
}

function functionEnd(brace) {
  let depth = 0, quote = null, escape = false, line = false, block = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

const rows = [];
const re = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
let m;
while ((m = re.exec(code))) {
  const name = m[1];
  const start = m.index + m[0].indexOf("function");
  const brace = bodyStart(start);
  if (brace < 0) continue;
  const end = functionEnd(brace);
  if (end < 0) continue;
  rows.push({ name, bytes: end - start, start });
}

rows.sort((a, b) => b.bytes - a.bytes);
console.log(`APP_FUNCTION_REPORT total=${rows.length} appBytes=${code.length}`);
for (const row of rows.slice(0, 60)) {
  console.log(`APP_FUNCTION ${row.name} bytes=${row.bytes} start=${row.start}`);
}
