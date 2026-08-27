function extractNamedConst(code, name) {
  const marker = new RegExp(`\\bconst\\s+${name}\\s*=`);
  const match = marker.exec(code);
  if (!match) return null;
  const start = match.index;
  let round = 0, square = 0, curly = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = code.indexOf("=", start) + 1; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") round++;
    else if (ch === ")") round--;
    else if (ch === "[") square++;
    else if (ch === "]") square--;
    else if (ch === "{") curly++;
    else if (ch === "}") curly--;
    else if (ch === ";" && round === 0 && square === 0 && curly === 0) {
      return { start, end: i + 1, source: code.slice(start, i + 1) };
    }
  }
  return null;
}

export default function petgrowInlineAssetExternalize20260828() {
  return {
    name: "petgrow-inline-asset-externalize-20260828",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      const hit = extractNamedConst(code, "PETGROW_LOGO_DATA_URI");
      if (!hit) this.error("[petgrow-phase5] PETGROW_LOGO_DATA_URI anchor not found");
      const replacement = 'const PETGROW_LOGO_DATA_URI = "/petgrow-splash-logo.png";';
      console.log(`PG_PHASE5_ASSET PETGROW_LOGO_DATA_URI ${hit.source.length}->${replacement.length}`);
      return {
        code: code.slice(0, hit.start) + replacement + code.slice(hit.end),
        map: null,
      };
    },
  };
}
