import fs from "node:fs";
import path from "node:path";

const TARGETS = [
  "AboutPage", "CommunityMockCard", "IllustCommunity", "IllustGrowth", "IllustMyPets", "IntroVideo", "LandingFeatureCard", "LandingHighlightCard", "SocialLinks",
  "ResultPage", "AdultWeightHero", "BreedInfoModal", "GrowthChartCard", "GrowthTableCard", "InfoAccordion", "MilestoneBadges", "PeerCompareCard", "PhotoAlbum", "RecordSection", "ShareCardModal", "VaccineChecklist", "buildGrowthTable", "estimateAdultWeight", "formatBirthDate", "getBreedDisplayName", "renderShareCard",
  "MyPage", "AccountActivityHub", "PetPointDashboard", "musicLiked",
  "AccountModal", "validateNicknameLocal",
  "PrivacyPage", "PrivacyContent", "SupportPage", "supportCreateInquiry", "supportInquiries", "supportNotices", "AdInquiryPage", "submitAdInquiry", "LegalContent",
  "OnboardingPage", "LandingPage", "LoginScreen",
];

function functionBodyStart(code, start) {
  const openParen = code.indexOf("(", start);
  if (openParen < 0) return -1;
  let depth = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = openParen; i < code.length; i++) {
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
    if (ch === "(") depth++;
    else if (ch === ")") { depth--; if (depth === 0) return code.indexOf("{", i + 1); }
  }
  return -1;
}

function extractFunction(code, matchIndex) {
  const start = matchIndex;
  const brace = functionBodyStart(code, start);
  if (brace < 0) return null;
  let depth = 0, quote = null, templateExpr = 0, escape = false, lineComment = false, blockComment = false;
  for (let i = brace; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) { if (ch === "\n") lineComment = false; continue; }
    if (blockComment) { if (ch === "*" && next === "/") { blockComment = false; i++; } continue; }
    if (quote) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (quote === "`" && ch === "$" && next === "{") { templateExpr++; depth++; i++; continue; }
      if (quote === "`" && ch === "}" && templateExpr > 0) { templateExpr--; depth--; continue; }
      if (ch === quote && templateExpr === 0) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'") { quote = ch; continue; }
    if (ch === "`") { quote = ch; templateExpr = 0; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1, source: code.slice(start, i + 1) };
    }
  }
  return null;
}

function words(source) {
  return new Set(source.match(/[A-Za-z_$][\w$]*/g) || []);
}

function localNames(source) {
  const result = new Set();
  const headEnd = source.indexOf("{");
  const head = headEnd >= 0 ? source.slice(0, headEnd) : source;
  const open = head.indexOf("(");
  const close = head.lastIndexOf(")");
  if (open >= 0 && close > open) {
    for (const token of head.slice(open + 1, close).match(/[A-Za-z_$][\w$]*/g) || []) result.add(token);
  }
  for (const re of [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g,
  ]) {
    let match;
    while ((match = re.exec(source))) result.add(match[1]);
  }
  return result;
}

function countName(source, name) {
  return (source.match(new RegExp(`\\b${name}\\b`, "g")) || []).length;
}

export default function petgrowV7Inspect() {
  return {
    name: "petgrow-v7-inspect",
    enforce: "pre",
    buildStart() {
      const code = fs.readFileSync(path.resolve(process.cwd(), "src/App.jsx"), "utf8");
      const functions = [];
      const byName = new Map();
      const re = /(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g;
      let match;
      while ((match = re.exec(code))) {
        const hit = extractFunction(code, match.index);
        if (!hit) continue;
        const item = { name: match[1], ...hit, bytes: hit.source.length };
        functions.push(item);
        byName.set(item.name, item);
      }

      const declared = new Set(functions.map((item) => item.name));
      for (const reDecl of [
        /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g,
        /import\s*\{([^}]+)\}\s*from/g,
        /import\s+([A-Za-z_$][\w$]*)\s+from/g,
      ]) {
        let decl;
        while ((decl = reDecl.exec(code))) {
          if (reDecl.source.includes("([^}]+)")) {
            for (const part of decl[1].split(",")) {
              const name = part.trim().split(/\s+as\s+/).pop();
              if (name) declared.add(name);
            }
          } else declared.add(decl[1]);
        }
      }

      const top = [...functions]
        .filter((item) => item.bytes >= 1800)
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 80)
        .map((item) => [item.name, item.bytes]);
      console.log("PGV7_TOP " + JSON.stringify(top));

      for (const target of TARGETS) {
        const item = byName.get(target);
        if (!item) continue;
        const local = localNames(item.source);
        const deps = [...words(item.source)]
          .filter((name) => declared.has(name) && name !== target && !local.has(name))
          .sort();
        const functionDeps = deps
          .filter((name) => byName.has(name))
          .map((name) => {
            const dep = byName.get(name);
            const masked = code.slice(0, item.start) + " ".repeat(item.end - item.start) + code.slice(item.end);
            return { name, bytes: dep.bytes, refsOutsideTarget: countName(masked, name) };
          });
        console.log("PGV7_DEP " + JSON.stringify({ name: target, bytes: item.bytes, deps, functionDeps }));
      }
    },
  };
}
