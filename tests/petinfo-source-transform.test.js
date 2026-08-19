import test from 'node:test';
import assert from 'node:assert/strict';
import { transformPetInfoCmsSource } from '../build/petinfo-cms-source-20260820.mjs';

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

test('PetInfo transform injects CMS-first loader and legacy export', () => {
  const source = `const TIPS_DATA = [];\n${legacyEffect}\nfunction TipsPage({ onClose }) { return null; }`;
  const out = transformPetInfoCmsSource(source, '/repo/src/App.jsx');
  assert.match(out, /PETINFO_CMS_USER_SOURCE_20260820/);
  assert.match(out, /window\.__PETGROW_TIPS_DATA__ = TIPS_DATA/);
  assert.match(out, /fetchPetInfoCmsItems/);
  assert.match(out, /cmsItems\.length > 0/);
  assert.match(out, /TIPS_SHEET_CSV_URL/);
});

test('PetInfo transform ignores unrelated files', () => {
  assert.equal(transformPetInfoCmsSource('hello', '/repo/src/main.jsx'), null);
});

test('PetInfo transform refuses drifted App source', () => {
  assert.throws(() => transformPetInfoCmsSource('function TipsPage({ onClose }) {}', '/repo/src/App.jsx'), /legacy PetInfo data-source effect not found/);
});
