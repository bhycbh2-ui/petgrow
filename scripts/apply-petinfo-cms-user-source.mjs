import fs from 'node:fs';

const file = 'src/App.jsx';
let s = fs.readFileSync(file, 'utf8');
const MARK = 'PETINFO_CMS_USER_SOURCE_20260820';

if (!s.includes(MARK)) {
  const tipsPageAnchor = 'function TipsPage({ onClose }) {';
  const tipsPageCount = s.split(tipsPageAnchor).length - 1;
  if (tipsPageCount !== 1) {
    throw new Error(`Expected exactly one TipsPage anchor, found ${tipsPageCount}`);
  }

  const helper = `/* ${MARK} */\nif (typeof window !== "undefined") window.__PETGROW_TIPS_DATA__ = TIPS_DATA;\n\nasync function fetchPetInfoCmsItems() {\n  const pageSize = 100;\n  const firstRes = await fetch(\`/api/petinfo?action=list&page=1&pageSize=\${pageSize}\`, { headers: { Accept: "application/json" } });\n  if (!firstRes.ok) throw new Error("Pet정보 CMS 조회 실패");\n  const first = await firstRes.json();\n  const items = Array.isArray(first?.items) ? [...first.items] : [];\n  const total = Number(first?.total) || items.length;\n  const totalPages = Math.max(1, Math.ceil(total / pageSize));\n  for (let page = 2; page <= totalPages; page += 1) {\n    const res = await fetch(\`/api/petinfo?action=list&page=\${page}&pageSize=\${pageSize}\`, { headers: { Accept: "application/json" } });\n    if (!res.ok) throw new Error("Pet정보 CMS 추가 페이지 조회 실패");\n    const data = await res.json();\n    if (Array.isArray(data?.items)) items.push(...data.items);\n  }\n  return items;\n}\n\n`;

  s = s.replace(tipsPageAnchor, helper + tipsPageAnchor);
}

const effectPattern = /  useEffect\(\(\) => \{\n    if \(!TIPS_SHEET_CSV_URL\) return;\n    \(async \(\) => \{\n      try \{\n        const res = await fetch\(TIPS_SHEET_CSV_URL\);\n        const text = await res\.text\(\);\n        const parsed = parseTipsCsv\(text\);\n        if \(parsed\.length > 0\) setTipsSource\(parsed\);\n      \} catch \{\n        \/\/ 시트를 못 불러오면 코드 안 기본 데이터를 그대로 써요\n      \}\n    \}\)\(\);\n  \}, \[\]\);/;

const replacement = `  useEffect(() => {\n    let cancelled = false;\n    (async () => {\n      try {\n        const cmsItems = await fetchPetInfoCmsItems();\n        if (!cancelled && cmsItems.length > 0) {\n          setTipsSource(cmsItems);\n          return;\n        }\n      } catch {\n        // CMS가 아직 준비되지 않았거나 일시 오류면 기존 데이터 경로를 사용해요.\n      }\n\n      if (!TIPS_SHEET_CSV_URL || cancelled) return;\n      try {\n        const res = await fetch(TIPS_SHEET_CSV_URL);\n        if (!res.ok) throw new Error("Pet정보 시트 조회 실패");\n        const text = await res.text();\n        const parsed = parseTipsCsv(text);\n        if (!cancelled && parsed.length > 0) setTipsSource(parsed);\n      } catch {\n        // 시트도 못 불러오면 초기값 TIPS_DATA를 그대로 유지해요.\n      }\n    })();\n    return () => { cancelled = true; };\n  }, []);`;

if (!s.includes('fetchPetInfoCmsItems();')) {
  throw new Error('PetInfo CMS helper was not inserted');
}

if (effectPattern.test(s)) {
  s = s.replace(effectPattern, replacement);
} else if (!s.includes('const cmsItems = await fetchPetInfoCmsItems();')) {
  throw new Error('Legacy TipsPage data-source effect anchor not found; refusing unsafe patch');
}

fs.writeFileSync(file, s);
console.log('PetInfo user source patched: CMS first, Sheet second, TIPS_DATA final fallback');
