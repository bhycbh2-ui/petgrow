import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import petgrowBrandRefresh20260822 from "./build/petgrow-brand-refresh-20260822.mjs";
import petgrowUiFixes from "./build/petgrow-ui-fixes.mjs";
import petgrowStabilityCleanup from "./build/petgrow-stability-cleanup-20260818.mjs";
import petgrowNewsPetTalkTarotFixes from "./build/petgrow-news-pettalk-tarot-20260818.mjs";
import petInfoCmsSource from "./build/petinfo-cms-source-20260820.mjs";
import petNewsLoadingState from "./build/petnews-loading-state-20260821.mjs";
import petgrowPerformanceLazy from "./build/petgrow-performance-lazy-20260821.mjs";
import petgrowRechartsTreeShake20260822 from "./build/petgrow-recharts-tree-shake-20260822.mjs";
import petgrowMenuSplitV3 from "./build/petgrow-menu-split-v3-20260821.mjs";
import petgrowMenuSplitV4 from "./build/petgrow-menu-split-v4-20260821.mjs";
import petgrowPetTalkSplitV5 from "./build/petgrow-pettalk-split-v5-20260821.mjs";
import petgrowDeepMenuSplitV6 from "./build/petgrow-deep-menu-split-v6-20260821.mjs";
import petgrowDeepScreenSplitV7 from "./build/petgrow-deep-screen-split-v7-20260821.mjs";
import petgrowRouteSplitV8 from "./build/petgrow-route-split-v8-20260821.mjs";
import petgrowPremiumSplashV2 from "./build/petgrow-premium-splash-v2-20260821.mjs";
import petgrowPremiumSplashV3 from "./build/petgrow-premium-splash-v3-20260822.mjs";
import petgrowSplashReadyGate from "./build/petgrow-splash-ready-gate-20260821.mjs";
import petgrowPetLifeLegalAudit20260821 from "./build/petgrow-petlife-legal-audit-20260821.mjs";
import petgrowFullQa20260821 from "./build/petgrow-full-qa-20260821.mjs";

const ADSENSE_CLIENT = "ca-pub-9699974051273244";

// SPA 홈/로그인/관리자/입력/빈 화면에서는 웹 광고 스크립트를 아예 로드하지 않습니다.
// 사이트 소유 확인용 meta만 유지하고, 실제 AdSense 스크립트는 아래의 정적 편집 콘텐츠에만 주입합니다.
function petgrowAdsenseWeb() {
  return {
    name: "petgrow-adsense-web",
    transformIndexHtml() {
      return [{
        tag: "meta",
        attrs: { name: "google-adsense-account", content: ADSENSE_CLIENT },
        injectTo: "head",
      }];
    },
  };
}

function petgrowAdsenseEditorialPages() {
  const loader = `
<script data-petgrow-editorial-adsense>
(function(){
  if(!/^https?:$/.test(location.protocol))return;
  if(/(?:^|[?&])app_version=/i.test(location.search))return;
  if(document.querySelector('script[data-petgrow-adsense]'))return;
  var main=document.querySelector('main');
  var text=String(main&&main.innerText||'').replace(/\\s+/g,' ').trim();
  if(text.length<700)return;
  var s=document.createElement('script');
  s.async=true;s.crossOrigin='anonymous';s.dataset.petgrowAdsense='true';
  s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
  document.head.appendChild(s);
})();
</script>`;
  return {
    name: "petgrow-adsense-editorial-pages",
    apply: "build",
    async closeBundle() {
      const dist = resolve(process.cwd(), "dist");
      const files = [resolve(dist, "pet-guide.html")];
      const guideDir = resolve(dist, "guides");
      try {
        for (const entry of await readdir(guideDir, { withFileTypes: true })) {
          if (entry.isFile() && entry.name.endsWith(".html")) files.push(resolve(guideDir, entry.name));
        }
      } catch {}
      for (const file of files) {
        try {
          let html = await readFile(file, "utf8");
          if (html.includes("data-petgrow-editorial-adsense")) continue;
          html = html.replace(/<\/body>/i, `${loader}</body>`);
          await writeFile(file, html, "utf8");
        } catch {}
      }
    },
  };
}

export default defineConfig({
  // 브랜딩 교체는 가장 먼저 실행해 기존 대용량 인라인 로고를 정적 자산으로 치환합니다.
  // 3차 Pet뉴스/Pet음악, 4차 내 주변 Pet·Pet톡 피드·관리자센터,
  // 5차 Pet톡 하위화면, 6차 Pet사주·PetBTI·Pet정보·정보가이드,
  // 7차 소개·성장결과·My/계정·지원/정책, 8차 등록·시작·로그인·더보기 등 보조 화면을 실제 사용 시점에 로드합니다.
  plugins: [petgrowBrandRefresh20260822(), petgrowPetLifeLegalAudit20260821(), petgrowFullQa20260821(), petgrowPremiumSplashV2(), petgrowPremiumSplashV3(), petgrowSplashReadyGate(), petgrowAdsenseWeb(), petgrowAdsenseEditorialPages(), petgrowPerformanceLazy(), petgrowRechartsTreeShake20260822(), petNewsLoadingState(), petInfoCmsSource(), petgrowUiFixes(), petgrowStabilityCleanup(), petgrowNewsPetTalkTarotFixes(), petgrowMenuSplitV3(), petgrowMenuSplitV4(), petgrowPetTalkSplitV5(), petgrowDeepMenuSplitV6(), petgrowDeepScreenSplitV7(), petgrowRouteSplitV8(), react()],
  build: {
    modulePreload: {
      resolveDependencies(filename, deps, context) {
        // Growth charts are deep-screen only. Do not make every home visit download
        // the chart vendor just because Rollup sees it in the entry graph.
        if (context?.hostType === "html") {
          return deps.filter((dep) => !/(?:^|\/)charts-vendor-[^/]+\.js$/.test(dep));
        }
        return deps;
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react-vendor";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-") || id.includes("node_modules/victory-vendor")) return "charts-vendor";
          if (id.includes("node_modules/leaflet")) return "maps-vendor";
          if (id.includes("node_modules/axios")) return "http-vendor";
          if (id.includes("node_modules/@capacitor")) return "capacitor-vendor";
          if (id.includes("node_modules/@vercel")) return "vercel-vendor";
        }
      }
    },
    chunkSizeWarningLimit: 650
  }
});
