import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import petgrowUiFixes from "./build/petgrow-ui-fixes.mjs";
import petgrowStabilityCleanup from "./build/petgrow-stability-cleanup-20260818.mjs";
import petgrowNewsPetTalkTarotFixes from "./build/petgrow-news-pettalk-tarot-20260818.mjs";
import petInfoCmsSource from "./build/petinfo-cms-source-20260820.mjs";

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
              if (document.querySelector('script[data-petgrow-adsense]')) return;
              var script = document.createElement('script');
              script.async = true;
              script.crossOrigin = 'anonymous';
              script.dataset.petgrowAdsense = 'true';
              script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}';
              document.head.appendChild(script);
            })();
          `,
          injectTo: "head",
        },
      ];
    },
  };
}

export default defineConfig({
  plugins: [petgrowAdsenseWeb(), petInfoCmsSource(), petgrowUiFixes(), petgrowStabilityCleanup(), petgrowNewsPetTalkTarotFixes(), react()],
  build: {
    // 큰 의존성을 별도 캐시 청크로 분리해 첫 재방문/메뉴 전환 시 다시 받는 양을 줄여요.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) return "react-vendor";
          if (id.includes("node_modules/recharts")) return "charts-vendor";
          if (id.includes("node_modules/@capacitor")) return "capacitor-vendor";
          if (id.includes("node_modules/@vercel")) return "vercel-vendor";
        }
      }
    },
    chunkSizeWarningLimit: 650
  }
});
