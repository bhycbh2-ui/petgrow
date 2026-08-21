function extractFunction(code, start) {
  const brace = code.indexOf("{", start);
  if (brace < 0) return null;
  let depth = 0;
  let quote = null;
  let templateDepth = 0;
  let escape = false;
  let lineComment = false;
  let blockComment = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (quote === "`" && ch === "$" && next === "{") { templateDepth++; i++; continue; }
      if (quote === "`" && ch === "}" && templateDepth > 0) { templateDepth--; continue; }
      if (ch === quote && templateDepth === 0) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; templateDepth = 0; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return code.slice(start, i + 1);
    }
  }
  return null;
}

function logChunks(name, source) {
  const encoded = Buffer.from(source, "utf8").toString("base64");
  const width = 3500;
  const count = Math.ceil(encoded.length / width);
  for (let i = 0; i < count; i++) {
    console.log(`PETGROW_V4_SOURCE ${name} ${i + 1}/${count} ${encoded.slice(i * width, (i + 1) * width)}`);
  }
}

export default function petgrowV4SourceInspect() {
  return {
    name: "petgrow-v4-source-inspect",
    enforce: "pre",
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      const matches = [];
      const re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
      for (const m of code.matchAll(re)) {
        const name = m[1];
        if (!/(Talk|Community|Nearby|Admin)/i.test(name)) continue;
        const source = extractFunction(code, m.index);
        if (source) matches.push({ name, size: source.length, source });
      }
      console.log("PETGROW_V4_INSPECT", matches.map(x => `${x.name}:${x.size}`).join(", "));
      for (const item of matches) {
        if (["NearbyPetPage", "AdminMusicPanel", "PetTalkFallback", "CommunityPage", "IllustCommunity"].includes(item.name)) logChunks(item.name, item.source);
      }
      return null;
    },
  };
}
