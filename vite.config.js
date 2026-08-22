import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
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

function petgrowAdsenseWeb() {
  return {
    name: "petgrow-adsense-web",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { name: "google-adsense-account", content: ADSENSE_CLIENT },
          injectTo: "head",
        },
        {
          tag: "script",
          children: `
            (function () {
              if (!/^https?:$/.test(window.location.protocol)) return;
              // PetGrow Android는 동일한 원격 웹 UI를 사용하지만 광고는 네이티브 AdMob으로만 제공합니다.
              // app_version이 있는 WebView에서는 AdSense 스크립트 자체를 로드하지 않아 두 광고 체계를 섞지 않습니다.
              if (/(?:^|[?&])app_version=/i.test(window.location.search)) return;
              var loaded = false;
              var scheduled = false;
              function loadAdsense() {
                if (loaded || document.visibilityState === 'hidden' || document.querySelector('script[data-petgrow-adsense]')) return;
                loaded = true;
                var script = document.createElement('script');
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.dataset.petgrowAdsense = 'true';
                script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
                document.head.appendChild(script);
              }
              function runWhenIdle() {
                if (document.visibilityState === 'hidden') {
                  document.addEventListener('visibilitychange', function onVisible() {
                    if (document.visibilityState !== 'visible') return;
                    document.removeEventListener('visibilitychange', onVisible);
                    runWhenIdle();
                  });
                  return;
                }
                if ('requestIdleCallback' in window) window.requestIdleCallback(loadAdsense, { timeout: 1600 });
                else loadAdsense();
              }
              var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
              var slow = !!(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
              var delay = slow ? 6500 : 2600;
              if (!scheduled) {
                scheduled = true;
                window.setTimeout(runWhenIdle, delay);
              }
            })();
          `,
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig({
  // 브랜딩 교체는 가장 먼저 실행해 기존 대용량 인라인 로고를 정적 자산으로 치환합니다.
  // 3차 Pet뉴스/Pet음악, 4차 내 주변 Pet·Pet톡 피드·관리자센터,
  // 5차 Pet톡 하위화면, 6차 Pet사주·PetBTI·Pet정보·정보가이드,
  // 7차 소개·성장결과·My/계정·지원/정책, 8차 등록·시작·로그인·더보기 등 보조 화면을 실제 사용 시점에 로드합니다.
  plugins: [petgrowBrandRefresh20260822(), petgrowPetLifeLegalAudit20260821(), petgrowFullQa20260821(), petgrowPremiumSplashV2(), petgrowPremiumSplashV3(), petgrowSplashReadyGate(), petgrowAdsenseWeb(), petgrowPerformanceLazy(), petgrowRechartsTreeShake20260822(), petNewsLoadingState(), petInfoCmsSource(), petgrowUiFixes(), petgrowStabilityCleanup(), petgrowNewsPetTalkTarotFixes(), petgrowMenuSplitV3(), petgrowMenuSplitV4(), petgrowPetTalkSplitV5(), petgrowDeepMenuSplitV6(), petgrowDeepScreenSplitV7(), petgrowRouteSplitV8(), react()],
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
