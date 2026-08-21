function scanFunctionBodyStart(code, start) {
  const openParen = code.indexOf("(", start);
  if (openParen < 0) return -1;
  let depth = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = openParen; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) { if (escape) { escape = false; continue; } if (ch === "\\") { escape = true; continue; } if (ch === quote) quote = null; continue; }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { quote = ch; continue; }
    if (ch === "(") depth++; else if (ch === ")") { depth--; if (depth === 0) return code.indexOf("{", i + 1); }
  }
  return -1;
}
function extractFunction(code, start) {
  const brace = scanFunctionBodyStart(code, start); if (brace < 0) return null;
  let depth = 0, quote = null, templateExpr = 0, escape = false, lineComment = false, blockComment = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; } if (ch === "\\") { escape = true; continue; }
      if (quote === "`" && ch === "$" && next === "{") { templateExpr++; depth++; i++; continue; }
      if (quote === "`" && ch === "}" && templateExpr > 0) { templateExpr--; depth--; continue; }
      if (ch === quote && templateExpr === 0) quote = null; continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { quote = ch; templateExpr = 0; continue; }
    if (ch === "{") depth++; else if (ch === "}") { depth--; if (depth === 0) return code.slice(start, i + 1); }
  }
  return null;
}
function uniq(re, s){return [...new Set([...s.matchAll(re)].map(m=>m[0]))].sort()}
export default function petgrowV4SourceInspect() {
  return { name:"petgrow-v4-source-inspect", enforce:"pre", transform(code,id){
    if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
    const wanted=/^(NearbyPetPage|AdminReportsPage|AdminMusicPanel|CommunityPage|CommunityFeed|PostComposer|PostDetail|MyActivityPage|PostCard)$/;
    const matches=[]; const re=/function\s+([A-Za-z_$][\w$]*)\s*\(/g;
    for(const m of code.matchAll(re)){const name=m[1]; if(!wanted.test(name))continue; const source=extractFunction(code,m.index); if(source)matches.push({name,size:source.length,source});}
    console.log("PETGROW_V4_TARGETS",matches.map(x=>`${x.name}:${x.size}`).join(", "));
    for(const x of matches){
      if(x.name==="AdminReportsPage") console.log("PETGROW_V4_ADMIN_DEPS",uniq(/\badmin[A-Z][A-Za-z0-9_]*/g,x.source).join(","),"COMP",uniq(/\b(?:PetPointAdminOverview|AdminMusicPanel)\b/g,x.source).join(","));
      if(["CommunityFeed","CommunityPage","PostComposer","PostDetail","MyActivityPage"].includes(x.name)) console.log(`PETGROW_V4_${x.name}_DEPS`,uniq(/\b(?:community[A-Z][A-Za-z0-9_]*|ResponsiveCategoryMenu|ResponsivePagination|SearchIcon|PlusIcon|UserIcon|PostCard|PostComposer|PostDetail|MyActivityPage|CommunityFeed|COMMUNITY_CATEGORY_KEYS|useT|useLang)\b/g,x.source).join(","));
    }
    return null;
  }};
}
