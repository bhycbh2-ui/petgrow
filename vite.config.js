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
import petgrowSplashV4 from "./build/petgrow-splash-v4-20260822.mjs";
import petgrowSplashReadyGate from "./build/petgrow-splash-ready-gate-20260821.mjs";
import petgrowFullQa20260821 from "./build/petgrow-full-qa-20260821.mjs";
import petgrowHomeBootUnblock20260828 from "./build/petgrow-home-boot-unblock-20260828.mjs";
import petgrowPetTalkOracleFixes from "./build/petgrow-pettalk-oracle-fixes-20260904.mjs";
import petgrowAboutNext from "./build/petgrow-about-next-20260905.mjs";

const ADSENSE_CLIENT = "ca-pub-9699974051273244";

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

export default defineConfig({
  plugins: [petgrowHomeBootUnblock20260828(), petgrowBrandRefresh20260822(), petgrowFullQa20260821(), petgrowSplashV4(), petgrowSplashReadyGate(), petgrowAdsenseWeb(), petgrowPerformanceLazy(), petgrowRechartsTreeShake20260822(), petNewsLoadingState(), petInfoCmsSource(), petgrowUiFixes(), petgrowStabilityCleanup(), petgrowNewsPetTalkTarotFixes(), petgrowPetTalkOracleFixes(), petgrowAboutNext(), petgrowMenuSplitV3(), petgrowMenuSplitV4(), petgrowPetTalkSplitV5(), petgrowDeepMenuSplitV6(), petgrowDeepScreenSplitV7(), petgrowRouteSplitV8(), react()],
  esbuild: {
    legalComments: "none",
  },
  build: {
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    reportCompressedSize: false,
    modulePreload: {
      resolveDependencies(filename, deps, context) {
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
