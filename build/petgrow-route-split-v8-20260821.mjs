import { transformWithEsbuild } from "vite";

const ENTRIES = {
  onboarding: { name: "OnboardingPage", title: "우리 아이 등록 화면을 불러오는 중입니다" },
  landing: { name: "LandingPage", title: "시작 화면을 불러오는 중입니다" },
  login: { name: "LoginScreen", title: "로그인 화면을 불러오는 중입니다" },
  more: { name: "MoreMenuPage", title: "더보기 화면을 불러오는 중입니다" },
  content: { name: "PetContentPage", title: "콘텐츠 화면을 불러오는 중입니다" },
  aboutPoint: { name: "PetPointAboutCard", title: "PetPoint 안내를 불러오는 중입니다" },
};
for (const [key, entry] of Object.entries(ENTRIES)) {
  entry.virtualId = `virtual:petgrow-v8-${key}`;
  entry.resolvedId = `\0${entry.virtualId}.jsx`;
}

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
  let depth = 0, quote = null, escape = false, lineComment = false, blockComment = false;
  for (let i = brace; i < code.length; i++) {
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
    if (ch === "{") { if (depth > 0) chars[i] = " "; depth++; continue; }
    if (ch === "}") { depth = Math.max(0, depth - 1); if (depth > 0) chars[i] = " "; continue; }
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
  const open = head.indexOf("("), close = head.lastIndexOf(")");
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

function externalDepsFor(source, bindings, entryName) {
  const locals = localNames(source);
  const deps = new Set();
  for (const word of source.match(/[A-Za-z_$][\w$]*/g) || []) {
    if (!bindings.has(word)) continue;
    if (word === entryName || locals.has(word) || REACT_BINDINGS.has(word)) continue;
    deps.add(word);
  }
  return [...deps].sort();
}

function wrapper(key, entry, deps) {
  const cap = key[0].toUpperCase() + key.slice(1);
  const depObject = deps.length ? `{ ${deps.join(", ")} }` : `{}`;
  return `
let __petgrowV8${cap}Component = null;
let __petgrowV8${cap}Promise = null;
function __petgrowV8Load${cap}(){
  if (__petgrowV8${cap}Component) return Promise.resolve(__petgrowV8${cap}Component);
  if (!__petgrowV8${cap}Promise) __petgrowV8${cap}Promise = import("${entry.virtualId}").then((m) => (__petgrowV8${cap}Component = m.default)).catch((error) => { __petgrowV8${cap}Promise = null; throw error; });
  return __petgrowV8${cap}Promise;
}
function ${entry.name}(props){
  const [LazyComponent, setLazyComponent] = useState(() => __petgrowV8${cap}Component);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (LazyComponent) return;
    let alive = true;
    __petgrowV8Load${cap}().then((Component) => { if (alive) { setLazyComponent(() => Component); setLoadError(false); } }).catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [LazyComponent]);
  if (!LazyComponent) return <div className="bg-card" role="status" aria-live="polite" style={{padding:20,textAlign:"center"}}><b>${entry.title}</b><p className="bg-sub" style={{marginTop:8}}>화면을 준비하고 있어요…</p>{loadError && <button type="button" className="bg-btn" style={{display:"block",margin:"10px auto"}} onClick={() => { setLoadError(false); __petgrowV8Load${cap}().then((Component) => setLazyComponent(() => Component)).catch(() => setLoadError(true)); }}>다시 시도</button>}</div>;
  const __deps = ${depObject};
  return <LazyComponent {...props} __deps={__deps} />;
}
`;
}

function virtualModule(entry, source, deps) {
  const depDecl = deps.length ? `let ${deps.join(", ")};\nfunction __bindDeps(d){ ({ ${deps.join(", ")} } = d || {}); }` : `function __bindDeps(){}`;
  return `import React, { Fragment, useCallback, useContext, useDeferredValue, useEffect, useId, useLayoutEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";\n${depDecl}\n${source}\nfunction __PetGrowV8Entry({ __deps, ...props }){ __bindDeps(__deps); return React.createElement(${entry.name}, props); }\nexport default __PetGrowV8Entry;\n`;
}

export default function petgrowRouteSplitV8() {
  const captured = {};
  const byVirtual = Object.fromEntries(Object.entries(ENTRIES).map(([key, entry]) => [entry.virtualId, key]));
  const byResolved = Object.fromEntries(Object.entries(ENTRIES).map(([key, entry]) => [entry.resolvedId, key]));
  return {
    name: "petgrow-secondary-route-split-v8",
    enforce: "pre",
    resolveId(id) {
      const key = byVirtual[id];
      return key ? ENTRIES[key].resolvedId : null;
    },
    async load(id) {
      const key = byResolved[id];
      if (!key) return null;
      const data = captured[key];
      if (!data) this.error(`[petgrow-v8] source for ${key} was not captured`);
      const jsx = virtualModule(ENTRIES[key], data.source, data.deps);
      const result = await transformWithEsbuild(jsx, id.replace(/^\0/, ""), { loader: "jsx", jsx: "automatic", sourcemap: false });
      return { code: result.code, map: null };
    },
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      const bindings = topLevelBindings(code);
      const replacements = [];
      for (const [key, entry] of Object.entries(ENTRIES)) {
        const hit = extractNamedFunction(code, entry.name);
        if (!hit) this.error(`[petgrow-v8] ${entry.name} anchor not found`);
        const deps = externalDepsFor(hit.source, bindings, entry.name);
        captured[key] = { source: hit.source, deps };
        replacements.push({ start: hit.start, end: hit.end, source: wrapper(key, entry, deps) });
        console.log(`PGV8_SPLIT ${key} deps=${JSON.stringify(deps)} bytes=${hit.source.length}`);
      }
      let next = code;
      for (const hit of replacements.sort((a,b) => b.start - a.start)) next = next.slice(0, hit.start) + hit.source + next.slice(hit.end);
      return { code: next, map: null };
    },
  };
}
