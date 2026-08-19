const MARK = 'PETINFO_CMS_USER_SOURCE_20260820';

const legacyEffect = `  useEffect(() => {
    if (!TIPS_SHEET_CSV_URL) return;
    (async () => {
      try {
        const res = await fetch(TIPS_SHEET_CSV_URL);
        const text = await res.text();
        const parsed = parseTipsCsv(text);
        if (parsed.length > 0) setTipsSource(parsed);
      } catch {
        // 시트를 못 불러오면 코드 안 기본 데이터를 그대로 써요
      }
    })();
  }, []);`;

const cmsEffect = `  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cmsItems = await fetchPetInfoCmsItems();
        if (!cancelled && cmsItems.length > 0) {
          setTipsSource(cmsItems);
          return;
        }
      } catch {
        // CMS가 아직 준비되지 않았거나 일시 오류면 기존 데이터 경로를 사용해요.
      }

      if (!TIPS_SHEET_CSV_URL || cancelled) return;
      try {
        const res = await fetch(TIPS_SHEET_CSV_URL);
        if (!res.ok) throw new Error("Pet정보 시트 조회 실패");
        const text = await res.text();
        const parsed = parseTipsCsv(text);
        if (!cancelled && parsed.length > 0) setTipsSource(parsed);
      } catch {
        // 시트도 못 불러오면 초기값 TIPS_DATA를 그대로 유지해요.
      }
    })();
    return () => { cancelled = true; };
  }, []);`;

const helper = `/* ${MARK} */
if (typeof window !== "undefined") window.__PETGROW_TIPS_DATA__ = TIPS_DATA;

async function fetchPetInfoCmsItems() {
  const pageSize = 100;
  const firstRes = await fetch(\`/api/petinfo?action=list&page=1&pageSize=\${pageSize}\`, { headers: { Accept: "application/json" } });
  if (!firstRes.ok) throw new Error("Pet정보 CMS 조회 실패");
  const first = await firstRes.json();
  const items = Array.isArray(first?.items) ? [...first.items] : [];
  const total = Number(first?.total) || items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetch(\`/api/petinfo?action=list&page=\${page}&pageSize=\${pageSize}\`, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Pet정보 CMS 추가 페이지 조회 실패");
    const data = await res.json();
    if (Array.isArray(data?.items)) items.push(...data.items);
  }
  return items;
}

`;

export function transformPetInfoCmsSource(code, id = '') {
  if (!/[/\\]src[/\\]App\.jsx(?:\?|$)/.test(id)) return null;
  if (code.includes(MARK) && code.includes('const cmsItems = await fetchPetInfoCmsItems();')) return code;

  const tipsPageAnchor = 'function TipsPage({ onClose }) {';
  const count = code.split(tipsPageAnchor).length - 1;
  if (count !== 1) throw new Error(`[petinfo-cms] expected one TipsPage anchor, found ${count}`);
  if (!code.includes(legacyEffect)) throw new Error('[petinfo-cms] legacy PetInfo data-source effect not found; refusing unsafe transform');

  let next = code.replace(tipsPageAnchor, helper + tipsPageAnchor);
  next = next.replace(legacyEffect, cmsEffect);
  if (!next.includes(MARK) || !next.includes('const cmsItems = await fetchPetInfoCmsItems();')) {
    throw new Error('[petinfo-cms] transform verification failed');
  }
  return next;
}

export default function petInfoCmsSource() {
  return {
    name: 'petgrow-petinfo-cms-source-20260820',
    enforce: 'pre',
    transform(code, id) {
      const transformed = transformPetInfoCmsSource(code, id);
      return transformed == null ? null : { code: transformed, map: null };
    },
  };
}
