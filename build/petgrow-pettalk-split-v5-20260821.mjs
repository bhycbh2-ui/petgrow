import { transformWithEsbuild } from "vite";

const VIRTUALS = {
  composer: "virtual:petgrow-v5-pettalk-composer",
  detail: "virtual:petgrow-v5-pettalk-detail",
  myActivity: "virtual:petgrow-v5-pettalk-my-activity",
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
  const marker = new RegExp(`function\\s+${name}\\s*\\(`);
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

function injectDeps(source, name, deps) {
  const depLine = `const { ${deps.join(", ")} } = __deps;`;
  return source.replace(
    new RegExp(`function\\s+${name}\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)\\s*\\{`),
    (_m, params) => `function ${name}({${params}, __deps }) {\n  ${depLine}`
  );
}

function virtualModule(source, name, deps) {
  const body = injectDeps(source, name, deps);
  if (body === source) throw new Error(`[petgrow-pettalk-split-v5] could not inject dependencies into ${name}`);
  return `import React, { useEffect, useMemo, useRef, useState } from "react";\n${body}\nexport default ${name};\n`;
}

function lazyRuntime(key, componentName, virtualId, depExpr, title) {
  const cap = key[0].toUpperCase() + key.slice(1);
  return `
let __petgrowV5${cap}Component = null;
let __petgrowV5${cap}Promise = null;
function __petgrowV5Load${cap}(){
  if (__petgrowV5${cap}Component) return Promise.resolve(__petgrowV5${cap}Component);
  if (!__petgrowV5${cap}Promise) {
    __petgrowV5${cap}Promise = import("${virtualId}").then((m) => {
      __petgrowV5${cap}Component = m.default;
      return __petgrowV5${cap}Component;
    }).catch((error) => {
      __petgrowV5${cap}Promise = null;
      throw error;
    });
  }
  return __petgrowV5${cap}Promise;
}
function ${componentName}(props){
  const [LazyComponent, setLazyComponent] = useState(() => __petgrowV5${cap}Component);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (LazyComponent) return;
    let alive = true;
    __petgrowV5Load${cap}().then((Component) => {
      if (alive) { setLazyComponent(() => Component); setLoadError(false); }
    }).catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [LazyComponent]);
  if (!LazyComponent) return <div className="bg-card" style={{padding:20,textAlign:"center"}} aria-live="polite"><b>${title}</b><p className="bg-sub" style={{marginTop:8}}>{loadError ? "화면을 불러오지 못했어요." : "화면을 준비하고 있어요…"}</p>{loadError && <button type="button" className="bg-btn" onClick={() => { setLoadError(false); __petgrowV5Load${cap}().then((Component) => setLazyComponent(() => Component)).catch(() => setLoadError(true)); }}>다시 시도</button>}</div>;
  const __deps = ${depExpr};
  return <LazyComponent {...props} __deps={__deps} />;
}
`;
}

export default function petgrowPetTalkSplitV5() {
  const sources = {};
  const resolved = Object.fromEntries(Object.entries(VIRTUALS).map(([k, v]) => [k, `\0${v}.jsx`]));
  const byVirtual = Object.fromEntries(Object.entries(VIRTUALS).map(([k, v]) => [v, k]));
  const byResolved = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [v, k]));

  const composerDeps = [
    "useT", "useLang", "fileToCompressedDataUrl", "communityUploadImage", "validatePetTalkText",
    "communityUpdatePost", "communityCreatePost", "petSnapshot", "PetPicker", "CmPetLine",
    "COMMUNITY_CATEGORY_KEYS", "ImagePickerGrid"
  ];
  const detailDeps = [
    "useT", "useLang", "communityGetPost", "communityListComments", "communityToggleLike",
    "validatePetTalkText", "petSnapshot", "communityAddComment", "communityDeleteComment",
    "communityDeletePost", "communitySetPostVisibility", "CmPetLine", "timeAgoLabel", "PhotoCarousel",
    "CommentItem", "PetPicker", "ConfirmModal", "ReportModal"
  ];
  const myActivityDeps = ["useT", "communityMyActivity", "PostCard"];

  return {
    name: "petgrow-pettalk-split-v5",
    enforce: "pre",
    resolveId(id) {
      const key = byVirtual[id];
      return key ? resolved[key] : null;
    },
    async load(id) {
      const key = byResolved[id];
      if (!key) return null;
      if (!sources[key]) this.error(`[petgrow-pettalk-split-v5] source for ${key} was not captured`);
      let jsx;
      if (key === "composer") jsx = virtualModule(sources[key], "PostComposer", composerDeps);
      else if (key === "detail") jsx = virtualModule(sources[key], "PostDetail", detailDeps);
      else jsx = virtualModule(sources[key], "MyActivityPage", myActivityDeps);
      const result = await transformWithEsbuild(jsx, id.replace(/^\0/, ""), { loader: "jsx", jsx: "automatic", sourcemap: false });
      return { code: result.code, map: null };
    },
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      const targets = [["composer", "PostComposer"], ["detail", "PostDetail"], ["myActivity", "MyActivityPage"]];
      const found = targets.map(([key, name]) => {
        const hit = extractNamedFunction(code, name);
        if (!hit) this.error(`[petgrow-pettalk-split-v5] ${name} anchor not found`);
        sources[key] = hit.source;
        return { key, name, ...hit };
      }).sort((a, b) => b.start - a.start);

      const wrappers = {
        composer: lazyRuntime("composer", "PostComposer", VIRTUALS.composer, `{ useT, useLang, fileToCompressedDataUrl, communityUploadImage, validatePetTalkText, communityUpdatePost, communityCreatePost, petSnapshot, PetPicker, CmPetLine, COMMUNITY_CATEGORY_KEYS, ImagePickerGrid }`, "Pet톡 글쓰기를 불러오는 중입니다"),
        detail: lazyRuntime("detail", "PostDetail", VIRTUALS.detail, `{ useT, useLang, communityGetPost, communityListComments, communityToggleLike, validatePetTalkText, petSnapshot, communityAddComment, communityDeleteComment, communityDeletePost, communitySetPostVisibility, CmPetLine, timeAgoLabel, PhotoCarousel, CommentItem, PetPicker, ConfirmModal, ReportModal }`, "Pet톡 글을 불러오는 중입니다"),
        myActivity: lazyRuntime("myActivity", "MyActivityPage", VIRTUALS.myActivity, `{ useT, communityMyActivity, PostCard }`, "내 활동을 불러오는 중입니다"),
      };

      let next = code;
      for (const hit of found) next = next.slice(0, hit.start) + wrappers[hit.key] + next.slice(hit.end);
      return { code: next, map: null };
    },
  };
}
