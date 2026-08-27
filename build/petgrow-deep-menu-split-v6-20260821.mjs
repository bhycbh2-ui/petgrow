import { transformWithEsbuild } from "vite";

const SHARED_TIPS_VIRTUAL_ID = "virtual:petgrow-v6-shared-tips-data";
const SHARED_TIPS_RESOLVED_ID = `\0${SHARED_TIPS_VIRTUAL_ID}.js`;

const CLUSTERS = {
  tips: {
    virtualId: "virtual:petgrow-v6-tips",
    entry: "TipsPage",
    functions: ["parseTipsCsv", "TipCard", "TipsPage"],
    constants: ["TIPS_SHEET_CSV_URL"],
    deps: ["HeartIcon", "HeartOutlineIcon", "ResponsiveCategoryMenu", "ResponsivePagination", "SearchIcon", "TIPS_SHEET_CSV_URL", "safeGet", "safeSet", "useLang", "useT"],
    title: "Pet정보를 불러오는 중입니다",
  },
  saju: {
    virtualId: "virtual:petgrow-v6-saju",
    entry: "SajuPage",
    functions: ["generateSajuResult", "SajuInputForm", "renderSajuShareCard", "SajuShareModal", "SajuResultView", "SajuPage"],
    constants: ["SAJU_DATA", "SAJU_ONE_WORD", "SAJU_TAG_POOL", "SAJU_TODAY"],
    deps: ["SAJU_DATA", "SAJU_ONE_WORD", "SAJU_TAG_POOL", "SAJU_TODAY", "seededPick", "SajuIcon", "breedName", "PETGROW_LOGO_DATA_URI", "loadImage", "roundRect", "wrapText", "Modal", "PlusIcon", "ShareIcon", "normalizePetDisplayText", "DailyFortunePanel", "FeaturePetHeader", "hashString", "petPointKstDate", "petPointSpend", "useLang", "useT"],
    title: "Pet사주를 불러오는 중입니다",
  },
  petbti: {
    virtualId: "virtual:petgrow-v6-petbti",
    entry: "PetBtiPage",
    functions: ["petBtiQuestionsFor", "petBtiScore", "petBtiOppositeType", "petBtiSectionText", "generatePetBtiResult", "PetBtiStatBar", "PetBtiQuestionFlow", "renderPetBtiShareCard", "PetBtiShareModal", "PetBtiResultView", "PetBtiPage"],
    constants: ["PETBTI_QUESTIONS_CAT", "PETBTI_QUESTIONS_DOG", "PETBTI_AXIS_TRAITS", "PETBTI_SECTION_AXES", "PETBTI_STAT_FLAVOR", "PETBTI_SUMMARY", "PETBTI_TYPES", "PETBTI_SECTION_ICON"],
    deps: ["PETBTI_QUESTIONS_CAT", "PETBTI_QUESTIONS_DOG", "PETBTI_AXIS_TRAITS", "PETBTI_SECTION_AXES", "PETBTI_STAT_FLAVOR", "PETBTI_SUMMARY", "PETBTI_TYPES", "PETBTI_SECTION_ICON", "hashString", "seededPick", "PETGROW_LOGO_DATA_URI", "loadImage", "roundRect", "wrapText", "Modal", "PlusIcon", "ShareIcon", "normalizePetDisplayText", "FeaturePetHeader", "PetBtiIcon", "useLang", "useT"],
    title: "PetBTI를 불러오는 중입니다",
  },
  guide: {
    virtualId: "virtual:petgrow-v6-info-guide",
    entry: "InfoGuidePage",
    functions: ["InfoGuidePage"],
    constants: [],
    deps: [],
    title: "정보가이드를 불러오는 중입니다",
  },
};

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

function extractNamedFunction(code, name) {
  const marker = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
  const match = marker.exec(code);
  if (!match) return null;
  const start = match.index;
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
    else if (ch === "}") { depth--; if (depth === 0) return { start, end: i + 1, source: code.slice(start, i + 1) }; }
  }
  return null;
}

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
    else if (ch === ";" && round === 0 && square === 0 && curly === 0) return { start, end: i + 1, source: code.slice(start, i + 1) };
  }
  return null;
}

function maskRanges(code, ranges) {
  let masked = code;
  for (const hit of [...ranges].sort((a, b) => b.start - a.start)) {
    masked = masked.slice(0, hit.start) + " ".repeat(hit.end - hit.start) + masked.slice(hit.end);
  }
  return masked;
}

function countName(code, name) {
  return (code.match(new RegExp(`\\b${name}\\b`, "g")) || []).length;
}

function lazyWrapper(key, cluster, deps) {
  const cap = key[0].toUpperCase() + key.slice(1);
  const depObject = deps.length ? `{ ${deps.join(", ")} }` : `{}`;
  return `
let __petgrowV6${cap}Component = null;
let __petgrowV6${cap}Promise = null;
function __petgrowV6Load${cap}(){
  if (__petgrowV6${cap}Component) return Promise.resolve(__petgrowV6${cap}Component);
  if (!__petgrowV6${cap}Promise) {
    __petgrowV6${cap}Promise = import("${cluster.virtualId}").then((m) => {
      __petgrowV6${cap}Component = m.default;
      return __petgrowV6${cap}Component;
    }).catch((error) => {
      __petgrowV6${cap}Promise = null;
      throw error;
    });
  }
  return __petgrowV6${cap}Promise;
}
function ${cluster.entry}(props){
  const [LazyComponent, setLazyComponent] = useState(() => __petgrowV6${cap}Component);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (LazyComponent) return;
    let alive = true;
    __petgrowV6Load${cap}().then((Component) => {
      if (alive) { setLazyComponent(() => Component); setLoadError(false); }
    }).catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [LazyComponent]);
  if (!LazyComponent) return <div className="bg-card" style={{padding:20,textAlign:"center"}} aria-live="polite"><b>${cluster.title}</b><p className="bg-sub" style={{marginTop:8}}>{loadError ? "화면을 불러오지 못했어요." : "화면을 준비하고 있어요…"}</p>{loadError && <button type="button" className="bg-btn" onClick={() => { setLoadError(false); __petgrowV6Load${cap}().then((Component) => setLazyComponent(() => Component)).catch(() => setLoadError(true)); }}>다시 시도</button>}</div>;
  const __deps = ${depObject};
  return <LazyComponent {...props} __deps={__deps} />;
}
`;
}

function virtualModule(key, cluster, functionSources, movedConstSources, externalDeps) {
  const depDecl = externalDeps.length ? `let ${externalDeps.join(", ")};\nfunction __bindDeps(d){ ({ ${externalDeps.join(", ")} } = d || {}); }` : `function __bindDeps(){}`;
  const sharedTipsImport = key === "tips" ? `import { TIPS_DATA } from "${SHARED_TIPS_VIRTUAL_ID}";\n` : "";
  return `import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";\n${sharedTipsImport}${depDecl}\n${movedConstSources.join("\n")}\n${functionSources.join("\n")}\nfunction __PetGrowV6Entry({ __deps, ...props }){ __bindDeps(__deps); return React.createElement(${cluster.entry}, props); }\nexport default __PetGrowV6Entry;\n`;
}

export default function petgrowDeepMenuSplitV6() {
  const captured = {};
  let capturedTipsData = "";
  const resolved = Object.fromEntries(Object.entries(CLUSTERS).map(([key, cluster]) => [key, `\0${cluster.virtualId}.jsx`]));
  const byVirtual = Object.fromEntries(Object.entries(CLUSTERS).map(([key, cluster]) => [cluster.virtualId, key]));
  const byResolved = Object.fromEntries(Object.entries(resolved).map(([key, id]) => [id, key]));

  return {
    name: "petgrow-deep-menu-split-v6",
    enforce: "pre",
    resolveId(id) {
      if (id === SHARED_TIPS_VIRTUAL_ID) return SHARED_TIPS_RESOLVED_ID;
      const key = byVirtual[id];
      return key ? resolved[key] : null;
    },
    async load(id) {
      if (id === SHARED_TIPS_RESOLVED_ID) {
        if (!capturedTipsData) this.error("[petgrow-v6] shared TIPS_DATA was not captured");
        return { code: capturedTipsData.replace(/^const\s+TIPS_DATA\b/, "export const TIPS_DATA"), map: null };
      }
      const key = byResolved[id];
      if (!key) return null;
      const data = captured[key];
      if (!data) this.error(`[petgrow-v6] source for ${key} was not captured`);
      const jsx = virtualModule(key, CLUSTERS[key], data.functions, data.constants, data.externalDeps);
      const result = await transformWithEsbuild(jsx, id.replace(/^\0/, ""), { loader: "jsx", jsx: "automatic", sourcemap: false });
      return { code: result.code, map: null };
    },
    transform(code, id) {
      const cleanId = String(id || "").replace(/\\/g, "/");
      if (cleanId.endsWith("/src/HomeInfoMusicSections.jsx")) {
        const importAnchor = 'import React, { useEffect, useMemo, useRef, useState } from "react";';
        const signatureAnchor = 'export default function HomeInfoMusicSections({ lang = "ko", onGoView, tips = [] }) {';
        if (!code.includes(importAnchor)) this.error("[petgrow-v6] HomeInfo React import anchor not found");
        if (!code.includes(signatureAnchor)) this.error("[petgrow-v6] HomeInfo signature anchor not found");
        const next = code
          .replace(importAnchor, `${importAnchor}\nimport { TIPS_DATA } from "${SHARED_TIPS_VIRTUAL_ID}";`)
          .replace(signatureAnchor, 'export default function HomeInfoMusicSections({ lang = "ko", onGoView, tips = TIPS_DATA }) {');
        return { code: next, map: null };
      }

      if (!cleanId.endsWith("/src/App.jsx")) return null;
      let workingCode = code;
      const tipsDataHit = extractNamedConst(workingCode, "TIPS_DATA");
      if (!tipsDataHit) this.error("[petgrow-v6] TIPS_DATA anchor not found");
      capturedTipsData = tipsDataHit.source;

      const homeTipsProp = /\s+tips=\{TIPS_DATA\}/g;
      const homeTipsMatches = workingCode.match(homeTipsProp) || [];
      if (homeTipsMatches.length !== 1) this.error(`[petgrow-v6] expected one HomeInfo tips prop, found ${homeTipsMatches.length}`);
      workingCode = workingCode.replace(homeTipsProp, "");

      const replacements = [];
      const tipsDataAfterPropRemoval = extractNamedConst(workingCode, "TIPS_DATA");
      if (!tipsDataAfterPropRemoval) this.error("[petgrow-v6] TIPS_DATA anchor lost after home prop cleanup");
      replacements.push({ start: tipsDataAfterPropRemoval.start, end: tipsDataAfterPropRemoval.end, source: "" });

      for (const [key, cluster] of Object.entries(CLUSTERS)) {
        const hits = cluster.functions.map((name) => {
          const hit = extractNamedFunction(workingCode, name);
          if (!hit) this.error(`[petgrow-v6] ${name} anchor not found`);
          return { name, ...hit };
        });
        const maskedFunctions = maskRanges(workingCode, hits);
        for (const hit of hits) {
          if (hit.name === cluster.entry) continue;
          if (countName(maskedFunctions, hit.name) > 0) this.error(`[petgrow-v6] ${hit.name} is referenced outside ${key}; refusing unsafe split`);
        }

        const movedConstants = [];
        const externalDeps = [...cluster.deps];
        for (const constName of cluster.constants) {
          const constHit = extractNamedConst(workingCode, constName);
          if (!constHit) continue;
          const masked = maskRanges(maskedFunctions, [constHit]);
          if (countName(masked, constName) === 0) {
            movedConstants.push({ name: constName, ...constHit });
            const idx = externalDeps.indexOf(constName);
            if (idx >= 0) externalDeps.splice(idx, 1);
          }
        }

        captured[key] = {
          functions: hits.map((hit) => hit.source),
          constants: movedConstants.map((hit) => hit.source),
          externalDeps,
        };

        for (const hit of hits) {
          replacements.push({ start: hit.start, end: hit.end, source: hit.name === cluster.entry ? lazyWrapper(key, cluster, externalDeps) : "" });
        }
        for (const hit of movedConstants) replacements.push({ start: hit.start, end: hit.end, source: "" });
      }

      let next = workingCode;
      for (const hit of replacements.sort((a, b) => b.start - a.start)) next = next.slice(0, hit.start) + hit.source + next.slice(hit.end);
      console.log(`PG_PHASE5_TIPS moved=${capturedTipsData.length} bytes shared-lazy`);
      return { code: next, map: null };
    },
  };
}
