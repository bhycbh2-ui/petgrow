import fs from "node:fs";

const code = fs.readFileSync("src/App.jsx", "utf8");
const lineAt = (start) => code.slice(0, start).split("\n").length;
const compact = (text) => text.replace(/\s+/g, " ").trim();

function bodyStart(start) {
  const openParen = code.indexOf("(", start);
  if (openParen < 0) return -1;
  let paren = 0, quote = null, escape = false, line = false, block = false;
  for (let i = openParen; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (ch === "\\") { escape = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") paren++;
    else if (ch === ")") { paren--; if (paren === 0) return code.indexOf("{", i + 1); }
  }
  return -1;
}

function functionEnd(brace) {
  let depth = 0, quote = null, escape = false, line = false, block = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (ch === "\\") { escape = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}

function statementEnd(start) {
  let paren = 0, brace = 0, bracket = 0, quote = null, escape = false, line = false, block = false;
  for (let i = start; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (line) { if (ch === "\n") line = false; continue; }
    if (block) { if (ch === "*" && next === "/") { block = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (ch === "\\") { escape = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { line = true; i++; continue; }
    if (ch === "/" && next === "*") { block = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") paren++;
    else if (ch === ")") paren = Math.max(0, paren - 1);
    else if (ch === "{") brace++;
    else if (ch === "}") brace = Math.max(0, brace - 1);
    else if (ch === "[") bracket++;
    else if (ch === "]") bracket = Math.max(0, bracket - 1);
    else if (ch === ";" && paren === 0 && brace === 0 && bracket === 0) return i + 1;
  }
  return -1;
}

const functions = [];
const functionRe = /(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
let m;
while ((m = functionRe.exec(code))) {
  const name = m[1], start = m.index + m[0].indexOf("function"), brace = bodyStart(start);
  if (brace < 0) continue;
  const end = functionEnd(brace);
  if (end > 0) functions.push({ name, bytes: end - start, start, end, line: lineAt(start) });
}
functions.sort((a, b) => b.bytes - a.bytes);

const declarations = [];
const declRe = /^(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
while ((m = declRe.exec(code))) {
  const name = m[1], start = m.index, end = statementEnd(start);
  if (end > 0) declarations.push({ name, bytes: end - start, start, end, line: lineAt(start) });
}
declarations.sort((a, b) => b.bytes - a.bytes);

console.log(`APP_FUNCTION_REPORT total=${functions.length} appBytes=${code.length}`);
for (const row of functions.slice(0, 60)) console.log(`APP_FUNCTION ${row.name} bytes=${row.bytes} line=${row.line} start=${row.start}`);
console.log(`APP_DECL_REPORT total=${declarations.length}`);
for (const row of declarations.slice(0, 60)) console.log(`APP_DECL ${row.name} bytes=${row.bytes} line=${row.line} start=${row.start}`);

const traceNames = ["TIPS_DATA", "PETGROW_LOGO_DATA_URI", "STRINGS", "GlobalStyle", "PRIVACY_SECTIONS_KO", "PRIVACY_SECTIONS_EN", "TERMS_SECTIONS_KO", "TERMS_SECTIONS_EN"];
for (const name of traceNames) {
  const re = new RegExp(`\\b${name}\\b`, "g");
  const hits = [];
  let hit;
  while ((hit = re.exec(code))) {
    const pos = hit.index;
    const ownerFunction = functions.filter((f) => f.start <= pos && pos < f.end).sort((a,b) => a.bytes - b.bytes)[0];
    const ownerDecl = declarations.filter((d) => d.start <= pos && pos < d.end).sort((a,b) => a.bytes - b.bytes)[0];
    const owner = ownerFunction ? `FN:${ownerFunction.name}` : ownerDecl ? `DECL:${ownerDecl.name}` : "TOP";
    hits.push(`line=${lineAt(pos)} owner=${owner}`);
    if (name === "TIPS_DATA") {
      console.log(`APP_CONTEXT TIPS_DATA line=${lineAt(pos)} ${compact(code.slice(Math.max(0, pos - 220), Math.min(code.length, pos + 320)))}`);
    }
  }
  console.log(`APP_REF ${name} count=${hits.length} ${hits.join(" | ")}`);
}
