import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import petgrowUiFixes from "./build/petgrow-ui-fixes.mjs";
import petgrowStabilityCleanup from "./build/petgrow-stability-cleanup-20260818.mjs";
import petgrowNewsPetTalkTarotFixes from "./build/petgrow-news-pettalk-tarot-20260818.mjs";
import petInfoCmsSource from "./build/petinfo-cms-source-20260820.mjs";
import petNewsLoadingState from "./build/petnews-loading-state-20260821.mjs";
import petgrowPerformanceLazy from "./build/petgrow-performance-lazy-20260821.mjs";
import petgrowMenuSplitV3 from "./build/petgrow-menu-split-v3-20260821.mjs";
import petgrowMenuSplitV4 from "./build/petgrow-menu-split-v4-20260821.mjs";
import petgrowPetTalkSplitV5 from "./build/petgrow-pettalk-split-v5-20260821.mjs";

const ADSENSE_CLIENT = "ca-pub-9699974051273244";

function petgrowAdsenseWeb() {
  return {
    name: "petgrow-adsense-web",
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: {
            name: "google-adsense-account",
            content: ADSENSE_CLIENT,
          },
          injectTo: "head",
        },
        {
          tag: "script",
          children: `
            (function () {
              if (!/^https?:$/.test(window.location.protocol)) return;
              var loaded = false;
              function loadAdsense() {
                if (loaded || document.querySelector('script[data-petgrow-adsense]')) return;
                loaded = true;
                var script = document.createElement('script');
                script.async = true;
                script.crossOrigin = 'anonymous';
                script.dataset.petgrowAdsense = 'true';
                script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
                document.head.appendChild(script);
              }
              var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
              var slow = !!(connection && (connection.saveData || /(^|-)2g$/.test(connection.effectiveType || '')));
              var delay = slow ? 4200 : 1800;
              if ('requestIdleCallback' in window) {
                window.requestIdleCallback(loadAdsense, { timeout: delay });
              } else {
                window.setTimeout(loadAdsense, delay);
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
  // 3차 Pet뉴스/Pet음악, 4차 내 주변 Pet·Pet톡 피드·관리자센터,
  // 5차 Pet톡 글쓰기·상세·내활동을 실제 사용 시점 청크로 분리합니다.
  plugins: [petgrowAdsenseWeb(), petgrowPerformanceLazy(), petNewsLoadingState(), petInfoCmsSource(), petgrowUiFixes(), petgrowStabilityCleanup(), petgrowNewsPetTalkTarotFixes(), petgrowMenuSplitV3(), petgrowMenuSplitV4(), petgrowPetTalkSplitV5(), react()],
  build: {
    // 자주 바뀌는 앱 코드와 무거운 외부 라이브러리를 분리해 재방문 캐시 효율을 높여요.
    // Recharts/Leaflet 및 비핵심 메뉴 화면은 실제 사용 시점에만 동적 import 됩니다.
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
