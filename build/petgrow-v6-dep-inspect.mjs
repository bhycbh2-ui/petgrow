import fs from "node:fs";
import path from "node:path";

function bodyStart(code, start) {
  const op = code.indexOf("(", start);
  if (op < 0) return -1;
  let d = 0, q = null, esc = false, line = false, block = false;
  for (let i = op; i < code.length; i++) {
    const c = code[i], n = code[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (q) { if (esc) { esc = false; continue; } if (c === "\\") { esc = true; continue; } if (c === q) q = null; continue; }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'" || c === "`") { q = c; continue; }
    if (c === "(") d++;
    else if (c === ")") { d--; if (d === 0) return code.indexOf("{", i + 1); }
  }
  return -1;
}

function extract(code, start) {
  const br = bodyStart(code, start);
  if (br < 0) return null;
  let d = 0, q = null, templateExpr = 0, esc = false, line = false, block = false;
  for (let i = br; i < code.length; i++) {
    const c = code[i], n = code[i + 1];
    if (line) { if (c === "\n") line = false; continue; }
    if (block) { if (c === "*" && n === "/") { block = false; i++; } continue; }
    if (q) {
      if (esc) { esc = false; continue; }
      if (c === "\\") { esc = true; continue; }
      if (q === "`" && c === "$" && n === "{") { templateExpr++; d++; i++; continue; }
      if (q === "`" && c === "}" && templateExpr > 0) { templateExpr--; d--; continue; }
      if (c === q && templateExpr === 0) q = null;
      continue;
    }
    if (c === "/" && n === "/") { line = true; i++; continue; }
    if (c === "/" && n === "*") { block = true; i++; continue; }
    if (c === '"' || c === "'") { q = c; continue; }
    if (c === "`") { q = c; templateExpr = 0; continue; }
    if (c === "{") d++;
    else if (c === "}") { d--; if (d === 0) return code.slice(start, i + 1); }
  }
  return null;
}

const words = (source) => new Set(source.match(/[A-Za-z_$][\w$]*/g) || []);

export default function petgrowV6DepInspect() {
  return {
    name: "petgrow-v6-dep-inspect",
    enforce: "pre",
    buildStart() {
      const code = fs.readFileSync(path.resolve(process.cwd(), "src/App.jsx"), "utf8");
      const funcs = [];
      const functionRe = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
      let match;
      while ((match = functionRe.exec(code))) {
        const source = extract(code, match.index);
        if (source) funcs.push({ name: match[1], source, bytes: source.length });
      }

      const declared = new Set(funcs.map((item) => item.name));
      let decl;
      const constRe = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g;
      while ((decl = constRe.exec(code))) declared.add(decl[1]);
      const defaultImportRe = /import\s+([A-Za-z_$][\w$]*)\s+from/g;
      while ((decl = defaultImportRe.exec(code))) declared.add(decl[1]);
      const namedImportRe = /import\s*\{([^}]+)\}\s*from/g;
      while ((decl = namedImportRe.exec(code))) {
        for (const part of decl[1].split(",")) {
          const name = part.trim().split(/\s+as\s+/).pop();
          if (name) declared.add(name);
        }
      }

      const top = funcs.filter((item) => item.bytes >= 1800).sort((a, b) => b.bytes - a.bytes).map((item) => [item.name, item.bytes]);
      console.log("PGV6_TOP " + JSON.stringify(top));

      for (const item of funcs.filter((x) => /(About|Saju|Bti|BTI|InfoGuide|Tips|TipCard)/i.test(x.name))) {
        const used = words(item.source);
        const deps = [...used].filter((name) => declared.has(name) && name !== item.name).sort();
        console.log("PGV6_DEP " + JSON.stringify({ name: item.name, bytes: item.bytes, deps }));
      }
    },
  };
}
