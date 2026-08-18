import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import petgrowUiFixes from "./build/petgrow-ui-fixes.mjs";
import petgrowTarotSajuRebuild from "./build/petgrow-tarot-saju-rebuild-20260818.mjs";
import petgrowNewsPetTalkTarotFixes from "./build/petgrow-news-pettalk-tarot-20260818.mjs";

export default defineConfig({
  plugins: [petgrowUiFixes(), petgrowTarotSajuRebuild(), petgrowNewsPetTalkTarotFixes(), react()],
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
