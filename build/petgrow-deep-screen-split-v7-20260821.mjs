import { transformWithEsbuild } from "vite";

const CLUSTERS = {
  about: {
    virtualId: "virtual:petgrow-v7-about",
    entry: "AboutPage",
    functions: [
      "CommunityMockCard", "IllustCommunity", "IllustGrowth", "IllustMyPets",
      "IntroVideo", "LandingFeatureCard", "LandingHighlightCard", "SocialLinks",
      "AboutPage",
    ],
    title: "PetGrow 소개를 불러오는 중입니다",
  },
  result: {
    virtualId: "virtual:petgrow-v7-result",
    entry: "ResultPage",
    functions: [
      "curveValueAt", "predictionRange", "diffLabel",
      "AdultWeightHero", "BreedInfoModal", "GrowthChartCard", "GrowthTableCard",
      "calcFeedingKcal", "calcHumanAge", "clothingSize", "vaccineStageIndex", "InfoAccordion",
      "MilestoneBadges", "estimatePercentile", "percentileDescKey", "PeerCompareCard",
      "groupPhotosByMonth", "AddPhotoCard", "PhotoTile", "SlideshowModal", "PhotoAlbum",
      "RecordForm", "RecordList", "RecordSection",
      "renderShareCard", "ShareCardModal", "VaccineChecklist",
      "buildGrowthTable", "estimateAdultWeight", "formatBirthDate", "getBreedDisplayName",
      "ResultPage",
    ],
    title: "성장 결과를 불러오는 중입니다",
  },
  my: {
    virtualId: "virtual:petgrow-v7-my",
    entry: "MyPage",
    functions: ["AccountActivityHub", "petPointSummary", "PetPointDashboard", "musicLiked", "MyPage"],
    title: "내 활동을 불러오는 중입니다",
  },
  account: {
    virtualId: "virtual:petgrow-v7-account",
    entry: "AccountModal",
    functions: ["validateNicknameLocal", "AccountModal"],
    title: "계정 정보를 불러오는 중입니다",
    gateProp: "open",
    modal: true,
  },
  privacy: {
    virtualId: "virtual:petgrow-v7-privacy",
    entry: "PrivacyPage",
    functions: ["PrivacyPage"],
    title: "개인정보 화면을 불러오는 중입니다",
  },
  support: {
    virtualId: "virtual:petgrow-v7-support",
    entry: "SupportPage",
    functions: ["supportCreateInquiry", "supportInquiries", "supportNotices", "SupportPage"],
    title: "고객지원을 불러오는 중입니다",
  },
  ad: {
    virtualId: "virtual:petgrow-v7-ad-inquiry",
    entry: "AdInquiryPage",
    functions: ["submitAdInquiry", "AdInquiryPage"],
    title: "제휴 문의를 불러오는 중입니다",
    gateProp: "open",
    modal: true,
  },
  legal: {
    virtualId: "virtual:petgrow-v7-legal",
    entry: "LegalContent",
    functions: ["LegalContent"],
    title: "정책 내용을 불러오는 중입니다",
  },
};

const REACT_BINDINGS = new Set([
  "React", "Fragment", "useState", "useEffect", "useMemo", "useCallback", "useRef",
  "useLayoutEffect", "useReducer", "useContext", "useId", "useDeferredValue", "useTransition",
]);

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
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1, source: code.slice(start, i + 1) };
    }
  }
  return null;
}

function maskStringsAndComments(code) {
  const out = code.split("");
  let quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i], next = code[i + 1];
    if (lineComment) {
      if (ch === "\n") lineComment = false;
      else out[i] = " ";
      continue;
    }
    if (blockComment) {
      out[i] = ch === "\n" ? "\n" : " ";
      if (ch === "*" && next === "/") { out[i + 1] = " "; blockComment = false; i++; }
      continue;
    }
    if (quote) {
      out[i] = ch === "\n" ? "\n" : " ";
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "/") { out[i] = out[i + 1] = " "; lineComment = true; i++; continue; }
    if (ch === "/" && next === "*") { out[i] = out[i + 1] = " "; blockComment = true; i++; continue; }
    if (ch === '"' || ch === "'" || ch === "`") { out[i] = " "; quote = ch; continue; }
  }
  return out.join("");
}

function topLevelBindings(code) {
  const clean = maskStringsAndComments(code);
  const chars = clean.split("");
  let depth = 0;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    if (ch === "{") {
      if (depth > 0) chars[i] = " ";
      depth++;
      continue;
    }
    if (ch === "}") {
      depth = Math.max(0, depth - 1);
      if (depth > 0) chars[i] = " ";
      continue;
    }
    if (depth > 0 && ch !== "\n") chars[i] = " ";
  }
  const top = chars.join("");
  const bindings = new Set();
  for (const re of [
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)/g,
    /\b(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/g,
  ]) {
    let match;
    while ((match = re.exec(top))) bindings.add(match[1]);
  }

  const importRe = /^\s*import\s+(.+?)\s+from\s+["'][^"']+["'];?/gm;
  let imp;
  while ((imp = importRe.exec(code))) {
    const spec = imp[1].trim();
    const named = spec.match(/\{([\s\S]*?)\}/);
    if (named) {
      for (const part of named[1].split(",")) {
        const token = part.trim();
        if (!token) continue;
        const alias = token.split(/\s+as\s+/).pop().trim();
        if (alias) bindings.add(alias);
      }
    }
    const namespace = spec.match(/\*\s+as\s+([A-Za-z_$][\w$]*)/);
    if (namespace) bindings.add(namespace[1]);
    const beforeNamed = spec.replace(/\{[\s\S]*?\}/, "").replace(/,\s*$/, "").trim();
    if (beforeNamed && !beforeNamed.startsWith("*")) {
      const first = beforeNamed.split(",")[0].trim();
      if (/^[A-Za-z_$][\w$]*$/.test(first)) bindings.add(first);
    }
  }
  return bindings;
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
    /\b(?:const|let|var)\s+([^=;\n]+)=/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s+(?:of|in)\b/g,
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,
    /\bcatch\s*\(\s*([A-Za-z_$][\w$]*)/g,
  ]) {
    let match;
    while ((match = re.exec(source))) {
      for (const token of (match[1] || "").match(/[A-Za-z_$][\w$]*/g) || []) result.add(token);
    }
  }
  return result;
}

function sourceWords(source) {
  return new Set(source.match(/[A-Za-z_$][\w$]*/g) || []);
}

function maskRanges(code, ranges) {
  let masked = code;
  for (const hit of [...ranges].sort((a, b) => b.start - a.start)) {
    masked = masked.slice(0, hit.start) + " ".repeat(hit.end - hit.start) + masked.slice(hit.end);
  }
  return masked;
}

function countName(code, name) {
  const clean = maskStringsAndComments(code);
  return (clean.match(new RegExp(`\\b${name}\\b`, "g")) || []).length;
}

function externalDepsFor(hits, bindings, movedNames) {
  const deps = new Set();
  for (const hit of hits) {
    const locals = localNames(hit.source);
    for (const word of sourceWords(hit.source)) {
      if (!bindings.has(word)) continue;
      if (movedNames.has(word) || locals.has(word) || REACT_BINDINGS.has(word)) continue;
      deps.add(word);
    }
  }
  return [...deps].sort();
}

function fallbackMarkup(cluster) {
  if (cluster.modal) {
    return `<div className="modal-overlay" role="status" aria-live="polite"><div className="modal-card" style={{maxWidth:420,padding:22,textAlign:"center"}}><b>${cluster.title}</b><p style={{margin:"8px 0 0",opacity:.7}}>잠시만 기다려주세요…</p></div></div>`;
  }
  if (cluster.entry === "LegalContent") {
    return `<div role="status" aria-live="polite" style={{padding:16,textAlign:"center"}}><b>${cluster.title}</b></div>`;
  }
  return `<div className="bg-card" role="status" aria-live="polite" style={{padding:20,textAlign:"center"}}><b>${cluster.title}</b><p className="bg-sub" style={{marginTop:8}}>화면을 준비하고 있어요…</p></div>`;
}

function lazyWrapper(key, cluster, deps) {
  const cap = key[0].toUpperCase() + key.slice(1);
  const depObject = deps.length ? `{ ${deps.join(", ")} }` : `{}`;
  const gateExpr = cluster.gateProp ? `props?.${cluster.gateProp} !== false` : `true`;
  const fallback = fallbackMarkup(cluster);
  return `
let __petgrowV7${cap}Component = null;
let __petgrowV7${cap}Promise = null;
function __petgrowV7Load${cap}(){
  if (__petgrowV7${cap}Component) return Promise.resolve(__petgrowV7${cap}Component);
  if (!__petgrowV7${cap}Promise) {
    __petgrowV7${cap}Promise = import("${cluster.virtualId}").then((m) => {
      __petgrowV7${cap}Component = m.default;
      return __petgrowV7${cap}Component;
    }).catch((error) => {
      __petgrowV7${cap}Promise = null;
      throw error;
    });
  }
  return __petgrowV7${cap}Promise;
}
function ${cluster.entry}(props){
  const __shouldLoad = ${gateExpr};
  const [LazyComponent, setLazyComponent] = useState(() => __petgrowV7${cap}Component);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (!__shouldLoad || LazyComponent) return;
    let alive = true;
    __petgrowV7Load${cap}().then((Component) => {
      if (alive) { setLazyComponent(() => Component); setLoadError(false); }
    }).catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [__shouldLoad, LazyComponent]);
  if (!__shouldLoad) return null;
  if (!LazyComponent) return <>{${fallback}}{loadError && <button type="button" className="bg-btn" style={{display:"block",margin:"10px auto"}} onClick={() => { setLoadError(false); __petgrowV7Load${cap}().then((Component) => setLazyComponent(() => Component)).catch(() => setLoadError(true)); }}>다시 시도</button>}</>;
  const __deps = ${depObject};
  return <LazyComponent {...props} __deps={__deps} />;
}
`;
}

function virtualModule(cluster, functionSources, externalDeps) {
  const depDecl = externalDeps.length
    ? `let ${externalDeps.join(", ")};\nfunction __bindDeps(d){ ({ ${externalDeps.join(", ")} } = d || {}); }`
    : `function __bindDeps(){}`;
  return `import React, { Fragment, useCallback, useContext, useDeferredValue, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";\n${depDecl}\n${functionSources.join("\n")}\nfunction __PetGrowV7Entry({ __deps, ...props }){ __bindDeps(__deps); return React.createElement(${cluster.entry}, props); }\nexport default __PetGrowV7Entry;\n`;
}

export default function petgrowDeepScreenSplitV7() {
  const captured = {};
  const resolved = Object.fromEntries(Object.entries(CLUSTERS).map(([key, cluster]) => [key, `\0${cluster.virtualId}.jsx`]));
  const byVirtual = Object.fromEntries(Object.entries(CLUSTERS).map(([key, cluster]) => [cluster.virtualId, key]));
  const byResolved = Object.fromEntries(Object.entries(resolved).map(([key, id]) => [id, key]));

  return {
    name: "petgrow-deep-screen-split-v7",
    enforce: "pre",
    resolveId(id) {
      const key = byVirtual[id];
      return key ? resolved[key] : null;
    },
    async load(id) {
      const key = byResolved[id];
      if (!key) return null;
      const data = captured[key];
      if (!data) this.error(`[petgrow-v7] source for ${key} was not captured`);
      const jsx = virtualModule(CLUSTERS[key], data.functions, data.externalDeps);
      const result = await transformWithEsbuild(jsx, id.replace(/^\0/, ""), { loader: "jsx", jsx: "automatic", sourcemap: false });
      return { code: result.code, map: null };
    },
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      const bindings = topLevelBindings(code);
      const replacements = [];

      for (const [key, cluster] of Object.entries(CLUSTERS)) {
        const hits = cluster.functions.map((name) => {
          const hit = extractNamedFunction(code, name);
          if (!hit) this.error(`[petgrow-v7] ${name} anchor not found in ${key}`);
          return { name, ...hit };
        });
        const movedNames = new Set(hits.map((hit) => hit.name));
        const maskedFunctions = maskRanges(code, hits);
        for (const hit of hits) {
          if (hit.name === cluster.entry) continue;
          if (countName(maskedFunctions, hit.name) > 0) {
            this.error(`[petgrow-v7] ${hit.name} is referenced outside ${key}; refusing unsafe split`);
          }
        }

        const externalDeps = externalDepsFor(hits, bindings, movedNames);
        captured[key] = { functions: hits.map((hit) => hit.source), externalDeps };
        console.log(`PGV7_SPLIT ${key} deps=${JSON.stringify(externalDeps)}`);

        for (const hit of hits) {
          replacements.push({
            start: hit.start,
            end: hit.end,
            source: hit.name === cluster.entry ? lazyWrapper(key, cluster, externalDeps) : "",
          });
        }
      }

      let next = code;
      for (const hit of replacements.sort((a, b) => b.start - a.start)) {
        next = next.slice(0, hit.start) + hit.source + next.slice(hit.end);
      }
      return { code: next, map: null };
    },
  };
}
