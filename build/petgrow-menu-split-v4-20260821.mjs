import { transformWithEsbuild } from "vite";

const VIRTUALS = {
  nearby: "virtual:petgrow-v4-nearby",
  community: "virtual:petgrow-v4-community-feed",
  adminMusic: "virtual:petgrow-v4-admin-music",
  admin: "virtual:petgrow-v4-admin-reports",
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
  if (new RegExp(`function\\s+${name}\\s*\\(\\s*\\)`).test(source)) {
    return source.replace(new RegExp(`function\\s+${name}\\s*\\(\\s*\\)\\s*\\{`), `function ${name}({ __deps }) {\n  ${depLine}`);
  }
  return source.replace(new RegExp(`function\\s+${name}\\s*\\(\\s*\\{([\\s\\S]*?)\\}\\s*\\)\\s*\\{`), (_m, params) => `function ${name}({${params}, __deps }) {\n  ${depLine}`);
}

function virtualModule(source, name, deps) {
  const body = injectDeps(source, name, deps);
  if (body === source) throw new Error(`[petgrow-menu-split-v4] could not inject dependencies into ${name}`);
  return `import React, { useEffect, useMemo, useRef, useState } from "react";\n${body}\nexport default ${name};\n`;
}

function lazyRuntime(key, virtualId, renderProps, depExpr, title) {
  const cap = key[0].toUpperCase() + key.slice(1);
  const componentName = key === "nearby" ? "NearbyPetPage" : key === "community" ? "CommunityFeed" : key === "adminMusic" ? "AdminMusicPanel" : "AdminReportsPage";
  return `
let __petgrow${cap}Component = null;
let __petgrow${cap}Promise = null;
function __petgrowLoad${cap}(){
  if (__petgrow${cap}Component) return Promise.resolve(__petgrow${cap}Component);
  if (!__petgrow${cap}Promise) {
    __petgrow${cap}Promise = import("${virtualId}").then((m) => {
      __petgrow${cap}Component = m.default;
      return __petgrow${cap}Component;
    }).catch((error) => {
      __petgrow${cap}Promise = null;
      throw error;
    });
  }
  return __petgrow${cap}Promise;
}
function ${componentName}(${renderProps.signature}){
  const [LazyComponent, setLazyComponent] = useState(() => __petgrow${cap}Component);
  const [loadError, setLoadError] = useState(false);
  useEffect(() => {
    if (LazyComponent) return;
    let alive = true;
    __petgrowLoad${cap}().then((Component) => { if (alive) { setLazyComponent(() => Component); setLoadError(false); } }).catch(() => { if (alive) setLoadError(true); });
    return () => { alive = false; };
  }, [LazyComponent]);
  if (!LazyComponent) return <div className="bg-card" style={{padding:20,textAlign:"center"}} aria-live="polite"><b>${title}</b><p className="bg-sub" style={{marginTop:8}}>{loadError ? "화면을 불러오지 못했어요." : "화면을 준비하고 있어요…"}</p>{loadError && <button type="button" className="bg-btn" onClick={() => { setLoadError(false); __petgrowLoad${cap}().then((Component) => setLazyComponent(() => Component)).catch(() => setLoadError(true)); }}>다시 시도</button>}</div>;
  const __deps = ${depExpr};
  return <LazyComponent ${renderProps.forward} __deps={__deps} />;
}
`;
}

export default function petgrowMenuSplitV4() {
  const sources = {};
  const resolved = Object.fromEntries(Object.entries(VIRTUALS).map(([k, v]) => [k, `\0${v}.jsx`]));
  const byVirtual = Object.fromEntries(Object.entries(VIRTUALS).map(([k, v]) => [v, k]));
  const byResolved = Object.fromEntries(Object.entries(resolved).map(([k, v]) => [v, k]));

  const nearbyDeps = ["useT", "MapPinIcon", "ResponsiveCategoryMenu"];
  const communityDeps = ["useT", "communityListPosts", "ResponsiveCategoryMenu", "ResponsivePagination", "SearchIcon", "PlusIcon", "UserIcon", "PostCard", "COMMUNITY_CATEGORY_KEYS"];
  const adminMusicDeps = ["adminMusicList", "adminMusicSave", "adminMusicToggle", "adminMusicDelete", "fileToDataUrl", "fileToCompressedDataUrl"];
  const adminDeps = [
    "adminStatus", "adminStats", "adminHealth", "adminListReports", "adminListPlaceReviewReports", "adminListMusicCommentReports", "adminLogs", "adminListAdmins",
    "adminSupportInquiries", "adminListDirectAds", "adminListAdInquiries", "adminVerify", "adminSetPin", "adminBootstrap", "adminRestrict", "adminUnblock",
    "adminResolveReport", "adminHidePlaceReview", "adminResolvePlaceReviewReport", "adminHideMusicComment", "adminResolveMusicCommentReport", "adminReportSummary",
    "adminReplyInquiry", "adminCreateNotice", "adminSaveDirectAd", "adminToggleDirectAd", "adminDeleteDirectAd", "adminSetAdInquiryStatus", "adminSearchUser",
    "adminAddUser", "adminChangeRole", "adminResetPin", "adminRemoveUser", "AdminMusicPanel", "PetPointAdminOverview"
  ];

  return {
    name: "petgrow-menu-split-v4",
    enforce: "pre",
    resolveId(id) {
      const key = byVirtual[id];
      return key ? resolved[key] : null;
    },
    async load(id) {
      const key = byResolved[id];
      if (!key) return null;
      if (!sources[key]) this.error(`[petgrow-menu-split-v4] source for ${key} was not captured`);
      let jsx;
      if (key === "nearby") jsx = virtualModule(sources[key], "NearbyPetPage", nearbyDeps);
      else if (key === "community") jsx = virtualModule(sources[key], "CommunityFeed", communityDeps);
      else if (key === "adminMusic") jsx = virtualModule(sources[key], "AdminMusicPanel", adminMusicDeps);
      else jsx = virtualModule(sources[key], "AdminReportsPage", adminDeps);
      const result = await transformWithEsbuild(jsx, id.replace(/^\0/, ""), { loader: "jsx", jsx: "automatic", sourcemap: false });
      return { code: result.code, map: null };
    },
    transform(code, id) {
      if (!/[\\/]src[\\/]App\.jsx(?:\?|$)/.test(id)) return null;
      const targets = [["nearby", "NearbyPetPage"], ["community", "CommunityFeed"], ["adminMusic", "AdminMusicPanel"], ["admin", "AdminReportsPage"]];
      const found = targets.map(([key, name]) => {
        const hit = extractNamedFunction(code, name);
        if (!hit) this.error(`[petgrow-menu-split-v4] ${name} anchor not found`);
        sources[key] = hit.source;
        return { key, name, ...hit };
      }).sort((a, b) => b.start - a.start);

      const wrappers = {
        nearby: lazyRuntime("nearby", VIRTUALS.nearby, { signature: "", forward: "" }, `{ useT, MapPinIcon, ResponsiveCategoryMenu }`, "내 주변 Pet을 불러오는 중입니다"),
        community: lazyRuntime("community", VIRTUALS.community, { signature: "props", forward: "{...props}" }, `{ useT, communityListPosts, ResponsiveCategoryMenu, ResponsivePagination, SearchIcon, PlusIcon, UserIcon, PostCard, COMMUNITY_CATEGORY_KEYS }`, "Pet톡을 불러오는 중입니다"),
        adminMusic: lazyRuntime("adminMusic", VIRTUALS.adminMusic, { signature: "", forward: "" }, `{ adminMusicList, adminMusicSave, adminMusicToggle, adminMusicDelete, fileToDataUrl, fileToCompressedDataUrl }`, "Pet음악 관리를 불러오는 중입니다"),
        admin: lazyRuntime("admin", VIRTUALS.admin, { signature: "props", forward: "{...props}" }, `{ adminStatus, adminStats, adminHealth, adminListReports, adminListPlaceReviewReports, adminListMusicCommentReports, adminLogs, adminListAdmins, adminSupportInquiries, adminListDirectAds, adminListAdInquiries, adminVerify, adminSetPin, adminBootstrap, adminRestrict, adminUnblock, adminResolveReport, adminHidePlaceReview, adminResolvePlaceReviewReport, adminHideMusicComment, adminResolveMusicCommentReport, adminReportSummary, adminReplyInquiry, adminCreateNotice, adminSaveDirectAd, adminToggleDirectAd, adminDeleteDirectAd, adminSetAdInquiryStatus, adminSearchUser, adminAddUser, adminChangeRole, adminResetPin, adminRemoveUser, AdminMusicPanel, PetPointAdminOverview }`, "관리자센터를 불러오는 중입니다"),
      };

      let next = code;
      for (const hit of found) next = next.slice(0, hit.start) + wrappers[hit.key] + next.slice(hit.end);
      return { code: next, map: null };
    },
  };
}
